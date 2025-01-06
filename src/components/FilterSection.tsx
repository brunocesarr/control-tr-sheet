import type { ChangeEvent } from 'react';
import { useContext, useState } from 'react';

import { SheetContext } from '@/contexts/useSheetContext';

import { ConfirmModal } from './CustomModals';

const FilterOptions = () => {
  const { filter, setFilter } = useContext(SheetContext);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFilter({ ...filter, status: value });
  };

  return (
    <div>
      <label className="text-md text-black-700 font-medium">Status</label>
      <div className="w-auto">
        <select
          value={filter.status ?? ''}
          onChange={handleChange}
          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-blue-500">
          <option disabled defaultValue="">
            {' '}
            -- Selecione uma opção --{' '}
          </option>
          <option value="">Todos</option>
          <option value="entregue">Entregue</option>
          <option value="nao entregue">Não Entregue</option>
        </select>
      </div>
    </div>
  );
};

const InputSearch = () => {
  const { filter, setFilter } = useContext(SheetContext);

  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setFilter({ ...filter, keyword: inputValue });
  };

  return (
    <div>
      <label className="text-md font-medium text-gray-700">Pesquisar</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="size-5 text-gray-500 dark:text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <input
          value={filter.keyword ?? ''}
          onChange={handleSearchInput}
          type="search"
          placeholder="Pesquisar..."
          className="w-80 rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 outline-none"
        />
      </div>
      <p className="text-xs font-light text-gray-500">
        Pesquise por CPF, Nome, CIB ou Imóvel Rural
      </p>
    </div>
  );
};

const ResetButton = () => {
  const { setFilter } = useContext(SheetContext);

  const handleReset = () => {
    setFilter({
      keyword: '',
      pageSize: 1,
    });
  };

  return (
    <button
      onClick={handleReset}
      className="medium h-10 min-h-[48px] rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500">
      Listar todos
    </button>
  );
};

const NoDeliveryStatusButton = () => {
  const { updateAllToNoDeliveryStatus } = useContext(SheetContext);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpenConfirmModal(true)}
        className="medium h-10 min-h-[48px] rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500">
        Marcar todos como nao entregue
      </button>
      <ConfirmModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        modalDescription={
          <>
            <p>Deseja realmente marcar todos como nao entregue?</p>
            <p> Lembre-se que é uma ação irreversível.</p>
          </>
        }
        confirmAction={updateAllToNoDeliveryStatus}
      />
    </>
  );
};

const FilterSection = () => {
  return (
    <div className="flex flex-row items-center justify-between gap-4 overflow-x-auto bg-slate-900/5 p-4 portrait:flex-col">
      <div className="flex flex-row gap-4 portrait:flex-col">
        <InputSearch />
        <FilterOptions />
      </div>
      <div className="flex flex-row gap-4 portrait:flex-col">
        <NoDeliveryStatusButton />
        <ResetButton />
      </div>
    </div>
  );
};

export { FilterSection };
