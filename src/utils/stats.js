/**
 * stats.js — Core Statistical Functions
 * Data Analysis Toolkit
 *
 * Provides foundational statistical computations used across all modules.
 * All functions are pure (no side effects) and work on plain JS arrays.
 */

'use strict';

// ─── Basic descriptive helpers ───────────────────────────────────────────────

/** Remove null/undefined/NaN from array */
export function clean(arr) {
  return arr.filter(v => v !== null && v !== undefined && !isNaN(v));
}

/** Arithmetic mean */
export function mean(arr) {
  const v = clean(arr);
  if (!v.length) return NaN;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/** Median (middle value of sorted array) */
export function median(arr) {
  const v = [...clean(arr)].sort((a, b) => a - b);
  if (!v.length) return NaN;
  const m = Math.floor(v.length / 2);
  return v.length % 2 === 0 ? (v[m - 1] + v[m]) / 2 : v[m];
}

/** Mode (most frequent value) */
export function mode(arr) {
  const freq = {};
  clean(arr).forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  let maxF = 0, modes = [];
  Object.entries(freq).forEach(([v, f]) => {
    if (f > maxF) { maxF = f; modes = [+v]; }
    else if (f === maxF) modes.push(+v);
  });
  return modes;
}

/** Sample variance (ddof=1) */
export function variance(arr) {
  const v = clean(arr);
  if (v.length < 2) return NaN;
  const m = mean(v);
  return v.reduce((acc, x) => acc + (x - m) ** 2, 0) / (v.length - 1);
}

/** Sample standard deviation */
export function stddev(arr) {
  return Math.sqrt(variance(arr));
}

/** Percentile using linear interpolation */
export function percentile(arr, p) {
  const v = [...clean(arr)].sort((a, b) => a - b);
  if (!v.length) return NaN;
  const idx = (p / 100) * (v.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return v[lo] + (v[hi] - v[lo]) * (idx - lo);
}

/** Interquartile range */
export function iqr(arr) {
  return percentile(arr, 75) - percentile(arr, 25);
}

/** Pearson skewness (Fisher's moment coefficient) */
export function skewness(arr) {
  const v = clean(arr);
  if (v.length < 3) return NaN;
  const m = mean(v), s = stddev(v), n = v.length;
  return (v.reduce((acc, x) => acc + ((x - m) / s) ** 3, 0) * n) / ((n - 1) * (n - 2));
}

/** Excess kurtosis (Fisher's definition, normal = 0) */
export function kurtosis(arr) {
  const v = clean(arr);
  if (v.length < 4) return NaN;
  const m = mean(v), s = stddev(v), n = v.length;
  const k4 = v.reduce((acc, x) => acc + ((x - m) / s) ** 4, 0);
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * k4
       - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
}

// ─── Full descriptive summary ─────────────────────────────────────────────────

/**
 * Compute full descriptive statistics for an array.
 * @param {number[]} arr
 * @returns {object} Summary object with all statistics
 */
export function describe(arr) {
  const v = clean(arr);
  return {
    n:        v.length,
    missing:  arr.length - v.length,
    mean:     mean(v),
    median:   median(v),
    mode:     mode(v),
    sd:       stddev(v),
    variance: variance(v),
    min:      Math.min(...v),
    max:      Math.max(...v),
    range:    Math.max(...v) - Math.min(...v),
    q1:       percentile(v, 25),
    q3:       percentile(v, 75),
    iqr:      iqr(v),
    skew:     skewness(v),
    kurt:     kurtosis(v),
    cv:       (stddev(v) / mean(v)) * 100,   // coefficient of variation %
    sem:      stddev(v) / Math.sqrt(v.length), // standard error of mean
  };
}

// ─── Probability distributions ───────────────────────────────────────────────

/** Standard normal CDF using Abramowitz & Stegun approximation */
export function normCDF(z) {
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741;
  const a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

/** Standard normal PDF */
export function normPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/** Normal PDF with given mu, sigma */
export function normalPDF(x, mu = 0, sigma = 1) {
  return normPDF((x - mu) / sigma) / sigma;
}

/** Normal CDF with given mu, sigma */
export function normalCDF(x, mu = 0, sigma = 1) {
  return normCDF((x - mu) / sigma);
}

/** Inverse normal CDF (probit) using rational approximation */
export function normInv(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [0, -3.969683028665376e+01, 2.209460984245205e+02,
             -2.759285104469687e+02, 1.383577518672690e+02,
             -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [0, -5.447609879822406e+01, 1.615858368580409e+02,
             -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01,
             -2.400758277161838e+00, -2.549732539343734e+00,
              4.374664141464968e+00,  2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01,
             2.445134137142996e+00, 3.754408661907416e+00];
  const pLow = 0.02425, pHigh = 1 - pLow;
  let q, r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5; r = q * q;
    return (((((a[1]*r+a[2])*r+a[3])*r+a[4])*r+a[5])*r+a[6])*q /
           (((((b[1]*r+b[2])*r+b[3])*r+b[4])*r+b[5])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
             ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

/** t-distribution CDF approximation using incomplete beta */
export function tCDF(t, df) {
  const x = df / (df + t * t);
  // Regularized incomplete beta approximation
  const betaInc = (x, a, b) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const logB = lgamma(a) + lgamma(b) - lgamma(a + b);
    return Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logB) / a / Math.exp(logB - lgamma(a) - lgamma(b));
  };
  return t < 0
    ? 0.5 * ibeta(x, df / 2, 0.5)
    : 1 - 0.5 * ibeta(x, df / 2, 0.5);
}

/** Regularized incomplete beta (series approximation) */
function ibeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const maxIter = 200, eps = 1e-8;
  let sum = 0, term = 1;
  for (let i = 0; i < maxIter; i++) {
    term *= (a + i) * x / (a + b + i) / (i + 1);
    sum += term;
    if (Math.abs(term) < eps) break;
  }
  return Math.pow(x, a) * Math.pow(1 - x, b) * sum;
}

/** Log-gamma function (Stirling approximation) */
function lgamma(z) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = z, tmp = z + 5.5;
  tmp -= (z + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) { y++; ser += c[j] / y; }
  return -tmp + Math.log(2.5066282746310005 * ser / z);
}

/** Critical t value for given alpha and df (two-tailed) */
export function tCritical(alpha, df) {
  const lookup = [12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,
                  2.228,2.201,2.179,2.160,2.145,2.131,2.120,2.110,2.101,
                  2.093,2.086,2.080,2.074,2.069,2.064,2.060,2.056,2.052,
                  2.048,2.045,2.042];
  if (df <= 0) return Infinity;
  if (alpha === 0.05) {
    if (df <= 30) return lookup[df - 1];
    if (df <= 60)  return 2.000;
    if (df <= 120) return 1.980;
    return 1.960;
  }
  // General: use normal approximation for large df
  return normInv(1 - alpha / 2);
}

// ─── Correlation ──────────────────────────────────────────────────────────────

/** Pearson correlation coefficient */
export function pearsonR(x, y) {
  const n = Math.min(x.length, y.length);
  const mx = mean(x.slice(0, n)), my = mean(y.slice(0, n));
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  return num / Math.sqrt(dx2 * dy2);
}

/** Spearman rank correlation */
export function spearmanR(x, y) {
  const rank = arr => {
    const sorted = [...arr].map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const ranks = new Array(arr.length);
    sorted.forEach(([, i], r) => { ranks[i] = r + 1; });
    return ranks;
  };
  return pearsonR(rank(x), rank(y));
}

// ─── Hypothesis tests ─────────────────────────────────────────────────────────

/**
 * One-sample t-test: H0: mean(x) = mu0
 * @returns {object} { t, df, pValue, reject, ci95 }
 */
export function tTestOneSample(arr, mu0 = 0, alpha = 0.05) {
  const v = clean(arr);
  const n = v.length, m = mean(v), s = stddev(v);
  const se = s / Math.sqrt(n);
  const t = (m - mu0) / se;
  const df = n - 1;
  // two-tailed p-value approximation
  const z = Math.abs(t);
  const pValue = 2 * (1 - normCDF(z));  // approximation
  const tc = tCritical(alpha, df);
  const me = tc * se;
  return {
    t: +t.toFixed(4),
    df,
    se: +se.toFixed(4),
    mean: +m.toFixed(4),
    pValue: +pValue.toFixed(4),
    reject: pValue < alpha,
    ci: { lower: +(m - me).toFixed(4), upper: +(m + me).toFixed(4) },
    tcrit: +tc.toFixed(3),
  };
}

/**
 * Two-sample independent t-test (Welch's)
 * H0: mean(x1) = mean(x2)
 */
export function tTestTwoSample(arr1, arr2, alpha = 0.05) {
  const v1 = clean(arr1), v2 = clean(arr2);
  const n1 = v1.length, n2 = v2.length;
  const m1 = mean(v1), m2 = mean(v2);
  const s1 = stddev(v1), s2 = stddev(v2);
  const se = Math.sqrt(s1 ** 2 / n1 + s2 ** 2 / n2);
  const t = (m1 - m2) / se;
  // Welch-Satterthwaite df
  const df = (s1**2/n1 + s2**2/n2)**2 /
             ((s1**2/n1)**2/(n1-1) + (s2**2/n2)**2/(n2-1));
  const pValue = 2 * (1 - normCDF(Math.abs(t)));
  const tc = tCritical(alpha, Math.floor(df));
  return {
    t: +t.toFixed(4),
    df: +df.toFixed(1),
    mean1: +m1.toFixed(4), mean2: +m2.toFixed(4),
    diff: +(m1 - m2).toFixed(4),
    se: +se.toFixed(4),
    pValue: +pValue.toFixed(4),
    reject: pValue < alpha,
    tcrit: +tc.toFixed(3),
  };
}

/**
 * Confidence interval for mean
 * @param {number[]} arr  sample data
 * @param {number}   alpha  significance level (default 0.05 → 95% CI)
 */
export function confidenceInterval(arr, alpha = 0.05) {
  const v = clean(arr);
  const m = mean(v), s = stddev(v), n = v.length;
  const se = s / Math.sqrt(n);
  const tc = tCritical(alpha, n - 1);
  const me = tc * se;
  return {
    mean: +m.toFixed(4),
    lower: +(m - me).toFixed(4),
    upper: +(m + me).toFixed(4),
    margin: +me.toFixed(4),
    se: +se.toFixed(4),
    tcrit: +tc.toFixed(3),
    level: (1 - alpha) * 100,
  };
}

// ─── Regression ───────────────────────────────────────────────────────────────

/**
 * Simple ordinary-least-squares regression of y on x.
 * @returns {object} { slope, intercept, r2, rmse, residuals, predict }
 */
export function linearRegression(x, y) {
  const n = Math.min(x.length, y.length);
  const mx = mean(x.slice(0, n)), my = mean(y.slice(0, n));
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const predict = xVal => slope * xVal + intercept;
  const residuals = y.slice(0, n).map((yi, i) => yi - predict(x[i]));
  const ssRes = residuals.reduce((a, r) => a + r ** 2, 0);
  const ssTot = y.slice(0, n).reduce((a, yi) => a + (yi - my) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  const rmse = Math.sqrt(ssRes / (n - 2));
  return {
    slope: +slope.toFixed(4),
    intercept: +intercept.toFixed(4),
    r2: +r2.toFixed(4),
    r: +Math.sqrt(r2).toFixed(4),
    rmse: +rmse.toFixed(4),
    n,
    residuals,
    predict,
  };
}

// ─── Goodness of fit ─────────────────────────────────────────────────────────

/**
 * Kolmogorov-Smirnov one-sample test
 * Tests whether data follows a given CDF function
 * @param {number[]} data
 * @param {Function} cdfFn  theoretical CDF e.g. x => normalCDF(x, mu, sigma)
 */
export function ksTest(data, cdfFn) {
  const v = [...clean(data)].sort((a, b) => a - b);
  const n = v.length;
  let D = 0;
  v.forEach((x, i) => {
    const empirical = (i + 1) / n;
    const theoretical = cdfFn(x);
    D = Math.max(D, Math.abs(empirical - theoretical),
                    Math.abs(i / n - theoretical));
  });
  // Approximate critical value at α=0.05
  const dCrit = 1.36 / Math.sqrt(n);
  return {
    D: +D.toFixed(4),
    dCrit: +dCrit.toFixed(4),
    reject: D > dCrit,
    pValue: D > dCrit ? '< 0.05' : '> 0.05',
  };
}

// ─── Histogram binning ────────────────────────────────────────────────────────

/**
 * Create histogram bins from data
 * @param {number[]} data
 * @param {number}   bins  number of bins (default: Sturges rule)
 */
export function histogram(data, bins = null) {
  const v = clean(data);
  const k = bins || Math.ceil(Math.log2(v.length)) + 1;  // Sturges
  const mn = Math.min(...v), mx = Math.max(...v);
  const bw = (mx - mn) / k;
  const counts = Array(k).fill(0);
  v.forEach(x => {
    const i = Math.min(Math.floor((x - mn) / bw), k - 1);
    counts[i]++;
  });
  return {
    counts,
    edges: Array.from({ length: k + 1 }, (_, i) => +(mn + i * bw).toFixed(2)),
    labels: counts.map((_, i) => `${(mn + i * bw).toFixed(1)}–${(mn + (i+1) * bw).toFixed(1)}`),
    binWidth: bw,
    density: counts.map(c => c / (v.length * bw)),
  };
}
