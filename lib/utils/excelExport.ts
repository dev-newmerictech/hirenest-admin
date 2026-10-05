// Excel export utility — generates .xlsx files client-side from cached data
// No API calls needed; reads from data already in memory (loaded from IndexedDB)

import * as XLSX from 'xlsx';

/**
 * Export an array of objects to an Excel (.xlsx) file and trigger a browser download.
 *
 * @param data      Array of flat objects to export (each object = one row)
 * @param filename  Name for the downloaded file (without extension)
 * @param sheetName Name of the worksheet tab inside the Excel file
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Sheet1'
): void {
  if (!data.length) {
    console.warn('[Excel] No data to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns based on header length (simple heuristic)
  const headers = Object.keys(data[0]);
  worksheet['!cols'] = headers.map((header) => ({
    wch: Math.max(header.length + 2, 15),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
