export type ExcelRow = Record<string, unknown>

// Thin wrapper over SheetJS. Dynamically imported so xlsx never lands in the
// SSR bundle — these only run from client click handlers.
export function useExcel() {
  async function exportToXlsx(filename: string, rows: ExcelRow[]) {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
  }

  async function importFromXlsx(file: File): Promise<ExcelRow[]> {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const first = wb.SheetNames[0]
    if (!first) return []
    return XLSX.utils.sheet_to_json<ExcelRow>(wb.Sheets[first]!, { defval: null })
  }

  return { exportToXlsx, importFromXlsx }
}
