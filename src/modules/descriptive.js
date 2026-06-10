/**
 * descriptive.js — Descriptive Statistics Module
 * Data Analysis Toolkit
 *
 * Exports high-level functions for frequency tables, binning,
 * summary tables, and formatted descriptive output.
 * Core math lives in utils/stats.js.
 */

'use strict';

import { clean, mean, median, stddev, variance, percentile,
         skewness, kurtosis } from '../utils/stats.js';

/**
 * Full descriptive summary for a numeric column.
 * @param {any[]} arr  raw column values (may contain null)
 * @returns {object}  all summary statistics
 */
export function summarize(arr) {
  const v = clean(arr);
  const n = v.length, m = mean(v), s = stddev(v);
  return {
    n,
    missing:  arr.length - n,
    mean:     +m.toFixed(4),
    median:   +median(v).toFixed(4),
    sd:       +s.toFixed(4),
    variance: +variance(v).toFixed(4),
    min:      +Math.min(...v).toFixed(4),
    q1:       +percentile(v, 25).toFixed(4),
    q3:       +percentile(v, 75).toFixed(4),
    max:      +Math.max(...v).toFixed(4),
    iqr:      +(percentile(v, 75) - percentile(v, 25)).toFixed(4),
    range:    +(Math.max(...v) - Math.min(...v)).toFixed(4),
    skewness: +skewness(v).toFixed(4),
    kurtosis: +kurtosis(v).toFixed(4),
    cv:       +(s / m * 100).toFixed(3),
    sem:      +(s / Math.sqrt(n)).toFixed(4),
  };
}

/**
 * Build a frequency distribution table from a numeric column.
 * @param {number[]} values  clean numeric values
 * @param {number}   bins    number of equal-width bins (default: Sturges rule)
 * @returns {Array<{ bin, lower, upper, count, relFreq, cumFreq }>}
 */
export function frequencyTable(values, bins = null) {
  const v = clean(values);
  const k = bins || Math.ceil(Math.log2(v.length)) + 1;
  const mn = Math.min(...v), mx = Math.max(...v), bw = (mx - mn) / k;
  const counts = Array(k).fill(0);
  v.forEach(x => {
    const i = Math.min(Math.floor((x - mn) / bw), k - 1);
    counts[i]++;
  });
  let cum = 0;
  return counts.map((count, i) => {
    cum += count;
    return {
      bin:     `${(mn + i * bw).toFixed(2)} – ${(mn + (i + 1) * bw).toFixed(2)}`,
      lower:   +(mn + i * bw).toFixed(4),
      upper:   +(mn + (i + 1) * bw).toFixed(4),
      count,
      relFreq: +(count / v.length * 100).toFixed(2),
      cumFreq: +(cum / v.length * 100).toFixed(2),
    };
  });
}

/**
 * Count frequencies for a categorical column.
 * @param {any[]} arr  raw column values
 * @returns {Array<{ value, count, pct }>} sorted descending by count
 */
export function categoryFrequency(arr) {
  const freq = {};
  arr.filter(v => v !== null && v !== undefined).forEach(v => {
    freq[v] = (freq[v] || 0) + 1;
  });
  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  return Object.entries(freq)
    .map(([value, count]) => ({ value, count, pct: +(count / total * 100).toFixed(2) }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Compare multiple numeric columns in a single summary table.
 * @param {object[]} rows     dataset rows
 * @param {string[]} columns  numeric column names
 * @returns {object[]} one row per column with all summary statistics
 */
export function multiColumnSummary(rows, columns) {
  return columns.map(col => ({
    column: col,
    ...summarize(rows.map(r => r[col])),
  }));
}

/**
 * Compute cross-tabulation (contingency table) for two categorical columns.
 * @param {object[]} rows  dataset rows
 * @param {string}   rowCol  column for rows
 * @param {string}   colCol  column for columns
 * @returns {{ rowLabels, colLabels, matrix, rowTotals, colTotals, total }}
 */
export function crosstab(rows, rowCol, colCol) {
  const rowLabels = [...new Set(rows.map(r => r[rowCol]).filter(v => v !== null))].sort();
  const colLabels = [...new Set(rows.map(r => r[colCol]).filter(v => v !== null))].sort();
  const matrix    = rowLabels.map(() => colLabels.map(() => 0));
  rows.forEach(r => {
    if (r[rowCol] === null || r[colCol] === null) return;
    const ri = rowLabels.indexOf(r[rowCol]);
    const ci = colLabels.indexOf(r[colCol]);
    if (ri >= 0 && ci >= 0) matrix[ri][ci]++;
  });
  const rowTotals = matrix.map(row => row.reduce((a, b) => a + b, 0));
  const colTotals = colLabels.map((_, j) => matrix.reduce((a, row) => a + row[j], 0));
  const total     = rowTotals.reduce((a, b) => a + b, 0);
  return { rowLabels, colLabels, matrix, rowTotals, colTotals, total };
}

/**
 * Five-number summary: [min, Q1, median, Q3, max]
 * @param {number[]} arr  numeric values
 */
export function fiveNumber(arr) {
  const v = clean(arr);
  return {
    min:    Math.min(...v),
    q1:     percentile(v, 25),
    median: median(v),
    q3:     percentile(v, 75),
    max:    Math.max(...v),
  };
}
