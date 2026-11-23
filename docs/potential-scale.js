// SPDX-License-Identifier: GPL-3.0-only
// A symmetric, zero-centred scale preserves the sign of the potential.
export function automaticPotentialLimit(values,floor=.05){
 let maximum=0;for(const value of values)if(Number.isFinite(value))maximum=Math.max(maximum,Math.abs(value));
 return Math.max(floor,Math.ceil(maximum*1.05/.025)*.025);
}
export function potentialPosition(value,limit){return Math.max(0,Math.min(1,(value/limit+1)/2));}
