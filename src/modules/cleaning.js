/**
 * cleaning.js — Data Cleaning & Preprocessing Module
 * Data Analysis Toolkit
 *
 * Provides: imputation, outlier detection (IQR/Z-score), normalization,
 * standardization, binning, encoding, and column operations.
 */

'use strict';

import { clean, mean, median, stddev, percentile } from '../utils/stats.js';

// ─── Missing value imputation ─────────────────────────────────────────────────

/**
 * Impute missing values in a column.
 * @param {any[]} arr        raw column values (may contain null)
 * @param {string} strategy  'mean' | 'median' | 'mode' | 'zero' | 'forward' | 'drop'
 * @returns {any[]} imputed array (same length unless strategy='drop')
 */
export function impute(arr, strategy = 'mean') {
  const numVals = clean(arr);
  let fillValue;

  switch (strategy) {
    case 'mean':    fillValue = mean(numVals);   break;
    case 'median':  fillValue = median(numVals); break;
    case 'mode':    fillValue = mode(arr);       break;
    case 'zero':    fillValue = 0;               break;
    case 'drop':    return arr.filter(v => v !== null && v !== undefined);
    case 'forward': {
      const result = [...arr];
      for (let i = 1; i < result.length; i++)
        if (result[i] === null) result[i] = result[i - 1];
      return result;
    }
    default: throw new Error(`Unknown imputation strategy: ${strategy}`);
  }

  return arr.map(v => (v === null || v === undefined) ? fillValue : v);
}

function mode(arr) {
  const freq = {};
  clean(arr).forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return +Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
}

// ─── Outlier detection ────────────────────────────────────────────────────────

/**
 * Detect outliers using the IQR fence method.
 * Points below Q1 - k*IQR or above Q3 + k*IQR are flagged.
 * @param {number[]} arr  numeric column values
 * @param {number}   k    fence multiplier (default 1.5; 3 = extreme outliers)
 * @returns {{ outliers: number[], mask: boolean[], lower: number, upper: number }}
 */
export function detectOutliersIQR(arr, k = 1.5) {
  const v = clean(arr);
  const q1 = percentile(v, 25), q3 = percentile(v, 75), iqrVal = q3 - q1;
  const lower = q1 - k * iqrVal, upper = q3 + k * iqrVal;
  const mask = arr.map(x => x !== null && (x < lower || x > upper));
  return { outliers: arr.filter((_, i) => mask[i]), mask, lower, upper, q1, q3, iqr: iqrVal };
}

/**
 * Detect outliers using Z-score threshold.
 * @param {number[]} arr       numeric column values
 * @param {number}   threshold default 3 (standard deviations)
 */
export function detectOutliersZScore(arr, threshold = 3) {
  const v = clean(arr), m = mean(v), s = stddev(v);
  const zScores = arr.map(x => x !== null ? Math.abs((x - m) / s) : 0);
  const mask = zScores.map(z => z > threshold);
  return { outliers: arr.filter((_, i) => mask[i]), mask, zScores, threshold };
}

/**
 * Remove outliers from rows based on IQR detection.
 * @param {object[]} rows   dataset rows
 * @param {string}   col    column to check
 * @param {number}   k      fence multiplier
 * @returns {{ clean: object[], removed: number }}
 */
export function removeOutliers(rows, col, k = 1.5) {
  const vals = rows.map(r => r[col]);
  const { mask } = detectOutliersIQR(vals, k);
  const cleaned = rows.filter((_, i) => !mask[i]);
  return { clean: cleaned, removed: rows.length - cleaned.length };
}

// ─── Normalization & standardization ─────────────────────────────────────────

/**
 * Min-max normalize to [0, 1] (or custom [newMin, newMax]).
 * @param {number[]} arr
 * @param {number}   newMin  target minimum (default 0)
 * @param {number}   newMax  target maximum (default 1)
 */
export function normalize(arr, newMin = 0, newMax = 1) {
  const v = clean(arr), mn = Math.min(...v), mx = Math.max(...v);
  if (mx === mn) return arr.map(x => x !== null ? (newMin + newMax) / 2 : null);
  return arr.map(x => x !== null ? newMin + ((x - mn) / (mx - mn)) * (newMax - newMin) : null);
}

/**
 * Z-score standardize (mean=0, sd=1).
 * @param {number[]} arr
 */
export function standardize(arr) {
  const v = clean(arr), m = mean(v), s = stddev(v);
  return arr.map(x => x !== null ? (x - m) / s : null);
}

// ─── Binning / discretization ─────────────────────────────────────────────────

/**
 * Equal-width binning (cut).
 * @param {number[]} arr   numeric values
 * @param {number}   bins  number of bins
 * @param {string[]} labels  optional custom labels
 */
export function cut(arr, bins = 5, labels = null) {
  const v = clean(arr), mn = Math.min(...v), mx = Math.max(...v);
  const bw = (mx - mn) / bins;
  const defaultLabels = Array.from({ length: bins }, (_, i) =>
    `[${(mn + i * bw).toFixed(2)}, ${(mn + (i + 1) * bw).toFixed(2)})`);
  const lbl = labels || defaultLabels;
  return arr.map(x => {
    if (x === null) return null;
    const i = Math.min(Math.floor((x - mn) / bw), bins - 1);
    return lbl[i];
  });
}

/**
 * Equal-frequency binning (qcut).
 * @param {number[]} arr   numeric values
 * @param {number}   q     number of quantiles
 */
export function qcut(arr, q = 4) {
  const sorted = [...clean(arr)].sort((a, b) => a - b);
  const n = sorted.length;
  const boundaries = Array.from({ length: q + 1 }, (_, i) => sorted[Math.floor(i * n / q)] ?? sorted[n - 1]);
  const labelNames = q === 4
    ? ['Q1 (bottom 25%)', 'Q2', 'Q3', 'Q4 (top 25%)']
    : Array.from({ length: q }, (_, i) => `Bin ${i + 1}`);
  return arr.map(x => {
    if (x === null) return null;
    for (let i = 0; i < q; i++) {
      if (x <= boundaries[i + 1]) return labelNames[i];
    }
    return labelNames[q - 1];
  });
}

// ─── Type conversion ──────────────────────────────────────────────────────────

/**
 * One-hot encode a categorical column.
 * @param {any[]}    arr     column values
 * @param {string}   colName column name prefix
 * @returns {object} { columns: string[], rows: object[] }
 */
export function oneHotEncode(arr, colName = 'col') {
  const categories = [...new Set(arr.filter(v => v !== null))];
  const columns = categories.map(c => `${colName}_${c}`);
  const rows = arr.map(v => {
    const row = {};
    categories.forEach(c => { row[`${colName}_${c}`] = v === c ? 1 : 0; });
    return row;
  });
  return { columns, rows };
}

// ─── Column operations ────────────────────────────────────────────────────────

/**
 * Compute a new column from a formula on existing columns.
 * @param {object[]} rows    dataset rows
 * @param {string}   name    new column name
 * @param {Function} formula  (row) => value
 */
export function computeColumn(rows, name, formula) {
  return rows.map(row => ({ ...row, [name]: formula(row) }));
}

/** Drop a column from all rows. */
export function dropColumn(rows, col) {
  return rows.map(row => { const r = { ...row }; delete r[col]; return r; });
}

/** Rename a column in all rows. */
export function renameColumn(rows, oldName, newName) {
  return rows.map(row => {
    const r = { ...row }; r[newName] = r[oldName]; delete r[oldName]; return r;
  });
}

/** Filter rows where column satisfies a condition. */
export function filterRows(rows, col, condition) {
  // condition: '>', '<', '>=', '<=', '==', '!='
  // e.g. filterRows(rows, 'age', '>30') → filter age > 30
  const match = condition.match(/^(>=|<=|>|<|==|!=)\s*(.+)$/);
  if (!match) throw new Error('Invalid condition: ' + condition);
  const [, op, val] = match;
  const num = Number(val);
  const compare = { '>': a => a > num, '<': a => a < num, '>=': a => a >= num,
                    '<=': a => a <= num, '==': a => a == val, '!=': a => a != val };
  return rows.filter(r => r[col] !== null && compare[op](r[col]));
}

/** Sort rows by a column. */
export function sortRows(rows, col, ascending = true) {
  return [...rows].sort((a, b) => {
    if (a[col] === null) return 1; if (b[col] === null) return -1;
    return ascending ? (a[col] > b[col] ? 1 : -1) : (a[col] < b[col] ? 1 : -1);
  });
}
