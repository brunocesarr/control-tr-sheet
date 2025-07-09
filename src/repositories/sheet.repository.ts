import type { SheetRowData } from '@/interfaces/tr-sheet';

import { apiManagerSheet } from './base/apiControlSheet';

async function readManagerSheet() {
  try {
    const { data } = await apiManagerSheet.get('/api/v1/sheet');
    if (!data || data.length === 0) throw 'Empty Sheet!';

    const rowsData = data
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
        } as SheetRowData;
      })
      .filter((item: any) => item.name && item.cpf)
      .sort((a: any, b: any) => a.name - b.name);

    return rowsData;
  } catch (error) {
    console.error(`The API returned an error. Message: ${(error as Error).message}`);
    throw error;
  }
}

async function updateTRStatus(range: string, newValue: boolean) {
  try {
    const form = new FormData();
    form.append('range', range);
    form.append('has_done', newValue.toString());

    await apiManagerSheet.patchForm('/api/v1/sheet', form);
  } catch (error) {
    console.error(`The API returned an error. Message: ${(error as Error).message}`);
    throw error;
  }
}

async function updateAllTRStatus(newValue: boolean) {
  try {
    const form = new FormData();
    form.append('has_done', newValue.toString());

    await apiManagerSheet.postForm('/api/v1/sheet/update-all-status', form);
  } catch (error) {
    console.error(`The API returned an error. Message: ${(error as Error).message}`);
    throw error;
  }
}

export { readManagerSheet, updateAllTRStatus, updateTRStatus };
