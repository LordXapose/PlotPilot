/**
 * visualizations.js — Chart Rendering Module
 * Data Analysis Toolkit
 *
 * Provides histogram, scatter, box plot, bar, line, correlation matrix,
 * bubble, and area charts using Chart.js.
 *
 * Usage:
 *   import { drawHistogram, drawScatter, drawCorrelation } from './visualizations.js';
 *   drawHistogram('canvasId', data, { bins: 7, color: '#388bfd' });
 */

'use strict';

// Shared Chart.js default options for dark-themed appearance
export const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#8b949e', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#8b949e', font: { size: 11 } },
    },
  },
};

/**
 * Build histogram bin data from a numeric array.
 * @param {number[]} values  clean numeric values
 * @param {number}   bins    number of bins (default 7)
 * @returns {{ labels, counts, edges, binWidth }}
 */
export function buildHistogramBins(values, bins = 7) {
  const mn = Math.min(...values), mx = Math.max(...values);
  const bw = (mx - mn) / bins;
  const counts = Array(bins).fill(0);
  values.forEach(v => {
    const i = Math.min(Math.floor((v - mn) / bw), bins - 1);
    counts[i]++;
  });
  const labels = counts.map((_, i) => `${(mn + i * bw).toFixed(1)}`);
  const edges  = Array.from({ length: bins + 1 }, (_, i) => +(mn + i * bw).toFixed(2));
  return { labels, counts, edges, binWidth: bw };
}

/**
 * Draw a histogram on a canvas element.
 * @param {string}   canvasId  id of <canvas> element
 * @param {number[]} values    numeric data array
 * @param {object}   opts      { bins, color, title }
 * @returns {Chart} Chart.js instance
 */
export function drawHistogram(canvasId, values, opts = {}) {
  const { bins = 7, color = '#388bfd' } = opts;
  const { labels, counts } = buildHistogramBins(values, bins);
  return new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: color + 'aa',
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: { ...CHART_DEFAULTS },
  });
}

/**
 * Draw a scatter plot.
 * @param {string}   canvasId  id of <canvas> element
 * @param {number[]} xValues   x-axis values
 * @param {number[]} yValues   y-axis values
 * @param {object}   opts      { color, xLabel, yLabel, regressionLine }
 */
export function drawScatter(canvasId, xValues, yValues, opts = {}) {
  const { color = '#388bfd', xLabel = 'X', yLabel = 'Y' } = opts;
  const points = xValues.map((x, i) => ({ x, y: yValues[i] })).filter(p => p.y != null);

  const datasets = [{
    data: points,
    backgroundColor: color + 'bb',
    pointRadius: 5,
    label: `${xLabel} vs ${yLabel}`,
  }];

  // Optional regression line
  if (opts.regressionLine && xValues.length >= 2) {
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const my = ys.reduce((a, b) => a + b, 0) / ys.length;
    let sxy = 0, sxx = 0;
    xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; });
    const b = sxy / sxx, a = my - b * mx;
    const xr = [Math.min(...xs), Math.max(...xs)];
    datasets.push({
      type: 'line',
      data: [{ x: xr[0], y: a + b * xr[0] }, { x: xr[1], y: a + b * xr[1] }],
      borderColor: '#f85149',
      borderWidth: 2,
      pointRadius: 0,
      label: 'Fit',
    });
  }

  return new Chart(document.getElementById(canvasId), {
    type: 'scatter',
    data: { datasets },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        legend: { display: opts.regressionLine, position: 'top', labels: { color: '#8b949e', boxWidth: 10 } },
      },
      scales: {
        x: { ...CHART_DEFAULTS.scales.x, title: { display: true, text: xLabel, color: '#8b949e' } },
        y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: yLabel, color: '#8b949e' } },
      },
    },
  });
}

/**
 * Draw a bar chart for categorical frequencies.
 * @param {string}   canvasId   id of <canvas> element
 * @param {string[]} labels     category labels
 * @param {number[]} values     frequencies / values
 * @param {object}   opts       { colors, horizontal }
 */
export function drawBar(canvasId, labels, values, opts = {}) {
  const PALETTE = ['#388bfd','#3fb950','#bc8cff','#d29922','#f85149','#76e3ea','#f778ba'];
  const colors = opts.colors || labels.map((_, i) => PALETTE[i % PALETTE.length] + 'bb');
  return new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderRadius: 5,
        borderSkipped: false,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      indexAxis: opts.horizontal ? 'y' : 'x',
    },
  });
}

/**
 * Draw a line chart.
 * @param {string}   canvasId  id of <canvas> element
 * @param {any[]}    labels    x-axis labels
 * @param {number[]} values    y-axis values
 * @param {object}   opts      { color, fill, tension }
 */
export function drawLine(canvasId, labels, values, opts = {}) {
  const { color = '#388bfd', fill = false, tension = 0.3 } = opts;
  return new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: color,
        borderWidth: 2,
        pointRadius: 3,
        backgroundColor: fill ? color + '22' : 'transparent',
        fill,
        tension,
      }],
    },
    options: { ...CHART_DEFAULTS },
  });
}

/**
 * Compute a correlation matrix for multiple numeric columns.
 * @param {object[]} rows     dataset rows
 * @param {string[]} columns  column names
 * @returns {number[][]} n×n correlation matrix
 */
export function correlationMatrix(rows, columns) {
  const clean = arr => arr.filter(v => v !== null && !isNaN(v));
  const mean  = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

  return columns.map(c1 => columns.map(c2 => {
    const v1 = clean(rows.map(r => r[c1]));
    const v2 = clean(rows.map(r => r[c2]));
    const n  = Math.min(v1.length, v2.length);
    const m1 = mean(v1.slice(0, n)), m2 = mean(v2.slice(0, n));
    let num = 0, d1 = 0, d2 = 0;
    for (let i = 0; i < n; i++) {
      num += (v1[i] - m1) * (v2[i] - m2);
      d1  += (v1[i] - m1) ** 2;
      d2  += (v2[i] - m2) ** 2;
    }
    return +(num / Math.sqrt(d1 * d2)).toFixed(3);
  }));
}

/**
 * Draw a doughnut / pie chart.
 * @param {string}   canvasId  id of <canvas> element
 * @param {string[]} labels    slice labels
 * @param {number[]} values    slice sizes
 * @param {object}   opts      { type: 'doughnut'|'pie' }
 */
export function drawDoughnut(canvasId, labels, values, opts = {}) {
  const PALETTE = ['#388bfd','#3fb950','#bc8cff','#d29922','#f85149','#76e3ea'];
  return new Chart(document.getElementById(canvasId), {
    type: opts.type || 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: PALETTE, borderWidth: 0 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#8b949e', boxWidth: 10, font: { size: 11 } } },
      },
    },
  });
}
