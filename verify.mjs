// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden. See LICENSE for terms.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as T from './docs/vendor/three.module.js';
const src=fs.readFileSync('docs/app.js','utf8');
const start=src.indexOf('function parseCube('),end=src.indexOf("$('cube').onchange",start);
const funcs=new Function('T',src.slice(start,end)+';return {parseCube,march,samplePotential};')(T);
for(const item of JSON.parse(fs.readFileSync('docs/data/index.json'))){
 const d=JSON.parse(fs.readFileSync('docs/data/'+item.id+'.json'));assert(d.converged);assert(d.energy<0);
 const imported=funcs.parseCube(fs.readFileSync('docs/data/'+item.id+'.cube','utf8'));
 const raw=fs.readFileSync('docs/data/'+item.id+'-esp.cube','utf8');const esp=funcs.parseCube(raw,'potential');assert.throws(()=>funcs.parseCube(raw));
 assert.deepEqual(imported.volume.dims,esp.volume.dims);assert.equal(imported.atoms.length,d.atoms.length);
 for(const level of ['0.001','0.002','0.005']){const m=d.meshes[level];assert(m);assert(m.vertices.every(Number.isFinite));assert(m.faces.every(i=>i>=0&&i<m.vertices.length/3));assert.equal(m.potential.length,m.vertices.length/3);assert(m.potential.every(Number.isFinite));assert(m.potentialMin<0&&m.potentialMax>0);const interpolated=funcs.samplePotential(m.vertices,esp.volume),errors=interpolated.map((v,i)=>Math.abs(v-m.potential[i])),mean=errors.reduce((a,b)=>a+b,0)/errors.length;assert(mean<.005,`${item.name} interpolation mean error ${mean}`);}
 const mesh=funcs.march(imported.volume,.001);assert(mesh.vertices.length>0);
 console.log(item.name+': converged; signed ESP; valid meshes; paired cubes and interpolation passed');
}
assert.throws(()=>funcs.parseCube('invalid'));console.log('Malformed import rejected');
