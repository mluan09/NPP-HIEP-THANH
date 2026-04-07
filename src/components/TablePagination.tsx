import React from 'react';

interface TablePaginationProps {
  totalItems: number;
  pageSize?: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  totalItems,
  pageSize = 10,
  currentPage,
  onPageChange,
}) => {
  if (totalItems <= pageSize) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const goToPage = (page: number) => {
    const safe = Math.min(totalPages, Math.max(1, page));
    if (safe !== currentPage) onPageChange(safe);
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination-controls">
      <button
        type="button"
        className="page-btn page-prev"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ‹ Trước
      </button>

      <div className="page-numbers">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={`page-num-btn ${page === currentPage ? 'active' : ''}`}
            onClick={() => goToPage(page)}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="page-btn page-next"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Sau ›
      </button>
    </div>
  );
};

export default TablePagination;

