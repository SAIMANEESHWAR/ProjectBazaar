import { Lock } from 'lucide-react';
import { PREP_FREE_MAX_PAGE, usePrepContentAccess } from './prepContentAccess';

interface PrepPaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function PrepPaginationBar({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  itemLabel = 'items',
  onPageChange,
  className = '',
}: PrepPaginationBarProps) {
  const { hasFullPrepAccess, guardPageChange } = usePrepContentAccess();

  if (totalPages <= 1) return null;

  const setPage = (page: number) => {
    guardPageChange(page, onPageChange);
  };

  const start = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalCount);

  const pageButtonClass = (page: number) =>
    `min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      page === currentPage
        ? 'bg-orange-500 text-white shadow-sm'
        : !hasFullPrepAccess && page > PREP_FREE_MAX_PAGE
          ? 'text-orange-500/80 hover:bg-orange-500/10 ring-1 ring-orange-500/20'
          : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-200 ${className}`}
    >
      <p className="text-sm text-gray-500">
        Showing{' '}
        <span className="font-semibold text-gray-900">
          {start}-{end}
        </span>{' '}
        of <span className="font-semibold text-gray-900">{totalCount}</span> {itemLabel}
        {!hasFullPrepAccess && totalPages > PREP_FREE_MAX_PAGE && (
          <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
            · Page 1 free — upgrade for more
          </span>
        )}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setPage(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="First page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          if (
            totalPages <= 7 ||
            page === 1 ||
            page === totalPages ||
            Math.abs(page - currentPage) <= 1
          ) {
            const locked = !hasFullPrepAccess && page > PREP_FREE_MAX_PAGE;
            return (
              <button
                key={page}
                type="button"
                onClick={() => setPage(page)}
                className={`inline-flex items-center justify-center gap-1 ${pageButtonClass(page)}`}
                title={locked ? 'Upgrade to Premium to view this page' : undefined}
              >
                {locked && <Lock className="h-3 w-3 shrink-0" aria-hidden />}
                {page}
              </button>
            );
          }
          if (
            (page === 2 && currentPage > 3) ||
            (page === totalPages - 1 && currentPage < totalPages - 2)
          ) {
            return (
              <span key={page} className="px-1 text-gray-400 text-sm select-none">
                ...
              </span>
            );
          }
          return null;
        })}
        <button
          type="button"
          onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Next page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setPage(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Last page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
