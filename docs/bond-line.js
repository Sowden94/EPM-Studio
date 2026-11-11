import {Molecule} from './vendor/openchemlib/openchemlib.js';
import {graphMolfile} from './browser-epm.js';
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden.
// Skeletal projection of the conformer underlying the EPM. Carbon/H are implicit.
export function skeletalAtoms(atoms,bonds){
 const implicitH=new Set();for(const [i,j] of bonds){if(atoms[i].el!=='H'&&atoms[j].el==='H')implicitH.add(j);if(atoms[j].el!=='H'&&atoms[i].el==='H')implicitH.add(i);}
 return atoms.map((_,i)=>!implicitH.has(i));
}
export function skeletalLabel(el){return el!=='C';}
export function skeletalLabels(atoms,bonds){
 const h=atoms.map(()=>0);for(const [i,j] of bonds){if(atoms[i].el!=='H'&&atoms[j].el==='H')h[i]++;if(atoms[j].el!=='H'&&atoms[i].el==='H')h[j]++;}
 return atoms.map((a,i)=>a.el==='C'?'':a.el+(h[i]?'H'+(h[i]>1?String(h[i]).replace(/\d/g,d=>'₀₁₂₃₄₅₆₇₈₉'[d]):''):''));
}
const orderCache=new WeakMap();
export function displayBondOrders(atoms,bonds){
 if(orderCache.has(bonds))return orderCache.get(bonds);
 const result=bonds.map(b=>b[2]);
 if(result.includes(1.5)){
  const graph={atoms:atoms.map((a,i)=>({id:i,element:a.el,x:a.p[0]*73.333333,y:-a.p[1]*73.333333,charge:a.charge||0})),bonds:bonds.map(([a,b,order])=>({a,b,order:order===1.5?4:order}))};
  const mol=Molecule.fromMolfile(graphMolfile(graph));for(let i=0;i<mol.getAllAtoms();i++)mol.setAtomMapNo(i,i+1,false);mol.normalizeAmbiguousBonds();mol.ensureHelperArrays(Molecule.cHelperRings);
  const resolved=new Map();for(let i=0;i<mol.getAllBonds();i++){const a=mol.getAtomMapNo(mol.getBondAtom(0,i))-1,b=mol.getAtomMapNo(mol.getBondAtom(1,i))-1;resolved.set([Math.min(a,b),Math.max(a,b)].join(','),mol.getBondOrder(i));}
  bonds.forEach(([a,b,o],i)=>{if(o===1.5)result[i]=resolved.get([Math.min(a,b),Math.max(a,b)].join(','))||1;});
 }
 orderCache.set(bonds,result);return result;
}
const ringCache=new WeakMap();
function bondRings(bonds){
 if(ringCache.has(bonds))return ringCache.get(bonds);
 const adj=new Map();bonds.forEach(([a,b],i)=>{if(!adj.has(a))adj.set(a,[]);if(!adj.has(b))adj.set(b,[]);adj.get(a).push([b,i]);adj.get(b).push([a,i]);});
 const rings=bonds.map(([a,b],edge)=>{const queue=[a],previous=new Map([[a,null]]);for(let q=0;q<queue.length;q++){const atom=queue[q];if(atom===b)break;for(const [next,idx] of adj.get(atom)||[]){if(idx===edge||previous.has(next))continue;previous.set(next,atom);queue.push(next);}}if(!previous.has(b))return null;const path=[];for(let atom=b;atom!==null;atom=previous.get(atom))path.push(atom);return path.length>=3?path:null;});
 ringCache.set(bonds,rings);return rings;
}
export function bondLineSegments(atoms,bonds,visible){
 const segments=[],orders=displayBondOrders(atoms,bonds);
 for(const [edge,[i,j]] of bonds.entries()){const order=orders[edge];if(!visible[i]||!visible[j])continue;const a=atoms[i].p,b=atoms[j].p,dir=b.map((v,k)=>v-a[k]);let perp=[-dir[1],dir[0],0],n=Math.hypot(...perp);if(n<1e-8){perp=[1,0,0];n=1;}perp=perp.map(v=>v/n*.16);
  const count=order===1.5?2:Math.max(1,Math.min(3,Math.round(order)));
  for(let line=0;line<count;line++){const offset=line-(count-1)/2,start=a.map((v,k)=>v+perp[k]*offset),end=b.map((v,k)=>v+perp[k]*offset);
   if(order===1.5&&line===1){for(let q=0;q<4;q++){const t=.1+q*.22,u=t+.12;segments.push({a:start.map((v,k)=>v+(end[k]-v)*t),b:start.map((v,k)=>v+(end[k]-v)*u)});}}
   else segments.push({a:start,b:end});
  }
 }
 return segments;
}
// Anchor the visible ink of the element itself, rather than the font's em box
// or the centre of a longer OH/NH2 label. All distances are display pixels.
export function atomLabelGeometry(elementMetrics,textMetrics,font){
 const left=Number.isFinite(elementMetrics.actualBoundingBoxLeft)?-elementMetrics.actualBoundingBoxLeft:0;
 const right=Number.isFinite(elementMetrics.actualBoundingBoxRight)?elementMetrics.actualBoundingBoxRight:elementMetrics.width;
 const ascent=Number.isFinite(elementMetrics.actualBoundingBoxAscent)?elementMetrics.actualBoundingBoxAscent:font*.75;
 const descent=Number.isFinite(elementMetrics.actualBoundingBoxDescent)?elementMetrics.actualBoundingBoxDescent:font*.15;
 const x=-(left+right)/2,y=(ascent-descent)/2;
 return {x,y,left:x-(textMetrics.actualBoundingBoxLeft||0),right:x+(Number.isFinite(textMetrics.actualBoundingBoxRight)?textMetrics.actualBoundingBoxRight:textMetrics.width),top:y-(Number.isFinite(textMetrics.actualBoundingBoxAscent)?textMetrics.actualBoundingBoxAscent:ascent),bottom:y+(Number.isFinite(textMetrics.actualBoundingBoxDescent)?textMetrics.actualBoundingBoxDescent:descent)};
}
export function labelBondGap(label,ox,oy,ux,uy,padding){
 if(!label)return 0;let near=-Infinity,far=Infinity;
 for(const [low,high,start,direction] of [[label.left-padding,label.right+padding,ox,ux],[label.top-padding,label.bottom+padding,oy,uy]]){
  if(Math.abs(direction)<1e-10){if(start<low||start>high)return 0;continue;}
  const a=(low-start)/direction,b=(high-start)/direction;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
 }
 return far>=Math.max(0,near)?Math.max(0,far):0;
}
export function renderBondLine(ctx,atoms,bonds,project,scale){
 const orders=displayBondOrders(atoms,bonds),rings=bondRings(bonds),visible=skeletalAtoms(atoms,bonds),labels=skeletalLabels(atoms,bonds),points=atoms.map(a=>project(a.p)),font=Math.max(12,scale*.28),width=Math.max(1.5,scale*.033),spacing=Math.max(width*2.5,scale*.13);
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#182738';ctx.lineWidth=width;ctx.font=font+'px Arial';ctx.textAlign='left';ctx.textBaseline='alphabetic';
 const labelGeometry=labels.map((text,i)=>text?atomLabelGeometry(ctx.measureText(atoms[i].el),ctx.measureText(text),font):null),padding=font*.1+width/2;
 for(const [edge,[i,j]] of bonds.entries()){if(!visible[i]||!visible[j])continue;const order=orders[edge],a=points[i],b=points[j],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len<.01)continue;const ux=dx/len,uy=dy/len;
  const n=Math.max(1,Math.min(3,Math.round(order))),ring=rings[edge];let inward=0;
  if(ring&&n===2){const centre=ring.reduce((v,k)=>[v[0]+points[k][0]/ring.length,v[1]+points[k][1]/ring.length],[0,0]);inward=Math.sign(-uy*(centre[0]-(a[0]+b[0])/2)+ux*(centre[1]-(a[1]+b[1])/2))||1;}
  for(let line=0;line<n;line++){const inner=ring&&n===2&&line===1,offset=ring&&n===2?line*spacing*inward:(line-(n-1)/2)*spacing,trim=inner?Math.max(spacing*.8,len*.14):0,ga=labelBondGap(labelGeometry[i],-uy*offset,ux*offset,ux,uy,padding),gb=labelBondGap(labelGeometry[j],-uy*offset,ux*offset,-ux,-uy,padding),ax=a[0]+ux*(ga+trim)-uy*offset,ay=a[1]+uy*(ga+trim)+ux*offset,bx=b[0]-ux*(gb+trim)-uy*offset,by=b[1]-uy*(gb+trim)+ux*offset;
   if(ga+gb+trim*2>=len)continue;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
  }
 }
 ctx.setLineDash([]);ctx.fillStyle='#182738';
 atoms.forEach((atom,i)=>{if(!visible[i]||!labels[i])return;const p=points[i];ctx.fillText(labels[i],p[0]+labelGeometry[i].x,p[1]+labelGeometry[i].y);});ctx.restore();
}
export function representationPanes(mode,width,height){return mode==='comparison'?[{x:0,width:Math.floor(width/2),height,type:'bondline'},{x:Math.floor(width/2),width:width-Math.floor(width/2),height,type:'ballstick'}]:[{x:0,width,height,type:mode}];}
