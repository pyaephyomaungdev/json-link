import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { TranslationItem, ExportOptions } from '@/types';
import { unflattenObject } from './parser';

/**
 * Downloads a Blob directly in the browser
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export to Excel (.xlsx) file
 */
export function exportToExcel(
  items: TranslationItem[],
  languages: string[],
  filename = 'translations.xlsx'
) {
  // Build header row: ["Key", "en", "my", ...]
  const headers = ['Key', ...languages];
  
  // Build data rows
  const data = items.map(item => {
    const row: Record<string, string> = { Key: item.key };
    for (const lang of languages) {
      row[lang] = item[lang] || '';
    }
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

  // Calculate dynamic column widths
  const colWidths = headers.map(header => {
    let maxLength = header.length;
    for (const item of items) {
      const val = header === 'Key' ? item.key : (item[header] || '');
      if (val && val.length > maxLength) {
        maxLength = Math.min(val.length, 60); // Cap at 60 for readability
      }
    }
    return { wch: Math.max(maxLength + 4, 12) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Translations');

  // Generate binary XLSX buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  downloadBlob(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Export to CSV with UTF-8 BOM so Excel opens it with perfect Unicode rendering
 */
export function exportToCsv(
  items: TranslationItem[],
  languages: string[],
  filename = 'translations.csv'
) {
  const headers = ['Key', ...languages];

  const escapeCsvValue = (val: string): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const csvRows: string[] = [];
  // Header
  csvRows.push(headers.map(escapeCsvValue).join(','));

  // Rows
  for (const item of items) {
    const rowValues = [
      escapeCsvValue(item.key),
      ...languages.map(lang => escapeCsvValue(item[lang] || '')),
    ];
    csvRows.push(rowValues.join(','));
  }

  // Add UTF-8 BOM (\uFEFF) at the beginning so Excel correctly recognizes UTF-8 (especially Myanmar Unicode)
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Generate JSON objects per language
 */
export function generateLanguageJsonData(
  items: TranslationItem[],
  lang: string,
  nested: boolean
): any {
  const flatDict: Record<string, string> = {};
  for (const item of items) {
    flatDict[item.key] = item[lang] || '';
  }

  return nested ? unflattenObject(flatDict) : flatDict;
}

/**
 * Export all languages as individual JSON files bundled in a ZIP
 */
export async function exportToJsonZip(
  items: TranslationItem[],
  languages: string[],
  options: ExportOptions,
  zipFilename = 'translations_json.zip'
) {
  const zip = new JSZip();

  for (const lang of languages) {
    const jsonData = generateLanguageJsonData(items, lang, options.nested);
    const jsonStr = JSON.stringify(jsonData, null, options.indent);
    zip.file(`${lang}.json`, jsonStr);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`);
}

/**
 * Export single combined JSON file
 */
export function exportToCombinedJson(
  items: TranslationItem[],
  languages: string[],
  options: ExportOptions,
  filename = 'translations_combined.json'
) {
  const combined: Record<string, any> = {};

  for (const lang of languages) {
    combined[lang] = generateLanguageJsonData(items, lang, options.nested);
  }

  const jsonStr = JSON.stringify(combined, null, options.indent);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}

/**
 * Export single language JSON file directly
 */
export function exportSingleLanguageJson(
  items: TranslationItem[],
  lang: string,
  options: ExportOptions
) {
  const data = generateLanguageJsonData(items, lang, options.nested);
  const jsonStr = JSON.stringify(data, null, options.indent);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${lang}.json`);
}
