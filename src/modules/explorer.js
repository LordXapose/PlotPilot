/**
 * explorer.js — Data Explorer Module
 * Data Analysis Toolkit
 *
 * Handles CSV loading, type detection, schema inference,
 * missing-value analysis, and dataset metadata.
 */

'use strict';

import { parseCSV, toCSV, downloadCSV, inferType } from '../utils/csvParser.js';

/**
 * Load a CSV string and return a fully annotated dataset object.
 * @param {string} csvText  raw CSV text
 * @returns {DataSet}
 */
export function loadDataset(csvText) {
  const { columns, rows, meta } = parseCSV(csvText);
  const numericCols    = columns.filter(c => meta.cols[c].type === 'numeric');
  const categoricalCols = columns.filter(c => meta.cols[c].type === 'categorical');

  return {
    columns,
    rows,
    meta,
    numericCols,
    categoricalCols,
    /** Convenience: get clean numeric values for a column */
    getNumeric(col) {
      return rows.map(r => r[col]).filter(v => v !== null && !isNaN(Number(v))).map(Number);
    },
    /** Convenience: get non-null values for a column */
    getValues(col) {
      return rows.map(r => r[col]).filter(v => v !== null);
    },
    /** Export current state as CSV string */
    toCSV() {
      return toCSV(columns, rows);
    },
    /** Download as CSV file in the browser */
    download(filename = 'export.csv') {
      downloadCSV(columns, rows, filename);
    },
  };
}

/**
 * Analyse missing values across all columns.
 * @param {object[]} rows     dataset rows
 * @param {string[]} columns  column names
 * @returns {Array<{ column, missing, total, pct, complete }>}
 */
export function missingValueReport(rows, columns) {
  return columns.map(col => {
    const vals   = rows.map(r => r[col]);
    const missing = vals.filter(v => v === null || v === undefined).length;
    return {
      column:   col,
      missing,
      total:    rows.length,
      pct:      +(missing / rows.length * 100).toFixed(2),
      complete: missing === 0,
    };
  }).sort((a, b) => b.missing - a.missing);
}

/**
 * Detect outliers per column using the IQR method and return a summary.
 * @param {object[]} rows       dataset rows
 * @param {string[]} numCols    numeric column names
 * @param {number}   k          IQR multiplier (default 1.5)
 * @returns {Array<{ column, count, lower, upper, values }>}
 */
export function outlierSummary(rows, numCols, k = 1.5) {
  return numCols.map(col => {
    const vals  = rows.map(r => r[col]).filter(v => v !== null && !isNaN(v)).map(Number);
    const sorted = [...vals].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1, lower = q1 - k * iqr, upper = q3 + k * iqr;
    const outliers = vals.filter(v => v < lower || v > upper);
    return { column: col, count: outliers.length, lower, upper, values: outliers };
  }).filter(r => r.count > 0);
}

/**
 * Compute dataset completeness score.
 * @param {object[]} rows     dataset rows
 * @param {string[]} columns  column names
 * @returns {number} percentage of non-null cells (0–100)
 */
export function completenessScore(rows, columns) {
  const total  = rows.length * columns.length;
  const filled = rows.reduce((acc, row) =>
    acc + columns.filter(c => row[c] !== null && row[c] !== undefined).length, 0);
  return +(filled / total * 100).toFixed(2);
}

/**
 * Generate a concise schema description string for each column.
 * @param {object} meta  metadata object from parseCSV
 * @returns {string[]}   one line per column
 */
export function schemaDescription(meta) {
  return Object.entries(meta.cols).map(([col, info]) =>
    `${col}: ${info.type}, ${info.unique} unique, ${info.missing} missing (${info.missingPct}%)`
  );
}

/**
 * Sample n random rows from a dataset.
 * @param {object[]} rows  dataset rows
 * @param {number}   n     sample size
 * @returns {object[]} sampled rows
 */
export function sampleRows(rows, n = 5) {
  const shuffled = [...rows].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, rows.length));
}
