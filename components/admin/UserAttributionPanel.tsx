import React from 'react';
import {
  formatAttributionLabel,
  formatCapturedAt,
  hasAttribution,
  type UserAttribution,
} from '../../lib/userAttribution';

interface UserAttributionPanelProps {
  attribution: UserAttribution;
  createdBy?: string;
  compact?: boolean;
}

const FIELDS: { key: keyof UserAttribution; label: string }[] = [
  { key: 'utmSource', label: 'Source' },
  { key: 'utmMedium', label: 'Medium' },
  { key: 'utmCampaign', label: 'Campaign' },
  { key: 'utmTerm', label: 'Term' },
  { key: 'utmContent', label: 'Content' },
  { key: 'gclid', label: 'Google Click ID' },
  { key: 'fbclid', label: 'Facebook Click ID' },
  { key: 'landingPage', label: 'Landing Page' },
  { key: 'signupReferrer', label: 'Referrer' },
  { key: 'attributionCapturedAt', label: 'Captured At' },
];

const UserAttributionPanel: React.FC<UserAttributionPanelProps> = ({
  attribution,
  createdBy,
  compact = false,
}) => {
  if (!hasAttribution(attribution)) {
    return (
      <div className={`rounded-xl border border-dashed border-gray-200 bg-gray-50 ${compact ? 'p-4' : 'p-6'}`}>
        <p className="text-sm text-gray-500">No UTM attribution recorded for this user.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50/80 to-white ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Marketing Attribution</h3>
          <p className="text-sm text-gray-600">{formatAttributionLabel(attribution)}</p>
        </div>
        {createdBy && (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white border border-orange-200 text-orange-700">
            via {createdBy}
          </span>
        )}
      </div>

      <div className={`grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {FIELDS.map(({ key, label }) => {
          const raw = attribution[key];
          if (!raw) return null;
          const value = key === 'attributionCapturedAt' ? formatCapturedAt(raw) : raw;
          return (
            <div key={key} className="rounded-lg bg-white/90 border border-orange-100 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
              <p className="text-sm font-medium text-gray-900 break-all mt-0.5">{value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserAttributionPanel;
