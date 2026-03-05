import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, FileText, Activity } from 'lucide-react';

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

// ── Color helpers ────────────────────────────────────────────────────
function coverageColor(pct: number): string {
  if (pct >= 80) return 'text-green-600 dark:text-green-400';
  if (pct >= 50) return 'text-yellow-500 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function coverageBgColor(pct: number): string {
  if (pct >= 80) return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
  if (pct >= 50) return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
  return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
}

function progressBarColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

// ── Metric Card ──────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  pct: number;
  covered: number;
  total: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, pct, covered, total }) => (
  <div className={`rounded-xl border p-5 ${coverageBgColor(pct)}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`text-2xl font-bold ${coverageColor(pct)}`}>{pct.toFixed(1)}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
      <div
        className={`h-2 rounded-full ${progressBarColor(pct)} transition-all duration-500`}
        style={{ width: `${Math.min(pct, 100)}%` }}
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
  const parts = path.split('/');
  let result = parts[parts.length - 1];
  for (let i = parts.length - 2; i >= 0; i--) {
    const candidate = `…/${parts.slice(i).join('/')}`;
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

  const fetchCoverage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/coverage/coverage-summary.json');
      if (!res.ok) {
        setError('no-data');
        setSummary(null);
        return;
      }
      const data: CoverageSummary & { meta?: TestMeta } = await res.json();
      const { meta: fileMeta, ...rest } = data;
      setSummary(rest as CoverageSummary);
      setMeta(fileMeta ?? {});
      setLastUpdated(fileMeta?.timestamp ?? new Date().toISOString());
    } catch {
      setError('no-data');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoverage();
  }, [fetchCoverage]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-64 gap-4" data-testid="loading-state">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        <p className="text-gray-500 dark:text-gray-400">Loading coverage report…</p>
      </div>
    );
  }

  // ── Empty / error state ──
  if (error === 'no-data' || !summary) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-64 gap-4 text-center" data-testid="empty-state">
        <AlertCircle className="w-12 h-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No coverage data available</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Run <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-sm">npm run test:coverage</code> to generate a report.
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

  // Build per-file list (exclude "total" key), sort by lowest line coverage
  const fileEntries = Object.entries(summary)
    .filter(([key]) => key !== 'total')
    .sort((a, b) => (a[1].lines?.pct ?? 0) - (b[1].lines?.pct ?? 0));

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : null;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto" data-testid="coverage-report">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="w-7 h-7 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Test Coverage Report</h1>
            {formattedDate && (
              <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="last-updated">
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

      {/* Test status summary (if meta present) */}
      {(meta.passedTests !== undefined || meta.failedTests !== undefined || meta.skippedTests !== undefined) && (
        <div className="flex flex-wrap gap-4" data-testid="test-status">
          {meta.passedTests !== undefined && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 dark:text-green-400 font-medium">{meta.passedTests} Passed</span>
            </div>
          )}
          {meta.failedTests !== undefined && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 dark:text-red-400 font-medium">{meta.failedTests} Failed</span>
            </div>
          )}
          {meta.skippedTests !== undefined && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400 font-medium">{meta.skippedTests} Skipped</span>
            </div>
          )}
        </div>
      )}

      {/* Summary metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="metric-cards">
        <MetricCard label="Lines" pct={total.lines?.pct ?? 0} covered={total.lines?.covered ?? 0} total={total.lines?.total ?? 0} />
        <MetricCard label="Branches" pct={total.branches?.pct ?? 0} covered={total.branches?.covered ?? 0} total={total.branches?.total ?? 0} />
        <MetricCard label="Functions" pct={total.functions?.pct ?? 0} covered={total.functions?.covered ?? 0} total={total.functions?.total ?? 0} />
        <MetricCard label="Statements" pct={total.statements?.pct ?? 0} covered={total.statements?.covered ?? 0} total={total.statements?.total ?? 0} />
      </div>

      {/* Per-file breakdown table */}
      {fileEntries.length > 0 && (
        <div data-testid="file-table">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            File Breakdown
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(sorted by lowest coverage)</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">File</th>
                  <th className="px-4 py-3 text-right">Lines %</th>
                  <th className="px-4 py-3 text-right">Branches %</th>
                  <th className="px-4 py-3 text-right">Functions %</th>
                  <th className="px-4 py-3 text-right">Statements %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {fileEntries.map(([filePath, fc]) => (
                  <tr key={filePath} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300 max-w-xs">
                      <span title={filePath}>{truncatePath(filePath)}</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${coverageColor(fc.lines?.pct ?? 0)}`}>
                      {(fc.lines?.pct ?? 0).toFixed(1)}%
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${coverageColor(fc.branches?.pct ?? 0)}`}>
                      {(fc.branches?.pct ?? 0).toFixed(1)}%
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${coverageColor(fc.functions?.pct ?? 0)}`}>
                      {(fc.functions?.pct ?? 0).toFixed(1)}%
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${coverageColor(fc.statements?.pct ?? 0)}`}>
                      {(fc.statements?.pct ?? 0).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverageReportPage;
