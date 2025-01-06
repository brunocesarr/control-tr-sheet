/* This example requires Tailwind CSS v2.0+ */
import { useState } from 'react';
import { GoChevronLeft, GoChevronRight } from 'react-icons/go';

interface PaginatedNumbersProps {
  totalPages: number;
  page: number;
  changePage: (index: number) => void;
  maxPageNumberLimit: number;
  minPageNumberLimit: number;
}

const PaginatedNumbers = ({
  totalPages,
  page,
  changePage,
  maxPageNumberLimit,
  minPageNumberLimit,
}: PaginatedNumbersProps) => {
  const paginateNumbers: React.ReactElement[] = [];

  paginateNumbers.push(
    <button
      key={1}
      onClick={() => changePage(1)}
      className={`${
        page === 1 ? 'bg-black text-white' : 'hover:bg-gray-50'
      } relative inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium`}>
      1
    </button>
  );

  if (minPageNumberLimit - 1 > 1) {
    paginateNumbers.push(
      <button
        key="leftDots"
        disabled
        className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium">
        ...
      </button>
    );
  }

  if (maxPageNumberLimit - minPageNumberLimit > 1) {
    Array.from({ length: totalPages }, (num, index) => {
      const pageNumber = index + 1;
      if (pageNumber > 1 && pageNumber >= minPageNumberLimit) {
        if (pageNumber < totalPages && pageNumber <= maxPageNumberLimit)
          paginateNumbers.push(
            <button
              key={pageNumber}
              onClick={() => changePage(pageNumber)}
              className={`${
                page === pageNumber ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
              } relative inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium`}>
              {pageNumber}{' '}
            </button>
          );
      }
    });
  }

  if (maxPageNumberLimit + 1 < totalPages) {
    paginateNumbers.push(
      <button
        key="rightDots"
        disabled
        className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium">
        ...
      </button>
    );
  }

  paginateNumbers.push(
    <button
      key={totalPages}
      onClick={() => changePage(totalPages)}
      className={`${
        page === totalPages ? 'bg-black text-white' : 'hover:bg-gray-50'
      } relative inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium`}>
      {totalPages}
    </button>
  );

  return paginateNumbers;
};

interface PaginationProps {
  totalPages: number;
  pageSize: number;
  page: number;
  changePage: (index: number) => void;
}

export default function Pagination({ totalPages, pageSize, page, changePage }: PaginationProps) {
  const [minPageNumberLimit, setMinPageNumberLimit] = useState(0);
  const [maxPageNumberLimit, setMaxPageNumberLimit] = useState(5);

  const pageDifference = (5 - 1) / 2;

  const handleMinAndMaxPageNumberLimit = (currentPage: number) => {
    const maxPageNumberLimit = currentPage + pageDifference;
    if (maxPageNumberLimit > totalPages) {
      setMaxPageNumberLimit(totalPages);
    } else {
      setMaxPageNumberLimit(maxPageNumberLimit);
    }

    const minPageNumberLimit = currentPage - pageDifference;
    if (minPageNumberLimit < 1) {
      setMinPageNumberLimit(1);
    } else {
      setMinPageNumberLimit(minPageNumberLimit);
    }
  };

  const incrementPage = () => {
    handlePage(page + 1);
  };

  const decrementPage = () => {
    handlePage(page - 1);
  };

  const handlePage = (currentPage: number) => {
    changePage(currentPage);
    handleMinAndMaxPageNumberLimit(currentPage);
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={decrementPage}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Anterior
        </button>
        <button
          onClick={incrementPage}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Proximo
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-900">
            Mostrando <span className="font-medium">{page}</span> to{' '}
            <span className="font-medium">{totalPages}</span> de{' '}
            <span className="font-medium">{totalPages * pageSize}</span> resultados
          </p>
        </div>
        <div>
          <nav
            className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Pagination">
            <button
              disabled={page === 1}
              onClick={decrementPage}
              className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white p-2 text-sm font-medium text-gray-500 hover:bg-gray-50">
              <span className="sr-only">Previous</span>
              <GoChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <PaginatedNumbers
              totalPages={totalPages}
              changePage={handlePage}
              page={page}
              minPageNumberLimit={minPageNumberLimit}
              maxPageNumberLimit={maxPageNumberLimit}
            />
            <button
              disabled={page === totalPages - 1}
              onClick={incrementPage}
              className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white p-2 text-sm font-medium text-gray-500 hover:bg-gray-50">
              <span className="sr-only">Next</span>
              <GoChevronRight className="size-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
