import type { GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { GoogleSpreadsheet } from 'google-spreadsheet';

import { spreadSheetAccountAuth } from './base/apiGoogleSheet';

const getSheet = async () => {
  try {
    const sheetId = process.env.GOOGLE_SERVICE_SHEET_ID;

    if (!sheetId) {
      throw new Error('Sheet id not found!');
    }

    const doc = new GoogleSpreadsheet(sheetId, spreadSheetAccountAuth);
    await doc.loadInfo();
    const rows = await doc.sheetsByTitle["Lista de ITR's"].getRows();
    return rows;
  } catch (error) {
    throw error;
  }
};

const updateStatusForCell = (
  sheet: GoogleSpreadsheetWorksheet,
  range: string,
  newValue: boolean
) => {
  try {
    const cellPosition = range.split(':')[0];
    const a1 = sheet.getCellByA1(cellPosition);
    a1.value = newValue;
  } catch (error) {
    throw error;
  }
};

const updateStatus = async (range: string, newValue: boolean) => {
  try {
    const sheetId = process.env.GOOGLE_SERVICE_SHEET_ID;

    if (!sheetId) {
      throw new Error('Sheet id not found!');
    }

    const doc = new GoogleSpreadsheet(sheetId, spreadSheetAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["Lista de ITR's"];
    await sheet.loadCells(range);

    updateStatusForCell(sheet, range, newValue);
    await sheet.saveUpdatedCells();
  } catch (error) {
    console.error(`Unknown error: ${error}`);
  }
};

const updateAllStatus = async (range: string[], newValue: boolean) => {
  try {
    const sheetId = process.env.GOOGLE_SERVICE_SHEET_ID;

    if (!sheetId) {
      throw new Error('Sheet id not found!');
    }

    const doc = new GoogleSpreadsheet(sheetId, spreadSheetAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["Lista de ITR's"];
    await sheet.loadCells();

    range.forEach(async (r) => {
      updateStatusForCell(sheet, r, newValue);
    });

    await sheet.saveUpdatedCells();
  } catch (error) {
    console.error(`Unknown error: ${error}`);
  }
};

export { getSheet, updateAllStatus, updateStatus };
