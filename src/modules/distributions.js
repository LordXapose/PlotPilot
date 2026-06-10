/**
 * distributions.js — Probability Distribution Engine
 * Data Analysis Toolkit
 *
 * Provides PDF, CDF, inverse CDF (quantile), and random sampling
 * for: Normal, Exponential, Uniform, Binomial, Poisson, t, Chi-squared, F
 *
 * Usage:
 *   const d = new Distribution('normal', { mu: 0, sigma: 1 });
 *   d.pdf(1.96)    // → 0.0584
 *   d.cdf(1.96)    // → 0.9750
 *   d.quantile(0.975) // → 1.9600
 *   d.sample(100)  // → [0.23, -1.1, ...]
 */

'use strict';

import { normCDF, normPDF, normInv } from '../utils/stats.js';

// ─── Helper math ─────────────────────────────────────────────────────────────

function lgamma(z) {
  const c = [76.18009172947146,-86.50532032941677,24.01409824083091,
             -1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
  let y = z, tmp = z + 5.5;
  tmp -= (z + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) { y++; ser += c[j] / y; }
  return -tmp + Math.log(2.5066282746310005 * ser / z);
}

function factorial(n) {
  if (n <= 1) return 1;
  let f = 1; for (let i = 2; i <= n; i++) f *= i; return f;
}

function choose(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  return Math.exp(lgamma(n+1) - lgamma(k+1) - lgamma(n-k+1));
}

// Box-Muller transform for normal random samples
function randNormal(mu = 0, sigma = 1) {
  const u1 = Math.random(), u2 = Math.random();
  return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ─── Distribution class ───────────────────────────────────────────────────────

/**
 * @class Distribution
 * Unified interface for all supported probability distributions.
 *
 * Supported types: 'normal', 'exponential', 'uniform', 'binomial',
 *                  'poisson', 't', 'chisq', 'f'
 */
export class Distribution {
  /**
   * @param {string} type   Distribution name (case-insensitive)
   * @param {object} params Distribution parameters
   */
  constructor(type, params = {}) {
    this.type = type.toLowerCase();
    this.params = { ...this._defaults(), ...params };
    this._validate();
  }

  _defaults() {
    const d = {
      normal:      { mu: 0, sigma: 1 },
      exponential: { lambda: 1 },
      uniform:     { a: 0, b: 1 },
      binomial:    { n: 10, p: 0.5 },
      poisson:     { lambda: 3 },
      t:           { df: 10 },
      chisq:       { df: 5 },
      f:           { df1: 5, df2: 10 },
    };
    return d[this.type] || {};
  }

  _validate() {
    const p = this.params;
    const checks = {
      normal:      () => p.sigma > 0,
      exponential: () => p.lambda > 0,
      uniform:     () => p.a < p.b,
      binomial:    () => p.n > 0 && p.p >= 0 && p.p <= 1,
      poisson:     () => p.lambda > 0,
      t:           () => p.df > 0,
      chisq:       () => p.df > 0,
      f:           () => p.df1 > 0 && p.df2 > 0,
    };
    if (checks[this.type] && !checks[this.type]()) {
      throw new Error(`Invalid parameters for ${this.type} distribution`);
    }
  }

  /** Probability density (or mass for discrete) at x */
  pdf(x) {
    const { mu, sigma, lambda, a, b, n, p, df, df1, df2 } = this.params;
    switch (this.type) {
      case 'normal':
        return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
               Math.exp(-0.5 * ((x - mu) / sigma) ** 2);

      case 'exponential':
        return x < 0 ? 0 : lambda * Math.exp(-lambda * x);

      case 'uniform':
        return (x >= a && x <= b) ? 1 / (b - a) : 0;

      case 'binomial': {
        if (!Number.isInteger(x) || x < 0 || x > n) return 0;
        return choose(n, x) * p ** x * (1 - p) ** (n - x);
      }

      case 'poisson': {
        if (!Number.isInteger(x) || x < 0) return 0;
        return Math.exp(-lambda) * lambda ** x / factorial(x);
      }

      case 't': {
        const coeff = Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2)) /
                      Math.sqrt(df * Math.PI);
        return coeff * (1 + x * x / df) ** (-(df + 1) / 2);
      }

      case 'chisq':
        if (x <= 0) return 0;
        return Math.exp((df / 2 - 1) * Math.log(x) - x / 2 -
               (df / 2) * Math.log(2) - lgamma(df / 2));

      case 'f': {
        if (x <= 0) return 0;
        const logPDF = (df1 / 2) * Math.log(df1 * x) +
                       (df2 / 2) * Math.log(df2) -
                       ((df1 + df2) / 2) * Math.log(df1 * x + df2) -
                       Math.log(x) - lgamma(df1 / 2) - lgamma(df2 / 2) + lgamma((df1 + df2) / 2);
        return Math.exp(logPDF);
      }

      default: return 0;
    }
  }

  /** Cumulative distribution function P(X ≤ x) */
  cdf(x) {
    const { mu, sigma, lambda, a, b, n, p, df } = this.params;
    switch (this.type) {
      case 'normal':
        return normCDF((x - mu) / sigma);

      case 'exponential':
        return x < 0 ? 0 : 1 - Math.exp(-lambda * x);

      case 'uniform':
        if (x < a) return 0;
        if (x > b) return 1;
        return (x - a) / (b - a);

      case 'binomial': {
        if (x < 0) return 0;
        if (x >= n) return 1;
        let sum = 0;
        for (let k = 0; k <= Math.floor(x); k++) sum += this.pdf(k);
        return sum;
      }

      case 'poisson': {
        if (x < 0) return 0;
        let sum = 0;
        for (let k = 0; k <= Math.floor(x); k++) sum += this.pdf(k);
        return sum;
      }

      case 't': {
        // Approximation using normal for large df
        if (df >= 30) return normCDF(x);
        // Abramowitz & Stegun approximation
        const A = (df - 0.5) / df;
        const B = 48 * A * A;
        const z2 = x * x / df;
        const z = A * Math.log(1 + z2);
        const y = Math.sqrt(z * B);
        const p2 = normCDF(y);
        return x < 0 ? 1 - p2 : p2;
      }

      case 'chisq': {
        if (x <= 0) return 0;
        // Regularized incomplete gamma (series)
        return gammaInc(df / 2, x / 2);
      }

      default: return 0;
    }
  }

  /** Inverse CDF (quantile function) P(X ≤ ?) = p */
  quantile(prob) {
    if (prob <= 0) return -Infinity;
    if (prob >= 1) return Infinity;
    const { mu, sigma, lambda, a, b } = this.params;
    switch (this.type) {
      case 'normal':
        return mu + sigma * normInv(prob);
      case 'exponential':
        return -Math.log(1 - prob) / lambda;
      case 'uniform':
        return a + prob * (b - a);
      default:
        // Numerical inversion via bisection
        return this._bisectionInv(prob);
    }
  }

  _bisectionInv(prob, lo = -1000, hi = 1000, tol = 1e-6, maxIter = 100) {
    // Expand bounds if needed
    while (this.cdf(lo) > prob) lo -= 100;
    while (this.cdf(hi) < prob) hi += 100;
    for (let i = 0; i < maxIter; i++) {
      const mid = (lo + hi) / 2;
      if (this.cdf(mid) < prob) lo = mid; else hi = mid;
      if (hi - lo < tol) break;
    }
    return (lo + hi) / 2;
  }

  /** Generate n random samples */
  sample(n = 1) {
    const samples = [];
    for (let i = 0; i < n; i++) samples.push(this._oneSample());
    return samples;
  }

  _oneSample() {
    const { mu, sigma, lambda, a, b, df } = this.params;
    switch (this.type) {
      case 'normal':     return randNormal(mu, sigma);
      case 'exponential': return -Math.log(Math.random()) / lambda;
      case 'uniform':    return a + Math.random() * (b - a);
      case 't':          return randNormal(0, 1) / Math.sqrt(this._chi2Sample(df) / df);
      default:           return this.quantile(Math.random());
    }
  }

  _chi2Sample(df) {
    let sum = 0;
    for (let i = 0; i < df; i++) sum += randNormal(0, 1) ** 2;
    return sum;
  }

  /** Generate x-axis range suitable for plotting this distribution */
  plotRange(n = 100) {
    const lo = this.quantile(0.001), hi = this.quantile(0.999);
    const step = (hi - lo) / (n - 1);
    const xs = Array.from({ length: n }, (_, i) => lo + i * step);
    return {
      x:   xs,
      pdf: xs.map(x => this.pdf(x)),
      cdf: xs.map(x => this.cdf(x)),
    };
  }

  /** Human-readable parameter string */
  toString() {
    const p = Object.entries(this.params).map(([k, v]) => `${k}=${v}`).join(', ');
    return `${this.type}(${p})`;
  }
}

// ─── Regularized incomplete gamma ────────────────────────────────────────────

function gammaInc(a, x) {
  if (x < 0) return 0;
  if (x === 0) return 0;
  // Series representation
  let sum = 1 / a, term = 1 / a;
  for (let k = 1; k < 200; k++) {
    term *= x / (a + k);
    sum += term;
    if (Math.abs(term) < 1e-10) break;
  }
  return Math.min(1, sum * Math.exp(-x + a * Math.log(x) - lgamma(a)));
}

// ─── Factory helpers ─────────────────────────────────────────────────────────

/** Create a Normal distribution */
export const normal = (mu = 0, sigma = 1) => new Distribution('normal', { mu, sigma });

/** Create an Exponential distribution */
export const exponential = (lambda = 1) => new Distribution('exponential', { lambda });

/** Create a Uniform distribution */
export const uniform = (a = 0, b = 1) => new Distribution('uniform', { a, b });

/** Create a Binomial distribution */
export const binomial = (n = 10, p = 0.5) => new Distribution('binomial', { n, p });

/** Create a Poisson distribution */
export const poisson = (lambda = 3) => new Distribution('poisson', { lambda });

/** Create a Student's t distribution */
export const tDist = (df = 10) => new Distribution('t', { df });

/** Create a Chi-squared distribution */
export const chisq = (df = 5) => new Distribution('chisq', { df });
