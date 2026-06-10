/**
 * timeseries.js — Time Series Analysis
 * Moving averages, trend, seasonality, autocorrelation, stationarity
 */
'use strict';
import { clean, mean, stddev } from '../utils/stats.js';

export function movingAverage(arr, window=3) {
  const v=clean(arr);
  return v.map((_,i)=>{
    if(i<window-1) return null;
    return mean(v.slice(i-window+1,i+1));
  });
}

export function exponentialSmoothing(arr, alpha=0.3) {
  const v=clean(arr); if(!v.length) return [];
  const result=[v[0]];
  for(let i=1;i<v.length;i++) result.push(alpha*v[i]+(1-alpha)*result[i-1]);
  return result;
}

export function linearTrend(arr) {
  const v=clean(arr), n=v.length;
  const xs=Array.from({length:n},(_,i)=>i);
  const mx=mean(xs), my=mean(v);
  let sxy=0,sxx=0;
  for(let i=0;i<n;i++){sxy+=(i-mx)*(v[i]-my);sxx+=(i-mx)**2;}
  const b=sxy/sxx, a=my-b*mx;
  const fitted=xs.map(x=>a+b*x);
  const detrended=v.map((y,i)=>y-fitted[i]);
  return {slope:+b.toFixed(6),intercept:+a.toFixed(4),fitted,detrended,
    direction:b>0?'upward':b<0?'downward':'flat',
    ratePerPeriod:+b.toFixed(4)};
}

export function autocorrelation(arr, maxLag=20) {
  const v=clean(arr), n=v.length, m=mean(v);
  const variance=v.reduce((a,x)=>a+(x-m)**2,0)/n;
  const acf=[];
  for(let lag=0;lag<=Math.min(maxLag,n-1);lag++){
    let cov=0;
    for(let i=lag;i<n;i++) cov+=(v[i]-m)*(v[i-lag]-m);
    acf.push({lag,r:+(cov/(n*variance)).toFixed(4),sig:1.96/Math.sqrt(n)});
  }
  return acf;
}

export function partialAutocorrelation(arr, maxLag=20) {
  const acf=autocorrelation(arr,maxLag).map(a=>a.r);
  const pacf=[1];
  for(let k=1;k<=Math.min(maxLag,acf.length-1);k++){
    // Yule-Walker approximation
    let num=acf[k], den=1;
    for(let j=1;j<k;j++){num-=pacf[j]*acf[k-j];den-=pacf[j]*acf[j];}
    pacf.push(+(num/den).toFixed(4));
  }
  return pacf.map((r,lag)=>({lag,r,sig:1.96/Math.sqrt(arr.length)}));
}

export function rollingStats(arr, window=5) {
  const v=clean(arr);
  return v.map((_,i)=>{
    if(i<window-1) return {mean:null,sd:null,min:null,max:null};
    const w=v.slice(i-window+1,i+1);
    return {mean:+mean(w).toFixed(4),sd:+stddev(w).toFixed(4),min:Math.min(...w),max:Math.max(...w)};
  });
}

export function differencing(arr, d=1) {
  let v=[...clean(arr)];
  for(let i=0;i<d;i++) v=v.slice(1).map((x,j)=>x-v[j]);
  return v;
}

export function adfTestApprox(arr) {
  // Augmented Dickey-Fuller approximation
  const v=clean(arr);
  const dv=differencing(v,1);
  const y=dv, x=v.slice(0,v.length-1);
  const n=y.length, mx=mean(x), my=mean(y);
  let sxy=0,sxx=0;
  for(let i=0;i<n;i++){sxy+=(x[i]-mx)*(y[i]-my);sxx+=(x[i]-mx)**2;}
  const b=sxy/sxx, se=stddev(y)/Math.sqrt(sxx);
  const tau=b/se;
  // Approximate critical values at 5%: -1.95 (no constant), -2.86 (with constant)
  const critical=-2.86;
  return {tau:+tau.toFixed(4),critical,stationary:tau<critical,
    interpretation:tau<critical?'Likely stationary':'Likely non-stationary (unit root)'};
}
