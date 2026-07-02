import React, { useEffect, useMemo, useState } from 'react';
import { fetchAllAdminUsers, getUserAttribution } from '../../services/adminUsersApi';
import {
  formatAttributionLabel,
  formatCapturedAt,
  hasUtmCampaignAttribution,
  hasVisitAttribution,
} from '../../lib/userAttribution';
import { UTM_TRACKING_SHEET_URL } from '../../lib/utmTracking';

interface CampaignStat {
  key: string;
  source: string;
  medium: string;
  campaign: string;
  signups: number;
}

const UserAttributionSummary: React.FC = () => {
  const [users, setUsers] = useState<Awaited<ReturnType<typeof fetchAllAdminUsers>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllAdminUsers();
        if (!cancelled) setUsers(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load attribution data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const attributedUsers = useMemo(
    () => users.filter((user) => hasUtmCampaignAttribution(getUserAttribution(user))),
    [users]
  );
  const visitOnlyUsers = useMemo(
    () =>
      users.filter((user) => {
        const attr = getUserAttribution(user);
        return hasVisitAttribution(attr) && !hasUtmCampaignAttribution(attr);
      }),
    [users]
  );

  const campaignStats = useMemo(() => {
    const map = new Map<string, CampaignStat>();
    for (const user of attributedUsers) {
      const attr = getUserAttribution(user);
      const source = attr.utmSource || '(direct)';
      const medium = attr.utmMedium || '—';
      const campaign = attr.utmCampaign || '—';
      const key = `${source}|${medium}|${campaign}`;
      const existing = map.get(key);
      if (existing) {
        existing.signups += 1;
      } else {
        map.set(key, { key, source, medium, campaign, signups: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.signups - a.signups);
  }, [attributedUsers]);

  const sources = useMemo(() => {
    const set = new Set<string>();
    attributedUsers.forEach((user) => {
      const source = getUserAttribution(user).utmSource;
      if (source) set.add(source);
    });
    return Array.from(set).sort();
  }, [attributedUsers]);

  const filteredUsers = useMemo(() => {
    if (sourceFilter === 'all') return attributedUsers;
    return attributedUsers.filter(
      (user) => getUserAttribution(user).utmSource === sourceFilter
    );
  }, [attributedUsers, sourceFilter]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mb-3" />
        <p className="text-gray-600">Loading marketing attribution...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marketing Attribution</h2>
          <p className="text-sm text-gray-600">
            Signups with UTM data synced from DynamoDB and{' '}
            <a
              href={UTM_TRACKING_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline font-medium"
            >
              Google Sheets
            </a>
          </p>
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All sources</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-5 border border-orange-200">
          <p className="text-sm text-orange-700 font-medium">UTM campaigns</p>
          <p className="text-3xl font-bold text-orange-900">{attributedUsers.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Visit-only (no UTM tags)</p>
          <p className="text-3xl font-bold text-blue-900">{visitOnlyUsers.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-5 border border-green-200">
          <p className="text-sm text-green-700 font-medium">Top source</p>
          <p className="text-2xl font-bold text-green-900">
            {campaignStats[0]?.source || '—'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Campaign breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Medium</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Signups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaignStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No attributed signups yet.
                  </td>
                </tr>
              ) : (
                campaignStats.map((row) => (
                  <tr key={row.key} className="hover:bg-orange-50/40">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.source}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.medium}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.campaign}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-orange-600">{row.signups}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Recent attributed signups</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Captured</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Landing page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.slice(0, 20).map((user) => {
                const attr = getUserAttribution(user);
                return (
                  <tr key={user.userId} className="hover:bg-orange-50/40">
                    <td className="px-6 py-3">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">{user.createdBy || 'self'}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{formatAttributionLabel(attr)}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {formatCapturedAt(attr.attributionCapturedAt)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 break-all max-w-xs">
                      {attr.landingPage || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserAttributionSummary;
