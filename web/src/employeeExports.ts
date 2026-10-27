import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import { strToU8, zipSync } from 'fflate'

export type EmployeeExportRow = {
  displayName: string
  email: string
  roleName: string
  status: string
  areaLimit: number
  foreignLimit: number
}

const headers = ['Personel', 'E-posta', 'Rol', 'Durum', 'Alan onay sınırı (m²)', 'Döviz onay sınırı']

function rowsForExport(users: EmployeeExportRow[]) {
  return users.map(user => [user.displayName, user.email, user.roleName, user.status, String(user.areaLimit), String(user.foreignLimit)])
}

function filename(extension: string) {
  return `hutec-personel-${new Date().toISOString().slice(0, 10)}.${extension}`
}

function escapeXml(value: string) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? character)
}

function columnName(index: number) {
  let value = index + 1
  let label = ''
  while (value > 0) {
    const remainder = (value - 1) % 26
    label = String.fromCharCode(65 + remainder) + label
    value = Math.floor((value - 1) / 26)
  }
  return label
}

function cellXml(value: string, column: number, row: number) {
  const reference = `${columnName(column)}${row}`
  return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
}

function exportXlsx(users: EmployeeExportRow[]) {
  const values = [headers, ...rowsForExport(users)]
  const sheetRows = values.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => cellXml(value, columnIndex, rowIndex + 1)).join('')}</row>`).join('')
  const files = {
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
    'xl/workbook.xml': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Personel" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    'xl/_rels/workbook.xml.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
    'xl/worksheets/sheet1.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`),
  }
  return new Blob([zipSync(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

async function exportPdf(users: EmployeeExportRow[]) {
  const [fontBundle, { default: pdfMake }] = await Promise.all([
    import('pdfmake/build/vfs_fonts'),
    import('pdfmake/build/pdfmake'),
  ])
  pdfMake.addVirtualFileSystem(fontBundle.default)
  const definition: TDocumentDefinitions = {
    pageOrientation: 'landscape' as const,
    content: [
      { text: 'Hutec Personel Listesi', style: 'title' },
      { text: new Date().toLocaleDateString('tr-TR'), style: 'subheading' },
      {
        table: { headerRows: 1, widths: ['*', '*', '*', 'auto', 'auto', 'auto'], body: [headers, ...rowsForExport(users)] },
        layout: 'lightHorizontalLines',
      },
    ],
    styles: { title: { fontSize: 18, bold: true, margin: [0, 0, 0, 6] }, subheading: { fontSize: 9, color: '#667078', margin: [0, 0, 0, 14] } },
    defaultStyle: { font: 'Roboto', fontSize: 8 },
  }
  const blob = await pdfMake.createPdf(definition).getBlob()
  downloadBlob(blob, filename('pdf'))
}

async function exportDocx(users: EmployeeExportRow[]) {
  const { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } = await import('docx')
  const makeCell = (text: string, bold = false) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold })] })] })
  const data = rowsForExport(users)
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map(header => makeCell(header, true)) }),
      ...data.map(row => new TableRow({ children: row.map(value => makeCell(value)) })),
    ],
  })
  const document = new Document({ sections: [{ children: [
    new Paragraph({ text: 'Hutec Personel Listesi', heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: `Dışa aktarma tarihi: ${new Date().toLocaleDateString('tr-TR')}` }),
    table,
  ] }] })
  const blob = await Packer.toBlob(document)
  downloadBlob(blob, filename('docx'))
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportEmployees(format: 'pdf' | 'xlsx' | 'docx', users: EmployeeExportRow[]) {
  if (format === 'pdf') {
    await exportPdf(users)
    return
  }
  if (format === 'xlsx') {
    downloadBlob(exportXlsx(users), filename('xlsx'))
    return
  }
  await exportDocx(users)
}