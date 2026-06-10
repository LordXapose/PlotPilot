/**
 * csvParser.js — CSV Parsing & Type Detection
 * Data Analysis Toolkit
 */

'use strict';

/**
 * Parse a CSV string into an array of row objects.
 * Handles quoted fields, commas inside quotes, and common delimiters.
 *
 * @param {string} text  Raw CSV text
 * @param {object} opts  Options
 * @param {string} opts.delimiter  Field delimiter (default: auto-detect)
 * @param {boolean} opts.header   First row is header (default: true)
 * @returns {{ columns: string[], rows: object[], meta: object }}
 */
export function parseCSV(text, opts = {}) {
  const { header = true } = opts;

  // Auto-detect delimiter
  const delimiters = [',', '\t', ';', '|'];
  const firstLine = text.split('\n')[0];
  const delimiter = opts.delimiter ||
    delimiters.reduce((best, d) =>
      (firstLine.split(d).length > firstLine.split(best).length ? d : best), ',');

  // Split into lines (handle \r\n and \n)
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
    .filter(l => l.trim().length > 0);

  if (lines.length === 0) return { columns: [], rows: [], meta: { rowCount: 0 } };

  // Parse a single line respecting quoted fields
  const parseLine = (line) => {
    const fields = [];
    let field = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        fields.push(field.trim()); field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const columns = header ? parseLine(lines[0]) : lines[0].split(delimiter).map((_, i) => `col${i + 1}`);
  const dataLines = header ? lines.slice(1) : lines;

  const rows = dataLines.map((line, idx) => {
    const fields = parseLine(line);
    const row = { _rowIndex: idx + (header ? 2 : 1) };
    columns.forEach((col, i) => {
      const raw = fields[i] !== undefined ? fields[i] : '';
      row[col] = coerceValue(raw);
    });
    return row;
  });

  const meta = buildMeta(columns, rows);

  return { columns, rows, meta };
}

/**
 * Try to coerce a string value to its natural JS type.
 * Returns null for empty/missing, number for numerics, string otherwise.
 */
function coerceValue(raw) {
  if (raw === '' || raw === 'NA' || raw === 'na' ||
      raw === 'N/A' || raw === 'n/a' || raw === 'null' ||
      raw === 'NULL' || raw === 'NaN' || raw === '?') return null;
  const num = Number(raw);
  if (!isNaN(num) && raw !== '') return num;
  return raw;
}

/**
 * Build metadata about columns: type, unique values, missing count.
 */
function buildMeta(columns, rows) {
  const colMeta = {};
  columns.forEach(col => {
    const vals = rows.map(r => r[col]);
    const nonNull = vals.filter(v => v !== null);
    const numericVals = nonNull.filter(v => typeof v === 'number');
    const type = numericVals.length / Math.max(nonNull.length, 1) >= 0.8
      ? 'numeric' : 'categorical';
    const unique = new Set(nonNull).size;
    colMeta[col] = {
      type,
      unique,
      missing: vals.filter(v => v === null).length,
      missingPct: +((vals.filter(v => v === null).length / vals.length) * 100).toFixed(1),
    };
  });
  return {
    rowCount: rows.length,
    colCount: columns.length,
    totalMissing: Object.values(colMeta).reduce((a, c) => a + c.missing, 0),
    columns: colMeta,
  };
}

/**
 * Convert an array of row objects back to a CSV string.
 * @param {string[]} columns  Column order
 * @param {object[]} rows     Row data
 * @returns {string}
 */
export function toCSV(columns, rows) {
  const escape = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.join(',');
  const body = rows.map(row => columns.map(c => escape(row[c])).join(','));
  return [header, ...body].join('\n');
}

/**
 * Infer better numeric type from string representation.
 * Returns 'integer' | 'float' | 'string' | 'boolean' | 'date'
 */
export function inferType(values) {
  const nonNull = values.filter(v => v !== null && v !== undefined);
  if (!nonNull.length) return 'empty';
  const nums = nonNull.filter(v => typeof v === 'number');
  if (nums.length / nonNull.length >= 0.9) {
    return nums.every(n => Number.isInteger(n)) ? 'integer' : 'float';
  }
  const bools = nonNull.filter(v =>
    ['true','false','yes','no','1','0'].includes(String(v).toLowerCase()));
  if (bools.length / nonNull.length >= 0.9) return 'boolean';
  return 'categorical';
}

/**
 * Download an array of rows as a CSV file in the browser.
 * @param {string[]} columns
 * @param {object[]} rows
 * @param {string}   filename
 */
export function downloadCSV(columns, rows, filename = 'data.csv') {
  const csv = toCSV(columns, rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
