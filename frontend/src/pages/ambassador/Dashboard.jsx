import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Users,
  Clock,
  DollarSign,
  Star,
  User,
  Activity,
  CheckCircle,
} from "lucide-react";
import AnimatedPage from "../../components/ui/AnimatedPage";
import api from "../../api/axiosConfig";
import SkeletonStat from "../../components/ui/SkeletonStat";
import SkeletonListItem from "../../components/ui/SkeletonListItem";
import AnimatedSection from "../../components/ui/AnimatedSection";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const icons = {
  Users: <Users className="h-6 w-6 text-violet-500" />,
  Clock: <Clock className="h-6 w-6 text-yellow-500" />,
  DollarSign: <DollarSign className="h-6 w-6 text-green-500" />,
  Star: <Star className="h-6 w-6 text-blue-500" />,
};

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [artisansData, setArtisansData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [topArtisans, setTopArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/ambassador/dashboard-summary");
        const data = response.data;

        setStats(data.stats);
        setArtisansData(data.artisansData);
        setRecentActivities(data.recentActivities);
        setTopArtisans(data.topArtisans);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Artisan Onboarding",
      },
    },
  };

  if (error) {
    return (
      <AnimatedPage>
        <div className="text-center text-red-500 p-8">{error}</div>
      </AnimatedPage>
    );
  }

  return (
    
      <div className="pb-8">
        <AnimatedSection className="mb-10 md:mb-12">
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
              <span className="text-google-yellow">Your</span> Ambassador{" "}
              <span className="text-white">Dashboard</span>
            </h1>
            <p
              className="text-lg text-white/90 max-w-2xl mx-auto"
              style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
            >
              Welcome back, track your impact and see how your support is !
            </p>
          </header>
        </div>
      </AnimatedSection>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading
            ? Array(4)
                .fill(0)
                .map((_, i) => <SkeletonStat key={i} />)
            : stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center space-x-4"
                >
                  <div className="p-3 rounded-full bg-gray-100">
                    {icons[stat.icon] || (
                      <Activity className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Onboarding Analytics
            </h2>
            <div className="h-80">
              {loading || !artisansData ? (
                <div className="h-full w-full bg-gray-200 rounded-md animate-pulse"></div>
              ) : (
                <Bar options={chartOptions} data={artisansData} />
              )}
            </div>
          </div>

          {}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Recent Activity
            </h2>
            <ul className="space-y-4">
              {loading
                ? Array(3)
                    .fill(0)
                    .map((_, i) => <SkeletonListItem key={i} />)
                : recentActivities.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex items-center space-x-3"
                    >
                      <div className="p-2 rounded-full bg-blue-100">
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </li>
                  ))}
            </ul>
          </div>

          {}
          <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Top Performing Artisans
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Artisan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading
                    ? Array(3)
                        .fill(0)
                        .map((_, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <SkeletonListItem />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </td>
                          </tr>
                        ))
                    : topArtisans.map((artisan) => (
                        <tr key={artisan.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={artisan.profilePic}
                                  alt={artisan.name}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {artisan.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ₹{artisan.value.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    
  );
};

export default Dashboard;
