import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axiosConfig";
import { Link } from "react-router-dom";
import AnimatedSection from "../../components/ui/AnimatedSection";
import StatCard from "../../components/artisan/StatCard";
import SkeletonCard from "../../components/ui/SkeletonCard";
import SkeletonStat from "../../components/ui/SkeletonStat";
import {
  CurrencyDollarIcon,
  UsersIcon,
  TrendingUpIcon,
  ExclamationCircleIcon,
  BriefcaseIcon,
} from "../../components/common/Icons";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

const getMockPortfolioChart = () => ({
  labels: [
    "Oct 14",
    "Oct 15",
    "Oct 16",
    "Oct 17",
    "Oct 18",
    "Oct 19",
    "Oct 20",
  ],
  data: [10000, 10250, 10150, 10300, 10450, 10400, 10550],
});

const getMockTopArtisans = () => [
  {
    id: "1",
    name: "Rina Kumari",
    profilePic: { url: "https://placehold.co/40x40/E8F0FE/4285F4?text=R" },
    craft: "Madhubani Painting",
  },
  {
    id: "2",
    name: "Suresh Prajapati",
    profilePic: { url: "https://placehold.co/40x40/E6F4EA/34A853?text=S" },
    craft: "Terracotta Pottery",
  },
  {
    id: "3",
    name: "Amina Khatun",
    profilePic: { url: "https://placehold.co/40x40/FCE8E6/EA4335?text=A" },
    craft: "Kantha Embroidery",
  },
];

const getMockJobsCreated = () => 42;

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

const RollingStatCard = ({ stat }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const endValue = parseInt(stat.value, 10) || 0;
    if (endValue === 0) return;

    let start = 0;
    const duration = 1500;
    const increment = endValue / (duration / 16);

    const counter = setInterval(() => {
      start += increment;
      if (start >= endValue) {
        setCount(endValue);
        clearInterval(counter);
      } else {
        setCount(Math.ceil(start));
      }
    }, 16);

    return () => clearInterval(counter);
  }, [stat.value]);

  return <StatCard stat={{ ...stat, value: count }} />;
};

const InvestorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [jobsCreated, setJobsCreated] = useState(0);
  const [portfolioChartData, setPortfolioChartData] = useState(null);
  const [topArtisans, setTopArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/investor/dashboard-data");
        setStats(response.data);

        setJobsCreated(getMockJobsCreated());
        setPortfolioChartData(getMockPortfolioChart());
        setTopArtisans(getMockTopArtisans());
      } catch (err) {
        setError("Failed to fetch investor stats. Please try again later.");
        console.error("Failed to fetch investor stats:", err);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchDashboardData();
  }, []);

  const statsData = [
    {
      title: "Total Invested",
      value: `₹${
        typeof stats?.totalInvested === "number"
          ? stats.totalInvested.toLocaleString()
          : 10000
      }`,
      icon: <CurrencyDollarIcon />,
      color: "text-google-green",
      borderColor: "border-google-green",
      link: "/investor/portfolio",
      description: "View your complete portfolio",
    },
    {
      title: "Artisans Supported",
      value: stats?.artisansSupported || 2,
      icon: <UsersIcon />,
      color: "text-google-blue",
      borderColor: "border-google-blue",
      link: "/investor/browse-artisans",
      description: "Discover new investment opportunities",
    },
    {
      title: "Jobs Created",
      value: jobsCreated,
      icon: <BriefcaseIcon />,
      color: "text-google-red",
      borderColor: "border-google-red",
      link: "/investor/portfolio",
      description: "Impact of your investments",
      isRolling: true,
    },
    {
      title: "Expected Returns",
      value: `${stats?.expectedReturns || 20}%`,
      icon: <TrendingUpIcon />,
      color: "text-google-yellow",
      borderColor: "border-google-yellow",
      link: "/investor/portfolio",
      description: "Based on current performance",
    },
  ];

  if (loading || !user) {
    return (
      <div>
        <div className="h-40 bg-gray-200 rounded-2xl shadow-xl mb-10 md:mb-12 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 md:mb-12">
          {[...Array(4)].map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
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
      <div className="text-center min-h-[calc(100vh-10rem)] flex flex-col justify-center items-center">
        <ExclamationCircleIcon className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-medium text-red-600 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <AnimatedSection className="mb-10 pt-8 md:mb-12">
        <div
          className="relative p-8 md:p-10  shadow-xl overflow-hidden text-white"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/2.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <header className="relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-2">
              <span className="text-google-yellow">Your</span> Investment{" "}
              <span className="text-white">Dashboard</span>
            </h1>
            <p
              className="text-lg text-white/90 max-w-2xl mx-auto"
              style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
            >
              Welcome back, {user.name}! Track your portfolio and find new
              opportunities.
            </p>
          </header>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mb-10 md:mb-12 px-8">
        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statsData.map((stat, index) =>
            stat.isRolling ? (
              <RollingStatCard key={index} stat={stat} />
            ) : (
              <StatCard key={index} stat={stat} />
            )
          )}
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-8">
        <AnimatedSection className="lg:col-span-2">
          {portfolioChartData && (
            <MiniLineChart
              title="Portfolio Value (Last 7 Days)"
              labels={portfolioChartData.labels}
              data={portfolioChartData.data}
              icon={<CurrencyDollarIcon />}
              borderColor="#34A853"
              bgColor="rgba(52, 168, 83, 0.1)"
            />
          )}
        </AnimatedSection>

        <AnimatedSection className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full">
            <h2 className="text-base font-medium text-gray-800 mb-4">
              Top Performing Artisans
            </h2>
            <div className="space-y-3">
              {topArtisans.length > 0 ? (
                topArtisans.map((artisan) => (
                  <Link
                    to={`../seller/${artisan.id}`}
                    key={artisan.id}
                    className="flex items-center p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={
                        artisan.profilePic?.url ||
                        "https://placehold.co/40x40/cccccc/ffffff?text=A"
                      }
                      alt={artisan.name}
                      className="w-10 h-10 rounded-full object-cover mr-3 flex-shrink-0"
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {artisan.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {artisan.craft || "View Profile"}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-sm text-gray-500 py-6">
                  No investment data available yet.
                </p>
              )}
            </div>
            {topArtisans.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <Link
                  to="../browse-artisans"
                  className="text-sm font-medium text-google-blue hover:underline"
                >
                  Browse all artisans
                </Link>
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default InvestorDashboard;
