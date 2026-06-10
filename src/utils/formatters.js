/**
 * formatters.js — Number & Display Formatting Utilities
 * Data Analysis Toolkit
 *
 * Consistent formatting helpers used across all modules.
 */

'use strict';

/**
 * Format a number to a given number of decimal places.
 * Returns '—' for NaN or undefined.
 * @param {number} v    value to format
 * @param {number} dp   decimal places (default 4)
 */
export function fmt(v, dp = 4) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return Number(v).toFixed(dp);
}

/**
 * Format a number with comma thousands separator.
 * @param {number} v  value
 * @param {number} dp decimal places
 */
export function fmtComma(v, dp = 2) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return Number(v).toLocaleString('en-US', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

/**
 * Format a p-value with appropriate precision.
 * Shows "< 0.001" for very small values.
 * @param {number} p  p-value
 */
export function fmtP(p) {
  if (p === null || p === undefined || isNaN(p)) return '—';
  if (p < 0.001) return '< 0.001';
  if (p < 0.01)  return p.toFixed(3);
  return p.toFixed(4);
}

/**
 * Format a percentage.
 * @param {number} v   value (0–1 or 0–100)
 * @param {boolean} raw  if true, value is already 0–100; else multiply by 100
 */
export function fmtPct(v, raw = false) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  const pct = raw ? v : v * 100;
  return pct.toFixed(1) + '%';
}

/**
 * Format a currency amount.
 * @param {number} v        value
 * @param {string} currency ISO currency code (default 'EUR')
 */
export function fmtCurrency(v, currency = 'EUR') {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency }).format(v);
}

/**
 * Format a statistical result object for display.
 * @param {object} result  object with numeric properties
 * @param {number} dp      decimal places
 * @returns {object}       same keys, formatted string values
 */
export function fmtResult(result, dp = 4) {
  const out = {};
  Object.entries(result).forEach(([k, v]) => {
    out[k] = typeof v === 'number' ? fmt(v, dp) : v;
  });
  return out;
}

/**
 * Truncate a string to maxLen characters with ellipsis.
 * @param {string} s      input string
 * @param {number} maxLen maximum length (default 30)
 */
export function truncate(s, maxLen = 30) {
  if (!s || s.length <= maxLen) return s;
  return s.slice(0, maxLen - 3) + '...';
}

/**
 * Pad a number string to a fixed width with leading spaces.
 * Useful for aligning columns in text output.
 */
export function padNum(v, width = 10, dp = 4) {
  const s = fmt(v, dp);
  return s.padStart(width);
}

/**
 * Format a confidence interval as a string.
 * @param {number} lower
 * @param {number} upper
 * @param {number} dp
 */
export function fmtCI(lower, upper, dp = 2) {
  return `[${fmt(lower, dp)}, ${fmt(upper, dp)}]`;
}

/**
 * Return a human-readable effect size label.
 * Based on Cohen's benchmarks.
 * @param {number} d  Cohen's d or similar effect size
 */
export function effectSizeLabel(d) {
  const abs = Math.abs(d);
  if (abs < 0.2) return 'negligible';
  if (abs < 0.5) return 'small';
  if (abs < 0.8) return 'medium';
  return 'large';
}

/**
 * Format a p-value decision string.
 * @param {number}  pValue
 * @param {number}  alpha   significance level (default 0.05)
 * @returns {string}  'significant' or 'not significant'
 */
export function significanceLabel(pValue, alpha = 0.05) {
  return pValue < alpha ? `significant (p = ${fmtP(pValue)})` : `not significant (p = ${fmtP(pValue)})`;
}
