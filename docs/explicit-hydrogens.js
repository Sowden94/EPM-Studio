// SPDX-License-Identifier: GPL-3.0-only
// Display-only hydrogen expansion. The editable graph remains unchanged.
export function hydrogenCount(graph,atom){
 const q=atom.charge||0,bo=graph.bonds.reduce((s,b)=>s+(b.a===atom.id||b.b===atom.id?b.order:0),0),el=atom.element;
 if(el==='H')return 0;
 let capacity=['C','Si'].includes(el)?4-Math.abs(q):el==='B'?3-q:el==='N'?3+q:el==='O'?2+q:1+q;
 if(el==='P'||el==='S')capacity=(el==='P'?[3,5]:[2,4,6]).map(n=>n+q).find(n=>n>=bo)??bo;
 return Math.max(0,Math.round(capacity-bo));
}
export function explicitHydrogenGraph(graph,count=hydrogenCount){
 const out={atoms:graph.atoms.map(a=>({...a})),bonds:graph.bonds.map(b=>({...b}))},tau=2*Math.PI;
 const lengths=graph.bonds.map(b=>{const a=graph.atoms.find(a=>a.id===b.a),c=graph.atoms.find(a=>a.id===b.b);return Math.hypot(a.x-c.x,a.y-c.y);}).filter(n=>n>1).sort((a,b)=>a-b),length=lengths.length?lengths[Math.floor(lengths.length/2)]:110;
 for(const atom of graph.atoms){
  const n=count(graph,atom);if(!n)continue;
  const neighbours=graph.bonds.filter(b=>b.a===atom.id||b.b===atom.id).map(b=>graph.atoms.find(a=>a.id===(b.a===atom.id?b.b:b.a))),angles=neighbours.map(a=>(Math.atan2(a.y-atom.y,a.x-atom.x)+tau)%tau).sort((a,b)=>a-b);
  let placements=[];
  if(!angles.length)placements=Array.from({length:n},(_,i)=>-Math.PI/2+i*tau/n);
  else if(angles.length===1&&n===1&&['O','S','N','P'].includes(atom.element))placements=[angles[0]+2*Math.PI/3];
  else{
   const gaps=angles.map((start,i)=>({start,size:((angles[(i+1)%angles.length]-start+tau)%tau)||tau,count:0}));
   for(let i=0;i<n;i++){const gap=gaps.reduce((a,b)=>b.size/(b.count+1)>a.size/(a.count+1)+1e-9?b:a);gap.count++;}
   placements=gaps.flatMap(g=>Array.from({length:g.count},(_,i)=>g.start+g.size*(i+1)/(g.count+1)));
  }
  for(let i=0;i<placements.length;i++){let id='implicit-H-'+atom.id+'-'+i;while(out.atoms.some(a=>a.id===id))id+='-';const t=placements[i];out.atoms.push({id,element:'H',charge:0,x:atom.x+length*Math.cos(t),y:atom.y+length*Math.sin(t),displayHydrogen:true,hydrogenOwner:atom.id});out.bonds.push({a:atom.id,b:id,order:1});}
 }
 return out;
}
