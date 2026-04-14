import React from 'react';
import Skeleton from './skeleton';

/**
 * Shared skeleton layout for buyer and seller dashboards.
 * Shows: stats row, optional header block, and project cards grid.
 */
const SkeletonDashboard: React.FC = () => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-5">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-7 w-14 rounded" />
          </div>
        </div>
      ))}
    </div>
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-52 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-20 h-10 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
              <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-6 w-16 rounded-lg" />
              ))}
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-between">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export default SkeletonDashboard;
