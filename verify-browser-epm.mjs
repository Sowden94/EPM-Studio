// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden. See LICENSE for terms.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {Molecule} from './docs/vendor/openchemlib/openchemlib.js';
import {partialCharges,chargeTypes,potentialAt,BOHR,graphKey} from './docs/browser-epm.js';
import {calculateBrowserEpm} from './docs/browser-engine.js';
const fixtures=JSON.parse(fs.readFileSync('test-fixtures/gasteiger-rdkit-2025.09.6.json'));
for(const reference of fixtures){const m=Molecule.fromSmiles(reference.smiles);m.addImplicitHydrogens();m.ensureHelperArrays(Molecule.cHelperParities);const q=partialCharges(m);assert.equal(q.length,reference.atoms.length);q.forEach((value,i)=>assert(Math.abs(value-reference.atoms[i].charge)<1e-10,reference.smiles+' atom '+i));}
assert.equal(potentialAt([BOHR,0,0],[{p:[0,0,0]}],[1]),1);assert.equal(potentialAt([BOHR,0,0],[{p:[0,0,0]}],[-1]),-1);
const resources=fs.readFileSync('docs/vendor/openchemlib/resources.json','utf8');
for(const el of ['F','Cl','Br','I']){const g={atoms:[{id:'c',element:'C',charge:0,x:0,y:0},{id:'x',element:el,charge:0,x:110,y:0}],bonds:[{a:'c',b:'x',order:1}]};const d=await calculateBrowserEpm(g,()=>{},resources),mesh=d.meshes.estimate;assert.equal(d.atoms.length,5);assert.equal(d.bonds.length,4);assert(d.estimated);assert(mesh.potentialMin<0&&mesh.potentialMax>0);assert(mesh.vertices.every(Number.isFinite));assert(mesh.potential.every(Number.isFinite));assert(mesh.faces.every(i=>Number.isInteger(i)&&i>=0&&i<mesh.vertices.length/3));assert(Math.abs(d.charges.reduce((a,b)=>a+b,0))<1e-10);console.log(el+': local conformer, charges and signed potential surface passed');}
console.log(fixtures.length+' charge fixtures match RDKit to 1e-10; Coulomb units/sign verified.');
