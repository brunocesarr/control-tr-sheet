import { apiManagerSheet } from './base/apiControlSheet'
import { SheetRowData } from '@/interfaces/tr-sheet'

async function readManagerSheet() {
  try {
    const { data } = await apiManagerSheet.get('/api/v1/sheet')
    if (!data || data.length === 0) throw 'Empty Sheet!'

    let rowsData = data
      .map((row: any) => {
        return {
          cellRange: row.cellRange,
          name: row.name,
          cpf: row.cpf,
          status: row.status,
          cib: row.cib,
          observations: row.observations,
          imovelRural: row.imovelRural,
          hasDone: row.hasDone,
        } as SheetRowData
      })
      .sort((a: any, b: any) => a.name - b.name)

    return rowsData
  } catch (error) {
    console.error(
      `The API returned an error. Message: ${(error as Error).message}`
    )
    throw error
  }
}

async function updateTRStatus(range: string, newValue: boolean) {
  try {
    const form = new FormData()
    form.append('range', range)
    form.append('has_done', newValue.toString())

    await apiManagerSheet.patchForm('/api/v1/sheet', form)
  } catch (error) {
    console.error(
      `The API returned an error. Message: ${(error as Error).message}`
    )
    throw error
  }
}

export { readManagerSheet, updateTRStatus }
