import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Video } from 'lucide-react';
import { useAuth, useNavigation } from '../App';
import { fetchLiveInterviewResults, type LiveInterviewRecord } from '../services/liveMockInterviewApi';
import { useDashboard } from '../context/DashboardContext';

type SortKey = 'latest' | 'oldest' | 'score_desc' | 'score_asc';

const LiveMockInterviewDashboard: React.FC = () => {
  const { userId } = useAuth();
  const { navigateTo } = useNavigation();
  const { setActiveView } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<LiveInterviewRecord[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('latest');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLiveInterviewResults(userId);
        if (active) setRecords(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load results');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [userId]);

  const avgScore = useMemo(() => {
    if (records.length === 0) return '--';
    const nums = records
      .map((r) => Number(String(r.evaluation.overall).split('/')[0]))
      .filter((n) => Number.isFinite(n));
    if (nums.length === 0) return '--';
    return `${Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)}/100`;
  }, [records]);

  const sortedRecords = useMemo(() => {
    const list = [...records];
    const scoreOf = (r: LiveInterviewRecord) => {
      const n = Number(String(r.evaluation?.overall || '').split('/')[0]);
      return Number.isFinite(n) ? n : -1;
    };
    list.sort((a, b) => {
      if (sortKey === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortKey === 'score_desc') {
        const d = scoreOf(b) - scoreOf(a);
        if (d !== 0) return d;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortKey === 'score_asc') {
        const d = scoreOf(a) - scoreOf(b);
        if (d !== 0) return d;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [records, sortKey]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Dashboard</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Live Mock Interview Results</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveView('live-mock-interview');
              navigateTo('dashboard');
            }}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
          >
            Start new interview
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Sessions" value={String(records.length)} />
          <StatCard label="Average score" value={avgScore} />
          <StatCard
            label="Latest session"
            value={sortedRecords[0]?.createdAt ? new Date(sortedRecords[0].createdAt).toLocaleDateString() : '--'}
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
        {!loading && !error && sortedRecords.length > 0 && (
          <div className="p-4 border-b border-gray-100 flex items-center justify-end">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
            >
              <option value="latest">Sort: Latest first</option>
              <option value="oldest">Sort: Oldest first</option>
              <option value="score_desc">Sort: Score high to low</option>
              <option value="score_asc">Sort: Score low to high</option>
            </select>
          </div>
        )}
        {loading ? (
          <div className="p-8 flex items-center justify-center gap-3 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading interview history...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error}</div>
        ) : sortedRecords.length === 0 ? (
          <div className="p-10 text-center">
            <Video className="w-8 h-8 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-700 font-medium">No interview sessions yet</p>
            <p className="text-gray-500 text-sm mt-1">Complete one live mock interview to see analytics here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sortedRecords.map((r) => (
              <li key={r.interviewId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{r.sessionLabel || `${r.track} interview`}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.track.toUpperCase()} · {r.level.toUpperCase()} · {Math.round(r.durationSec / 60)} min ·{' '}
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Provider: {(r.provider || 'N/A').toUpperCase()} {r.model ? `· ${r.model}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Overall</p>
                  <p className="text-xl font-bold text-orange-600">{r.evaluation.overall}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

export default LiveMockInterviewDashboard;

