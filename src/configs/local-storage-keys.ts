export class LocalStorageKeysCache {
  static readonly GOOGLE_SHEET_SERVICE_GET_TR_SHEET: string = process.env
    .NEXT_PUBLIC_AMBIENTE_TR_MANAGER_WEB_APP
    ? `tr_sheet_${process.env.NEXT_PUBLIC_AMBIENTE_TR_MANAGER_WEB_APP}`
    : 'tr_sheet'

  static readonly GOOGLE_SHEET_SERVICE_GET_TR_SHEET_TITLE: string = process.env
    .NEXT_PUBLIC_AMBIENTE_TR_MANAGER_WEB_APP
    ? `tr_sheet-title_${process.env.NEXT_PUBLIC_AMBIENTE_TR_MANAGER_WEB_APP}`
    : 'tr_sheet_title'
}
