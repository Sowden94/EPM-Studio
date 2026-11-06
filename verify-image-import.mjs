// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden. See LICENSE for terms.
import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
import {graphFromMol} from './docs/mol-import.js';
import {POST} from './server/recognize.js';
const mol=fs.readFileSync('test-fixtures/acetic-acid.mol','utf8'),graph=graphFromMol(mol),ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('docs/orgo-sketcher.js','utf8'),ctx);
assert.equal(graph.atoms.length,4);assert.equal(graph.bonds.length,3);assert.equal(ctx.ProductChem.validation(graph),'');assert.equal(ctx.ProductChem.normalized(graph).atoms.reduce((n,a)=>n+a.h,0),4);
assert.throws(()=>graphFromMol('invalid'));
assert.throws(()=>graphFromMol(mol.replace(' O   0',' Fe  0')),/not supported/);
const bondLines=mol.split('\n');bondLines[8]='  1  2  4  0';assert.throws(()=>graphFromMol(bondLines.join('\n')),/bond/);
assert.equal((await POST(new Request('https://test.example/api/recognize',{method:'POST'}))).status,403);
const invalid=new FormData();invalid.append('image',new File(['wrong'],'structure.txt',{type:'text/plain'}));
assert.equal((await POST(new Request('https://test.example/api/recognize',{method:'POST',headers:{Origin:'https://test.example'},body:invalid}))).status,400);
const originalFetch=globalThis.fetch;try{
 let calls=0;globalThis.fetch=async()=>new Response(JSON.stringify(++calls===1?{smiles:['CC(=O)O']}:{molblock:mol}),{headers:{'Content-Type':'application/json'}});
 const form=new FormData();form.append('image',new File(['fixture'],'image.png',{type:'image/png'}));const result=await POST(new Request('https://test.example/api/recognize',{method:'POST',headers:{Origin:'https://test.example'},body:form}));assert.equal(result.status,200);assert.equal((await result.json()).molblock,mol);assert.equal(calls,2);
 globalThis.fetch=async()=>new Response(JSON.stringify({smiles:['CC','O']}));const multiple=new FormData();multiple.append('image',new File(['fixture'],'image.png',{type:'image/png'}));assert.equal((await POST(new Request('https://test.example/api/recognize',{method:'POST',headers:{Origin:'https://test.example'},body:multiple}))).status,422);
}finally{globalThis.fetch=originalFetch}
console.log('Image import: acid graph, unsupported features, same-origin requirement, file validation, success and multiple-structure rejection checked.');
