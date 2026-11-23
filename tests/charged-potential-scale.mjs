import assert from 'node:assert/strict';
import {planarModel,projectionPixels,projectionRange} from '../docs/flat-projection.js';
import {automaticPotentialLimit,potentialPosition} from '../docs/potential-scale.js';
const acetate={atoms:[{id:'a',element:'C',x:0,y:50},{id:'b',element:'C',x:95,y:0},{id:'c',element:'O',x:95,y:-110},{id:'d',element:'O',charge:-1,x:190,y:50}],bonds:[{a:'a',b:'b',order:1},{a:'b',b:'c',order:2},{a:'b',b:'d',order:1}]};
for(const [name,graph] of [['acetate',acetate],['methoxide',{atoms:[{id:'c',element:'C',x:0,y:0},{id:'o',element:'O',charge:-1,x:110,y:0}],bonds:[{a:'c',b:'o',order:1}]}],['ammonium',{atoms:[{id:'n',element:'N',charge:1,x:0,y:0}],bonds:[]}],['formaldehyde',{atoms:[{id:'c',element:'C',x:0,y:0},{id:'o',element:'O',x:110,y:0}],bonds:[{a:'c',b:'o',order:2}]}]]){
 const model=planarModel(graph),range=projectionRange(model),limit=automaticPotentialLimit([range.min,range.max]),values=[];
 projectionPixels(model,256,v=>{values.push(v);return [0,0,0]});
 assert.ok(limit>0&&Number.isFinite(limit));assert.equal(potentialPosition(0,limit),.5);
 assert.ok(values.every(v=>potentialPosition(v,limit)>0&&potentialPosition(v,limit)<1));
 const charge=graph.atoms.reduce((s,a)=>s+(a.charge||0),0);assert.ok(Math.abs(model.charges.reduce((s,q)=>s+q,0)-charge)<1e-7);
 if(charge<0){assert.ok(values.every(v=>v<0));assert.ok(values.every(v=>potentialPosition(v,limit)<.5));assert.ok(Math.max(...values.map(v=>potentialPosition(v,limit)))-Math.min(...values.map(v=>potentialPosition(v,limit)))>.2);}
 console.log(name, {charge,range,autoLimit:limit,fixedClipped:values.filter(v=>Math.abs(v)>=.05).length/values.length,autoClipped:values.filter(v=>Math.abs(v)>=limit).length/values.length});
}
assert.equal(automaticPotentialLimit([]),.05);assert.equal(automaticPotentialLimit([NaN,Infinity]),.05);assert.equal(potentialPosition(-.5,.25),0);assert.equal(potentialPosition(.5,.25),1);
console.log('Passed charged/neutral auto scaling, sign preservation, charge conservation and fixed clipping.');
