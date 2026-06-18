import React from 'react';
import { ArrowRight, Calendar, Inbox, MessageSquare } from 'lucide-react';

export interface PeerPracticeQueueHeroProps {
  onScheduleInterview: () => void;
  onBrowseRequests: () => void;
  onMyRequests: () => void;
  incomingCount?: number;
}

export const PeerPracticeQueueHero: React.FC<PeerPracticeQueueHeroProps> = ({
  onScheduleInterview,
  onBrowseRequests,
  onMyRequests,
  incomingCount = 0,
}) => {
  return (
    <section className="border-b border-gray-200/80 bg-white px-4 py-6 sm:px-5 sm:py-7 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <MessageSquare className="h-5 w-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              Peer practice queue
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Match by interview type, experience, region, and stack. Connect to propose times — Meet link
              unlocks when someone accepts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
          <button
            type="button"
            onClick={onMyRequests}
            className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-xs font-bold text-orange-800 transition-colors hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/35 dark:text-orange-200 dark:hover:bg-orange-950/55"
          >
            <Inbox className="h-3.5 w-3.5 shrink-0" />
            My requests
            {incomingCount > 0 && (
              <span className="flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold tabular-nums text-white">
                {incomingCount > 9 ? '9+' : incomingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onBrowseRequests}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Browse queue
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </button>
          <button
            type="button"
            onClick={onScheduleInterview}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f97316] to-amber-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:from-orange-600 hover:to-amber-600"
          >
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            Schedule interview
          </button>
        </div>
      </div>
    </section>
  );
};

export default PeerPracticeQueueHero;
