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
export function skeletalLabels(atoms,bonds,showH=false){
 const h=atoms.map(()=>0);for(const [i,j] of bonds){if(atoms[i].el!=='H'&&atoms[j].el==='H')h[i]++;if(atoms[j].el!=='H'&&atoms[i].el==='H')h[j]++;}
 return atoms.map((a,i)=>a.el==='C'?'':showH?a.el:a.el+(h[i]?'H'+(h[i]>1?String(h[i]).replace(/\d/g,d=>'₀₁₂₃₄₅₆₇₈₉'[d]):''):''));
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
export function renderBondLine(ctx,atoms,bonds,project,scale,showH=false,options={}){
 const orders=displayBondOrders(atoms,bonds),rings=bondRings(bonds),visible=showH?atoms.map(()=>true):skeletalAtoms(atoms,bonds),labels=skeletalLabels(atoms,bonds,showH),points=atoms.map(a=>project(a.p)),font=Math.max(12,scale*.28)*(options.labelScale||1),width=Math.max(1.5,scale*.033),spacing=Math.max(width*2.5,scale*.13);
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=options.ink||'#182738';ctx.fillStyle=options.ink||'#182738';ctx.lineWidth=width;ctx.font=(options.labelWeight?options.labelWeight+' ':'')+font+'px Arial';ctx.textAlign='left';ctx.textBaseline='alphabetic';
 const labelGeometry=labels.map((text,i)=>text?atomLabelGeometry(ctx.measureText(atoms[i].el),ctx.measureText(text),font):null),padding=font*.1+width/2;
 if(!options.labelsOnly)for(const [edge,[i,j]] of bonds.entries()){if(!visible[i]||!visible[j])continue;const order=orders[edge],a=points[i],b=points[j],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len<.01)continue;const ux=dx/len,uy=dy/len;
  const stereo=bonds[edge][3];if(stereo&&order===1){const reverse=bonds[edge][4]===1,start=reverse?b:a,end=reverse?a:b,vx=(end[0]-start[0])/len,vy=(end[1]-start[1])/len,ga=labelBondGap(labelGeometry[reverse?j:i],0,0,vx,vy,padding),gb=labelBondGap(labelGeometry[reverse?i:j],0,0,-vx,-vy,padding),sx=start[0]+vx*ga,sy=start[1]+vy*ga,ex=end[0]-vx*gb,ey=end[1]-vy*gb,half=spacing*.65;
   if(stereo==='wedge'){ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex-vy*half,ey+vx*half);ctx.lineTo(ex+vy*half,ey-vx*half);ctx.closePath();ctx.fill();}else for(let k=1;k<=7;k++){const t=k/7,x=sx+(ex-sx)*t,y=sy+(ey-sy)*t;ctx.beginPath();ctx.moveTo(x-vy*half*t,y+vx*half*t);ctx.lineTo(x+vy*half*t,y-vx*half*t);ctx.stroke();}continue;}
  const n=Math.max(1,Math.min(3,Math.round(order))),ring=rings[edge];let inward=0;
  if(ring&&n===2){const centre=ring.reduce((v,k)=>[v[0]+points[k][0]/ring.length,v[1]+points[k][1]/ring.length],[0,0]);inward=Math.sign(-uy*(centre[0]-(a[0]+b[0])/2)+ux*(centre[1]-(a[1]+b[1])/2))||1;}
  for(let line=0;line<n;line++){const inner=ring&&n===2&&line===1,offset=ring&&n===2?line*spacing*inward:(line-(n-1)/2)*spacing,trim=inner?Math.max(spacing*.8,len*.14):0,ga=labelBondGap(labelGeometry[i],-uy*offset,ux*offset,ux,uy,padding),gb=labelBondGap(labelGeometry[j],-uy*offset,ux*offset,-ux,-uy,padding),ax=a[0]+ux*(ga+trim)-uy*offset,ay=a[1]+uy*(ga+trim)+ux*offset,bx=b[0]-ux*(gb+trim)-uy*offset,by=b[1]-uy*(gb+trim)+ux*offset;
   if(ga+gb+trim*2>=len)continue;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
  }
 }
 if(options.bondsOnly){ctx.restore();return;}
 ctx.setLineDash([]);ctx.fillStyle=options.labelInk||'#182738';
 const text=(value,x,y)=>{if(options.halo){ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(1.5,font*.12);ctx.strokeText(value,x,y);}ctx.fillText(value,x,y);};
 atoms.forEach((atom,i)=>{if(!visible[i]||!labels[i])return;const p=points[i];text(labels[i],p[0]+labelGeometry[i].x,p[1]+labelGeometry[i].y);});
 // Lone pairs occupy the least crowded angular sectors; charge uses a separate sector.
 const valence={H:1,B:3,C:4,N:5,O:6,F:7,Si:4,P:5,S:6,Cl:7,Br:7,I:7};
 atoms.forEach((a,i)=>{if(!visible[i])return;const p=points[i],neighbours=bonds.filter(b=>b[0]===i||b[1]===i).map(b=>b[b[0]===i?1:0]),bo=bonds.reduce((s,b)=>s+(b[0]===i||b[1]===i?b[2]:0),0),pairs=(valence[a.el]-(a.charge||0)-bo)/2;
 const occupied=neighbours.map(j=>Math.atan2(points[j][1]-p[1],points[j][0]-p[0]));if(labels[i])occupied.push(0);
 const delta=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
 const choose=()=>{let best=0,score=-1;for(let j=0;j<24;j++){const t=-Math.PI/2+j*Math.PI/12,v=occupied.length?Math.min(...occupied.map(o=>delta(t,o))):Math.PI;if(v>score){score=v;best=t;}}occupied.push(best);return best;};
 ctx.fillStyle=options.labelInk||'#182738';if(Number.isInteger(pairs)&&pairs>0&&pairs<=4)for(let k=0;k<pairs;k++){const t=choose(),r=font*.95,x=p[0]+Math.cos(t)*r,y=p[1]+Math.sin(t)*r;for(const sign of [-1,1]){ctx.beginPath();ctx.arc(x-Math.sin(t)*font*.13*sign,y+Math.cos(t)*font*.13*sign,Math.max(1,font*.065),0,Math.PI*2);if(options.halo){ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(1,font*.09);ctx.stroke();}ctx.fill();}}
 if(a.charge){const t=choose(),r=font*1.4,x=p[0]+Math.cos(t)*r,y=p[1]+Math.sin(t)*r;ctx.save();ctx.font='bold '+font*.75+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';text((Math.abs(a.charge)>1?Math.abs(a.charge):'')+(a.charge>0?'+':'−'),x,y);ctx.restore();}
 });ctx.restore();
}
export function representationPanes(mode,width,height){return mode==='comparison'?[{x:0,width:Math.floor(width/2),height,type:'bondline'},{x:Math.floor(width/2),width:width-Math.floor(width/2),height,type:'ballstick'}]:[{x:0,width,height,type:mode}];}
