import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import AnimatedSection from "../../components/ui/AnimatedSection";
import {
  BriefcaseIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  ChartBarIcon,
  ArrowRightIcon,
  TrendingUpIcon,
} from "../../components/common/Icons";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SkeletonBase = ({ className = "" }) => (
  <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`}></div>
);
const SkeletonSidebarCard = () => <SkeletonBase className="h-28" />;
const SkeletonChartCard = () => <SkeletonBase className="h-64" />;
const SkeletonListItem = () => (
  <div className="flex items-center space-x-3 py-4 animate-pulse">
    <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <SkeletonBase className="h-4 w-3/4" />
      <SkeletonBase className="h-3 w-1/2" />
    </div>
    <SkeletonBase className="h-8 w-24 rounded-md" />
  </div>
);

const TabButton = ({ title, isActive, onClick, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors relative whitespace-nowrap ${
      isActive
        ? "text-google-blue font-medium"
        : "text-gray-500 hover:text-gray-700"
    }`}
    aria-current={isActive ? "page" : undefined}
  >
    {title}
    {count !== undefined && (
      <span
        className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
          isActive
            ? "bg-google-blue/10 text-google-blue"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {count}
      </span>
    )}
    {isActive && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-google-blue rounded-t-full"></div>
    )}
  </button>
);

const InvestmentTypeChart = ({ data }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.data,
        backgroundColor: ["#4285F4", "#DB4437", "#F4B400", "#0F9D58"],
        borderColor: "#FFFFFF",
        borderWidth: 2,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 11, family: "Roboto" },
          color: "#5F6368",
          boxWidth: 15,
          padding: 15,
        },
      },
      title: { display: false },
    },
  };
  return (
    <div className="h-64 md:h-80">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

const InvestmentCraftChart = ({ data }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.data,
        backgroundColor: [
          "#4285F4",
          "#34A853",
          "#FBBC05",
          "#EA4335",
          "#7FBCFF",
          "#81C995",
        ],
        borderRadius: 4,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#E0E0E0", drawBorder: false },
        ticks: { font: { size: 10, family: "Roboto" }, color: "#5F6368" },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, family: "Roboto" }, color: "#5F6368" },
      },
    },
  };
  return (
    <div className="h-64 md:h-80">
      <Bar options={options} data={chartData} />
    </div>
  );
};

const InvestmentCard = ({ investment }) => {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    paid_back: "bg-gray-100 text-gray-700",
    defaulted: "bg-red-100 text-red-800",
  };
  const typeColors = {
    Equity: "border-google-blue",
    Loan: "border-google-green",
    "Pre-order": "border-google-yellow",
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 overflow-hidden">
        <div
          className={`w-1.5 h-10 rounded-full ${
            typeColors[investment.type] || "border-gray-300"
          }`}
        ></div>
        <img
          src={investment.artisan.avatar}
          alt={investment.artisan.name}
          className="h-10 w-10 rounded-full flex-shrink-0"
        />
        <div className="overflow-hidden">
          <p className="font-semibold text-sm text-gray-800 truncate">
            {investment.artisan.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {investment.type} &bull; {investment.craft}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <p className="font-medium text-sm text-gray-800">
            ₹{investment.amount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Invested</p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            statusColors[investment.status] || "bg-gray-100"
          }`}
        >
          {investment.status.replace("_", " ").charAt(0).toUpperCase() +
            investment.status.replace("_", " ").slice(1)}
        </span>
        <Link
          to={`/seller/${investment.artisan.id}`}
          className="p-1.5 text-gray-400 hover:text-google-blue hover:bg-blue-50 rounded-full transition-colors"
        >
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

const InvestmentPortfolio = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("portfolio");

  const mockInvestments = [
    {
      id: "1",
      artisan: {
        id: "a1",
        name: "Rohan Verma",
        avatar: "https://placehold.co/100x100/34A853/FFFFFF?text=RV",
      },
      amount: 500,
      type: "Equity",
      status: "active",
      craft: "Pottery",
    },
    {
      id: "2",
      artisan: {
        id: "a2",
        name: "Meera Patel",
        avatar: "https://placehold.co/100x100/4285F4/FFFFFF?text=MP",
      },
      amount: 250,
      type: "Loan",
      status: "paid_back",
      craft: "Painting",
    },
    {
      id: "3",
      artisan: {
        id: "a3",
        name: "Sanjay Kumar",
        avatar: "https://placehold.co/100x100/FBBC05/FFFFFF?text=SK",
      },
      amount: 700,
      type: "Equity",
      status: "active",
      craft: "Woodwork",
    },
    {
      id: "4",
      artisan: {
        id: "a4",
        name: "Aisha Khan",
        avatar: "https://placehold.co/100x100/DB4437/FFFFFF?text=AK",
      },
      amount: 300,
      type: "Pre-order",
      status: "active",
      craft: "Textiles",
    },
    {
      id: "5",
      artisan: {
        id: "a5",
        name: "Vikram Choi",
        avatar: "https://placehold.co/100x100/7FBCFF/FFFFFF?text=VC",
      },
      amount: 150,
      type: "Loan",
      status: "defaulted",
      craft: "Metalwork",
    },
  ];

  useEffect(() => {
    const fetchInvestments = async () => {
      setLoading(true);
      try {

        setInvestments(mockInvestments);
      } catch (err) {
        setError("Failed to fetch investments. Please try again later.");
        console.error("Failed to fetch investments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestments();
  }, []);

  const { summary, chartData, activeInvestments, exitedInvestments } =
    useMemo(() => {
      const active = investments.filter((inv) => inv.status === "active");
      const exited = investments.filter((inv) => inv.status !== "active");
      const total = investments.reduce((sum, inv) => sum + inv.amount, 0);
      const typeData = active.reduce((acc, inv) => {
        acc[inv.type] = (acc[inv.type] || 0) + inv.amount;
        return acc;
      }, {});
      const craftData = active.reduce((acc, inv) => {
        acc[inv.craft] = (acc[inv.craft] || 0) + inv.amount;
        return acc;
      }, {});
      return {
        summary: {
          totalInvested: total,
          activeCount: active.length,
          avgReturn: "4.8%",
        },
        chartData: {
          byType: {
            labels: Object.keys(typeData),
            data: Object.values(typeData),
          },
          byCraft: {
            labels: Object.keys(craftData),
            data: Object.values(craftData),
          },
        },
        activeInvestments: active,
        exitedInvestments: exited,
      };
    }, [investments]);

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-10 px-6 md:px-8 py-8 md:py-10 bg-gradient-to-br from-[#F8F9FA] via-[#F1F3F4] to-[#E8F0FE] min-h-screen">
        <div className="flex-grow space-y-8 md:space-y-10">
          <SkeletonBase className="h-10 w-3/4 mb-4" /> {}
          <SkeletonBase className="h-10 w-full mb-6" /> {}
          <div className="space-y-4">
            <SkeletonBase className="h-20 w-full rounded-lg" />
            <SkeletonBase className="h-20 w-full rounded-lg" />
          </div>
        </div>
        <div className="lg:w-80 flex-shrink-0 space-y-6">
          <SkeletonSidebarCard />
          <SkeletonSidebarCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] px-6 text-center bg-gradient-to-br from-[#F8F9FA] via-[#F1F3F4] to-[#E8F0FE]">
        <ExclamationCircleIcon className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-medium text-red-600 mb-2">
          Oops! Something went wrong.
        </h2>
        <p className="text-gray-600 text-sm mb-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-10 px-6 pb-8 bg-gradient-to-br from-[#F8F9FA] via-[#F1F3F4] to-[#E8F0FE] min-h-screen">
      {}
      <div className="flex-grow lg:w-2/3">
        {" "}
        {}
        <AnimatedSection className="pt-20 mb-8 text-center">
          <h1
            className="inline-block text-3xl font-semibold px-6 py-3 rounded-xl shadow-md"
            style={{
              background: "linear-gradient(90deg, #faeb65ff, #FBC02D)",
              color: "#f9f9fcff",
            }}
          >
            My Investment Portfolio
          </h1>
          <p className="mt-3 text-gray-700 text-sm">
            Track your Investments and performance here.
          </p>
        </AnimatedSection>
        {}
        <div className="border-b border-gray-200 mb-8 sticky top-2 bg-white/80 backdrop-blur-sm z-30 -mx-6 md:-mx-8 px-6 md:px-8">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            <TabButton
              title="Active Portfolio"
              isActive={activeTab === "portfolio"}
              onClick={() => setActiveTab("portfolio")}
              count={activeInvestments.length}
            />
            <TabButton
              title="Analytics"
              isActive={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
            />
            <TabButton
              title="Exited"
              isActive={activeTab === "exited"}
              onClick={() => setActiveTab("exited")}
              count={exitedInvestments.length}
            />
          </div>
        </div>
        {}
        {activeTab === "portfolio" && (
          <AnimatedSection key="portfolio">
            <div className="space-y-4">
              {activeInvestments.length > 0 ? (
                activeInvestments.map((inv) => (
                  <InvestmentCard key={inv.id} investment={inv} />
                ))
              ) : (
                <p className="text-center text-gray-500 py-10 text-sm">
                  You have no active investments.
                </p>
              )}
            </div>
          </AnimatedSection>
        )}
        {activeTab === "analytics" && (
          <AnimatedSection key="analytics">
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <ChartPieIcon className="w-5 h-5 text-gray-500" /> Investments
                  by Type
                </h2>
                <InvestmentTypeChart data={chartData.byType} />
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-gray-500" /> Investments
                  by Craft
                </h2>
                <InvestmentCraftChart data={chartData.byCraft} />
              </div>
            </div>
          </AnimatedSection>
        )}
        {activeTab === "exited" && (
          <AnimatedSection key="exited">
            <div className="space-y-4">
              {exitedInvestments.length > 0 ? (
                exitedInvestments.map((inv) => (
                  <InvestmentCard key={inv.id} investment={inv} />
                ))
              ) : (
                <p className="text-center text-gray-500 py-10 text-sm">
                  You have no exited or paid back investments.
                </p>
              )}
            </div>
          </AnimatedSection>
        )}
      </div>{" "}
      {}
      {}
      <aside className="lg:w-80 flex-shrink-0 space-y-6 lg:sticky lg:top-24 self-start mt-4 lg:mt-0">
        {}
        <AnimatedSection>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <CurrencyDollarIcon className="w-5 h-5 text-google-green" />
              <h3 className="text-base font-medium text-gray-800">
                Total Invested
              </h3>
            </div>
            <p className="text-4xl font-bold text-gray-800">
              ₹{summary.totalInvested.toLocaleString()}
            </p>
          </div>
        </AnimatedSection>
        <AnimatedSection>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <BriefcaseIcon className="w-5 h-5 text-google-blue" />
              <h3 className="text-base font-medium text-gray-800">
                Active Investments
              </h3>
            </div>
            <p className="text-4xl font-bold text-gray-800">
              {summary.activeCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">Artisans</p>
          </div>
        </AnimatedSection>
        <AnimatedSection>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUpIcon className="w-5 h-5 text-gray-500" />
              <h3 className="text-base font-medium text-gray-800">
                Est. Avg. Return
              </h3>
            </div>
            <p className="text-4xl font-bold text-gray-800">
              {summary.avgReturn}
            </p>
            <p className="text-xs text-gray-500 mt-1">Annualized (Mock Data)</p>
          </div>
        </AnimatedSection>

        {}
        <AnimatedSection>
          <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-200/80">
            <div className="flex items-center gap-2.5 mb-2">
              <SparklesIcon className="h-5 w-5 text-google-blue" />
              <h3 className="text-sm font-medium text-blue-900">AI Insights</h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed mb-4">
              Your portfolio is heavily weighted in Equity. Consider
              diversifying with Loan-based investments to balance risk.
            </p>
            <Link
              to="/buyer"
              className="w-full block text-center bg-white text-google-blue border border-blue-200 font-medium py-1.5 rounded-lg hover:bg-blue-100/70 transition-colors text-xs"
            >
              Discover More Artisans
            </Link>
          </div>
        </AnimatedSection>
      </aside>
    </div>
  );
};

export default InvestmentPortfolio;
