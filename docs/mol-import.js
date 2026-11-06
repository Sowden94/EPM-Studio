// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden. See LICENSE for terms.
// Strict V2000 import: reject unsupported features instead of silently discarding them.
export function graphFromMol(mol){
 const lines=mol.replace(/\r/g,'').split('\n'),counts=lines.findIndex(line=>line.includes('V2000'));
 if(counts<0)throw Error('This drawing is not a supported MOL V2000 structure.');
 const n=Number(lines[counts].slice(0,3)),m=Number(lines[counts].slice(3,6));
 if(!Number.isInteger(n)||n<1||n>200||!Number.isInteger(m)||m<0||m>300)throw Error('Use an image containing one molecule with at most 200 atoms.');
 const supported=['H','B','C','N','O','F','Si','P','S','Cl','Br','I'],atoms=[],bonds=[],charges={0:0,1:3,2:2,3:1,5:-1,6:-2,7:-3};
 for(let i=0;i<n;i++){
  const line=lines[counts+1+i]||'',element=line.slice(31,34).trim(),x=Number(line.slice(0,10)),y=-Number(line.slice(10,20)),mass=Number(line.slice(34,36)),code=Number(line.slice(36,39));
  if(!supported.includes(element))throw Error('The recognised element '+element+' is not supported by the current editor.');
  if(!Number.isFinite(x)||!Number.isFinite(y)||mass||!(code in charges)||Number(line.slice(39,42))||Number(line.slice(42,45)))throw Error('This result contains an isotope, radical or atom feature the editor cannot preserve.');
  atoms.push({id:'image'+i,element,x,y,charge:charges[code]});
 }
 for(let i=0;i<m;i++){
  const line=lines[counts+1+n+i]||'',a=Number(line.slice(0,3))-1,b=Number(line.slice(3,6))-1,order=Number(line.slice(6,9)),stereo=Number(line.slice(9,12));
  if(!atoms[a]||!atoms[b]||a===b||![1,2,3].includes(order)||![0,1,6].includes(stereo)||stereo&&order!==1)throw Error('The result has a bond or stereochemical feature the editor cannot preserve.');
  bonds.push({a:atoms[a].id,b:atoms[b].id,order,...(stereo?{stereo:stereo===1?'wedge':'hash',stereoFrom:atoms[a].id}:{})});
 }
 for(const line of lines.slice(counts+1+n+m)){
  if(line.startsWith('M  CHG')){const parts=line.slice(6).trim().split(/\s+/).map(Number);for(let i=0;i<parts[0];i++){const atom=atoms[parts[1+i*2]-1],charge=parts[2+i*2];if(!atom||!Number.isInteger(charge))throw Error('Invalid charge in recognised drawing.');atom.charge=charge;}}
  else if(line.startsWith('M  ')&&!line.startsWith('M  END'))throw Error('The result contains an unsupported MOL property.');
 }
 const lengths=bonds.map(b=>{const a=atoms.find(x=>x.id===b.a),c=atoms.find(x=>x.id===b.b);return Math.hypot(a.x-c.x,a.y-c.y)}).filter(x=>x>0).sort((a,b)=>a-b),scale=lengths.length?110/lengths[Math.floor(lengths.length/2)]:70;
 const cx=atoms.reduce((sum,a)=>sum+a.x,0)/n,cy=atoms.reduce((sum,a)=>sum+a.y,0)/n;
 atoms.forEach(a=>{a.x=550+(a.x-cx)*scale;a.y=215+(a.y-cy)*scale;});
 return{atoms,bonds};
}
