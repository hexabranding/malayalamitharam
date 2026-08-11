import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export default function AdminPagination({ currentPage, totalPages, onPageChange, windowSize = 5 }) {
  if (totalPages <= 1) return null;

  function getPageNumbers() {
    if (totalPages <= windowSize) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + windowSize - 1);

    if (end - start < windowSize - 1) {
      start = Math.max(1, end - windowSize + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  const pages = getPageNumbers();
  const showFirstEllipsis = pages[0] > 1;
  const showLastEllipsis = pages[pages.length - 1] < totalPages;

  return (
    <div className="admin-pagination">
      <button
        className="admin-pagination-btn"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        title="First page"
      >
        <ChevronsLeft size={16} />
      </button>
      <button
        className="admin-pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} /> Prev
      </button>

      {showFirstEllipsis && (
        <>
          <button className="admin-pagination-btn" onClick={() => onPageChange(1)}>1</button>
          <span className="admin-pagination-ellipsis">...</span>
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          className={`admin-pagination-btn ${currentPage === page ? "active" : ""}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {showLastEllipsis && (
        <>
          <span className="admin-pagination-ellipsis">...</span>
          <button className="admin-pagination-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}

      <button
        className="admin-pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next <ChevronRight size={16} />
      </button>
      <button
        className="admin-pagination-btn"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        title="Last page"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
}
