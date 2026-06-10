/**
 * sampling.js — Sampling Distributions & Bootstrap
 * CLT demonstration, bootstrap confidence intervals, sample size calculator
 */
'use strict';
import { clean, mean, stddev, normInv } from '../utils/stats.js';

export function bootstrapCI(arr, stat='mean', B=1000, alpha=0.05) {
  const v=clean(arr), n=v.length;
  const statFn={mean,median:a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)],sd:stddev}[stat]||mean;
  const boots=[];
  for(let b=0;b<B;b++){
    const sample=Array.from({length:n},()=>v[Math.floor(Math.random()*n)]);
    boots.push(statFn(sample));
  }
  boots.sort((a,b)=>a-b);
  const lo=boots[Math.floor(B*alpha/2)], hi=boots[Math.floor(B*(1-alpha/2))];
  return {observed:+statFn(v).toFixed(4),lower:+lo.toFixed(4),upper:+hi.toFixed(4),
    B,se:+stddev(boots).toFixed(4),boots,stat,level:(1-alpha)*100};
}

export function samplingDistribution(arr, sampleSize=10, iterations=500) {
  const v=clean(arr);
  const sampleMeans=[];
  for(let i=0;i<iterations;i++){
    const s=Array.from({length:sampleSize},()=>v[Math.floor(Math.random()*v.length)]);
    sampleMeans.push(mean(s));
  }
  return {sampleMeans,mean:+mean(sampleMeans).toFixed(4),
    sd:+stddev(sampleMeans).toFixed(4),
    theoreticalSE:+(stddev(v)/Math.sqrt(sampleSize)).toFixed(4),
    populationMean:+mean(v).toFixed(4),
    sampleSize,iterations};
}

export function sampleSizeForMean(marginOfError, sigma, alpha=0.05) {
  const z=normInv(1-alpha/2);
  return Math.ceil((z*sigma/marginOfError)**2);
}

export function sampleSizeForProportion(marginOfError, p=0.5, alpha=0.05) {
  const z=normInv(1-alpha/2);
  return Math.ceil(z**2*p*(1-p)/marginOfError**2);
}

export function powerAnalysis(effectSize, alpha=0.05, n=20) {
  // Two-sided one-sample t-test power approximation
  const z_alpha=normInv(1-alpha/2);
  const ncp=effectSize*Math.sqrt(n);
  // Approximation: power ≈ Φ(ncp - z_alpha) + Φ(-ncp - z_alpha)
  const {normCDF:nCDF}={normCDF:z=>{const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;const s=z<0?-1:1,x=Math.abs(z),t=1/(1+p*x);return 0.5*(1+s*(1-((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x)));} };
  const power=nCDF(ncp-z_alpha)+nCDF(-ncp-z_alpha);
  return {power:+Math.min(1,power).toFixed(4),effectSize,alpha,n,ncp:+ncp.toFixed(4)};
}

export function cohenD(arr1, arr2) {
  const v1=clean(arr1),v2=clean(arr2);
  const m1=mean(v1),m2=mean(v2),s1=stddev(v1),s2=stddev(v2);
  const pooled=Math.sqrt(((v1.length-1)*s1**2+(v2.length-1)*s2**2)/(v1.length+v2.length-2));
  const d=(m1-m2)/pooled;
  const magnitude=Math.abs(d)<0.2?'negligible':Math.abs(d)<0.5?'small':Math.abs(d)<0.8?'medium':'large';
  return {d:+d.toFixed(4),pooledSD:+pooled.toFixed(4),magnitude,
    mean1:+m1.toFixed(4),mean2:+m2.toFixed(4)};
}
