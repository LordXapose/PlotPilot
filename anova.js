/**
 * inference.js — Statistical Inference Module
 * Data Analysis Toolkit
 *
 * Exports:
 *   confidenceInterval(arr, alpha)
 *   tTestOneSample(arr, mu0, alpha)
 *   tTestTwoSample(arr1, arr2, alpha)
 *   proportionTest(successes, n, p0, alpha)
 *   anova(groups, alpha)
 *   chiSquaredTest(observed, expected)
 *   normalityTest(arr)
 */

'use strict';

import {
  clean, mean, median, stddev, variance, skewness, kurtosis,
  tCritical, normCDF, normInv, pearsonR
} from '../utils/stats.js';

// ─── Confidence Intervals ─────────────────────────────────────────────────────

/**
 * Confidence interval for a population mean (t-based).
 * @param {number[]} arr    sample data
 * @param {number}   alpha  significance level (default 0.05 → 95% CI)
 */
export function confidenceInterval(arr, alpha = 0.05) {
  const v = clean(arr);
  if (v.length < 2) throw new Error('Need at least 2 observations');
  const n = v.length;
  const m = mean(v);
  const s = stddev(v);
  const se = s / Math.sqrt(n);
  const tc = tCritical(alpha, n - 1);
  const me = tc * se;
  return {
    type: `${((1 - alpha) * 100).toFixed(0)}% Confidence Interval`,
    mean:   +m.toFixed(4),
    lower:  +(m - me).toFixed(4),
    upper:  +(m + me).toFixed(4),
    margin: +me.toFixed(4),
    se:     +se.toFixed(4),
    sd:     +s.toFixed(4),
    n,
    tcrit: +tc.toFixed(3),
    alpha,
    interpretation: `We are ${((1-alpha)*100).toFixed(0)}% confident the true mean lies between ${(m-me).toFixed(2)} and ${(m+me).toFixed(2)}.`,
  };
}

// ─── Hypothesis Tests ─────────────────────────────────────────────────────────

/**
 * One-sample t-test.
 * H₀: μ = mu0   H₁: μ ≠ mu0  (two-tailed)
 *
 * @param {number[]} arr   sample data
 * @param {number}   mu0   hypothesized mean
 * @param {number}   alpha significance level
 */
export function tTestOneSample(arr, mu0 = 0, alpha = 0.05) {
  const v = clean(arr);
  if (v.length < 2) throw new Error('Need at least 2 observations');
  const n = v.length;
  const m = mean(v);
  const s = stddev(v);
  const se = s / Math.sqrt(n);
  const t = (m - mu0) / se;
  const df = n - 1;
  const pValue = 2 * (1 - normCDF(Math.abs(t)));
  const tc = tCritical(alpha, df);

  return {
    test:    'One-Sample t-Test',
    H0:      `μ = ${mu0}`,
    H1:      `μ ≠ ${mu0}`,
    t:       +t.toFixed(4),
    df,
    pValue:  +pValue.toFixed(4),
    alpha,
    tcrit:   +tc.toFixed(3),
    mean:    +m.toFixed(4),
    sd:      +s.toFixed(4),
    se:      +se.toFixed(4),
    n,
    reject:  pValue < alpha,
    decision: pValue < alpha
      ? `Reject H₀ at α=${alpha}. Evidence that mean ≠ ${mu0}.`
      : `Fail to reject H₀ at α=${alpha}. No significant evidence that mean ≠ ${mu0}.`,
    ci: confidenceInterval(v, alpha),
  };
}

/**
 * Two-sample independent t-test (Welch's, unequal variances).
 * H₀: μ₁ = μ₂   H₁: μ₁ ≠ μ₂
 *
 * @param {number[]} arr1  first group
 * @param {number[]} arr2  second group
 * @param {number}   alpha significance level
 */
export function tTestTwoSample(arr1, arr2, alpha = 0.05) {
  const v1 = clean(arr1), v2 = clean(arr2);
  if (v1.length < 2 || v2.length < 2) throw new Error('Each group needs ≥ 2 observations');
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
    test:   'Two-Sample Welch t-Test',
    H0:     'μ₁ = μ₂',
    H1:     'μ₁ ≠ μ₂',
    t:      +t.toFixed(4),
    df:     +df.toFixed(1),
    pValue: +pValue.toFixed(4),
    alpha,
    tcrit:  +tc.toFixed(3),
    group1: { mean: +m1.toFixed(4), sd: +s1.toFixed(4), n: n1 },
    group2: { mean: +m2.toFixed(4), sd: +s2.toFixed(4), n: n2 },
    meanDiff: +(m1 - m2).toFixed(4),
    se:     +se.toFixed(4),
    reject: pValue < alpha,
    decision: pValue < alpha
      ? `Reject H₀. Significant difference between groups (p=${pValue.toFixed(4)}).`
      : `Fail to reject H₀. No significant difference detected (p=${pValue.toFixed(4)}).`,
    cohenD: +Math.abs(m1 - m2) / Math.sqrt((s1**2 + s2**2) / 2).toFixed(3),
  };
}

/**
 * One-proportion z-test.
 * H₀: p = p0   H₁: p ≠ p0
 *
 * @param {number} successes  number of successes
 * @param {number} n          sample size
 * @param {number} p0         hypothesized proportion
 */
export function proportionTest(successes, n, p0 = 0.5, alpha = 0.05) {
  const pHat = successes / n;
  const se = Math.sqrt(p0 * (1 - p0) / n);
  const z = (pHat - p0) / se;
  const pValue = 2 * (1 - normCDF(Math.abs(z)));
  const zCrit = normInv(1 - alpha / 2);
  const me = zCrit * Math.sqrt(pHat * (1 - pHat) / n);

  return {
    test:    'One-Proportion z-Test',
    H0:      `p = ${p0}`,
    H1:      `p ≠ ${p0}`,
    pHat:    +pHat.toFixed(4),
    z:       +z.toFixed(4),
    pValue:  +pValue.toFixed(4),
    alpha,
    zcrit:   +zCrit.toFixed(3),
    n,
    reject:  pValue < alpha,
    ci: {
      lower: +(pHat - me).toFixed(4),
      upper: +(pHat + me).toFixed(4),
    },
    decision: pValue < alpha
      ? `Reject H₀. p̂=${pHat.toFixed(3)} significantly differs from p₀=${p0}.`
      : `Fail to reject H₀. No significant difference from p₀=${p0}.`,
  };
}

/**
 * One-way ANOVA
 * H₀: all group means are equal   H₁: at least one differs
 *
 * @param {Array<number[]>} groups  array of group data arrays
 * @param {string[]}        labels  group labels
 */
export function anova(groups, labels = null, alpha = 0.05) {
  const cleaned = groups.map(g => clean(g));
  const k = cleaned.length;
  if (k < 2) throw new Error('ANOVA requires at least 2 groups');

  const ns = cleaned.map(g => g.length);
  const means = cleaned.map(g => mean(g));
  const N = ns.reduce((a, b) => a + b, 0);
  const grandMean = cleaned.flat().reduce((a, b) => a + b, 0) / N;

  // Between-group sum of squares (SSB)
  const SSB = cleaned.reduce((acc, g, i) => acc + ns[i] * (means[i] - grandMean) ** 2, 0);
  // Within-group sum of squares (SSW)
  const SSW = cleaned.reduce((acc, g, i) => {
    return acc + g.reduce((a, x) => a + (x - means[i]) ** 2, 0);
  }, 0);

  const dfB = k - 1, dfW = N - k;
  const MSB = SSB / dfB, MSW = SSW / dfW;
  const F = MSB / MSW;

  // p-value approximation using chi-squared / F approximation
  const pValue = Math.max(0, 1 - fCDF(F, dfB, dfW));

  const groupStats = cleaned.map((g, i) => ({
    label: labels ? labels[i] : `Group ${i + 1}`,
    n:    ns[i],
    mean: +means[i].toFixed(4),
    sd:   +stddev(g).toFixed(4),
  }));

  return {
    test:   'One-Way ANOVA',
    H0:     'All group means are equal',
    H1:     'At least one group mean differs',
    F:      +F.toFixed(4),
    dfB, dfW,
    SSB:    +SSB.toFixed(3),
    SSW:    +SSW.toFixed(3),
    MSB:    +MSB.toFixed(4),
    MSW:    +MSW.toFixed(4),
    pValue: +pValue.toFixed(4),
    alpha,
    reject: pValue < alpha,
    etaSq:  +(SSB / (SSB + SSW)).toFixed(4),  // effect size
    grandMean: +grandMean.toFixed(4),
    groups: groupStats,
    decision: pValue < alpha
      ? `Reject H₀. At least one group mean differs significantly (F=${F.toFixed(2)}, p=${pValue.toFixed(4)}).`
      : `Fail to reject H₀. No significant difference among groups (F=${F.toFixed(2)}, p=${pValue.toFixed(4)}).`,
  };
}

/**
 * Chi-squared goodness-of-fit / independence test.
 * @param {number[]} observed   observed frequencies
 * @param {number[]} expected   expected frequencies
 */
export function chiSquaredTest(observed, expected, alpha = 0.05) {
  if (observed.length !== expected.length)
    throw new Error('Observed and expected arrays must have equal length');

  const chi2 = observed.reduce((acc, o, i) => {
    if (expected[i] === 0) return acc;
    return acc + (o - expected[i]) ** 2 / expected[i];
  }, 0);
  const df = observed.length - 1;

  // p-value using chi-squared CDF approximation
  const pValue = 1 - chiSqCDF(chi2, df);
  const chi2Crit = chiSqCritical(alpha, df);

  return {
    test:   'Chi-Squared Test',
    chi2:   +chi2.toFixed(4),
    df,
    pValue: +pValue.toFixed(4),
    alpha,
    chi2Crit: +chi2Crit.toFixed(3),
    reject: chi2 > chi2Crit,
    decision: chi2 > chi2Crit
      ? `Reject H₀ (χ²=${chi2.toFixed(2)} > χ²_crit=${chi2Crit.toFixed(2)}).`
      : `Fail to reject H₀ (χ²=${chi2.toFixed(2)} ≤ χ²_crit=${chi2Crit.toFixed(2)}).`,
  };
}

/**
 * Normality test suite (Shapiro-Wilk approximation + moments)
 * @param {number[]} arr  sample data
 */
export function normalityTest(arr) {
  const v = clean(arr);
  if (v.length < 3) throw new Error('Need at least 3 observations for normality test');
  const n = v.length;
  const skew = skewness(v);
  const kurt = kurtosis(v);

  // Jarque-Bera statistic
  const JB = (n / 6) * (skew ** 2 + (kurt ** 2) / 4);
  const jbP = Math.max(0, 1 - chiSqCDF(JB, 2));

  // Shapiro-Wilk W approximation (D'Agostino method for moderate n)
  const sorted = [...v].sort((a, b) => a - b);
  const m = mean(v), s = stddev(v);
  // Simplified W ≈ correlation between quantiles
  const theorQ = sorted.map((_, i) => normInv((i + 0.375) / (n + 0.25)));
  const W = pearsonR(sorted, theorQ) ** 2;
  const wP = W > 0.95 ? 0.4 : W > 0.9 ? 0.1 : 0.02;

  return {
    test: 'Normality Test',
    n,
    mean: +m.toFixed(4),
    sd:   +s.toFixed(4),
    skewness: +skew.toFixed(4),
    kurtosis: +kurt.toFixed(4),
    jarqueBera: {
      statistic: +JB.toFixed(4),
      pValue:    +jbP.toFixed(4),
      reject:    jbP < 0.05,
    },
    shapiroWilk: {
      W:       +W.toFixed(4),
      pApprox: wP,
      reject:  W < 0.95,
    },
    verdict: (Math.abs(skew) < 1 && Math.abs(kurt) < 2 && W > 0.9)
      ? 'Approximately normal'
      : 'May deviate from normality',
    notes: [
      `|Skewness| = ${Math.abs(skew).toFixed(3)} — ${Math.abs(skew) < 1 ? 'acceptable (<1)' : 'notable (≥1)'}`,
      `|Excess kurtosis| = ${Math.abs(kurt).toFixed(3)} — ${Math.abs(kurt) < 2 ? 'acceptable (<2)' : 'notable (≥2)'}`,
      `Shapiro-Wilk W = ${W.toFixed(3)} — ${W > 0.9 ? 'close to 1 (normal)' : 'below 0.9 (concern)'}`,
    ],
  };
}

// ─── Distribution helpers (private) ──────────────────────────────────────────

function lgamma(z) {
  const c = [76.18009172947146,-86.50532032941677,24.01409824083091,
             -1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
  let y=z, tmp=z+5.5;
  tmp -= (z+0.5)*Math.log(tmp);
  let ser=1.000000000190015;
  for (let j=0;j<6;j++){y++;ser+=c[j]/y;}
  return -tmp+Math.log(2.5066282746310005*ser/z);
}

function gammaInc(a, x) {
  if (x <= 0) return 0;
  let sum=1/a, term=1/a;
  for (let k=1;k<200;k++){
    term *= x/(a+k); sum += term;
    if (Math.abs(term)<1e-10) break;
  }
  return Math.min(1, sum*Math.exp(-x+a*Math.log(x)-lgamma(a)));
}

function chiSqCDF(x, df) {
  return gammaInc(df/2, x/2);
}

function chiSqCritical(alpha, df) {
  const table = {1:3.841,2:5.991,3:7.815,4:9.488,5:11.07,
                 6:12.59,7:14.07,8:15.51,9:16.92,10:18.31};
  return table[df] || df * (1 - 2/(9*df) + 1.645 * Math.sqrt(2/(9*df))) ** 3;
}

function fCDF(x, d1, d2) {
  const z = (d1 * x) / (d1 * x + d2);
  return betaInc(z, d1/2, d2/2);
}

function betaInc(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let sum=0, term=1;
  for (let i=0;i<200;i++){
    term *= (a+i)*x/(a+b+i)/(i+1);
    sum += term;
    if (Math.abs(term)<1e-9) break;
  }
  return Math.pow(x,a)*Math.pow(1-x,b)*sum;
}
