import {explicitHydrogenGraph} from './explicit-hydrogens.js';
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden.
import {Molecule} from './vendor/openchemlib/openchemlib.js';
import {graphMolfile,partialCharges,BOHR} from './browser-epm.js';
export function planarModel(graph){
 graph=explicitHydrogenGraph(graph);
 const mol=Molecule.fromMolfile(graphMolfile(graph));mol.ensureHelperArrays(Molecule.cHelperNeighbours);mol.addImplicitHydrogens();mol.ensureHelperArrays(Molecule.cHelperRings);
 const charges=partialCharges(mol),atoms=Array.from({length:mol.getAllAtoms()},(_,i)=>({el:mol.getAtomLabel(i),charge:mol.getAtomCharge(i),p:[mol.getAtomX(i),-mol.getAtomY(i),0]}));
 const bonds=Array.from({length:mol.getAllBonds()},(_,i)=>{const a=mol.getBondAtom(0,i),b=mol.getBondAtom(1,i),source=graph.bonds.find(edge=>{const x=graph.atoms.findIndex(n=>n.id===edge.a),y=graph.atoms.findIndex(n=>n.id===edge.b);return x===a&&y===b||x===b&&y===a;});return [a,b,mol.getBondOrder(i),source?.stereo||'',source?.stereoFrom===graph.atoms[b]?.id?1:0];});
 const cx=(Math.min(...atoms.map(a=>a.p[0]))+Math.max(...atoms.map(a=>a.p[0])))/2,cy=(Math.min(...atoms.map(a=>a.p[1]))+Math.max(...atoms.map(a=>a.p[1])))/2;atoms.forEach(a=>{a.p[0]-=cx;a.p[1]-=cy;});
 return {atoms,bonds,charges,radius:Math.max(2,...atoms.map(a=>Math.hypot(...a.p)+2.2))};
}
const radii={H:1.2,B:1.92,C:1.7,N:1.55,O:1.52,F:1.47,Si:2.1,P:1.8,S:1.8,Cl:1.75,Br:1.85,I:1.98};
// Front orthographic projection of the point-charge potential on the envelope
// of the planar drawing. Explicitly separate from a quantum conformer's map.
export function projectionPixels(model,size,colour){
 const span=model.radius*2.24,pixels=new Uint8ClampedArray(size*size*4),r=model.atoms.map(a=>radii[a.el]||1.7);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const px=((x+.5)/size-.5)*span,py=(.5-(y+.5)/size)*span;let z2=-Infinity;
  for(let i=0;i<model.atoms.length;i++){const p=model.atoms[i].p;z2=Math.max(z2,r[i]*r[i]-(px-p[0])**2-(py-p[1])**2);}
  if(z2<0)continue;let v=0;
  for(let i=0;i<model.atoms.length;i++){const p=model.atoms[i].p;v+=model.charges[i]*BOHR/Math.sqrt((px-p[0])**2+(py-p[1])**2+z2);}
  const rgb=colour(v),k=(y*size+x)*4;pixels[k]=Math.round(rgb[0]*255);pixels[k+1]=Math.round(rgb[1]*255);pixels[k+2]=Math.round(rgb[2]*255);pixels[k+3]=255;
 }
 return pixels;
}
// Cache a bounded sampling pass separately from coloured image pixels.
const rangeCache=new WeakMap();
export function projectionRange(model){
 if(rangeCache.has(model))return rangeCache.get(model);
 let min=Infinity,max=-Infinity;
 projectionPixels(model,128,value=>{min=Math.min(min,value);max=Math.max(max,value);return [0,0,0];});
 const range={min,max};rangeCache.set(model,range);return range;
}
