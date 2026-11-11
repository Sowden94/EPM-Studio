// Gasteiger–Marsili charge equalisation adapted from RDKit's BSD implementation.
// Copyright (C) 2003-2011 Greg Landrum and Rational Discovery LLC.
// See vendor/RDKit-LICENSE.txt and browser-methods.html for sources and limitations.
export const BOHR=0.529177210903;
const params={H:{'*':[7.17,6.24,-.56]},C:{sp3:[7.98,9.18,1.88],sp2:[8.79,9.32,1.51],sp:[10.39,9.45,.73]},N:{sp3:[11.54,10.82,1.36],sp2:[12.87,11.15,.85],sp:[15.68,11.7,-.27]},O:{sp3:[14.18,12.92,1.39],sp2:[17.07,13.79,.47]},F:{sp3:[14.66,13.85,2.31]},Cl:{sp3:[11,9.69,1.35]},Br:{sp3:[10.08,8.47,1.16]},I:{sp3:[9.9,7.96,.96]},S:{sp3:[10.14,9.13,1.38],sp2:[10.88,9.49,1.33]},P:{sp3:[8.9,8.24,.96],sp2:[9.665,8.530,.735]},Si:{sp3:[7.3,6.567,.657],sp2:[7.905,6.748,.443],sp:[9.065,7.027,-.002]},B:{sp3:[5.98,6.82,1.605],sp2:[6.42,6.807,1.322]}};
export function chargeTypes(mol){
 const n=mol.getAllAtoms(),types=[];
 for(let i=0;i<n;i++){
  const el=mol.getAtomLabel(i),pi=mol.getAtomPi(i)||0,degree=mol.getAllConnAtoms(i),valence=Array.from({length:degree},(_,j)=>mol.getConnBondOrder(i,j)).reduce((a,b)=>a+b,0);
  let type=el==='H'?'*':pi>=2?'sp':pi||mol.isAromaticAtom(i)?'sp2':'sp3';
  if(el==='N'&&type!=='sp'&&mol.isFlatNitrogen(i))type='sp2';
  if(['O','N'].includes(el)&&type==='sp3'&&mol.getAtomCharge(i)<=0&&Array.from({length:degree},(_,j)=>mol.getConnAtom(i,j)).some(j=>(mol.getAtomPi(j)||0)>0||mol.isAromaticAtom(j)))type='sp2';
  if(el==='S'&&valence>3)type='sp3';
  if(el==='B'&&degree===3&&mol.getAtomCharge(i)===0)type='sp2';
  if(['F','Cl','Br','I'].includes(el))type='sp3';
  if(!params[el]?.[type])throw Error('The browser charge model has no validated parameters for '+el+' ('+type+').');types.push(type);
 }
 return types;
}
export function partialCharges(mol){
 mol.ensureHelperArrays(mol.constructor.cHelperRings);const n=mol.getAllAtoms(),types=chargeTypes(mol),q=Array(n).fill(0),sets=types.map((type,i)=>params[mol.getAtomLabel(i)][type]),ion=sets.map((p,i)=>mol.getAtomLabel(i)==='H'?20.02:p.reduce((a,b)=>a+b,0));
 const conjugated=(a,b)=>['sp','sp2'].includes(types[a])&&['sp','sp2'].includes(types[b]);
 for(let i=0;i<n;i++){
  let formal=mol.getAtomCharge(i);if(!formal||Math.abs(q[i])>1e-12)continue;const ids=new Set([i]);
  for(let j=0;j<mol.getAllConnAtoms(i);j++){const mid=mol.getConnAtom(i,j);if(!conjugated(i,mid))continue;for(let k=0;k<mol.getAllConnAtoms(mid);k++){const end=mol.getConnAtom(mid,k);if(end!==i&&mol.getAtomLabel(end)===mol.getAtomLabel(i)&&conjugated(mid,end)&&!ids.has(end)){ids.add(end);formal+=mol.getAtomCharge(end);}}}
  for(const id of ids)q[id]=formal/ids.size;
 }
 let damping=.5;
 for(let iteration=0;iteration<12;iteration++){
  const electronegativity=q.map((charge,i)=>sets[i][0]+charge*(sets[i][1]+sets[i][2]*charge)),next=q.slice();
  for(let i=0;i<n;i++)for(let j=0;j<mol.getAllConnAtoms(i);j++){const other=mol.getConnAtom(i,j),delta=electronegativity[other]-electronegativity[i];next[i]+=damping*delta/(delta>=0?ion[i]:ion[other]);}
  q.splice(0,n,...next);damping*=.5;
 }
 const formal=Array.from({length:n},(_,i)=>mol.getAtomCharge(i)).reduce((a,b)=>a+b,0);
 if(q.some(x=>!Number.isFinite(x)||Math.abs(x)>3)||Math.abs(q.reduce((a,b)=>a+b,0)-formal)>1e-7)throw Error('The browser charge calculation failed its charge-conservation check.');
 return q;
}
export function graphKey(g){return JSON.stringify({atoms:g.atoms.map(a=>[a.id,a.element,a.charge||0]),bonds:g.bonds.map(b=>[b.a,b.b,b.order,b.stereo||'',b.stereoFrom||''])});}
export function graphMolfile(g){
 const pad=(x,n)=>String(x).padStart(n);const lines=['Browser potential','  EPMstudio  2D','',pad(g.atoms.length,3)+pad(g.bonds.length,3)+'  0  0  0  0            999 V2000'];
 for(const a of g.atoms)lines.push(pad((a.x/73.333333).toFixed(4),10)+pad((-a.y/73.333333).toFixed(4),10)+pad('0.0000',10)+' '+a.element.padEnd(3)+' 0  0  0  0  0  0  0  0  0  0  0  0');
 for(const b of g.bonds){const reverse=b.stereoFrom===b.b;lines.push(pad(g.atoms.findIndex(a=>a.id===(reverse?b.b:b.a))+1,3)+pad(g.atoms.findIndex(a=>a.id===(reverse?b.a:b.b))+1,3)+pad(b.order,3)+pad(b.stereo==='wedge'?1:b.stereo==='hash'?6:0,3)+'  0  0  0');}
 const charged=g.atoms.map((a,i)=>[i+1,a.charge||0]).filter(([,q])=>q);for(let k=0;k<charged.length;k+=8){const group=charged.slice(k,k+8);lines.push('M  CHG'+pad(group.length,3)+group.map(([i,q])=>pad(i,4)+pad(q,4)).join(''));}lines.push('M  END');return lines.join('\n');
}
export function potentialAt(point,atoms,charges){let sum=0;for(let i=0;i<atoms.length;i++){const p=atoms[i].p,dx=p[0]-point[0],dy=p[1]-point[1],dz=p[2]-point[2];sum+=charges[i]*BOHR/Math.sqrt(dx*dx+dy*dy+dz*dz);}return sum;}
// Bondi radii (A), with the B radius from Mantina et al. (2009), used only for the display surface.
const radii={H:1.2,B:1.92,C:1.7,N:1.55,O:1.52,F:1.47,Si:2.1,P:1.8,S:1.8,Cl:1.75,Br:1.85,I:1.98};
export function surfaceMesh(atoms,charges){
 const lower=[0,1,2].map(k=>Math.min(...atoms.map(a=>a.p[k]-radii[a.el]))-.65),upper=[0,1,2].map(k=>Math.max(...atoms.map(a=>a.p[k]+radii[a.el]))+.65),span=upper.map((v,k)=>v-lower[k]);
 // Keep the spatial detail for long molecules; budget all grid points, not just the longest axis.
 let step=Math.max(.26,Math.cbrt(span[0]*span[1]*span[2]/220000)),dims=span.map(v=>Math.ceil(v/step)+1);
 while(dims.reduce((n,d)=>n*d,1)>250000){step*=1.02;dims=span.map(v=>Math.ceil(v/step)+1);}
 const [nx,ny,nz]=dims,values=new Float32Array(nx*ny*nz),surfaceAtoms=atoms.map(a=>[...a.p,radii[a.el]]);
 for(let x=0;x<nx;x++)for(let y=0;y<ny;y++)for(let z=0;z<nz;z++){
  const px=lower[0]+x*step,py=lower[1]+y*step,pz=lower[2]+z*step;let distance=Infinity;
  for(const a of surfaceAtoms){const dx=a[0]-px,dy=a[1]-py,dz=a[2]-pz,d=Math.sqrt(dx*dx+dy*dy+dz*dz)-a[3],h=Math.max(.35-Math.abs(distance-d),0)/.35;distance=Math.min(distance,d)-h*h*.35/4;}
  values[(x*ny+y)*nz+z]=distance;
 }
 const offsets=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]],edges=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],vertices=[],faces=[],potential=[];
 for(let x=0;x<nx-1;x++)for(let y=0;y<ny-1;y++)for(let z=0;z<nz-1;z++){
  const v=offsets.map(([a,b,c])=>values[((x+a)*ny+y+b)*nz+z+c]);if(Math.min(...v)>0||Math.max(...v)<0)continue;
  const pts=offsets.map(([a,b,c])=>[lower[0]+(x+a)*step,lower[1]+(y+b)*step,lower[2]+(z+c)*step]);
  for(const tet of tets){const cut=[];for(const [a,b] of edges){const i=tet[a],j=tet[b];if((v[i]>=0)!==(v[j]>=0)){const f=-v[i]/(v[j]-v[i]);cut.push(pts[i].map((p,k)=>p+f*(pts[j][k]-p)));}}
   if(cut.length===3||cut.length===4){const idx=vertices.length/3;for(const p of cut){vertices.push(...p);potential.push(potentialAt(p,atoms,charges));}faces.push(idx,idx+1,idx+2);if(cut.length===4)faces.push(idx+1,idx+3,idx+2);}
  }
 }
 if(!vertices.length||potential.some(v=>!Number.isFinite(v)))throw Error('The browser could not construct a finite potential surface.');
 return{vertices,faces,potential,potentialMin:potential.reduce((a,b)=>Math.min(a,b),Infinity),potentialMax:potential.reduce((a,b)=>Math.max(a,b),-Infinity)};
}
