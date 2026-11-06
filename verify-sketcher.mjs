// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden. See LICENSE for terms.
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const env={};vm.createContext(env);vm.runInContext(fs.readFileSync('docs/orgo-sketcher.js','utf8'),env);const chem=env.ProductChem;
const app=fs.readFileSync('docs/app.js','utf8'),a=app.indexOf('function exampleGraph('),b=app.indexOf('function setDraft(',a);const exampleGraph=new Function(app.slice(a,b)+';return exampleGraph')();
for(const d of JSON.parse(fs.readFileSync('docs/data/catalog.json'))){const graph=exampleGraph(d);assert.equal(chem.validation(graph),'',d.name);const normalized=chem.normalized(graph);assert(chem.isomorphic(normalized,chem.normalized(exampleGraph(d))));const expectedH=d.atoms.filter(a=>a.el==='H').length,actualH=normalized.atoms.reduce((n,a)=>n+a.h+(a.element==='H'?1:0),0);assert.equal(actualH,expectedH,d.name+' implicit hydrogen count');const charged=JSON.parse(JSON.stringify(graph));charged.atoms[0].charge=1;assert(!chem.isomorphic(normalized,chem.normalized(charged)));console.log(d.name+': valid graph, correct implicit hydrogens, charge-sensitive matching');}
const html=fs.readFileSync('docs/index.html','utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);console.log('Sketcher DOM IDs unique');

// Editable methanol must keep its carbon endpoint, rather than hiding it as Me.
const displayStart=app.indexOf('// Keep every drawn atom editable'),displayEnd=app.indexOf('class PotentialSketcher',displayStart);
vm.runInContext(app.slice(displayStart,displayEnd),env);
const methanol={atoms:[{id:'c',element:'C',charge:0,x:0,y:0},{id:'o',element:'O',charge:0,x:110,y:0}],bonds:[{a:'c',b:'o',order:1}]};
const displayed=chem.display(methanol);assert.equal(displayed.atoms.filter(a=>!a.hidden).length,2);assert(displayed.atoms.every(a=>!a.condensedMe));assert.equal(chem.validation(methanol),'');console.log('Methanol carbon remains visible and editable');

// A late example response must not replace edits made while it was loading.
let release;const exampleReady=new Promise(resolve=>release=resolve),calls={draft:0,display:0};
const race={getExample:()=>exampleReady,ensureSurface:async()=>{},showData:()=>calls.display++,setDraft:()=>calls.draft++,$:()=>({value:'0.001'}),setMapBusy:()=>{},setMapAvailable:()=>{},say:()=>{}};
vm.createContext(race);const loadStart=app.indexOf('async function loadExample('),loadEnd=app.indexOf('function description()',loadStart);
vm.runInContext('let loadNumber=0,drawingRevision=0;'+app.slice(loadStart,loadEnd),race);
const pending=vm.runInContext('loadExample("formaldehyde")',race);vm.runInContext('drawingRevision++',race);release({});await pending;assert.equal(calls.draft,0);assert.equal(calls.display,1);
await vm.runInContext('loadExample("formaldehyde")',race);assert.equal(calls.draft,1);console.log('Late example load preserves in-progress drawing; unedited loads still populate the editor');

// Extra element tools retain chemically sensible implicit H and reject excess bonds.
for(const [element,order,h] of [['F',1,0],['Cl',1,0],['Br',1,0],['I',1,0],['B',1,2],['Si',1,3],['P',1,2],['S',1,1]]){
 const g={atoms:[{id:'a',element,charge:0,x:0,y:0},{id:'c',element:'C',charge:0,x:110,y:0}],bonds:[{a:'a',b:'c',order}]};
 assert.equal(chem.validation(g),'',element);assert.equal(chem.normalized(g).atoms[0].h,h,element);assert(chem.display(g).atoms.every(a=>Number.isFinite(a.h)&&Number.isFinite(a.lp)),element);
 if(['F','Cl','Br','I'].includes(element)){g.bonds[0].order=2;assert.match(chem.validation(g),/valence/);}
}
console.log('Halogens, B, Si, P and S: validation, implicit hydrogens and display checked');
