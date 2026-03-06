import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Activity,
  Info,
  Search,
  Play,
  Loader2,
  ChevronUp,
  ChevronDown,
  Filter,
} from "lucide-react";
import {
  runTestForFile,
  type TestRunResult,
} from "../../services/testRunnerApi";

// ── Types ────────────────────────────────────────────────────────────
interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

interface FileCoverage {
  lines: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  statements: CoverageMetric;
}

interface CoverageSummary {
  total: FileCoverage;
  [filePath: string]: FileCoverage;
}

interface TestMeta {
  passedTests?: number;
  failedTests?: number;
  skippedTests?: number;
  timestamp?: string;
}

// ── Sort column type ─────────────────────────────────────────────────
type SortColumn = "file" | "lines" | "branches" | "functions" | "statements";
type CoverageFilter = "all" | "critical" | "warning" | "good";
type RunState = "idle" | "running" | "passed" | "failed";

// ── Color helpers ────────────────────────────────────────────────────
function coverageColor(pct: number): string {
  if (pct >= 80) return "text-green-600 dark:text-green-400";
  if (pct >= 50) return "text-yellow-500 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function coverageBgColor(pct: number): string {
  if (pct >= 80)
    return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
  if (pct >= 50)
    return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800";
  return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
}

function progressBarColor(pct: number): string {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

// ── Info Tooltip ─────────────────────────────────────────────────────
// Uses fixed positioning (computed from getBoundingClientRect) so the tooltip
// escapes any overflow:hidden/auto ancestor (like the scrollable table wrapper).
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [tipStyle, setTipStyle] = useState<React.CSSProperties | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    if (!iconRef.current) return;
    const r = iconRef.current.getBoundingClientRect();
    setTipStyle({
      position: "fixed",
      top: r.top - 10,
      left: r.left + r.width / 2,
      transform: "translate(-50%, -100%)",
      zIndex: 9999,
      animation: "crFadeUp 0.15s ease forwards",
    });
  };

  return (
    <span
      ref={iconRef}
      className="inline-flex items-center ml-1 align-middle"
      onMouseEnter={show}
      onMouseLeave={() => setTipStyle(null)}
    >
      <Info className="w-3.5 h-3.5 text-gray-400 hover:text-orange-400 cursor-help transition-colors" />
      {tipStyle && (
        <div
          style={tipStyle}
          className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg
                     px-3 py-2 w-56 shadow-xl pointer-events-none leading-relaxed"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      )}
    </span>
  );
};

// ── Sortable Column Header ────────────────────────────────────────────
const SortableHeader: React.FC<{
  col: SortColumn;
  label: string;
  tooltip: string;
  sortCol: SortColumn;
  sortDir: "asc" | "desc";
  onSort: (col: SortColumn) => void;
  align?: "left" | "right";
  thClassName?: string;
}> = ({
  col,
  label,
  tooltip,
  sortCol,
  sortDir,
  onSort,
  align = "right",
  thClassName = "",
}) => {
  const isActive = sortCol === col;
  return (
    <th
      className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"} ${thClassName}`}
    >
      <button
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-0.5 uppercase text-xs font-semibold
                    hover:text-orange-500 transition-colors select-none
                    ${isActive ? "text-orange-500" : "text-gray-500 dark:text-gray-400"}`}
      >
        {align === "left" && <InfoTooltip text={tooltip} />}
        <span className="mx-0.5">{label}</span>
        {align === "right" && <InfoTooltip text={tooltip} />}
        <span className="ml-0.5">
          {isActive ? (
            sortDir === "asc" ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )
          ) : (
            <ChevronUp className="w-3.5 h-3.5 opacity-25" />
          )}
        </span>
      </button>
    </th>
  );
};

// ── Run Button ───────────────────────────────────────────────────────
// Calls POST /api/run-test to execute Vitest for the given source file.
// State transitions: idle → running → passed/failed (with details) → idle.
const RunButton: React.FC<{ filePath: string }> = ({ filePath }) => {
  const [state, setState] = useState<RunState>("idle");
  const [runResult, setRunResult] = useState<TestRunResult | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRun = async () => {
    setState("running");
    setRunResult(null);
    console.log(
      `%c[CoverageReport] ▶ Running tests for: ${filePath}`,
      "color: #f97316; font-weight: bold",
    );

    try {
      const res = await runTestForFile(filePath);
      setRunResult(res);

      if (res.ok && res.status === "passed") {
        setState("passed");
        console.log(
          `%c[CoverageReport] ✅ PASSED: ${filePath}  (${res.summary?.passed}/${res.summary?.total} tests, ${res.duration}ms)`,
          "color: #16a34a; font-weight: bold",
        );
      } else if (res.ok && res.status === "failed") {
        setState("failed");
        console.log(
          `%c[CoverageReport] ❌ FAILED: ${filePath}  (${res.summary?.failed} failed, ${res.summary?.passed} passed of ${res.summary?.total})`,
          "color: #dc2626; font-weight: bold",
        );
        if (res.output) console.log(res.output);
      } else {
        setState("failed");
        console.error(`[CoverageReport] Error: ${res.error ?? "Unknown error"}`);
      }
    } catch (err) {
      setState("failed");
      setRunResult({
        ok: false,
        error: err instanceof Error ? err.message : "Network error",
      });
      console.error("[CoverageReport] Network error:", err);
    }

    // Auto-reset to idle after 5s so user can re-run
    resetTimer.current = setTimeout(() => {
      setState("idle");
      setRunResult(null);
    }, 5000);
  };

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  if (state === "running")
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs
                       bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 font-medium"
      >
        <Loader2 className="w-3 h-3 animate-spin" /> Running…
      </span>
    );
  if (state === "passed")
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs
                       bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 font-medium cursor-default"
        style={{ animation: "crFadeUp 0.2s ease forwards" }}
        title={
          runResult?.summary
            ? `${runResult.summary.passed}/${runResult.summary.total} tests passed in ${runResult.duration}ms`
            : undefined
        }
      >
        <CheckCircle className="w-3 h-3" />
        {runResult?.summary
          ? `${runResult.summary.passed}/${runResult.summary.total} Passed`
          : "Passed"}
      </span>
    );
  if (state === "failed")
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs
                       bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-medium cursor-default"
        style={{ animation: "crFadeUp 0.2s ease forwards" }}
        title={
          runResult?.error ??
          (runResult?.summary
            ? `${runResult.summary.failed} failed, ${runResult.summary.passed} passed`
            : undefined)
        }
      >
        <XCircle className="w-3 h-3" />
        {runResult?.summary
          ? `${runResult.summary.failed} Failed`
          : runResult?.error
            ? "Error"
            : "Failed"}
      </span>
    );

  return (
    <button
      onClick={handleRun}
      title={`Run tests for ${filePath}`}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs
                 bg-gray-100 hover:bg-orange-100 text-gray-500 hover:text-orange-600
                 dark:bg-gray-800 dark:hover:bg-orange-900/30 dark:hover:text-orange-400
                 transition-all duration-200 font-medium group"
    >
      <Play className="w-3 h-3 fill-current group-hover:scale-110 transition-transform" />
      Run
    </button>
  );
};

// ── Metric Card ──────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  pct: number;
  covered: number;
  total: number;
  index: number;
  animate: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  pct,
  covered,
  total,
  index,
  animate,
}) => (
  <div
    className={`rounded-xl border p-5 ${coverageBgColor(pct)}`}
    style={{
      opacity: animate ? 1 : 0,
      transform: animate ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
      transitionDelay: `${index * 80}ms`,
    }}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}
      </span>
      <span className={`text-2xl font-bold ${coverageColor(pct)}`}>
        {pct.toFixed(1)}%
      </span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
      <div
        className={`h-2 rounded-full ${progressBarColor(pct)}`}
        style={{
          width: animate ? `${Math.min(pct, 100)}%` : "0%",
          transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
          transitionDelay: `${index * 80 + 200}ms`,
        }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
    <p className="text-xs text-gray-500 dark:text-gray-400">
      {covered} / {total} covered
    </p>
  </div>
);

// ── File row ─────────────────────────────────────────────────────────
const truncatePath = (path: string, max = 60): string => {
  if (path.length <= max) return path;
  const parts = path.split("/");
  let result = parts[parts.length - 1];
  for (let i = parts.length - 2; i >= 0; i--) {
    const candidate = `…/${parts.slice(i).join("/")}`;
    if (candidate.length <= max) result = candidate;
    else break;
  }
  return result;
};

// ── Main Page ────────────────────────────────────────────────────────
const CoverageReportPage: React.FC = () => {
  const [summary, setSummary] = useState<CoverageSummary | null>(null);
  const [meta, setMeta] = useState<TestMeta>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);

  // Filter & sort state
  const [search, setSearch] = useState("");
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");
  const [sortCol, setSortCol] = useState<SortColumn>("lines");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const fetchCoverage = useCallback(async () => {
    setLoading(true);
    setAnimate(false);
    setError(null);
    try {
      const res = await fetch("/coverage/coverage-summary.json");
      if (!res.ok) {
        setError("no-data");
        setSummary(null);
        return;
      }
      const data: CoverageSummary & { meta?: TestMeta } = await res.json();
      const { meta: fileMeta, ...rest } = data;
      setSummary(rest as CoverageSummary);
      setMeta(fileMeta ?? {});
      setLastUpdated(fileMeta?.timestamp ?? new Date().toISOString());
    } catch {
      setError("no-data");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoverage();
  }, [fetchCoverage]);

  // Trigger animations after data loads
  useEffect(() => {
    if (!loading && summary) {
      const t = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading, summary]);

  // ── Loading ──
  if (loading) {
    return (
      <div
        className="p-8 flex flex-col items-center justify-center min-h-64 gap-4"
        data-testid="loading-state"
      >
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        <p className="text-gray-500 dark:text-gray-400">
          Loading coverage report…
        </p>
      </div>
    );
  }

  // ── Empty / error state ──
  if (error === "no-data" || !summary) {
    return (
      <div
        className="p-8 flex flex-col items-center justify-center min-h-64 gap-4 text-center"
        data-testid="empty-state"
      >
        <AlertCircle className="w-12 h-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          No coverage data available
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Run{" "}
          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-sm">
            npm run test:coverage
          </code>{" "}
          to generate a report.
        </p>
        <button
          onClick={fetchCoverage}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          data-testid="refresh-button"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const total = summary.total;

  // Coverage filter predicate
  const filterByStatus = ([, fc]: [string, FileCoverage]) => {
    const pct = fc.lines?.pct ?? 0;
    if (coverageFilter === "critical") return pct < 50;
    if (coverageFilter === "warning") return pct >= 50 && pct < 80;
    if (coverageFilter === "good") return pct >= 80;
    return true;
  };

  // Build per-file list with search + status filter + sort
  const fileEntries = Object.entries(summary)
    .filter(([key]) => key !== "total")
    .filter(
      ([key]) =>
        search === "" || key.toLowerCase().includes(search.toLowerCase()),
    )
    .filter(filterByStatus)
    .sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      if (sortCol === "file") {
        aVal = a[0];
        bVal = b[0];
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      aVal = a[1][sortCol]?.pct ?? 0;
      bVal = b[1][sortCol]?.pct ?? 0;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : null;

  const COLUMN_TOOLTIPS: Record<string, string> = {
    file: "Source file path relative to the project root.",
    lines: "Percentage of executable lines that were hit by at least one test.",
    branches:
      "Percentage of code branches (if/else, ternary, switch) covered by tests.",
    functions: "Percentage of functions/methods that were called during tests.",
    statements:
      "Percentage of individual statements executed across all tests.",
  };

  const FILTER_OPTIONS: {
    value: CoverageFilter;
    label: string;
    color: string;
  }[] = [
    {
      value: "all",
      label: "All files",
      color: "text-gray-600 dark:text-gray-300",
    },
    {
      value: "critical",
      label: "🔴 Critical < 50%",
      color: "text-red-600 dark:text-red-400",
    },
    {
      value: "warning",
      label: "🟡 Warning 50–79%",
      color: "text-yellow-600 dark:text-yellow-400",
    },
    {
      value: "good",
      label: "🟢 Good ≥ 80%",
      color: "text-green-600 dark:text-green-400",
    },
  ];

  return (
    <>
      {/* Keyframe styles injected inline so no Tailwind config change needed */}
      <style>{`
        @keyframes crFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes crSlideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div
        className="p-6 space-y-8 max-w-7xl mx-auto"
        data-testid="coverage-report"
      >
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ animation: "crFadeUp 0.35s ease forwards" }}
        >
          <div className="flex items-center gap-3">
            <Activity className="w-7 h-7 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Test Coverage Report
              </h1>
              {formattedDate && (
                <p
                  className="text-sm text-gray-500 dark:text-gray-400"
                  data-testid="last-updated"
                >
                  Last updated: {formattedDate}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={fetchCoverage}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors self-start sm:self-auto"
            data-testid="refresh-button"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Test status summary */}
        {(meta.passedTests !== undefined ||
          meta.failedTests !== undefined ||
          meta.skippedTests !== undefined) && (
          <div
            className="flex flex-wrap gap-4"
            data-testid="test-status"
            style={{ animation: "crFadeUp 0.35s ease 0.1s both" }}
          >
            {meta.passedTests !== undefined && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 dark:text-green-400 font-medium">
                  {meta.passedTests} Passed
                </span>
              </div>
            )}
            {meta.failedTests !== undefined && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 dark:text-red-400 font-medium">
                  {meta.failedTests} Failed
                </span>
              </div>
            )}
            {meta.skippedTests !== undefined && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2">
                <AlertCircle className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  {meta.skippedTests} Skipped
                </span>
              </div>
            )}
          </div>
        )}

        {/* Summary metric cards — staggered fade-in + animated progress bars */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          data-testid="metric-cards"
        >
          {(["lines", "branches", "functions", "statements"] as const).map(
            (key, i) => (
              <MetricCard
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                pct={total[key]?.pct ?? 0}
                covered={total[key]?.covered ?? 0}
                total={total[key]?.total ?? 0}
                index={i}
                animate={animate}
              />
            ),
          )}
        </div>

        {/* Per-file breakdown */}
        {Object.keys(summary).filter((k) => k !== "total").length > 0 && (
          <div data-testid="file-table">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                File Breakdown
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({fileEntries.length} file
                  {fileEntries.length !== 1 ? "s" : ""})
                </span>
              </h2>

              {/* Filters row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search files…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-7 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                               focus:outline-none focus:ring-2 focus:ring-orange-400 w-44 transition-shadow"
                  />
                </div>

                {/* Coverage status filter */}
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={coverageFilter}
                    onChange={(e) =>
                      setCoverageFilter(e.target.value as CoverageFilter)
                    }
                    className="pl-7 pr-6 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                               focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none cursor-pointer transition-shadow"
                  >
                    {FILTER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {fileEntries.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-gray-500 rounded-xl border border-gray-200 dark:border-gray-700">
                No files match the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <SortableHeader
                        col="file"
                        label="File"
                        tooltip={COLUMN_TOOLTIPS.file}
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                        align="left"
                        thClassName="w-48 sm:w-64"
                      />
                      <SortableHeader
                        col="lines"
                        label="Lines %"
                        tooltip={COLUMN_TOOLTIPS.lines}
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        col="branches"
                        label="Branches %"
                        tooltip={COLUMN_TOOLTIPS.branches}
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        col="functions"
                        label="Functions %"
                        tooltip={COLUMN_TOOLTIPS.functions}
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        col="statements"
                        label="Statements %"
                        tooltip={COLUMN_TOOLTIPS.statements}
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      />
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-20">
                        Run
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {fileEntries.map(([filePath, fc], idx) => (
                      <tr
                        key={filePath}
                        className="bg-white dark:bg-gray-900 hover:bg-orange-50/40 dark:hover:bg-gray-800 transition-colors"
                        style={{
                          opacity: animate ? 1 : 0,
                          transform: animate
                            ? "translateX(0)"
                            : "translateX(-8px)",
                          transition:
                            "opacity 0.3s ease, transform 0.3s ease, background-color 0.15s ease",
                          transitionDelay: `${Math.min(idx * 25, 500)}ms`,
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300 overflow-hidden">
                          <span className="block truncate" title={filePath}>
                            {truncatePath(filePath)}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${coverageColor(fc.lines?.pct ?? 0)}`}
                        >
                          {(fc.lines?.pct ?? 0).toFixed(1)}%
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${coverageColor(fc.branches?.pct ?? 0)}`}
                        >
                          {(fc.branches?.pct ?? 0).toFixed(1)}%
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${coverageColor(fc.functions?.pct ?? 0)}`}
                        >
                          {(fc.functions?.pct ?? 0).toFixed(1)}%
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${coverageColor(fc.statements?.pct ?? 0)}`}
                        >
                          {(fc.statements?.pct ?? 0).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RunButton filePath={filePath} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CoverageReportPage;
