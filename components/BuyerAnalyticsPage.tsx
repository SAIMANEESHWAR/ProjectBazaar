import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../App";
import {
  cachedFetchUserData,
  cachedFetchAllProjects,
  Purchase,
} from "../services/buyerApi";
import SkeletonDashboard from "./ui/skeleton-dashboard";
import {
  Wallet,
  ShoppingBag,
  Tag,
  TrendingUp,
  BarChart3,
  PieChart,
  Receipt,
  CalendarDays,
  LayoutDashboard,
  Clock,
} from "lucide-react";

interface ApiProject {
  projectId: string;
  title: string;
  category: string;
  price: number;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
  subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  colorClass,
  subtext,
}) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-200 group">
    <div
      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass} flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
        {title}
      </p>
      <p className="text-2xl font-bold text-gray-900 truncate leading-tight">
        {value}
      </p>
      {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
    </div>
  </div>
);

interface ChartBarProps {
  label: string;
  value: number;
  maxValue: number;
}

const ChartBar: React.FC<ChartBarProps> = ({ label, value, maxValue }) => {
  const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const formatted =
    value >= 1000
      ? `₹${(value / 1000).toFixed(1)}k`
      : value > 0
        ? `₹${value.toFixed(0)}`
        : "";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-semibold text-gray-500 h-4">
        {formatted}
      </span>
      <div className="w-full h-36 bg-gray-100 rounded-lg flex items-end overflow-hidden">
        <div
          className="w-full rounded-lg bg-gradient-to-t from-orange-500 to-orange-400 transition-all duration-500"
          style={{ height: `${Math.max(heightPercent, value > 0 ? 4 : 0)}%` }}
          title={`₹${value.toFixed(2)}`}
        />
      </div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
};

const BuyerAnalyticsPage: React.FC = () => {
  const { userId } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [projects, setProjects] = useState<Map<string, ApiProject>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [user, allProjectsData] = await Promise.all([
          cachedFetchUserData(userId),
          cachedFetchAllProjects(),
        ]);
        setUserData(user);
        if (allProjectsData.success && allProjectsData.projects) {
          const projectMap = new Map<string, ApiProject>();
          allProjectsData.projects.forEach((project: ApiProject) => {
            projectMap.set(project.projectId, project);
          });
          setProjects(projectMap);
        }
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [userId]);

  const monthlySpendData = useMemo(() => {
    if (!userData?.purchases) return [];
    const monthMap = new Map<string, number>();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentDate = new Date();
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      last6Months.push(monthKey);
      monthMap.set(monthKey, 0);
    }
    userData.purchases.forEach((purchase: Purchase) => {
      const purchaseDate = new Date(purchase.purchasedAt);
      const monthKey = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(
        monthKey,
        (monthMap.get(monthKey) || 0) + purchase.priceAtPurchase,
      );
    });
    return last6Months.map((monthKey) => {
      const date = new Date(monthKey + "-01");
      return {
        month: monthNames[date.getMonth()],
        amount: monthMap.get(monthKey) || 0,
      };
    });
  }, [userData]);

  const maxSpend = useMemo(
    () => Math.max(...monthlySpendData.map((d) => d.amount), 1),
    [monthlySpendData],
  );

  const categorySpendData = useMemo(() => {
    if (!userData?.purchases) return [];
    const categoryMap = new Map<string, number>();
    let totalSpent = 0;
    userData.purchases.forEach((purchase: Purchase) => {
      const project = projects.get(purchase.projectId);
      const category = project?.category || "Other";
      categoryMap.set(
        category,
        (categoryMap.get(category) || 0) + purchase.priceAtPurchase,
      );
      totalSpent += purchase.priceAtPurchase;
    });
    const palette = [
      { bg: "bg-orange-500", hex: "#f97316" },
      { bg: "bg-blue-500", hex: "#3b82f6" },
      { bg: "bg-purple-500", hex: "#a855f7" },
      { bg: "bg-emerald-500", hex: "#10b981" },
      { bg: "bg-rose-400", hex: "#fb7185" },
    ];
    return Array.from(categoryMap.entries())
      .map(([category, amount], index) => ({
        category,
        amount: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
        rawAmount: amount,
        color: palette[index % palette.length].bg,
        hex: palette[index % palette.length].hex,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [userData, projects]);

  const conicGradient = useMemo(() => {
    if (categorySpendData.length === 0)
      return "conic-gradient(#e5e7eb 0% 100%)";
    let current = 0;
    const stops = categorySpendData
      .map((item) => {
        const start = current;
        current += item.amount;
        return `${item.hex} ${start}% ${current}%`;
      })
      .join(", ");
    return `conic-gradient(${stops})`;
  }, [categorySpendData]);

  const recentPurchases = useMemo(() => {
    if (!userData?.purchases) return [];
    return [...userData.purchases]
      .sort(
        (a: Purchase, b: Purchase) =>
          new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime(),
      )
      .slice(0, 5)
      .map((purchase: Purchase) => {
        const project = projects.get(purchase.projectId);
        const date = new Date(purchase.purchasedAt);
        return {
          title: project?.title || `Project ${purchase.projectId}`,
          category: project?.category || "Other",
          date: date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          price: purchase.priceAtPurchase,
          initials: (project?.title || "P").slice(0, 2).toUpperCase(),
        };
      });
  }, [userData, projects]);

  const favoriteCategory = useMemo(
    () =>
      categorySpendData.length > 0 ? categorySpendData[0].category : "N/A",
    [categorySpendData],
  );

  const avgProjectCost = useMemo(() => {
    if (!userData?.purchases?.length) return 0;
    const total = userData.purchases.reduce(
      (sum: number, p: Purchase) => sum + p.priceAtPurchase,
      0,
    );
    return total / userData.purchases.length;
  }, [userData]);

  if (isLoading) {
    return (
      <div className="mt-8 space-y-8">
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <LayoutDashboard className="h-6 w-6 text-orange-500" />
            Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your spending and purchase activity
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-shrink-0">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Last 6 months</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Spent"
          value={`₹${userData?.totalSpent?.toFixed(2) || "0.00"}`}
          icon={<Wallet className="h-6 w-6 text-orange-500" />}
          colorClass="bg-orange-50 border border-orange-100"
          subtext="All-time purchases"
        />
        <StatCard
          title="Projects Purchased"
          value={String(userData?.totalPurchases || 0)}
          icon={<ShoppingBag className="h-6 w-6 text-orange-500" />}
          colorClass="bg-orange-50 border border-orange-100"
          subtext="Total acquisitions"
        />
        <StatCard
          title="Favorite Category"
          value={favoriteCategory}
          icon={<Tag className="h-6 w-6 text-orange-500" />}
          colorClass="bg-orange-50 border border-orange-100"
          subtext="Most purchased type"
        />
        <StatCard
          title="Avg. Project Cost"
          value={`₹${avgProjectCost.toFixed(2)}`}
          icon={<TrendingUp className="h-6 w-6 text-orange-500" />}
          colorClass="bg-orange-50 border border-orange-100"
          subtext="Per project average"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spend Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 leading-tight">
                Monthly Spend
              </h3>
              <p className="text-xs text-gray-400">Last 6 months overview</p>
            </div>
          </div>
          {monthlySpendData.some((d) => d.amount > 0) ? (
            <div className="grid grid-cols-6 gap-3">
              {monthlySpendData.map((data) => (
                <ChartBar
                  key={data.month}
                  label={data.month}
                  value={data.amount}
                  maxValue={maxSpend}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-gray-300">
              <BarChart3 className="h-12 w-12 mb-3" />
              <p className="text-sm text-gray-400 font-medium">
                No purchase data available
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Your monthly spending will appear here
              </p>
            </div>
          )}
        </div>

        {/* Category Donut Chart */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <PieChart className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 leading-tight">
                By Category
              </h3>
              <p className="text-xs text-gray-400">Spending distribution</p>
            </div>
          </div>
          {categorySpendData.length > 0 ? (
            <div className="flex flex-col items-center gap-5">
              {/* Donut */}
              <div className="relative w-36 h-36">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: conicGradient }}
                />
                <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center">
                  <p className="text-xs font-bold text-gray-800 leading-tight">
                    ₹{(userData?.totalSpent || 0).toFixed(0)}
                  </p>
                  <p className="text-[9px] text-gray-400 font-medium tracking-wide uppercase">
                    total
                  </p>
                </div>
              </div>
              {/* Legend */}
              <ul className="w-full space-y-2.5">
                {categorySpendData.map((item) => (
                  <li key={item.category} className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${item.color}`}
                    />
                    <span className="text-sm text-gray-600 flex-1 truncate">
                      {item.category}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {item.amount}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <PieChart className="h-12 w-12 mb-3" />
              <p className="text-sm text-gray-400 font-medium">
                No category data
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Receipt className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 leading-tight">
              Recent Purchases
            </h3>
            <p className="text-xs text-gray-400">Your latest transactions</p>
          </div>
        </div>
        {recentPurchases.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {recentPurchases.map((item, index) => (
              <li
                key={`${item.title}-${index}`}
                className="py-3.5 flex items-center gap-4 hover:bg-gray-50 px-2 rounded-xl transition-colors"
              >
                {/* Initials avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm select-none">
                  {item.initials}
                </div>
                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate text-sm">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {item.date}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="text-xs bg-orange-50 text-orange-600 font-medium px-2 py-0.5 rounded-full border border-orange-100">
                      {item.category}
                    </span>
                  </div>
                </div>
                {/* Price */}
                <p className="font-bold text-gray-900 text-base flex-shrink-0">
                  ₹{item.price.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-gray-300">
            <Receipt className="h-12 w-12 mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              No recent purchases
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Your transactions will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerAnalyticsPage;
