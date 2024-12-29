import { SheetRowData } from '@/interfaces/tr-sheet'
import { readManagerSheet } from '@/repositories/sheet.repository'

async function getManagerTable() {
  const brazilianLeague: SheetRowData[] = await readManagerSheet()
  return brazilianLeague ?? []
}

export { getManagerTable }
