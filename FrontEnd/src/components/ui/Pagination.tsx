// Component phân trang tái sử dụng - đang duplicate ở nhiều file

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Pagination: Component phân trang chuẩn với 4 nút: First, Prev, Next, Last.
 * Tái sử dụng thay vì copy-paste logic phân trang ở mọi nơi.
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <p className="text-xs text-slate-500">
        Trang {currentPage} / {totalPages}
      </p>
      <div className="flex gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-2 py-1 rounded border text-xs disabled:opacity-40 hover:bg-slate-50"
          aria-label="Trang đầu"
        >
          «
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 rounded border text-xs disabled:opacity-40 hover:bg-slate-50"
          aria-label="Trang trước"
        >
          ‹
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 rounded border text-xs disabled:opacity-40 hover:bg-slate-50"
          aria-label="Trang sau"
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 rounded border text-xs disabled:opacity-40 hover:bg-slate-50"
          aria-label="Trang cuối"
        >
          »
        </button>
      </div>
    </div>
  );
};
