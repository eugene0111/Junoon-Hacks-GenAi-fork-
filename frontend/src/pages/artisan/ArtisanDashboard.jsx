import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axiosConfig";
import { Link } from "react-router-dom";
import AnimatedSection from "../../components/ui/AnimatedSection";
import StatCard from "../../components/artisan/StatCard";
import {
  SparklesIcon,
  ArchiveIcon,
  TrendingUpIcon,
  EyeIcon,
  CurrencyDollarIcon,
  UserCheck,
  ExclamationCircleIcon,
} from "../../components/common/Icons";
import SkeletonCard from "../../components/ui/SkeletonCard";
import SkeletonStat from "../../components/ui/SkeletonStat";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MiniLineChart = ({ title, data, labels, icon, borderColor, bgColor }) => {
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: title,
        data: data,
        borderColor: borderColor || "#4285F4",
        backgroundColor: bgColor || "rgba(66, 133, 244, 0.1)",
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false, displayColors: false },
    },
    scales: { x: { display: false }, y: { display: false } },
    elements: { line: { borderWidth: 2 } },
  };
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && (
          <span className="text-gray-400">
            {React.cloneElement(icon, { className: "h-5 w-5" })}
          </span>
        )}
      </div>
      <div className="flex-grow h-24 md:h-32">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
};

const MiniBarChart = ({ title, data, labels, icon, borderColor, bgColor }) => {
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: title,
        data: data,
        backgroundColor: bgColor || "rgba(66, 133, 244, 0.5)",
        borderColor: borderColor || "#4285F4",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false, displayColors: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { display: false },
      },
      y: {
        display: false,
        beginAtZero: true,
      },
    },
  };
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && (
          <span className="text-gray-400">
            {React.cloneElement(icon, { className: "h-5 w-5" })}
          </span>
        )}
      </div>
      <div className="flex-grow h-24 md:h-32">
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
};

const MentorshipWidget = () => {
  const [mentor, setMentor] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const mentorRes = await api.get("/mentorship/my-mentor");
      if (mentorRes.data && mentorRes.data.mentor) {
        setMentor(mentorRes.data.mentor);
        setRequests([]);
      } else {
        const requestsRes = await api.get("/mentorship/requests");
        setRequests(requestsRes.data.requests.filter((req) => req.ambassador));
      }
    } catch (error) {
      console.error("Error fetching mentorship data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async (mentorshipId) => {
    try {
      await api.put(`/mentorship/accept/${mentorshipId}`);
      setLoading(true);
      fetchData();
    } catch (error) {
      alert("Failed to accept request. Please try again.");
      console.error(error);
    }
  };

  if (loading) {
    return <div className="h-20 bg-gray-200 rounded-lg animate-pulse mb-6"></div>;
  }

  if (mentor) {
    return (
      <AnimatedSection className="pt-8">
        <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-lg flex justify-between items-center">
          <div className="flex items-center">
            <UserCheck className="h-6 w-6 mr-3" />
            <div>
              <h3 className="font-bold">You are mentored by {mentor.name}</h3>
              <a
                href={`mailto:${mentor.email}`}
                className="text-sm text-green-700 hover:underline"
              >
                Contact your mentor
              </a>
            </div>
          </div>
        </div>
      </AnimatedSection>
    );
  }

  if (requests.length > 0) {
    return (
      <AnimatedSection className="mb-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg">
          <h3 className="font-bold mb-2">You have new mentorship requests!</h3>
          {requests.map(({ id, ambassador }) => (
            <div key={id} className="flex justify-between items-center py-1">
              <p>
                <span className="font-semibold">{ambassador.name}</span> wants
                to be your mentor.
              </p>
              <button
                onClick={() => handleAccept(id)}
                className="bg-blue-500 text-white font-semibold px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition"
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      </AnimatedSection>
    );
  }

  return null;
};

const ArtisanDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, lowInventory: 0 });
  const [salesData, setSalesData] = useState({ labels: [], data: [] });
  const [viewsData, setViewsData] = useState({ labels: [], data: [] });
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/dashboard/artisan-stats");
        setStats(response.data.stats);
        setSalesData(response.data.salesData || { labels: [], data: [] });
        setViewsData(response.data.viewsData || { labels: [], data: [] });
        setTopProducts(response.data.topProducts);
      } catch (err) {
        setError("Failed to fetch dashboard data");
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const statsData = [
    {
      title: "New Orders",
      value: stats.orders,
      icon: <ArchiveIcon />,
      color: "text-google-blue",
      borderColor: "border-google-blue",
      bgColor: "bg-google-blue",
      link: "/artisan/orders",
      description: "View and manage incoming orders",
    },
    {
      title: "Trending Craft",
      value: "Block Printing",
      icon: <SparklesIcon />,
      color: "text-google-green",
      borderColor: "border-google-green",
      bgColor: "bg-google-green",
      link: "/artisan/trends",
      description: "Discover high-demand art forms",
    },
    {
      title: "Low Stock Alerts",
      value: `${stats.lowInventory} items`,
      icon: <TrendingUpIcon />,
      color: "text-google-red",
      borderColor: "border-google-red",
      bgColor: "bg-google-red",
      link: "/artisan/products",
      description: "Replenish your popular items",
    },
  ];

  if (loading || !user) {
    return (
      <div className="px-6 md:px-8 py-8 md:py-10">
        <div className="h-40 bg-gray-200 rounded-2xl shadow-xl mb-10 md:mb-12 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 md:mb-12">
          {[...Array(3)].map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <SkeletonCard className="h-40 md:h-48" />
            <SkeletonCard className="h-40 md:h-48" />
          </div>
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border animate-pulse">
            <div className="h-6 w-1/2 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 py-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-md"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 md:px-8 py-8 md:py-10 text-center min-h-[calc(100vh-10rem)] flex flex-col justify-center items-center">
        <ExclamationCircleIcon className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-medium text-red-600 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-8 py-8 md:py-10">
      <MentorshipWidget />

      <AnimatedSection className="mb-10 pt-8 md:mb-12">
        <div
          className="relative p-8 md:p-10 rounded-2xl shadow-xl overflow-hidden text-white"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/2.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <header className="relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-2">
              <span className="text-google-yellow">Your</span> Creative{" "}
              <span className="text-white">Dashboard</span>
            </h1>
            <p
              className="text-lg text-white/90 max-w-2xl mx-auto"
              style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
            >
              Welcome back, {user.name}! Here's your workspace.
            </p>
          </header>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mb-10 md:mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {statsData.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <AnimatedSection className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <MiniLineChart
            title="Sales (Last 7 Days)"
            labels={salesData.labels}
            data={salesData.data}
            icon={<CurrencyDollarIcon />}
            borderColor="#34A853"
            bgColor="rgba(52, 168, 83, 0.1)"
          />
          <MiniBarChart
            title="Views by Top Product"
            labels={viewsData.labels}
            data={viewsData.data}
            icon={<EyeIcon />}
            borderColor="#4285F4"
            bgColor="rgba(66, 133, 244, 0.5)"
          />
        </AnimatedSection>

        <AnimatedSection className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full">
            <h2 className="text-base font-medium text-gray-800 mb-4">
              Top Performing Products
            </h2>
            <div className="space-y-3">
              {topProducts.length > 0 ? (
                topProducts.map((product) => (
                  <Link
                    to={`/artisan/products/edit/${product.id}`}
                    key={product.id}
                    className="flex items-center p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={
                        product.images[0]?.url ||
                        "https://placehold.co/40x40/cccccc/ffffff?text=P"
                      }
                      alt={product.name}
                      className="w-10 h-10 rounded-md object-cover mr-3 flex-shrink-0"
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.stats?.views || 0} Views
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-sm text-gray-500 py-6">
                  No product data available yet.
                </p>
              )}
            </div>
            {topProducts.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <Link
                  to="/artisan/analytics/products"
                  className="text-sm font-medium text-google-blue hover:underline"
                >
                  View all product performance
                </Link>
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default ArtisanDashboard;