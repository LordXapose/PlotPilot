/**
 * anova.js — ANOVA & Post-Hoc Tests
 * One-way ANOVA, Tukey HSD, Levene's test, effect sizes
 */
'use strict';
import { clean, mean, stddev, variance, normCDF } from '../utils/stats.js';

export function oneWayAnova(groups, labels = null) {
  const cleaned = groups.map(g => clean(g));
  const k = cleaned.length, ns = cleaned.map(g => g.length);
  const means = cleaned.map(g => mean(g));
  const N = ns.reduce((a,b)=>a+b,0);
  const grandMean = cleaned.flat().reduce((a,b)=>a+b,0)/N;
  const SSB = cleaned.reduce((acc,g,i)=>acc+ns[i]*(means[i]-grandMean)**2,0);
  const SSW = cleaned.reduce((acc,g,i)=>acc+g.reduce((a,x)=>a+(x-means[i])**2,0),0);
  const dfB=k-1, dfW=N-k, MSB=SSB/dfB, MSW=SSW/dfW, F=MSB/MSW;
  const pValue = Math.max(0,1-fCDF(F,dfB,dfW));
  const etaSq = SSB/(SSB+SSW);
  const omegaSq = (SSB-(dfB*MSW))/(SSB+SSW+MSW);
  return {
    F:+F.toFixed(4), dfB, dfW, SSB:+SSB.toFixed(3), SSW:+SSW.toFixed(3),
    MSB:+MSB.toFixed(4), MSW:+MSW.toFixed(4), pValue:+pValue.toFixed(4),
    reject:pValue<0.05, etaSq:+etaSq.toFixed(4), omegaSq:+omegaSq.toFixed(4),
    grandMean:+grandMean.toFixed(4), N, k,
    groups:cleaned.map((g,i)=>({label:labels?.[i]||`G${i+1}`,n:ns[i],mean:+means[i].toFixed(4),sd:+stddev(g).toFixed(4)}))
  };
}

export function tukeyHSD(groups, labels=null, alpha=0.05) {
  const cleaned=groups.map(g=>clean(g));
  const k=cleaned.length, ns=cleaned.map(g=>g.length), means=cleaned.map(g=>mean(g));
  const N=ns.reduce((a,b)=>a+b,0);
  const MSW=cleaned.reduce((acc,g,i)=>acc+g.reduce((a,x)=>a+(x-means[i])**2,0),0)/(N-k);
  const results=[];
  for(let i=0;i<k;i++) for(let j=i+1;j<k;j++){
    const se=Math.sqrt(MSW/2*(1/ns[i]+1/ns[j]));
    const q=Math.abs(means[i]-means[j])/se;
    const pApprox=Math.min(1,2*(1-normCDF(q/Math.sqrt(2))));
    results.push({g1:labels?.[i]||`G${i+1}`,g2:labels?.[j]||`G${j+1}`,
      diff:+(means[i]-means[j]).toFixed(4),q:+q.toFixed(4),
      pAdj:+pApprox.toFixed(4),significant:pApprox<alpha});
  }
  return results;
}

export function leveneTest(groups) {
  const cleaned=groups.map(g=>clean(g));
  const meds=cleaned.map(g=>mean(g)); // use means for Brown-Forsythe
  const zij=cleaned.map((g,i)=>g.map(x=>Math.abs(x-meds[i])));
  return oneWayAnova(zij);
}

function lgamma(z){const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,1.208650973866179e-3,-5.395239384953e-6];let y=z,t=z+5.5;t-=(z+.5)*Math.log(t);let s=1.000000000190015;for(let j=0;j<6;j++){y++;s+=c[j]/y;}return -t+Math.log(2.5066282746310005*s/z);}
function betaInc(x,a,b){if(x<=0)return 0;if(x>=1)return 1;let s=0,t=1;for(let i=0;i<200;i++){t*=(a+i)*x/(a+b+i)/(i+1);s+=t;if(Math.abs(t)<1e-9)break;}return Math.pow(x,a)*Math.pow(1-x,b)*s;}
function fCDF(x,d1,d2){const z=(d1*x)/(d1*x+d2);return betaInc(z,d1/2,d2/2);}
