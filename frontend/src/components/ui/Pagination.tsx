// @ts-nocheck
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const Pagination = ({
  currentPage,
  onPageChange,
  pagination = {
    page : 1, 
    limit : 10,
    total : 1,
    totalPages: 1,
    hasNext : false,
    hasPrev : false
  },
}: PaginationProps) => {
  // Destructure pagination object
  const { totalPages, hasNext, hasPrev } = pagination;
  
  // Ensure we always have at least 1 page
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  // Use hasNext/hasPrev from pagination object
  const canGoPrev = hasPrev !== undefined ? hasPrev : safeCurrentPage > 1;
  const canGoNext = hasNext !== undefined ? hasNext : safeCurrentPage < safeTotalPages;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (safeTotalPages <= maxVisible) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (safeCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(safeTotalPages);
      } else if (safeCurrentPage >= safeTotalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = safeTotalPages - 3; i <= safeTotalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = safeCurrentPage - 1; i <= safeCurrentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(safeTotalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => canGoPrev && onPageChange(safeCurrentPage - 1)}
        disabled={!canGoPrev}
        className={`px-2 py-1 text-sm rounded transition-colors ${
          !canGoPrev
            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pageNumbers.map((page, index) => (
        <button
          key={`page-${index}-${page}`}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            page === safeCurrentPage
              ? 'bg-orange-600 dark:bg-orange-700 text-white'
              : page === '...'
              ? 'text-gray-400 dark:text-gray-500 cursor-default'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
          }`}
          aria-label={typeof page === 'number' ? `Page ${page}` : 'More pages'}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => canGoNext && onPageChange(safeCurrentPage + 1)}
        disabled={!canGoNext}
        className={`px-2 py-1 text-sm rounded transition-colors ${
          !canGoNext
            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
        }`}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;