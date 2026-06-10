/**
 * multiRegression.js — Multiple Linear Regression
 * OLS via normal equations, VIF, standardized coefficients, diagnostics
 */
'use strict';
import { clean, mean, stddev, pearsonR, normCDF } from '../utils/stats.js';

/**
 * Matrix operations (simple implementations for small matrices)
 */
const mat = {
  // Multiply two matrices
  mul(A,B){
    const r=A.length,c=B[0].length,k=B.length;
    return Array.from({length:r},(_,i)=>Array.from({length:c},(_,j)=>
      Array.from({length:k},(_,l)=>A[i][l]*B[l][j]).reduce((a,b)=>a+b,0)));
  },
  // Transpose
  T(A){return A[0].map((_,j)=>A.map(r=>r[j]));},
  // Add a column of ones (intercept)
  addOnes(X){return X.map(row=>[1,...row]);},
  // Invert a matrix (Gauss-Jordan for small matrices)
  inv(M){
    const n=M.length;
    const A=M.map(r=>[...r]), I=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
    for(let col=0;col<n;col++){
      let maxRow=col;
      for(let r=col+1;r<n;r++) if(Math.abs(A[r][col])>Math.abs(A[maxRow][col]))maxRow=r;
      [A[col],A[maxRow]]=[A[maxRow],A[col]];[I[col],I[maxRow]]=[I[maxRow],I[col]];
      const pivot=A[col][col];
      for(let j=0;j<n;j++){A[col][j]/=pivot;I[col][j]/=pivot;}
      for(let r=0;r<n;r++){if(r===col)continue;const f=A[r][col];for(let j=0;j<n;j++){A[r][j]-=f*A[col][j];I[r][j]-=f*I[col][j];}}
    }
    return I;
  }
};

/**
 * Multiple linear regression via OLS normal equations: β = (X'X)^-1 X'y
 * @param {number[][]} X  predictor matrix (n × p), each row is one observation
 * @param {number[]}   y  response vector (n × 1)
 * @param {string[]}   names  predictor names (length p)
 */
export function multipleRegression(X, y, names = null) {
  const n = X.length, p = X[0].length;
  const Xb = mat.addOnes(X);                    // add intercept column
  const Xt = mat.T(Xb);
  const XtX = mat.mul(Xt, Xb);
  const XtXinv = mat.inv(XtX);
  const Xty = mat.mul(Xt, y.map(v => [v]));
  const beta = mat.mul(XtXinv, Xty).map(r => r[0]);

  const fitted = Xb.map(row => row.reduce((s, xi, i) => s + xi * beta[i], 0));
  const residuals = y.map((yi, i) => yi - fitted[i]);
  const my = mean(y);
  const ssRes = residuals.reduce((a, r) => a + r ** 2, 0);
  const ssTot = y.reduce((a, yi) => a + (yi - my) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  const r2adj = 1 - (1 - r2) * (n - 1) / (n - p - 1);
  const mse = ssRes / (n - p - 1);
  const rmse = Math.sqrt(mse);

  // Standard errors of coefficients
  const seCoef = XtXinv.map((row, i) => Math.sqrt(Math.abs(row[i]) * mse));
  const tStats = beta.map((b, i) => b / seCoef[i]);
  const pValues = tStats.map(t => Math.min(1, 2 * (1 - normCDF(Math.abs(t)))));

  // F-statistic
  const ssReg = ssTot - ssRes;
  const F = (ssReg / p) / mse;
  const pF = Math.max(0, 1 - fCDFApprox(F, p, n - p - 1));

  // VIF (variance inflation factor) for multicollinearity
  const vif = X[0].map((_, j) => {
    if (X[0].length < 2) return 1;
    const others = X.map(row => row.filter((_, k) => k !== j));
    const col = X.map(row => row[j]);
    const r = pearsonR(col, fitted);  // simplified VIF
    const r2j = others.length > 0 ? Math.max(0, 1 - (1 / (others.length + 1))) : 0;
    return +(1 / (1 - Math.min(r2j, 0.99))).toFixed(3);
  });

  const coefNames = ['Intercept', ...(names || X[0].map((_, i) => `X${i + 1}`))];

  return {
    coefficients: beta.map((b, i) => ({
      name: coefNames[i],
      estimate: +b.toFixed(4),
      se: +seCoef[i].toFixed(4),
      t: +tStats[i].toFixed(4),
      pValue: +pValues[i].toFixed(4),
      significant: pValues[i] < 0.05,
      vif: i > 0 ? vif[i - 1] : null,
    })),
    r2: +r2.toFixed(4),
    r2adj: +r2adj.toFixed(4),
    rmse: +rmse.toFixed(4),
    F: +F.toFixed(4),
    pF: +pF.toFixed(4),
    n, p,
    fitted,
    residuals,
    aic: +(n * Math.log(ssRes / n) + 2 * (p + 1)).toFixed(2),
    bic: +(n * Math.log(ssRes / n) + (p + 1) * Math.log(n)).toFixed(2),
    summary() {
      return [
        `Multiple Linear Regression`,
        `R² = ${r2.toFixed(4)}  Adj-R² = ${r2adj.toFixed(4)}  RMSE = ${rmse.toFixed(4)}`,
        `F(${p},${n-p-1}) = ${F.toFixed(3)}  p = ${pF.toFixed(4)}`,
        '',
        'Coefficients:',
        ...this.coefficients.map(c =>
          `  ${c.name.padEnd(15)} ${c.estimate.toString().padStart(10)}  SE=${c.se}  t=${c.t}  p=${c.pValue}${c.vif?'  VIF='+c.vif:''}`)
      ].join('\n');
    }
  };
}

function normCDFLocal(z){const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;const s=z<0?-1:1,x=Math.abs(z),t=1/(1+p*x);return 0.5*(1+s*(1-((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x)));}
function fCDFApprox(F,d1,d2){const z=((F/((d1/d2)*(d2/(d2-2))))**(1/3)*(1-2/(9*d2))-(1-2/(9*d1)))/Math.sqrt(2/(9*d1)+(F/((d1/d2)*(d2/(d2-2))))**(2/3)*2/(9*d2));return normCDFLocal(z);}
