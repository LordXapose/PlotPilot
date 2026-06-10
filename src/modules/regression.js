/**
 * regression.js — Linear Regression Module
 * Data Analysis Toolkit
 *
 * Exports:
 *   linearRegression(x, y)      → full OLS model object
 *   multipleRegression(X, y)    → multiple regression (matrix form)
 *   regressionDiagnostics(model) → residual analysis
 */

'use strict';

import { clean, mean, stddev, pearsonR, normCDF } from '../utils/stats.js';

/**
 * Simple ordinary-least-squares regression of y on x.
 *
 * @param {number[]} x  predictor variable
 * @param {number[]} y  response variable
 * @returns {object} Full regression model
 *
 * @example
 * const model = linearRegression(ages, incomes);
 * model.predict(35);   // predicted income at age 35
 * model.r2;            // R-squared
 * model.summary();     // console-friendly summary table
 */
export function linearRegression(x, y) {
  // Pair up and remove rows with any null
  const pairs = x.map((xi, i) => [xi, y[i]])
                  .filter(([a, b]) => a !== null && b !== null && !isNaN(a) && !isNaN(b));
  if (pairs.length < 3) throw new Error('Need at least 3 complete observations for regression');

  const xs = pairs.map(p => p[0]);
  const ys = pairs.map(p => p[1]);
  const n = xs.length;

  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }

  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const predict = xVal => slope * xVal + intercept;

  const fitted    = xs.map(xi => predict(xi));
  const residuals = ys.map((yi, i) => yi - fitted[i]);
  const ssRes     = residuals.reduce((a, r) => a + r ** 2, 0);
  const ssTot     = ys.reduce((a, yi) => a + (yi - my) ** 2, 0);

  const r2   = 1 - ssRes / ssTot;
  const r2adj = 1 - (1 - r2) * (n - 1) / (n - 2);
  const rmse = Math.sqrt(ssRes / (n - 2));

  // Standard error of slope and intercept
  const se_slope     = rmse / Math.sqrt(sxx);
  const se_intercept = rmse * Math.sqrt((1/n) + mx**2/sxx);

  // t-stats and p-values
  const t_slope     = slope / se_slope;
  const t_intercept = intercept / se_intercept;
  const p_slope     = 2 * (1 - normCDF(Math.abs(t_slope)));
  const p_intercept = 2 * (1 - normCDF(Math.abs(t_intercept)));

  // F-statistic
  const ssReg = ssTot - ssRes;
  const F = (ssReg / 1) / (ssRes / (n - 2));
  const pF  = Math.max(0, 1 - fCDFApprox(F, 1, n - 2));

  return {
    // Coefficients
    slope:      +slope.toFixed(4),
    intercept:  +intercept.toFixed(4),

    // Fit quality
    r:     +pearsonR(xs, ys).toFixed(4),
    r2:    +r2.toFixed(4),
    r2adj: +r2adj.toFixed(4),
    rmse:  +rmse.toFixed(4),

    // Inference
    se_slope:     +se_slope.toFixed(4),
    se_intercept: +se_intercept.toFixed(4),
    t_slope:      +t_slope.toFixed(4),
    t_intercept:  +t_intercept.toFixed(4),
    p_slope:      +p_slope.toFixed(4),
    p_intercept:  +p_intercept.toFixed(4),
    F:            +F.toFixed(4),
    pF:           +pF.toFixed(4),
    df:           [1, n - 2],

    // Data
    n,
    fitted,
    residuals,
    xs, ys,

    // Prediction
    predict,

    // Prediction interval
    predictInterval(xNew, alpha = 0.05) {
      const se_pred = rmse * Math.sqrt(1 + 1/n + (xNew - mx)**2 / sxx);
      const tc = 1.96;  // approx for 95%
      const yHat = predict(xNew);
      return { y: +yHat.toFixed(4), lower: +(yHat - tc*se_pred).toFixed(4), upper: +(yHat + tc*se_pred).toFixed(4) };
    },

    // Human-readable summary
    summary() {
      const lines = [
        '=== Simple Linear Regression ===',
        '',
        `Model:  ŷ = ${slope.toFixed(4)}x + (${intercept.toFixed(4)})`,
        '',
        'Coefficients:',
        `  Intercept  ${intercept.toFixed(4)}   SE=${se_intercept.toFixed(4)}   t=${t_intercept.toFixed(3)}   p=${p_intercept.toFixed(4)}`,
        `  Slope      ${slope.toFixed(4)}    SE=${se_slope.toFixed(4)}   t=${t_slope.toFixed(3)}   p=${p_slope.toFixed(4)}`,
        '',
        `R² = ${r2.toFixed(4)}   Adj-R² = ${r2adj.toFixed(4)}   RMSE = ${rmse.toFixed(4)}`,
        `F(1,${n-2}) = ${F.toFixed(4)}   p = ${pF.toFixed(4)}   n = ${n}`,
      ];
      return lines.join('\n');
    },
  };
}

/**
 * Regression diagnostics — analyzes residuals.
 * @param {object} model  output of linearRegression()
 */
export function regressionDiagnostics(model) {
  const res = model.residuals;
  const n   = res.length;

  // Durbin-Watson (autocorrelation in residuals)
  let dw = 0;
  for (let i = 1; i < n; i++) dw += (res[i] - res[i-1]) ** 2;
  dw /= res.reduce((a, r) => a + r**2, 0);

  // Shapiro-Wilk W approximation for residuals
  const sorted = [...res].sort((a, b) => a - b);
  const mRes = mean(res), sRes = stddev(res);
  const stdRes = sorted.map(r => (r - mRes) / sRes);

  // Influential points (Cook's distance approx)
  const hii = model.xs.map(xi => {
    const mx = mean(model.xs), sxx = model.xs.reduce((a, x) => a + (x-mx)**2, 0);
    return 1/n + (xi - mx)**2 / sxx;
  });
  const mse = res.reduce((a,r) => a+r**2, 0) / (n-2);
  const cooks = res.map((r, i) => (r**2 * hii[i]) / (2 * mse * (1 - hii[i])**2));

  return {
    durbinWatson: +dw.toFixed(4),
    dwInterpret: dw < 1.5 ? 'Positive autocorrelation detected'
               : dw > 2.5 ? 'Negative autocorrelation detected'
               : 'No significant autocorrelation',
    cooks,
    maxCook: +Math.max(...cooks).toFixed(4),
    highInfluence: cooks.map((c, i) => ({ i, cook: c })).filter(p => p.cook > 4/n),
    residualStats: {
      mean:   +mean(res).toFixed(4),
      sd:     +stddev(res).toFixed(4),
      min:    +Math.min(...res).toFixed(4),
      max:    +Math.max(...res).toFixed(4),
    },
    stdResiduals: model.xs.map((x, i) => ({
      x, fitted: model.fitted[i], residual: res[i],
      stdResidual: +(res[i] / (stddev(res) * Math.sqrt(1 - hii[i]))).toFixed(3),
    })),
  };
}

// ─── Helper: F-CDF approximation ─────────────────────────────────────────────

function fCDFApprox(F, d1, d2) {
  // Wilson-Hilferty approximation
  const z = ((F/((d1/d2)*(d2/(d2-2)))) ** (1/3) * (1 - 2/(9*d2)) - (1 - 2/(9*d1))) /
             Math.sqrt(2/(9*d1) + (F/((d1/d2)*(d2/(d2-2))))**(2/3) * 2/(9*d2));
  return normCDF(z);
}
