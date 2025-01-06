import { SheetContext } from '@/contexts/useSheetContext';
import { useContext, useEffect, useState } from 'react';
import Skeleton from './Skeleton';
import Container from './Container';
import Pagination from './Pagination';

export function Table() {
  const { isLoading, response, updateStatus } = useContext(SheetContext);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setPageSize(15);
    setPage(1);
  }, [response]);

  const totalPages = Math.ceil(response.length / 15);

  const renderBadge = (hasDone: boolean, status: string) => {
    if (!hasDone) {
      return (
        <span className="inline-flex items-center justify-center px-1 py-2 text-sm font-semibold leading-none bg-white rounded border text-yellow-800 border-yellow-800">
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-1 py-1 text-sm font-semibold leading-none bg-white rounded border text-green-800 border-green-800">
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="m-4">
        <div className="flex flex-1 gap-1 my-2">
          {Object.keys(new Array(5).fill(null))
            .map(Number)
            .map((_, index) => (
              <Skeleton key={index} className="w-3/12 h-6" />
            ))}
        </div>
        <Skeleton className="w-full h-1" />
        {Object.keys(new Array(15).fill(null))
          .map(Number)
          .map((_, index) => (
            <Skeleton key={index} className="mt-2 w-full h-10" />
          ))}
      </div>
    );
  }

  return (
    <Container>
      <table className="mt-2 border border-stroke bg-white py-1 shadow-default border-strokedark bg-boxdark w-full overflow-y-auto ">
        <thead className="bg-emerald-700 shadow">
          <tr className="text-center font-medium text-white">
            <th className="w-[48px] bg-white shadow-none"></th>
            <th className="min-w-[150px] px-2 py-4 border-x-2">STATUS</th>
            <th className="min-w-[150px] border-x-2">CPF</th>
            <th className="min-w-[150px] px-2 border-x-2">NOME</th>
            <th className="px-2 border-x-2">CIB</th>
            <th className="min-w-[150px] px-2 border-x-2">IMÓVEL RURAL</th>
            <th className="min-w-[150px] px-2 border-x-2">OBSERVAÇÕES</th>
          </tr>
        </thead>
        <tbody>
          {response.slice((page - 1) * pageSize, page * pageSize).map((row, key) => (
            <tr key={key} className="border-b border-double border-neutral-400">
              <td className="w-[48px] py-2">
                <div className="flex justify-center items-center space-x-3.5">
                  <button className="hover:text-primary" onClick={() => updateStatus(row)}>
                    {row.hasDone ? (
                      <svg
                        className="fill-current"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg">
                        <g
                          id="🔍-Product-Icons"
                          stroke="none"
                          strokeWidth="1"
                          fill="none"
                          fillRule="evenodd">
                          <g
                            id="ic_fluent_checkbox_checked_24_regular"
                            fill="#356854"
                            fillRule="nonzero">
                            <path
                              d="M18.25,3 C19.7687831,3 21,4.23121694 21,5.75 L21,18.25 C21,19.7687831 19.7687831,21 18.25,21 L5.75,21 C4.23121694,21 3,19.7687831 3,18.25 L3,5.75 C3,4.23121694 4.23121694,3 5.75,3 L18.25,3 Z M18.25,4.5 L5.75,4.5 C5.05964406,4.5 4.5,5.05964406 4.5,5.75 L4.5,18.25 C4.5,18.9403559 5.05964406,19.5 5.75,19.5 L18.25,19.5 C18.9403559,19.5 19.5,18.9403559 19.5,18.25 L19.5,5.75 C19.5,5.05964406 18.9403559,4.5 18.25,4.5 Z M10,14.4393398 L16.4696699,7.96966991 C16.7625631,7.6767767 17.2374369,7.6767767 17.5303301,7.96966991 C17.7965966,8.23593648 17.8208027,8.65260016 17.6029482,8.94621165 L17.5303301,9.03033009 L10.5303301,16.0303301 C10.2640635,16.2965966 9.84739984,16.3208027 9.55378835,16.1029482 L9.46966991,16.0303301 L6.46966991,13.0303301 C6.1767767,12.7374369 6.1767767,12.2625631 6.46966991,11.9696699 C6.73593648,11.7034034 7.15260016,11.6791973 7.44621165,11.8970518 L7.53033009,11.9696699 L10,14.4393398 L16.4696699,7.96966991 L10,14.4393398 Z"
                              id="🎨Color"></path>
                          </g>
                        </g>
                      </svg>
                    ) : (
                      <svg
                        className="fill-current"
                        width="24px"
                        height="24"
                        viewBox="0 0 24 24"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg">
                        <g
                          id="🔍-Product-Icons"
                          stroke="none"
                          strokeWidth="1"
                          fill="none"
                          fillRule="evenodd">
                          <g
                            id="ic_fluent_checkbox_unchecked_24_regular"
                            fill="#356854"
                            fillRule="nonzero">
                            <path
                              d="M5.75,3 L18.25,3 C19.7687831,3 21,4.23121694 21,5.75 L21,18.25 C21,19.7687831 19.7687831,21 18.25,21 L5.75,21 C4.23121694,21 3,19.7687831 3,18.25 L3,5.75 C3,4.23121694 4.23121694,3 5.75,3 Z M5.75,4.5 C5.05964406,4.5 4.5,5.05964406 4.5,5.75 L4.5,18.25 C4.5,18.9403559 5.05964406,19.5 5.75,19.5 L18.25,19.5 C18.9403559,19.5 19.5,18.9403559 19.5,18.25 L19.5,5.75 C19.5,5.05964406 18.9403559,4.5 18.25,4.5 L5.75,4.5 Z"
                              id="🎨Color"></path>
                          </g>
                        </g>
                      </svg>
                    )}
                  </button>
                </div>
              </td>
              <td className="text-center">{renderBadge(row.hasDone, row.status)}</td>
              <td className="text-center">
                <h5 className="font-medium text-black ">{row.cpf}</h5>
              </td>
              <td className="px-2">
                <p className="text-black ">{row.name}</p>
              </td>
              <td className="px-2">
                <p className="text-black ">{row.cib}</p>
              </td>
              <td className="px-2">
                <p className="text-black ">{row.imovelRural}</p>
              </td>
              <td className="px-2">
                <p className="text-black ">{row.observations}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <Pagination totalPages={totalPages} pageSize={pageSize} page={page} changePage={setPage} />
      )}
    </Container>
  );
}

export default Table;
