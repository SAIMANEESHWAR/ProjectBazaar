import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../App";
import {
  cachedFetchUserData,
  cachedFetchAllProjects,
  cachedFetchProjectDetails,
  Purchase,
  ProjectDetails,
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
  Search,
  Eye,
  ThumbsUp,
  Activity,
  Flame,
  Hash,
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

// Heatmap intensity class based on count relative to max
const heatmapColor = (count: number, max: number): string => {
  if (count === 0) return "bg-gray-100";
  const ratio = count / max;
  if (ratio <= 0.25) return "bg-orange-100";
  if (ratio <= 0.5) return "bg-orange-300";
  if (ratio <= 0.75) return "bg-orange-500";
  return "bg-orange-600";
};

const BuyerAnalyticsPage: React.FC = () => {
  const { userId } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [projects, setProjects] = useState<Map<string, ApiProject>>(new Map());
  const [projectDetails, setProjectDetails] = useState<
    Map<string, ProjectDetails>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Load core data
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

  // Load full project details for SEO/interest analytics (non-blocking)
  useEffect(() => {
    const loadDetails = async () => {
      if (!userData?.purchases?.length) return;
      try {
        const uniqueIds: string[] = [
          ...new Set(
            userData.purchases.map((p: Purchase) => p.projectId)
          ),
        ].slice(0, 20) as string[];

        const results = await Promise.allSettled(
          uniqueIds.map((id) => cachedFetchProjectDetails(id))
        );
        const detailMap = new Map<string, ProjectDetails>();
        results.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value) {
            detailMap.set(uniqueIds[index], result.value);
          }
        });
        setProjectDetails(detailMap);
      } catch (err) {
        console.error("Error loading project details:", err);
      }
    };
    loadDetails();
  }, [userData]);

  // ── Core memos ──────────────────────────────────────────────────────────────

  const monthlySpendData = useMemo(() => {
    if (!userData?.purchases) return [];
    const monthMap = new Map<string, number>();
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const currentDate = new Date();
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
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
        (monthMap.get(monthKey) || 0) + purchase.priceAtPurchase
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
    [monthlySpendData]
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
        (categoryMap.get(category) || 0) + purchase.priceAtPurchase
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
          new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
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
    [categorySpendData]
  );

  const avgProjectCost = useMemo(() => {
    if (!userData?.purchases?.length) return 0;
    const total = userData.purchases.reduce(
      (sum: number, p: Purchase) => sum + p.priceAtPurchase,
      0
    );
    return total / userData.purchases.length;
  }, [userData]);

  // ── SEO memos ───────────────────────────────────────────────────────────────

  // Aggregate tags from all fetched project details
  const tagFrequencyData = useMemo(() => {
    const tagMap = new Map<string, number>();
    projectDetails.forEach((detail) => {
      (detail.tags || []).forEach((tag: string) => {
        const normalised = tag.toLowerCase().trim();
        if (normalised) tagMap.set(normalised, (tagMap.get(normalised) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [projectDetails]);

  const maxTagCount = useMemo(
    () => Math.max(...tagFrequencyData.map((t) => t.count), 1),
    [tagFrequencyData]
  );

  // Engagement metrics across owned projects
  const engagementMetrics = useMemo(() => {
    if (projectDetails.size === 0)
      return { avgViews: 0, avgLikes: 0, avgPurchases: 0 };
    let totalViews = 0, totalLikes = 0, totalPurchases = 0;
    projectDetails.forEach((d) => {
      totalViews += d.viewsCount || 0;
      totalLikes += d.likesCount || 0;
      totalPurchases += d.purchasesCount || 0;
    });
    const n = projectDetails.size;
    return {
      avgViews: Math.round(totalViews / n),
      avgLikes: Math.round(totalLikes / n),
      avgPurchases: Math.round(totalPurchases / n),
    };
  }, [projectDetails]);

  // ── Geo / heatmap memo ───────────────────────────────────────────────────────

  const activityHeatmap = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const slots = ["Night\n12–6am", "Morning\n6–12pm", "Afternoon\n12–6pm", "Evening\n6–12am"];
    // rows = time slots, cols = days
    const grid: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0));

    userData?.purchases?.forEach((purchase: Purchase) => {
      const date = new Date(purchase.purchasedAt);
      const dayIndex = (date.getDay() + 6) % 7; // Mon=0 … Sun=6
      const hour = date.getHours();
      const slotIndex = hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3;
      grid[slotIndex][dayIndex]++;
    });

    const maxVal = Math.max(...grid.flat(), 1);
    return { grid, days, slots, maxVal };
  }, [userData]);

  const totalHeatmapPurchases = useMemo(
    () => activityHeatmap.grid.flat().reduce((a, b) => a + b, 0),
    [activityHeatmap]
  );

  const peakDayLabel = useMemo(() => {
    if (totalHeatmapPurchases === 0) return "—";
    const daySums = activityHeatmap.days.map((day, i) => ({
      day,
      total: activityHeatmap.grid.reduce((sum, row) => sum + row[i], 0),
    }));
    return daySums.sort((a, b) => b.total - a.total)[0].day;
  }, [activityHeatmap, totalHeatmapPurchases]);

  const peakSlotLabel = useMemo(() => {
    if (totalHeatmapPurchases === 0) return "—";
    const slotSums = activityHeatmap.slots.map((slot, i) => ({
      slot: slot.split("\n")[0],
      total: activityHeatmap.grid[i].reduce((a, b) => a + b, 0),
    }));
    return slotSums.sort((a, b) => b.total - a.total)[0].slot;
  }, [activityHeatmap, totalHeatmapPurchases]);

  // ────────────────────────────────────────────────────────────────────────────

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
            Track your spending, interests, and purchase activity
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-shrink-0">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Last 6 months</span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
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

      {/* ── Charts row ── */}
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

      {/* ── Recent Purchases ── */}
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm select-none">
                  {item.initials}
                </div>
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

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── SEO: Interest & Keyword Analytics ── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tag Frequency — keyword interests */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Hash className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 leading-tight">
                  Top Keyword Interests
                </h3>
                <p className="text-xs text-gray-400">
                  Technologies across your purchased projects
                </p>
              </div>
            </div>
            <span className="text-xs bg-orange-50 text-orange-500 font-semibold px-2.5 py-1 rounded-full border border-orange-100">
              SEO
            </span>
          </div>

          {tagFrequencyData.length > 0 ? (
            <div className="space-y-3">
              {tagFrequencyData.map((item, i) => (
                <div key={item.tag} className="flex items-center gap-3">
                  {/* rank */}
                  <span className="w-5 text-[11px] font-bold text-gray-300 text-right flex-shrink-0">
                    {i + 1}
                  </span>
                  {/* tag name */}
                  <span className="w-28 text-sm font-medium text-gray-700 truncate flex-shrink-0 capitalize">
                    {item.tag}
                  </span>
                  {/* bar */}
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.count / maxTagCount) * 100}%`,
                      }}
                    />
                  </div>
                  {/* count badge */}
                  <span className="w-8 text-xs font-semibold text-gray-500 text-right flex-shrink-0">
                    ×{item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <Search className="h-12 w-12 mb-3" />
              <p className="text-sm text-gray-400 font-medium">
                No keyword data yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Tags from your purchased projects will appear here
              </p>
            </div>
          )}
        </div>

        {/* Content Engagement Score */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 leading-tight">
                  Content Quality
                </h3>
                <p className="text-xs text-gray-400">Avg. across owned projects</p>
              </div>
            </div>
            <span className="text-xs bg-orange-50 text-orange-500 font-semibold px-2.5 py-1 rounded-full border border-orange-100">
              SEO
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-5">
            {/* Avg Views */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Avg Views
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {engagementMetrics.avgViews.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Avg Likes */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
                <ThumbsUp className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Avg Likes
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {engagementMetrics.avgLikes.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Avg Purchases (social proof) */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Avg Sales
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {engagementMetrics.avgPurchases.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── GEO: Purchase Activity Heatmap ── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Activity className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 leading-tight">
                Purchase Activity Heatmap
              </h3>
              <p className="text-xs text-gray-400">
                When you buy — by day and time of day
              </p>
            </div>
          </div>
          <span className="text-xs bg-orange-50 text-orange-500 font-semibold px-2.5 py-1 rounded-full border border-orange-100">
            GEO
          </span>
        </div>

        {totalHeatmapPurchases > 0 ? (
          <div className="space-y-6">
            {/* Summary chips */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2">
                <CalendarDays className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-gray-600 font-medium">
                  Peak day: <span className="text-orange-600 font-bold">{peakDayLabel}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-gray-600 font-medium">
                  Peak time: <span className="text-orange-600 font-bold">{peakSlotLabel}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2">
                <ShoppingBag className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-gray-600 font-medium">
                  Total: <span className="text-orange-600 font-bold">{totalHeatmapPurchases} purchases</span>
                </span>
              </div>
            </div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[480px]">
                {/* Day headers */}
                <div className="grid grid-cols-8 gap-1.5 mb-1.5">
                  <div /> {/* empty corner */}
                  {activityHeatmap.days.map((day) => (
                    <div
                      key={day}
                      className="text-center text-[11px] font-semibold text-gray-400 pb-0.5"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {activityHeatmap.grid.map((row, rowIdx) => (
                  <div
                    key={rowIdx}
                    className="grid grid-cols-8 gap-1.5 mb-1.5"
                  >
                    {/* Time label */}
                    <div className="flex items-center justify-end pr-2">
                      <span className="text-[10px] font-medium text-gray-400 text-right leading-tight whitespace-pre-line">
                        {activityHeatmap.slots[rowIdx]}
                      </span>
                    </div>
                    {/* Cells */}
                    {row.map((count, colIdx) => (
                      <div
                        key={colIdx}
                        title={`${activityHeatmap.days[colIdx]} ${activityHeatmap.slots[rowIdx].split("\n")[0]}: ${count} purchase${count !== 1 ? "s" : ""}`}
                        className={`h-9 rounded-lg ${heatmapColor(count, activityHeatmap.maxVal)} transition-colors cursor-default flex items-center justify-center`}
                      >
                        {count > 0 && (
                          <span className="text-[10px] font-bold text-white drop-shadow-sm">
                            {count}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-gray-400 font-medium">Less</span>
              {["bg-gray-100", "bg-orange-100", "bg-orange-300", "bg-orange-500", "bg-orange-600"].map(
                (cls) => (
                  <div key={cls} className={`w-5 h-5 rounded-md ${cls}`} />
                )
              )}
              <span className="text-xs text-gray-400 font-medium">More</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-gray-300">
            <Activity className="h-12 w-12 mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              No activity data yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Your purchase patterns will be visualised here
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default BuyerAnalyticsPage;
