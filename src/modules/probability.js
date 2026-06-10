/**
 * probability.js — Probability Calculator Module
 * Data Analysis Toolkit
 *
 * Provides P(X <= x), P(X >= x), P(a <= X <= b),
 * and inverse CDF for all supported distributions.
 */

'use strict';

import { Distribution, normal, exponential, uniform, binomial, poisson, tDist }
  from './distributions.js';

/**
 * Compute P(X <= x) for any supported distribution.
 * @param {string} distType  'normal'|'exponential'|'uniform'|'binomial'|'poisson'|'t'
 * @param {object} params    distribution parameters
 * @param {number} x         value
 * @returns {number} probability
 */
export function pLeq(distType, params, x) {
  const d = new Distribution(distType, params);
  return d.cdf(x);
}

/**
 * Compute P(X >= x) for any supported distribution.
 */
export function pGeq(distType, params, x) {
  return 1 - pLeq(distType, params, x);
}

/**
 * Compute P(a <= X <= b) for any supported distribution.
 */
export function pBetween(distType, params, a, b) {
  const d = new Distribution(distType, params);
  return Math.max(0, d.cdf(b) - d.cdf(a));
}

/**
 * Find x such that P(X <= x) = prob (inverse CDF / quantile function).
 * @param {string} distType  distribution name
 * @param {object} params    distribution parameters
 * @param {number} prob      target probability (0 to 1)
 * @returns {number} quantile value
 */
export function quantile(distType, params, prob) {
  const d = new Distribution(distType, params);
  return d.quantile(prob);
}

/**
 * Full probability query — computes all query types at once.
 * @param {string} distType  distribution name
 * @param {object} params    distribution parameters
 * @param {object} query     { type: 'leq'|'geq'|'between'|'inv', x?, a?, b?, p? }
 * @returns {{ result, label, formula }}
 */
export function calcProbability(distType, params, query) {
  const d = new Distribution(distType, params);
  let result, label, formula;

  switch (query.type) {
    case 'leq':
      result  = d.cdf(query.x);
      label   = `P(X ≤ ${query.x})`;
      formula = `CDF(${query.x})`;
      break;
    case 'geq':
      result  = 1 - d.cdf(query.x);
      label   = `P(X ≥ ${query.x})`;
      formula = `1 − CDF(${query.x})`;
      break;
    case 'between':
      result  = Math.max(0, d.cdf(query.b) - d.cdf(query.a));
      label   = `P(${query.a} ≤ X ≤ ${query.b})`;
      formula = `CDF(${query.b}) − CDF(${query.a})`;
      break;
    case 'inv':
      result  = d.quantile(query.p);
      label   = `Q(${query.p}) = x`;
      formula = `Inverse CDF at p = ${query.p}`;
      break;
    default:
      throw new Error(`Unknown query type: ${query.type}`);
  }

  return {
    result:   +result.toFixed(6),
    label,
    formula,
    distType,
    params,
    query,
    distribution: d.toString(),
  };
}

/**
 * Generate a table of probability values for a distribution.
 * Useful for printing or exporting a probability table.
 * @param {string} distType  distribution name
 * @param {object} params    distribution parameters
 * @param {number[]} xValues x values to evaluate
 * @returns {Array<{ x, pdf, cdf }>}
 */
export function probabilityTable(distType, params, xValues) {
  const d = new Distribution(distType, params);
  return xValues.map(x => ({
    x,
    pdf: +d.pdf(x).toFixed(6),
    cdf: +d.cdf(x).toFixed(6),
  }));
}

/**
 * Compute common critical values for the Normal distribution.
 * @returns {object} critical values at standard alpha levels
 */
export function normalCriticalValues() {
  const d = new Distribution('normal', { mu: 0, sigma: 1 });
  return {
    z_90:  +d.quantile(0.95).toFixed(4),   // one-tail 5%
    z_95:  +d.quantile(0.975).toFixed(4),  // two-tail 5%
    z_99:  +d.quantile(0.995).toFixed(4),  // two-tail 1%
    z_999: +d.quantile(0.9995).toFixed(4), // two-tail 0.1%
  };
}
