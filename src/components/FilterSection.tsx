import { SheetContext } from '@/contexts/useSheetContext'
import { ChangeEvent, useContext, useState } from 'react'

const FilterOptions = () => {
  const { filter, setFilter } = useContext(SheetContext)

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setFilter({ ...filter, status: value })
  }

  return (
    <div>
      <label className="text-md font-medium text-black-700">Status</label>
      <div className="w-auto">
        <select
          value={filter.status ?? ''}
          onChange={handleChange}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
        >
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
  )
}

const InputSearch = () => {
  const { filter, setFilter } = useContext(SheetContext)

  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setFilter({ ...filter, keyword: inputValue })
  }

  return (
    <div>
      <label className="text-md font-medium text-gray-700">Pesquisar</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
        <input
          value={filter.keyword ?? ''}
          onChange={handleSearchInput}
          type="search"
          placeholder="Pesquisar..."
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg w-80 pl-10 p-2.5 outline-none"
        />
      </div>
      <p className="text-xs font-light text-gray-500">
        Pesquise por CPF, Nome, CIB ou Imóvel Rural
      </p>
    </div>
  )
}

const ResetButton = () => {
  const { setFilter } = useContext(SheetContext)

  const handleReset = () => {
    setFilter({
      keyword: '',
      hasDone: null,
      page: 1,
    })
  }

  return (
    <button
      onClick={handleReset}
      className="font medium text-sm text-white bg-cyan-600 px-4 py-2 h-10 rounded-lg hover:bg-cyan-500 min-h-[48px]"
    >
      Listar todos
    </button>
  )
}

const FilterSection = () => {
  return (
    <div className="overflow-x-auto flex flex-row portrait:flex-col justify-between items-center px-4 py-4 bg-slate-900/5">
      <div className="flex flex-row portrait:flex-col gap-4">
        <InputSearch />
        <FilterOptions />
      </div>
      <ResetButton />
    </div>
  )
}

export { FilterSection }
