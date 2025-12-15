import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const [goToPage, setGoToPage] = useState("");
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Only hide if there's no data at all
  if (totalItems === 0) return null;

  const handleGoToPage = () => {
    const page = parseInt(goToPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setGoToPage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleGoToPage();
    }
  };

  // Generate page numbers with ellipsis logic
  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3, 4, 5);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push("...");
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Calculate showing range
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Showing Text */}
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        Menampilkan {startItem} - {endItem} dari {totalItems}
      </div>

      <div className="flex items-center gap-4 order-1 sm:order-2">
        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>

          {/* Page Numbers */}
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="w-10 h-10 flex items-center justify-center text-gray-500"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                  currentPage === page
                    ? "bg-[#2C3E50] text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Go to Page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Pergi ke halaman</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={goToPage}
              onChange={(e) => setGoToPage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder=""
              className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleGoToPage}
              disabled={!goToPage}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Pergi ke halaman"
            >
              <ArrowRight size={18} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
