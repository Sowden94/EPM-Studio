/* Shared drawing engine ported from the user's Orgo 101 source. */
const clone=x=>JSON.parse(JSON.stringify(x));
const keyBond=(a,b)=>[a,b].sort().join('~');
const LP=id=>({type:'lp',id}),BD=(a,b)=>({type:'bond',a,b});
function formal(g,a){if(a.element==='R')return 0;const v={H:1,B:3,C:4,Si:4,N:5,P:5,O:6,F:7,S:6,Cl:7,Br:7,I:7}[a.element];return v-2*a.lp-a.h-g.bonds.filter(b=>b.a===a.id||b.b===a.id).reduce((s,b)=>s+b.order,0)}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=s=>String(s).replace(/\d/g,d=>'₀₁₂₃₄₅₆₇₈₉'[+d]).replace(/\+/g,'⁺');
const chemistryTopic=q=>q.chemistryTopic||q.topic;
const locKey=l=>l.type==='lp'?'lp:'+l.id:'bond:'+keyBond(l.a,l.b);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function labelWidth(text){return [...text].reduce((n,c)=>n+(/\d/.test(c)?9:/[()]/.test(c)?8:c===c.toLowerCase()?12:17),0)}
function chemicalText(text){return esc(text).replace(/(\d+)/g,'<tspan baseline-shift="sub" font-size="17">$1</tspan>')}
function orientedGroupLabel(label,neighborX,groupX){
 if(neighborX<=groupX)return label;
 return ({CH3:'H3C',CH2CH3:'CH3CH2',CH2CH2CH3:'CH3CH2CH2','CH(CH3)2':'(CH3)2HC'}[label]||label);
}
function rectRadius(a,dx,dy,pad=0){const len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;return Math.min(Math.abs(ux)>1e-6?((ux<0?a.left:a.right)+pad)/Math.abs(ux):Infinity,Math.abs(uy)>1e-6?(a.halfH+pad)/Math.abs(uy):Infinity)}
function bondLabelRadius(a,dx,dy){if(a.compactOxygenBond)return 1/Math.sqrt((dx/10.5)**2+(dy/12)**2)+3;return rectRadius(a,dx,dy,5);}
function bondSegments(b){if(b.ringCenter&&b.order===2){const mid={x:(b.start.x+b.end.x)/2,y:(b.start.y+b.end.y)/2},sign=((b.ringCenter.x-mid.x)*(-b.uy)+(b.ringCenter.y-mid.y)*b.ux)>0?1:-1,ox=-b.uy*7*sign,oy=b.ux*7*sign;const ta=b.start.skeletal?0:bondLabelRadius(b.start,b.ux,b.uy),tb=b.end.skeletal?0:bondLabelRadius(b.end,-b.ux,-b.uy);return [{a:{x:b.start.x+b.ux*ta,y:b.start.y+b.uy*ta},b:{x:b.end.x-b.ux*tb,y:b.end.y-b.uy*tb},off:0},{a:{x:b.start.x+b.ux*Math.max(12,ta+8)+ox,y:b.start.y+b.uy*Math.max(12,ta+8)+oy},b:{x:b.end.x-b.ux*Math.max(12,tb+8)+ox,y:b.end.y-b.uy*Math.max(12,tb+8)+oy},off:7*sign}];}const ta=b.start.skeletal?0:bondLabelRadius(b.start,b.ux,b.uy),tb=b.end.skeletal?0:bondLabelRadius(b.end,-b.ux,-b.uy);return(b.order===1?[0]:b.order===2?[-5,5]:[-7,0,7]).map(off=>({a:{x:b.start.x+b.ux*ta-b.uy*off,y:b.start.y+b.uy*ta+b.ux*off},b:{x:b.end.x-b.ux*tb-b.uy*off,y:b.end.y-b.uy*tb+b.ux*off},off}))}
function coreRadius(a,angle){if(a.skeletal)return a.arrowGap??6;const halfW=a.element.length===2?16:10,halfH=13,gap=a.arrowGap??3,dx=Math.cos(angle),dy=Math.sin(angle);return Math.min(Math.abs(dx)>1e-7?(halfW+gap)/Math.abs(dx):Infinity,Math.abs(dy)>1e-7?(halfH+gap)/Math.abs(dy):Infinity)}
function LPsvg(s){const dx=(s.orthogonal?-Math.round(Math.sin(s.angle)):-Math.sin(s.angle))*3.6,dy=(s.orthogonal?Math.round(Math.cos(s.angle)):Math.cos(s.angle))*3.6;return `<g class="lone-pair"><circle cx="${s.x-dx}" cy="${s.y-dy}" r="2.25"/><circle cx="${s.x+dx}" cy="${s.y+dy}" r="2.25"/></g>`}
function markRingBonds(g){for(const bond of g.bonds){const queue=[[bond.a]],seen=new Set([bond.a]);let path;while(queue.length&&!path){const p=queue.shift(),id=p.at(-1);for(const b of g.bonds){if(b===bond||b.a!==id&&b.b!==id)continue;const next=b.a===id?b.b:b.a;if(next===bond.b){path=[...p,next];break;}if(!seen.has(next)){seen.add(next);queue.push([...p,next]);}}}if(path){const atoms=path.map(id=>g.atoms.find(a=>a.id===id));bond.ringCenter={x:atoms.reduce((n,a)=>n+a.x,0)/atoms.length,y:atoms.reduce((n,a)=>n+a.y,0)/atoms.length};}}}
function layoutGraph(g,pairPadding=8.5,options={}){
g={...g,bonds:g.bonds.map(b=>({...b}))};markRingBonds(g);
const atoms=g.atoms.map(n=>{const a={...n};const neighbors=g.bonds.filter(b=>b.a===a.id||b.b===a.id).map(b=>g.atoms.find(n=>n.id===(b.a===a.id?b.b:b.a)));a.hSide=neighbors.reduce((s,n)=>s+n.x-a.x,0)>=0?-1:1;a.halfH=15;if(a.element==='R'){a.displayLabel=orientedGroupLabel(a.label,neighbors[0]?.x??a.x,a.x);a.left=a.right=labelWidth(a.displayLabel)/2}else{a.left=a.right=a.element.length===2?16:11;if(a.h){if(a.hSide<0)a.left+=a.h>1?29:20;else a.right+=a.h>1?29:20}}if(a.skeletal){a.left=a.right=a.halfH=0;}else if(a.displayCarbon){a.left=a.right=labelWidth(a.displayCarbon)/2;}if(a.condensedMe){a.condensedMeSide=neighbors.filter(n=>!n.hidden).some(n=>n.x>a.x+1)?-1:1;if(a.h&&!a.hAbove){a.hSide=-a.condensedMeSide;a.left=a.right=a.element.length===2?16:11;if(a.hSide<0)a.left+=a.h>1?29:20;else a.right+=a.h>1?29:20;}if(a.condensedMeSide<0)a.left=50;else a.right=50;}if(a.condensedSuffix){a.hSide=1;a.left=11;a.right=13+labelWidth(a.condensedSuffix);}if(a.condensedPrefix){a.hSide=-1;a.left=13+labelWidth(a.condensedPrefix);a.right=11;}if(a.hAbove){a.left=a.right=a.element.length===2?16:11;a.halfH=15;}if(a.condensedAlcohol){a.condensedMeSide=-1;a.left=50;a.right=33;}a.compactOxygenBond=options.compactOxygenBonds&&a.element==='O'&&!a.h&&!a.condensedMe&&!a.condensedAlcohol;a.charge=formal(g,n);a.directions=neighbors.map(n=>a.condensedAlcohol&&n.element==='H'?0:(a.condensedMe||a.condensedSuffix||a.condensedPrefix)&&n.hidden?(a.condensedMeSide<0||a.condensedPrefix?Math.PI:0):Math.atan2(n.y-a.y,n.x-a.x));if(a.h&&!a.skeletal&&!a.displayCarbon)a.directions.push(a.hAbove?(a.hLabelDy>0?Math.PI/2:-Math.PI/2):a.hSide<0?Math.PI:0);return a}).filter(a=>!a.hidden);
const sources=[],targets=[];atoms.forEach(a=>targets.push({key:'atom:'+a.id,id:a.id,x:a.x,y:a.y,label:a.element==='R'?a.label:a.element+' atom',atom:a}));
function gap(t,dirs){return dirs.length?Math.min(...dirs.map(d=>Math.abs(Math.atan2(Math.sin(t-d),Math.cos(t-d))))):Math.PI}
for(const a of atoms){const dirs=[...a.directions];for(let n=0;n<(a.hideLonePairs?0:a.lp);n++){let angle=0,best=-1;for(let i=0;i<(a.condensedMe||options.cardinalPairs?4:24);i++){const t=i*Math.PI/(a.condensedMe||options.cardinalPairs?2:12),score=gap(t,dirs);if(score>best+1e-5){angle=t;best=score}}dirs.push(angle);const rad=rectRadius(a,Math.cos(angle),Math.sin(angle),a.pairPadding??pairPadding);sources.push({key:'lp:'+a.id,id:'lp:'+a.id+':'+n,loc:LP(a.id),x:a.x+Math.cos(angle)*rad,y:a.y+Math.sin(angle)*rad,angle,orthogonal:options.cardinalPairs,type:'lp',owner:a.id,label:'Lone pair '+(n+1)+' on '+a.element});}}
const bonds=g.bonds.filter(b=>atoms.some(a=>a.id===b.a)&&atoms.some(a=>a.id===b.b)).map(b=>{const a=atoms.find(a=>a.id===b.a),c=atoms.find(a=>a.id===b.b),len=dist(a,c),ux=(c.x-a.x)/len,uy=(c.y-a.y)/len;return{...b,start:a,end:c,ux,uy,len,key:'bond:'+keyBond(b.a,b.b)}});
for(const b of bonds){const segments=bondSegments(b),segment=segments[0],mid={x:(segment.a.x+segment.b.x)/2,y:(segment.a.y+segment.b.y)/2};const center={x:mid.x+b.uy*segment.off,y:mid.y-b.ux*segment.off};sources.push({key:b.key,id:b.key,loc:BD(b.a,b.b),x:mid.x,y:mid.y,type:'bond',bond:b,segment,label:(b.order>1?'π':'σ')+' pair in '+b.start.element+'–'+b.end.element+' bond'});targets.push({key:b.key,...center,label:b.start.element+'–'+b.end.element+' bond',bond:b})}

const charges=[];for(const a of atoms.filter(a=>a.charge)){let best;const tightO=options.tightPositiveOxygen&&a.element==='O'&&a.charge>0;for(const padding of (tightO?[8.5,10.5,13,15.5,18,21,24,28,32]:options.chargePaddingChoices||(options.chargePairClearance?[10.5,13,15.5,18,21,24]:[10.5,13,15.5,18])))for(let i=0;i<48;i++){const t=-Math.PI+i*Math.PI/24;if(tightO&&Math.sin(t)>-.8)continue;if((a.condensedSuffix&&(Math.cos(t)>-0.15||Math.sin(t)>-0.15))||(options.cardinalPairs&&a.h&&!a.hAbove&&Math.cos(t)*a.hSide>0)||(a.condensedMe&&!tightO&&(Math.cos(t)*a.condensedMeSide>-0.15||Math.sin(t)>-0.15))||(options.negativeChargeAbove&&a.charge<0&&Math.sin(t)>-0.5))continue;const rad=rectRadius(a,Math.cos(t),Math.sin(t))+padding,p={x:a.x+Math.cos(t)*rad,y:a.y+Math.sin(t)*rad};if(options.raisedNegativeCharges&&a.charge<0&&a.element!=='C'&&(p.y>a.y-25||Math.abs(p.x-a.x)<18))continue;let score=(padding-10.5)*10+(p.y>a.y?8:0)+Math.abs(t+Math.PI/4)*.5;
for(const pair of sources.filter(s=>s.type==='lp')){score+=Math.max(0,17-dist(p,pair))*80;if(options.chargePairClearance){const dx=-Math.sin(pair.angle)*3.6,dy=Math.cos(pair.angle)*3.6;for(const sign of [-1,1])score+=Math.max(0,options.chargePairClearance-dist(p,{x:pair.x+sign*dx,y:pair.y+sign*dy}))*2000;}}
for(const other of atoms){if(other.hAbove){const hx=Math.max(Math.abs(p.x-other.x)-(other.h>1?16:11),0),hy=Math.max(Math.abs(p.y-(other.y+(other.hLabelDy??-29)))-15,0);score+=Math.max(0,12-Math.hypot(hx,hy))*200;}const dx=Math.max(other.x-other.left-p.x,0,p.x-other.x-other.right),dy=Math.max(other.y-other.halfH-p.y,0,p.y-other.y-other.halfH);score+=Math.max(0,(tightO&&other.id===a.id?10:12)-Math.hypot(dx,dy))*100;if(other.id!==a.id&&dist(p,other)<dist(p,a)+8)score+=1000;}
for(const bond of bonds)for(const seg of bondSegments(bond))score+=Math.max(0,12-segmentDistance(p,seg.a,seg.b))*80;
for(const c of charges)score+=Math.max(0,24-dist(p,c))*100;
if(!best||score<best.score)best={...p,score};}
if(a.positiveChargeClearN){
 const side=a.condensedPrefix?1:-1;for(const [dx,dy] of [[0,-27],[side*19,-20],[side*21,-22],[side*23,-24]]){const p={x:a.x+dx,y:a.y+dy};if(!bonds.every(b=>bondSegments(b).every(seg=>segmentDistance(p,seg.a,seg.b)>=12)))continue;if(!atoms.every(other=>Math.hypot(Math.max(other.x-other.left-p.x,0,p.x-other.x-other.right),Math.max(other.y-other.halfH-p.y,0,p.y-other.y-other.halfH))>=10))continue;best={...p,score:0};break;}
}
if(a.positiveChargeNearO){
 const side=a.h?-a.hSide:1;
 for(const offset of [19,22,24]){let found=false;for(const sign of [side,-side]){
  if(a.h&&sign*a.hSide>0)continue;
  const p={x:a.x+sign*offset,y:a.y-(offset+1)},clearLabel=other=>Math.hypot(Math.max(other.x-other.left-p.x,0,p.x-other.x-other.right),Math.max(other.y-other.halfH-p.y,0,p.y-other.y-other.halfH))>=(other.id===a.id?9:11);
  if(!atoms.every(clearLabel)||!bonds.every(b=>bondSegments(b).every(seg=>segmentDistance(p,seg.a,seg.b)>=12))||!charges.every(c=>dist(p,c)>=24))continue;
  if(!sources.filter(s=>s.type==='lp').every(pair=>[-1,1].every(sign=>dist(p,{x:pair.x-sign*Math.sin(pair.angle)*3.6,y:pair.y+sign*Math.cos(pair.angle)*3.6})>=17)))continue;
  best={...p,score:0};found=true;break;
 }if(found)break;}
}
if(a.acidTightPositiveO){
 for(const [dx,dy] of [[0,-27],[19,-25],[-19,-25],[21,-27],[-21,-27]]){const p={x:a.x+dx,y:a.y+dy};
  if(!atoms.every(other=>Math.hypot(Math.max(other.x-other.left-p.x,0,p.x-other.x-other.right),Math.max(other.y-other.halfH-p.y,0,p.y-other.y-other.halfH))>=9.5))continue;
  if(!bonds.every(b=>bondSegments(b).every(seg=>segmentDistance(p,seg.a,seg.b)>=12)))continue;
  if(!sources.filter(s=>s.type==='lp').every(pair=>[-1,1].every(sign=>dist(p,{x:pair.x-sign*Math.sin(pair.angle)*3.6,y:pair.y+sign*Math.cos(pair.angle)*3.6})>=17)))continue;
  best={...p,score:0};break;
 }
}
charges.push({...best,value:a.charge,owner:a.id,r:8.5})}

const xs=atoms.flatMap(a=>[a.x-a.left,a.x+a.right]).concat(sources.map(s=>s.x),charges.map(a=>a.x)),ys=atoms.flatMap(a=>[a.y-a.halfH,a.y+a.halfH]).concat(atoms.filter(a=>a.hAbove).flatMap(a=>[a.y+(a.hLabelDy??-29)-15,a.y+(a.hLabelDy??-29)+15]),sources.map(s=>s.y),charges.map(a=>a.y));return{atoms,bonds,sources,targets,charges,bounds:{x:Math.min(...xs)-28,y:Math.min(...ys)-32,w:Math.max(...xs)-Math.min(...xs)+56,h:Math.max(...ys)-Math.min(...ys)+64}};
}
function answerMoveSets(q){return[q.moves,...(q.alternativeMoves||[])]}
function sourceMoves(q,s){return answerMoveSets(q).flat().filter(m=>locKey(m.from)===s.key)}
function targetForMove(q,m){if(m.to.type==='lp')return'atom:'+m.to.id;const k=locKey(m.to);if(q.start.bonds.some(b=>'bond:'+keyBond(b.a,b.b)===k))return k;if(q.topic==='rearrangement')return'atom:'+q.acceptor;if(m.from.type==='lp')return'atom:'+(m.to.a===m.from.id?m.to.b:m.to.a);throw Error('Unsupported destination')}
function goodArrow(q,a){return answerMoveSets(q).some(set=>set.some(m=>locKey(m.from)===a.source.key&&targetForMove(q,m)===a.target.key))}
function bezier(s,c1,c2,e,t){const u=1-t;return{x:u*u*u*s.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*e.x,y:u*u*u*s.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*e.y}}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
const ARROW_HEAD_LENGTH=20,ARROW_HEAD_HALF_WIDTH=8;
function routeArrow(l,s,target,q){
 // Reuse obstacle geometry for every candidate curve; none changes during routing.
 const pairs=l.sources.filter(a=>a.type==='lp'),otherPairs=pairs.filter(a=>a.id!==s.id),obstacles=l.bonds.map(b=>({key:b.key,segments:bondSegments(b)})),sourceSegments=s.bond?bondSegments(s.bond):[],condensedOwners=new Set(l.atoms.filter(a=>a.condensedMe).map(a=>a.id));
 const source=s,resonance=chemistryTopic(q)==='resonance';let best;const direct=Math.atan2(s.y-target.y,s.x-target.x);
 const hardResonance=chemistryTopic(q)==='resonance'&&q.level==='hard';
 const angles=target.approachAngles|| (target.atom?[direct,direct-.7,direct+.7,direct-1.2,direct+1.2,-Math.PI/2,Math.PI/2,0,Math.PI]:[Math.atan2(target.bond.ux,-target.bond.uy),Math.atan2(-target.bond.ux,target.bond.uy)]);
 const startDirections=s.type==='lp'?(target.startAngles||[s.angle,s.angle-.75,s.angle+.75]).map(a=>({x:Math.cos(a),y:Math.sin(a)})):[{x:s.bond.uy,y:-s.bond.ux},{x:-s.bond.uy,y:s.bond.ux}];
 for(const angle of angles){const out={x:Math.cos(angle),y:Math.sin(angle)},radius=target.atom?coreRadius(target.atom,angle):(target.arrowGap??(resonance?(target.bond.order===1?5:target.bond.order===2?10:12):2.5)),e={x:target.x+out.x*radius,y:target.y+out.y*radius};
 const leadChoices=target.leadChoices||(target.approachAngles?[50,92,160,240,320]:hardResonance?[38,58,82,108,135]:[32,50,70,92]),endChoices=target.endChoices||(target.approachAngles?[70,115,160,220,280]:hardResonance?[58,82,108,135]:[50,70,92,115]);
 for(const startDirection of startDirections)for(const lead of leadChoices)for(const endLead of endChoices){
 let startGap=resonance?(source.type==='lp'?7:5):0;if(resonance&&source.type==='bond')while(startGap<25&&sourceSegments.some(seg=>segmentDistance({x:source.x+startDirection.x*startGap,y:source.y+startDirection.y*startGap},seg.a,seg.b)<5-1e-8))startGap+=4;const s={...source,x:source.x+startDirection.x*startGap,y:source.y+startDirection.y*startGap};
 const c1={x:s.x+startDirection.x*lead,y:s.y+startDirection.y*lead},c2={x:e.x+out.x*endLead,y:e.y+out.y*endLead};let score=(lead+endLead)*.012;
 const chord={x:e.x-s.x,y:e.y-s.y},side1=chord.x*(c1.y-s.y)-chord.y*(c1.x-s.x),side2=chord.x*(c2.y-s.y)-chord.y*(c2.x-s.x);
 if(side1*side2<0)score+=target.smoothBow||resonance?1000000:120;
 score+=Math.max(0,dist(s,c1)+dist(c1,c2)+dist(c2,e)-dist(s,e)*1.45)*1.25;
 if(resonance){const mid=bezier(s,c1,c2,e,.5),chordLength=dist(s,e)||1,bow=Math.abs(chord.x*(mid.y-s.y)-chord.y*(mid.x-s.x))/chordLength;score+=Math.max(0,(hardResonance?38:24)-bow)*10+Math.max(0,bow-82)*2;}
 if(target.atom)for(const dir of target.atom.directions){const gap=Math.abs(Math.atan2(Math.sin(angle-dir),Math.cos(angle-dir)));score+=Math.max(0,.65-gap)*40}const points=[];
 for(let i=1;i<30;i++){const p=bezier(s,c1,c2,e,i/30);points.push(p);if(l.plus&&dist(p,l.plus)<15)score+=target.approachAngles?3000:30;
 for(const a of l.atoms){if(a.hAbove&&Math.abs(p.x-a.x)<(a.h>1?18:13)&&Math.abs(p.y-(a.y+(a.hLabelDy??-29)))<17)score+=3000;const dx=Math.max(a.x-a.left-p.x,0,p.x-a.x-a.right),dy=Math.max(a.y-a.halfH-p.y,0,p.y-a.y-a.halfH),clearance=Math.hypot(dx,dy);if(clearance<2)score+=target.approachAngles?3000:50;score+=Math.max(0,30-clearance)*3}
 for(const pair of otherPairs)if(dist(p,pair)<7)score+=15;
 if(target.avoidPoints?.some(other=>dist(p,other)<10))score+=10000;
 for(const ch of l.charges)if(dist(p,ch)<14)score+=target.approachAngles||condensedOwners.has(ch.owner)?5000:60;
 for(const b of obstacles){if((b.key===s.key&&dist(p,s)<8)||(b.key===target.key&&dist(p,e)<8))continue;for(const seg of b.segments)if(segmentDistance(p,seg.a,seg.b)<(target.approachAngles?5:3))score+=target.approachAngles?3000:12}
 }
 // Include arrowhead wings, not only the curve, in the clearance check.
 const tx=(e.x-c2.x)/endLead,ty=(e.y-c2.y)/endLead;
 const wings=[{x:e.x-ARROW_HEAD_LENGTH*tx+ARROW_HEAD_HALF_WIDTH*ty,y:e.y-ARROW_HEAD_LENGTH*ty-ARROW_HEAD_HALF_WIDTH*tx},{x:e.x-ARROW_HEAD_LENGTH*tx-ARROW_HEAD_HALF_WIDTH*ty,y:e.y-ARROW_HEAD_LENGTH*ty+ARROW_HEAD_HALF_WIDTH*tx}];
 for(const p of wings){if(target.avoidPoints?.some(other=>dist(p,other)<10))score+=10000;for(const a of l.atoms)if(p.x>a.x-a.left-1&&p.x<a.x+a.right+1&&p.y>a.y-a.halfH&&p.y<a.y+a.halfH)score+=80;for(const pair of pairs)if(dist(p,pair)<6)score+=20;for(const ch of l.charges)if(dist(p,ch)<13)score+=target.approachAngles||condensedOwners.has(ch.owner)?5000:80}
 if(target.visibleRouteScore&&(!best||score<best.score))score+=target.visibleRouteScore({start:s,c1,c2,e});
 if(!best||score<best.score)best={score,start:{x:s.x,y:s.y},c1,c2,e,points,wings,d:`M${s.x} ${s.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${e.x} ${e.y}`};
 }}return best;
}

const layoutCache=new Map();
// Keep explicit C–H bonds attached to C, clear of condensed hydrogen labels.
function acidDisplayGraph(graph,product=false,resonance=false){
 const g={...graph,atoms:graph.atoms.map(a=>({...a})),bonds:graph.bonds.map(b=>({...b}))};
 // Condense the newly added proton on O/N in the product, as in Proton Transfer.
 if(product){const proton=g.atoms.find(a=>a.id==='proton'),bond=g.bonds.find(b=>b.a==='proton'||b.b==='proton'),owner=bond&&g.atoms.find(a=>a.id===(bond.a==='proton'?bond.b:bond.a));if(owner&&['O','N'].includes(owner.element)){owner.h+=1;proton.hidden=true;g.bonds=g.bonds.filter(b=>b!==bond);}}
 // Draw longer alkyl groups out, retain Me and Ph as compact labels.
 for(const a of [...g.atoms].filter(a=>a.element==='R')){
  if(a.label==='C6H5')a.label='Ph';
  else if(a.label==='CH3')a.label='Me';
  else if(['CH2CH3','CH3CH2'].includes(a.label)){const bond=g.bonds.find(b=>b.a===a.id||b.b===a.id),owner=g.atoms.find(n=>n.id===(bond.a===a.id?bond.b:bond.a)),angle=Math.atan2(a.y-owner.y,a.x-owner.x),turn=angle<0?Math.PI/3:-Math.PI/3,id=a.id+'-ethyl-end';a.element='C';a.h=2;a.lp=0;delete a.label;g.atoms.push({id,element:'C',x:a.x+110*Math.cos(angle+turn),y:a.y+110*Math.sin(angle+turn),h:3,lp:0});g.bonds.push({a:a.id,b:id,order:1});}
 }
 for(const a of g.atoms.filter(a=>['O','N'].includes(a.element))){
  const neighbors=g.bonds.filter(b=>b.a===a.id||b.b===a.id).map(b=>g.atoms.find(n=>n.id===(b.a===a.id?b.b:b.a))),methyls=neighbors.filter(n=>n.element==='R'&&n.label==='Me'),h=neighbors.find(n=>n.element==='H');
  if(!resonance&&a.element==='N'&&methyls.length){methyls.forEach(n=>n.hidden=true);const label=(a.h?'H'+(a.h>1?a.h:''):'')+'Me'+(methyls.length>1?methyls.length:'');if(h&&h.x>a.x)a.condensedPrefix=label;else a.condensedSuffix=label;a.positiveChargeClearN=true;}
  if(a.element==='O'&&!a.h&&methyls.length===1){methyls[0].hidden=true;a.condensedSuffix='Me';}
  if(a.element==='O'&&a.h&&methyls.length===1){const heavy=methyls[0],side=heavy.x>=a.x?1:-1;heavy.x=a.x+side*55;heavy.y=a.y-95.2627944163;}
  // Three bonds at oxygen: give the explicit H its own 120-degree sector.
  if(a.element==='O'&&a.h===1&&h&&neighbors.filter(n=>n.element!=='H').length===1){const heavy=neighbors.find(n=>n.element!=='H'),side=heavy.x>=a.x?1:-1;heavy.x=a.x+side*55;heavy.y=a.y-95.2627944163;h.x=a.x+side*55;h.y=a.y+95.2627944163;}
  if(formal(g,a)>0){a.hideLonePairs=true;if(a.element==='O'){a.positiveChargeNearO=true;a.acidTightPositiveO=true;}}
 }

 for(const a of g.atoms.filter(a=>a.element==='C'&&a.h)){
  const neighbors=g.bonds.filter(b=>b.a===a.id||b.b===a.id).map(b=>g.atoms.find(n=>n.id===(b.a===a.id?b.b:b.a))),hydrogens=neighbors.filter(n=>n.element==='H'),heavy=neighbors.filter(n=>n.element!=='H');
  if(!hydrogens.length||g.bonds.some(b=>b.order===3&&(b.a===a.id||b.b===a.id)))continue;
  if(heavy.length===1&&hydrogens.length===1){
   const h=hydrogens[0],angle=Math.atan2(heavy[0].y-a.y,heavy[0].x-a.x),choices=[angle+2*Math.PI/3,angle-2*Math.PI/3],direction=choices.sort((x,y)=>Math.sin(y)-Math.sin(x))[0],length=dist(a,h);h.x=a.x+Math.cos(direction)*length;h.y=a.y+Math.sin(direction)*length;
  }else{
   const angles=neighbors.map(n=>Math.atan2(n.y-a.y,n.x-a.x)),clearance=t=>Math.min(...angles.map(d=>Math.abs(Math.atan2(Math.sin(t-d),Math.cos(t-d)))));
   a.hAbove=true;a.hLabelDy=clearance(Math.PI/2)>=clearance(-Math.PI/2)?34:-34;
  }
 }

 // Use consistent lengths and standard 30/60-degree drawing directions.
 const positions=new Map(g.atoms.map(a=>[a.id,{x:a.x,y:a.y}])),visited=new Set();for(const root of [...g.atoms].sort((a,b)=>(['base','acid'].includes(b.id)?1:0)-(['base','acid'].includes(a.id)?1:0))){if(visited.has(root.id)||root.hidden)continue;visited.add(root.id);const queue=[root];while(queue.length){const parent=queue.shift();for(const bond of g.bonds.filter(b=>b.a===parent.id||b.b===parent.id)){const child=g.atoms.find(a=>a.id===(bond.a===parent.id?bond.b:bond.a));if(visited.has(child.id))continue;const angle=Math.round(Math.atan2(positions.get(child.id).y-positions.get(parent.id).y,positions.get(child.id).x-positions.get(parent.id).x)/(Math.PI/6))*Math.PI/6;child.x=parent.x+110*Math.cos(angle);child.y=parent.y+110*Math.sin(angle);visited.add(child.id);queue.push(child);}}}
 // Each sp center and its substituent lie on one straight axis. Rotate the
 // entire attached branch so its internal bond angles are preserved.
 for(const triple of g.bonds.filter(b=>b.order===3))for(const [id,otherId] of [[triple.a,triple.b],[triple.b,triple.a]]){
  const center=g.atoms.find(a=>a.id===id),other=g.atoms.find(a=>a.id===otherId),axis=Math.atan2(center.y-other.y,center.x-other.x);
  for(const bond of g.bonds.filter(b=>(b.a===id||b.b===id)&&b!==triple)){
   const child=g.atoms.find(a=>a.id===(bond.a===id?bond.b:bond.a)),turn=axis-Math.atan2(child.y-center.y,child.x-center.x),seen=new Set([id,otherId]),queue=[child];
   while(queue.length){const atom=queue.shift();if(seen.has(atom.id))continue;seen.add(atom.id);const dx=atom.x-center.x,dy=atom.y-center.y;atom.x=center.x+dx*Math.cos(turn)-dy*Math.sin(turn);atom.y=center.y+dx*Math.sin(turn)+dy*Math.cos(turn);for(const edge of g.bonds.filter(b=>b.a===atom.id||b.b===atom.id))queue.push(g.atoms.find(a=>a.id===(edge.a===atom.id?edge.b:edge.a)));}
  }
 }
 const ring=g.atoms.filter(a=>a.id==='base'||/^bn[1-5]$/.test(a.id));if(ring.length===6&&ring.find(a=>a.id==='base').element==='N'){const center={x:ring.reduce((v,a)=>v+a.x,0)/6,y:ring.reduce((v,a)=>v+a.y,0)/6},ids=new Set(ring.map(a=>a.id));for(const b of g.bonds)if(ids.has(b.a)&&ids.has(b.b))b.ringCenter=center;}
 for(const a of g.atoms){if(a.element==='C'&&a.h===3&&g.bonds.filter(b=>b.a===a.id||b.b===a.id).length===1){a.element='R';a.label='Me';}if(a.element==='C'){a.skeletal=true;delete a.hAbove;delete a.hLabelDy;if(a.lp)a.pairPadding=18;}if(['F','Cl','Br','I'].includes(a.element))a.pairPadding=3;}
 return g;
}
// Resonance uses the same presentation rules while retaining the atom framework.
function resonanceDisplayGraph(graph,reference){
 const g=clone(graph),cycles=[];
 for(const a of [...g.atoms].filter(a=>a.element==='R')){
  if(!['CH2CH2CH3','CH(CH3)2','C6H11'].includes(a.label))continue;
  const edge=g.bonds.find(b=>b.a===a.id||b.b===a.id),owner=g.atoms.find(n=>n.id===(edge.a===a.id?edge.b:edge.a)),angle=Math.round(Math.atan2(a.y-owner.y,a.x-owner.x)/(Math.PI/6))*Math.PI/6,label=a.label;
  a.element='C';a.lp=0;a.h=label==='CH2CH2CH3'?2:1;delete a.label;
  const add=(id,from,theta,h)=>{const parent=g.atoms.find(a=>a.id===from);g.atoms.push({id,element:'C',h,lp:0,x:parent.x+110*Math.cos(theta),y:parent.y+110*Math.sin(theta)});g.bonds.push({a:from,b:id,order:1});};
  if(label==='CH2CH2CH3'){const turn=Math.sin(angle)>0?-Math.PI/3:Math.PI/3;add(a.id+'-propyl-middle',a.id,angle+turn,2);add(a.id+'-propyl-end',a.id+'-propyl-middle',angle,3);}
  if(label==='CH(CH3)2')for(const sign of[-1,1])add(a.id+'-branch-'+sign,a.id,angle+sign*Math.PI/3,3);
  if(label==='C6H11'){const center={x:a.x+110*Math.cos(angle),y:a.y+110*Math.sin(angle)},ids=[a.id];for(let i=1;i<6;i++){const id=a.id+'-cyclo-'+i;ids.push(id);g.atoms.push({id,element:'C',h:2,lp:0,x:center.x+110*Math.cos(angle+Math.PI+i*Math.PI/3),y:center.y+110*Math.sin(angle+Math.PI+i*Math.PI/3)});g.bonds.push({a:ids[i-1],b:id,order:1});}g.bonds.push({a:ids[5],b:a.id,order:1});cycles.push(ids);}
 }
 const display=acidDisplayGraph(g,false,true);
 // Contributors share exactly the same coordinates, including expanded groups.
 if(reference)for(const a of display.atoms){const original=reference.atoms.find(n=>n.id===a.id);if(original){a.x=original.x;a.y=original.y;}}
 const aromatic=display.atoms.filter(a=>/^c[0-5]$/.test(a.id));if(aromatic.length===6)cycles.push(aromatic.map(a=>a.id));
 for(const ids of cycles){const atoms=ids.map(id=>display.atoms.find(a=>a.id===id)),center={x:atoms.reduce((v,a)=>v+a.x,0)/atoms.length,y:atoms.reduce((v,a)=>v+a.y,0)/atoms.length};for(const b of display.bonds)if(ids.includes(b.a)&&ids.includes(b.b))b.ringCenter=center;}
 for(const a of display.atoms.filter(a=>a.element==='N'&&formal(display,a)>0))a.positiveChargeClearN=true;
 return display;
}
// Spread each acid–base pair across the same two columns as the role controls.
function spaceAcidCompounds(graph){
 const g=clone(graph),layout=layoutGraph(g,7,{cardinalPairs:true}),roots=['base','acid'].sort((a,b)=>g.atoms.find(n=>n.id===a).x-g.atoms.find(n=>n.id===b).x);
 roots.forEach((root,i)=>{const ids=new Set(),queue=[root];while(queue.length){const id=queue.shift();if(ids.has(id))continue;ids.add(id);for(const b of g.bonds)if(b.a===id||b.b===id)queue.push(b.a===id?b.b:b.a);}const atoms=layout.atoms.filter(a=>ids.has(a.id)),center=(Math.min(...atoms.map(a=>a.x-a.left))+Math.max(...atoms.map(a=>a.x+a.right)))/2,dx=(i?525:175)-center;for(const a of g.atoms)if(ids.has(a.id))a.x+=dx;for(const b of g.bonds)if(b.ringCenter&&ids.has(b.a)&&ids.has(b.b))b.ringCenter={...b.ringCenter,x:b.ringCenter.x+dx};});
 return g;
}
// Locate separators in the visible gaps, using the same graph as the drawing.
function acidSeparators(layout,graph){
 const ranges=['base','acid'].map(root=>{const ids=new Set(),queue=[root];while(queue.length){const id=queue.shift();if(ids.has(id))continue;ids.add(id);for(const b of graph.bonds)if(b.a===id||b.b===id)queue.push(b.a===id?b.b:b.a);}
 const atoms=layout.atoms.filter(a=>ids.has(a.id)),pairs=layout.sources.filter(s=>s.type==='lp'&&ids.has(s.owner)),charges=layout.charges.filter(c=>ids.has(c.owner));
 return {left:Math.min(...atoms.map(a=>a.x-a.left),...pairs.map(s=>s.x-6),...charges.map(c=>c.x-9)),right:Math.max(...atoms.map(a=>a.x+a.right),...pairs.map(s=>s.x+6),...charges.map(c=>c.x+9))};}).sort((a,b)=>a.left-b.left);
 layout.compounds=ranges;layout.plus={x:(ranges[0].right+ranges[1].left)/2,y:180};
}
function layouts(q){if(layoutCache.has(q.id))return layoutCache.get(q.id);const acid=chemistryTopic(q)==='acid',resonance=chemistryTopic(q)==='resonance',styled=acid||resonance,startGraph=acid?spaceAcidCompounds(acidDisplayGraph(q.start)):resonance?resonanceDisplayGraph(q.start):q.start,productGraph=acid?spaceAcidCompounds(acidDisplayGraph(q.product,true)):resonance?resonanceDisplayGraph(q.product,startGraph):q.product,options=styled?{compactOxygenBonds:true,tightPositiveOxygen:true,chargePairClearance:17,negativeChargeAbove:true,cardinalPairs:true}:{},start=layoutGraph(startGraph,styled?7:8.5,options),product=layoutGraph(productGraph,styled?7:8.5,options),routes=new Map();if(chemistryTopic(q)==='acid'){acidSeparators(start,startGraph);acidSeparators(product,productGraph);}const all=[start.bounds,product.bounds];for(const s of start.sources){const m=sourceMoves(q,s)[0];if(!m)continue;const t=start.targets.find(t=>t.key===targetForMove(q,m));if(!t)throw Error('No target '+q.id);const r=routeArrow(start,s,t,q);routes.set(s.id+'>'+t.key,r);const pts=[s,...r.points,r.e];all.push({x:Math.min(...pts.map(p=>p.x))-15,y:Math.min(...pts.map(p=>p.y))-15,w:Math.max(...pts.map(p=>p.x))-Math.min(...pts.map(p=>p.x))+30,h:Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y))+30})}let x=Math.min(...all.map(b=>b.x)),y=Math.min(...all.map(b=>b.y)),right=Math.max(...all.map(b=>b.x+b.w)),bottom=Math.max(...all.map(b=>b.y+b.h));if(acid){x=Math.min(0,x);right=Math.max(700,right);}const view={x,y,w:right-x,h:bottom-y};const result={start,product,routes,view};layoutCache.set(q.id,result);return result}
function molecule(l,q){let html='';for(const b of l.bonds)for(const segment of bondSegments(b))html+=`<line class="bond" x1="${segment.a.x}" y1="${segment.a.y}" x2="${segment.b.x}" y2="${segment.b.y}"/>`;

for(const a of l.atoms){if(a.skeletal)continue;if(a.displayCarbon){html+=`<text class="atom-label" x="${a.x}" y="${a.y}">${esc(a.displayCarbon)}</text>`;continue;}if(a.element==='R'){html+=`<text class="atom-label" x="${a.x}" y="${a.y}">${chemicalText(a.displayLabel||a.label)}</text>`}else{html+=`<text class="atom-label" x="${a.x}" y="${a.y}">${a.element}</text>`;if(a.condensedMe)html+=`<text class="atom-label" style="text-anchor:${a.condensedMeSide<0?'end':'start'}" x="${a.x+a.condensedMeSide*13}" y="${a.y}">Me</text>`;if(a.condensedAlcohol)html+=`<text class="atom-label" style="text-anchor:start" x="${a.x+13}" y="${a.y}">H</text>`;if(a.condensedPrefix)html+=`<text class="atom-label" style="text-anchor:end" x="${a.x-13}" y="${a.y}">${chemicalText(a.condensedPrefix)}</text>`;if(a.condensedSuffix)html+=`<text class="atom-label" style="text-anchor:start" x="${a.x+13}" y="${a.y}">${chemicalText(a.condensedSuffix)}</text>`;else if(!a.condensedPrefix&&a.hAbove)html+=`<text class="atom-label" x="${a.x}" y="${a.y+(a.hLabelDy??-29)}">H${a.h>1?`<tspan baseline-shift="sub" font-size="17">${a.h}</tspan>`:''}</text>`;else if(!a.condensedPrefix&&a.h)html+=`<text class="atom-label" style="text-anchor:${a.hSide<0?'end':'start'}" x="${a.x+a.hSide*13}" y="${a.y}">H${a.h>1?`<tspan baseline-shift="sub" font-size="17">${a.h}</tspan>`:''}</text>`}}
html+=l.sources.filter(s=>s.type==='lp').map(LPsvg).join('');html+=l.charges.map(c=>`<g class="charge-symbol" data-charge-owner="${esc(c.owner)}" role="img" aria-label="${c.value>0?'Positive':'Negative'} formal charge on ${esc(l.atoms.find(a=>a.id===c.owner).element)}"><circle cx="${c.x}" cy="${c.y}" r="8.5"/><path d="M${c.x-3.8} ${c.y} H${c.x+3.8}${c.value>0?` M${c.x} ${c.y-3.8} V${c.y+3.8}`:''}"/></g>`).join('');if(chemistryTopic(q)==='acid')html+=`<text class="reaction-plus" x="${l.plus?.x??295}" y="${l.plus?.y??180}">+</text>`;return html}
function relationArrow(acid){return `<svg viewBox="0 0 48 30" aria-hidden="true">${acid?'<path d="M4 10 H44 L36 4 M44 20 H4 L12 26" fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="butt" stroke-linejoin="miter"/>':'<path d="M10 15 H38" fill="none" stroke="#111" stroke-width="1.8"/><path d="M3 15 L13 11 L11 15 L13 19 Z M45 15 L35 11 L37 15 L35 19 Z" fill="#111"/>'}</svg>`}

function arrowPath(route){return cleanArrow(route.start,route.c1,route.c2,route.e)}
function cleanArrow(s,c1,c2,e,preview=false){
 const tangentLength=Math.hypot(e.x-c2.x,e.y-c2.y)||1,ux=(e.x-c2.x)/tangentLength,uy=(e.y-c2.y)/tangentLength;
 let t=.99;while(t>.05&&dist(bezier(s,c1,c2,e,t),e)<16)t-=.005;
 const mix=(a,b,n)=>({x:a.x+(b.x-a.x)*n,y:a.y+(b.y-a.y)*n}),a=mix(s,c1,t),b=mix(c1,c2,t),c=mix(c2,e,t),d=mix(a,b,t),f=mix(b,c,t),shaftEnd=mix(d,f,t);
 const left={x:e.x-ARROW_HEAD_LENGTH*ux-ARROW_HEAD_HALF_WIDTH*uy,y:e.y-ARROW_HEAD_LENGTH*uy+ARROW_HEAD_HALF_WIDTH*ux},right={x:e.x-ARROW_HEAD_LENGTH*ux+ARROW_HEAD_HALF_WIDTH*uy,y:e.y-ARROW_HEAD_LENGTH*uy-ARROW_HEAD_HALF_WIDTH*ux};
 return `<g class="electron-arrow"><path class="curly${preview?' preview':''}" d="M${s.x} ${s.y} C${a.x} ${a.y} ${d.x} ${d.y} ${shaftEnd.x} ${shaftEnd.y}"/><path class="electron-arrowhead" d="M${e.x} ${e.y} L${left.x} ${left.y} L${right.x} ${right.y} Z"/></g>`
}

function previewPath(s,t){const dx=t.x-s.x,dy=t.y-s.y,d=Math.hypot(dx,dy)||1,lead=Math.min(40,Math.max(12,d*.32));const out=s.type==='lp'?{x:Math.cos(s.angle),y:Math.sin(s.angle)}:{x:s.bond.uy,y:-s.bond.ux};const c1={x:s.x+out.x*lead,y:s.y+out.y*lead},bend=Math.min(20,d*.15),c2={x:t.x-dx*.25-dy/d*bend,y:t.y-dy*.25+dx/d*bend};return cleanArrow(s,c1,c2,t,true)}

// A single shared drawing surface keeps both sides on the same scale and baseline.
function mountReaction(startMarkup,ls,q){
 const v=ls.view,acid=chemistryTopic(q)==='acid',gap=acid?0:130,total=2*v.w+gap,styled=acid||chemistryTopic(q)==='resonance',size=styled?`class="reaction-canvas practice-reaction acid-reaction" style="width:${acid?'100%':total*.82+'px'};height:${v.h*.82}px"`:'class="reaction-canvas"';
 const center=acid?ls.start.plus.y-v.y:v.h/2;
 const arrowX=acid&&ls.start.compounds&&ls.product.compounds?(ls.start.compounds[1].right-v.x+v.w+ls.product.compounds[0].left-v.x)/2:v.w+gap/2;
 // One shared coordinate system keeps bonds, electron arrows and separators together.
 const connector=relationArrow(acid).replace(/<svg[^>]*>/,`<g class="scheme-connector" transform="translate(${arrowX-28.8} ${center-18}) scale(1.2)" aria-hidden="true">`).replace('</svg>','</g>');
 $('drawing').innerHTML=`<svg ${size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${v.h}" role="group" aria-label="${esc(q.title)}"><g id="board" transform="translate(${-v.x} ${-v.y})" role="group" aria-label="Starting structure: answer here">${startMarkup}</g>${connector}<g transform="translate(${v.w+gap-v.x} ${-v.y})" role="img" aria-label="Target structure">${molecule(ls.product,q)}</g></svg>`;
 $('product-drawing').innerHTML='';
}

/* Molecular answers are marked by chemistry, independently of drawing coordinates. */
(()=>{
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x)),key=(a,b)=>[a,b].sort().join('~'),electrons={H:1,B:3,C:4,Si:4,N:5,P:5,O:6,F:7,S:6,Cl:7,Br:7,I:7};
function bondOrder(g,id){return g.bonds.filter(b=>b.a===id||b.b===id).reduce((n,b)=>n+b.order,0);}
function atomCapacity(g,a){const q=a.charge||0,bo=bondOrder(g,a.id);if(a.element==='Ph')return 1;if(a.element==='H')return q?0:1;if(['C','Si'].includes(a.element))return 4-Math.abs(q);if(a.element==='B')return 3-q;if(a.element==='P'||a.element==='S'){const shells=(a.element==='P'?[3,5]:[2,4,6]).map(n=>n+q);return shells.find(n=>n>=bo)??shells.at(-1)}if(a.element==='N')return 3+q;if(a.element==='O')return 2+q;return 1+q;}
function hydrogens(g,a){if(a.element==='H'||a.element==='Ph')return 0;return Math.max(0,atomCapacity(g,a)-bondOrder(g,a.id));}
function fromChemical(g){return {atoms:g.atoms.map(a=>({id:a.id,element:a.element==='R'?a.label==='Me'?'C':a.label:a.element,charge:a.element==='R'?0:formal(g,a),x:a.x,y:a.y})),bonds:g.bonds.map(b=>({a:b.a,b:b.b,order:b.order}))};}
function normalized(g){
 const bonds=g.bonds.map(b=>({...b})),atoms=g.atoms.map(a=>({...a,h:hydrogens(g,a),charge:a.charge||0})),byId=new Map(atoms.map(a=>[a.id,a])),removed=new Set();
 for(const a of atoms.filter(a=>a.element==='H'&&!a.charge)){const attached=bonds.filter(b=>b.a===a.id||b.b===a.id);if(attached.length===1&&attached[0].order===1){const neighbor=byId.get(attached[0].a===a.id?attached[0].b:attached[0].a);if(neighbor.element!=='H'&&neighbor.element!=='Ph'){neighbor.h++;removed.add(a.id);}}}
 return {atoms:atoms.filter(a=>!removed.has(a.id)),bonds:bonds.filter(b=>!removed.has(b.a)&&!removed.has(b.b))};
}
function chemicalExpected(g){
 // Retain the specified hydrogen counts before folding explicitly drawn H atoms.
 const atoms=g.atoms.map(a=>({id:a.id,element:a.element==='R'?(a.label==='Me'?'C':a.label):a.element,charge:a.element==='R'?0:formal(g,a),h:a.element==='R'?(a.label==='Me'?3:0):a.h||0,x:a.x,y:a.y})),bonds=g.bonds.map(b=>({...b})),byId=new Map(atoms.map(a=>[a.id,a])),removed=new Set();
 for(const a of atoms.filter(a=>a.element==='H'&&!a.charge)){const attached=bonds.filter(b=>b.a===a.id||b.b===a.id);if(attached.length===1&&attached[0].order===1){const neighbor=byId.get(attached[0].a===a.id?attached[0].b:attached[0].a);if(neighbor.element!=='H'&&neighbor.element!=='Ph'){neighbor.h++;removed.add(a.id);}}}
 return {atoms:atoms.filter(a=>!removed.has(a.id)),bonds:bonds.filter(b=>!removed.has(b.a)&&!removed.has(b.b))};
}
function components(g){const remaining=new Set(g.atoms.map(a=>a.id)),out=[];while(remaining.size){const start=remaining.values().next().value,ids=new Set([start]),queue=[start];remaining.delete(start);while(queue.length){const id=queue.shift();for(const b of g.bonds.filter(b=>b.a===id||b.b===id)){const other=b.a===id?b.b:b.a;if(remaining.has(other)){remaining.delete(other);ids.add(other);queue.push(other);}}}out.push({atoms:g.atoms.filter(a=>ids.has(a.id)),bonds:g.bonds.filter(b=>ids.has(b.a)&&ids.has(b.b))});}return out;}
function label(a){return [a.element,a.charge||0,a.h||0].join(':');}
function isomorphic(a,b){
 if(a.atoms.length!==b.atoms.length||a.bonds.length!==b.bonds.length)return false;
 const maps=g=>{const adj=new Map(g.atoms.map(a=>[a.id,new Map()]));for(const e of g.bonds){adj.get(e.a).set(e.b,e.order);adj.get(e.b).set(e.a,e.order);}return adj;},aa=maps(a),bb=maps(b),signature=(g,adj,atom)=>label(atom)+'/'+[...adj.get(atom.id).values()].sort().join(','),as=a.atoms.map(x=>signature(a,aa,x)),bs=b.atoms.map(x=>signature(b,bb,x));
 if([...as].sort().join('|')!==[...bs].sort().join('|'))return false;
 const order=a.atoms.map((atom,i)=>({atom,i})).sort((x,y)=>bs.filter(s=>s===as[x.i]).length-bs.filter(s=>s===as[y.i]).length||aa.get(y.atom.id).size-aa.get(x.atom.id).size),mapped=new Map(),used=new Set();
 function visit(n){if(n===order.length)return true;const{atom,i}=order[n];for(let j=0;j<b.atoms.length;j++){const target=b.atoms[j];if(used.has(target.id)||as[i]!==bs[j])continue;let ok=true;for(const[id,to]of mapped)if((aa.get(atom.id).get(id)||0)!==(bb.get(target.id).get(to)||0)){ok=false;break;}if(!ok)continue;mapped.set(atom.id,target.id);used.add(target.id);if(visit(n+1))return true;mapped.delete(atom.id);used.delete(target.id);}return false;}
 return visit(0);
}
function inventory(g){const counts={};for(const a of g.atoms){counts[a.element]=(counts[a.element]||0)+1;if(a.h)counts.H=(counts.H||0)+a.h;}return Object.keys(counts).sort().map(k=>k+counts[k]).join(',');}
function validation(g){
 const ids=new Set();for(const a of g.atoms){if(ids.has(a.id))return'Duplicate atom.';ids.add(a.id);if(!['B','C','Si','P','O','N','H','F','S','Cl','Br','I','Ph'].includes(a.element))return'Choose an atom from the toolbar.';if(a.element==='Ph'&&a.charge)return'Ph represents a neutral phenyl group. Place a charge on the appropriate atom.';if(!Number.isInteger(a.charge||0)||Math.abs(a.charge||0)>1)return'This set uses formal charges of +1, 0 or −1.';}
 const seen=new Set();for(const b of g.bonds){if(b.a===b.b||!ids.has(b.a)||!ids.has(b.b)||![1,2,3].includes(b.order)||seen.has(key(b.a,b.b)))return'Check the bonds in your drawing.';seen.add(key(b.a,b.b));}
 for(const a of g.atoms){const bo=bondOrder(g,a.id),capacity=atomCapacity(g,a);if(bo>capacity)return`Check the valence of ${a.element}: it has too many bonds for its charge.`;}
 return'';
}
function check(q,drawing){
 if(!drawing.atoms.length)return{correct:false,message:q.mainProductOnly?'Draw the main product before checking.':'Draw the product/s before checking.'};const invalid=validation(drawing);if(invalid)return{correct:false,message:invalid};
 const actual=normalized(drawing),expected=chemicalExpected(q.product);if(isomorphic(actual,expected))return{correct:true,message:'Correct. '+q.explanation};
 const charge=g=>g.atoms.reduce((sum,a)=>sum+(a.charge||0),0);
 if(charge(actual)!==charge(expected))return{correct:false,message:q.mainProductOnly?'Check the formal charges on the main product. The other species will be added automatically.':'Check the formal charges. Total charge must be conserved across this step.'};
 if(inventory(actual)!==inventory(expected))return{correct:false,message:q.mainProductOnly?'Draw only the main product, with the correct atoms and hydrogens. Leave out counterions and small by-products; these are added automatically.':'Check that every atom and hydrogen is present in the products. Hydrogens are added automatically from each atom’s bonds and formal charge.'};
 if(components(actual).length!==components(expected).length)return{correct:false,message:q.mainProductOnly?'Draw just the main product. The remaining species appear once it is correct.':'Check how many separate products form. Include the leaving group or the other proton-transfer product where applicable.'};
 return{correct:false,message:'Check the bonds and the positions of the charges. Follow every shown arrow, including any change in bond order.'};
}
// The drawing task follows the substrate; small coproducts remain part of the
// balanced answer but are supplied only after the student's main product is right.
function forDrawing(q){
 const parts=components(q.product),organic=id=>parts.find(c=>c.atoms.some(a=>a.id===id)&&c.atoms.some(a=>a.element==='C'||a.element==='R'));
 const chosen=q.drawingProductAnchor?parts.find(c=>c.atoms.some(a=>a.id===q.drawingProductAnchor)):q.topic==='proton'?(organic(q.acid||'acid')||parts.find(c=>c.atoms.some(a=>a.id===(q.donor||'base')))):parts.find(c=>c.atoms.some(a=>a.id===(q.acceptor||'c')));
 if(!chosen)throw Error('Missing main drawing product: '+q.id);
 return{...q,product:copy(chosen),mainProductOnly:true};
}
function checkMain(q,drawing){return check(forDrawing(q),drawing);}
// Measure what is actually visible, including label width, lone pairs and charges.
function visualBounds(g,layout){
 const ids=new Set(g.atoms.map(a=>a.id));if(!layout&&typeof layoutGraph==='function')layout=layoutGraph(display(g),7,{compactOxygenBonds:true,tightPositiveOxygen:true,chargePairClearance:17,negativeChargeAbove:true,raisedNegativeCharges:true,cardinalPairs:true});
 const atoms=layout?layout.atoms.filter(a=>ids.has(a.id)):display(g).atoms.filter(a=>!a.hidden).map(a=>({...a,left:a.condensedMe?31:20,right:a.condensedMe?50:20,halfH:15})),pairs=layout?layout.sources.filter(a=>a.type==='lp'&&ids.has(a.owner)):[],charges=layout?layout.charges.filter(a=>ids.has(a.owner)):[],xs=atoms.flatMap(a=>[a.x-a.left,a.x+a.right]).concat(pairs.flatMap(a=>[a.x-6,a.x+6]),charges.flatMap(a=>[a.x-9,a.x+9])),ys=atoms.flatMap(a=>[a.y-a.halfH,a.y+a.halfH]).concat(pairs.flatMap(a=>[a.y-6,a.y+6]),charges.flatMap(a=>[a.y-9,a.y+9]));
 const pi=g.bonds.find(b=>b.order===2&&[b.a,b.b].every(id=>g.atoms.find(a=>a.id===id)?.element==='C')),baseline=pi?(g.atoms.find(a=>a.id===pi.a).y+g.atoms.find(a=>a.id===pi.b).y)/2:(Math.min(...atoms.map(a=>a.y))+Math.max(...atoms.map(a=>a.y)))/2;
 return{left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys),baseline};
}
function completeDrawing(q,drawing){
 const main=forDrawing(q),mainIds=new Set(main.product.atoms.map(a=>a.id)),extras=components(q.product).filter(c=>!c.atoms.some(a=>mainIds.has(a.id))),out=copy(drawing);
 const lengths=drawing.bonds.map(b=>{const a=drawing.atoms.find(a=>a.id===b.a),n=drawing.atoms.find(a=>a.id===b.b);return Math.hypot(a.x-n.x,a.y-n.y);}).filter(n=>n>10).sort((a,b)=>a-b),scale=(lengths.length?lengths[Math.floor(lengths.length/2)]:80)/110;
 const gap=Math.max(90,90*scale),mainBox=visualBounds(out);let edge=mainBox.right+gap;const cy=mainBox.baseline;
 extras.forEach((part,i)=>{const raw=fromChemical(part);raw.bonds=copy(part.bonds);const implicit=new Set(raw.atoms.filter(a=>a.element==='H'&&!a.charge&&raw.bonds.some(b=>(b.a===a.id||b.b===a.id)&&b.order===1&&raw.atoms.find(n=>n.id===(b.a===a.id?b.b:b.a)).element!=='H')).map(a=>a.id));raw.atoms=raw.atoms.filter(a=>!implicit.has(a.id));raw.bonds=raw.bonds.filter(b=>!implicit.has(b.a)&&!implicit.has(b.b));for(const a of raw.atoms){a.x*=scale;a.y*=scale;}const box=visualBounds(raw),dx=edge-box.left,dy=cy-box.baseline,ids=new Map();for(const a of raw.atoms){let id='auto-'+i+'-'+a.id;while(out.atoms.some(n=>n.id===id))id+='-';ids.set(a.id,id);a.id=id;a.x+=dx;a.y+=dy;}for(const b of raw.bonds){b.a=ids.get(b.a);b.b=ids.get(b.b);if(b.stereoFrom)b.stereoFrom=ids.get(b.stereoFrom);}out.atoms.push(...raw.atoms);out.bonds.push(...raw.bonds);edge=box.right+dx+gap;});
 return out;
}
function display(g){
 const graph={atoms:g.atoms.map(a=>{const h=hydrogens(g,a),bo=bondOrder(g,a.id),lp=a.element==='Ph'?0:(electrons[a.element]-(a.charge||0)-bo-h)/2;return{id:a.id,element:a.element==='Ph'?'R':a.element,label:a.element==='Ph'?'Ph':a.element,x:a.x,y:a.y,h,lp,skeletal:a.element==='C'&&bo>0,arrowGap:a.element==='C'?10:5,hideLonePairs:!Number.isInteger(lp)||lp<0||['O','N'].includes(a.element)&&(a.charge||0)>0,pairPadding:['Cl','Br','I'].includes(a.element)?3:undefined};}),bonds:copy(g.bonds)};
 for(const a of graph.atoms.filter(a=>a.element==='O'||a.element==='N')){const methyls=graph.bonds.filter(b=>b.a===a.id||b.b===a.id).map(b=>graph.atoms.find(n=>n.id===(b.a===a.id?b.b:b.a))).filter(n=>n.element==='C'&&hydrogens(g,g.atoms.find(x=>x.id===n.id))===3&&bondOrder(g,n.id)===1);if(methyls.length){if(a.element==='O'&&methyls.length===1){a.condensedMe=true;}else{const label=(a.h?'H'+(a.h>1?a.h:''):'')+'Me'+(methyls.length>1?methyls.length:'');const visible=graph.bonds.filter(b=>b.a===a.id||b.b===a.id).map(b=>graph.atoms.find(n=>n.id===(b.a===a.id?b.b:b.a))).filter(n=>!methyls.includes(n));if(visible.reduce((sum,n)=>sum+n.x-a.x,0)>0)a.condensedPrefix=label;else a.condensedSuffix=label;}for(const m of methyls)m.hidden=true;}if(a.element==='N'&&(g.atoms.find(n=>n.id===a.id).charge||0)>0)a.positiveChargeClearN=true;}
 return graph;
}
const api={copy,key,hydrogens,bondOrder,fromChemical,normalized,chemicalExpected,components,isomorphic,inventory,validation,check,forDrawing,checkMain,completeDrawing,visualBounds,display};globalThis.ProductChem=api;if(typeof module!=='undefined')module.exports=api;
})();

function additionMarkup(layout,q){return molecule(layout,q).replace(/class="bond"/g,'class="bond" stroke="#172532" stroke-width="2"').replace(/class="atom-label"/g,'class="atom-label" font-family="Arial,sans-serif" font-size="26" text-anchor="middle" dominant-baseline="central" fill="#172532"').replace(/class="lone-pair"/g,'class="lone-pair" fill="#172532"').replace(/class="charge-symbol"/g,'class="charge-symbol" stroke="#172532" stroke-width="1.5" fill="white"').replace(/<path d="M/g,'<path fill="none" d="M');}

(()=>{const baseMarkup=additionMarkup;function wedge(b){const segment=bondSegments(b)[0],from=b.stereoFrom===b.b?segment.b:segment.a,to=b.stereoFrom===b.b?segment.a:segment.b,length=dist(from,to),ux=(to.x-from.x)/length,uy=(to.y-from.y)/length,width=7;if(b.stereo==='wedge')return `<path class="stereo-bond" d="M${from.x} ${from.y} L${to.x-uy*width} ${to.y+ux*width} L${to.x+uy*width} ${to.y-ux*width} Z" fill="#172532"/>`;return `<g class="stereo-bond" stroke="#172532" stroke-width="1.7">`+Array.from({length:8},(_,i)=>{const t=(i+1)/9,x=from.x+(to.x-from.x)*t,y=from.y+(to.y-from.y)*t,w=width*t;return `<path d="M${x-uy*w} ${y+ux*w} L${x+uy*w} ${y-ux*w}"/>`;}).join('')+'</g>';}
additionMarkup=function(l,q){return baseMarkup({...l,bonds:l.bonds.filter(b=>!b.stereo)},q)+l.bonds.filter(b=>b.stereo).map(wedge).join('');};
})();
/* Small, dependency-free molecular sketcher. Answer chemistry lives in ProductChem. */
(()=>{'use strict';
const $=id=>document.getElementById(id),cp=ProductChem.copy;
class StructureEditor{
 constructor(onChange=()=>{}){this.board=$('p-board');this.onChange=onChange;this.graph={atoms:[],bonds:[]};this.tool='bond1';this.history=[];this.future=[];this.anchor=null;this.cursor={x:410,y:185};this.serial=0;this.locked=false;
 this.board.addEventListener('pointerdown',e=>this.down(e));this.board.addEventListener('pointermove',e=>this.motion(e));this.board.addEventListener('pointerup',e=>this.up(e));this.board.addEventListener('pointercancel',()=>{this.drag=null;$('p-preview').innerHTML='';});this.board.addEventListener('keydown',e=>this.keydown(e));
 document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>this.setTool(b.dataset.tool)));
 for(const[name,fn]of Object.entries({undo:()=>this.undo(),redo:()=>this.redo(),clear:()=>this.setGraph({atoms:[],bonds:[]}),tidy:()=>this.tidy(),fit:()=>this.fit()}))$('p-'+name).addEventListener('click',()=>{if(!this.locked)fn();});this.render();}
 getGraph(){return cp(this.graph);} snapshot(){this.history.push(this.getGraph());if(this.history.length>100)this.history.shift();this.future=[];}
 changed(){this.render();this.onChange(this.getGraph());} setGraph(g,record=true){if(record)this.snapshot();this.graph=cp(g);this.anchor=null;this.drag=null;if(!record){this.history=[];this.future=[];}this.changed();this.fit();}
 undo(){if(!this.history.length)return;this.future.push(this.getGraph());this.graph=this.history.pop();this.anchor=null;this.changed();} redo(){if(!this.future.length)return;this.history.push(this.getGraph());this.graph=this.future.pop();this.anchor=null;this.changed();}
 setTool(tool){if(this.locked)return;this.tool=tool;this.anchor=null;this.render();} setLocked(value){this.locked=value;document.querySelectorAll('[data-tool],.editor-actions button').forEach(b=>b.disabled=value);this.render();}
 atom(id){return this.graph.atoms.find(a=>a.id===id);} addAtom(p,element='C'){let id;do{id='draw'+(++this.serial);}while(this.atom(id));const a={id,element,charge:0,x:p.x,y:p.y};this.graph.atoms.push(a);return a;}
 addBond(a,b,order){if(a===b)return;const existing=this.graph.bonds.find(e=>ProductChem.key(e.a,e.b)===ProductChem.key(a,b));if(existing)existing.order=order;else this.graph.bonds.push({a,b,order});}
 point(e){const r=this.board.getBoundingClientRect(),v=this.board.getAttribute('viewBox').split(/\s+/).map(Number),scale=Math.min(r.width/v[2],r.height/v[3]);return{x:v[0]+(e.clientX-r.left-(r.width-v[2]*scale)/2)/scale,y:v[1]+(e.clientY-r.top-(r.height-v[3]*scale)/2)/scale};}
 target(e,p){if(e.target.dataset.atom)return{atom:e.target.dataset.atom};if(e.target.dataset.bond)return{bond:Number(e.target.dataset.bond)};const near=this.graph.atoms.filter(a=>!this.hidden?.has(a.id)).map(a=>({a,d:Math.hypot(a.x-p.x,a.y-p.y)})).sort((a,b)=>a.d-b.d)[0];return near?.d<18?{atom:near.a.id}:{};}
 eraseTarget(p,t={}){const charge=this.layout.charges.find(c=>Math.hypot(c.x-p.x,c.y-p.y)<11);if(charge)return{charge:charge.owner};if(t.atom||t.bond!==undefined)return t;const atom=this.graph.atoms.find(a=>!this.hidden.has(a.id)&&Math.hypot(a.x-p.x,a.y-p.y)<15);if(atom)return{atom:atom.id};const bond=this.layout.bonds.find(b=>bondSegments(b).some(segment=>segmentDistance(p,segment.a,segment.b)<9));return bond?{bond:this.graph.bonds.findIndex(b=>ProductChem.key(b.a,b.b)===ProductChem.key(bond.a,bond.b))}:{};}
 eraseAt(p,t={},record=true){t=this.eraseTarget(p,t);if(!t.charge&&!t.atom&&t.bond===undefined)return false;if(record)this.snapshot();if(t.charge)this.atom(t.charge).charge=0;else if(t.atom){const ids=new Set([t.atom]);for(const b of this.graph.bonds)if(b.a===t.atom&&this.hidden.has(b.b))ids.add(b.b);else if(b.b===t.atom&&this.hidden.has(b.a))ids.add(b.a);this.graph.atoms=this.graph.atoms.filter(a=>!ids.has(a.id));this.graph.bonds=this.graph.bonds.filter(b=>!ids.has(b.a)&&!ids.has(b.b));}else this.graph.bonds.splice(t.bond,1);this.anchor=null;this.changed();return true;}
 eraseStroke(p,t={}){const d=this.drag;if(this.eraseAt(p,t,!d.erased))d.erased=true;}
 snapped(a,p){let angle=Math.atan2(p.y-a.y,p.x-a.x);angle=Math.round(angle/(Math.PI/6))*Math.PI/6;const label=a.element==='C'?0:a.element==='Ph'?17:12,length=60+label;return{x:a.x+Math.cos(angle)*length,y:a.y+Math.sin(angle)*length};}
 activate(p,t={}){if(this.locked)return;const a=this.atom(t.atom);if(this.tool.startsWith('bond')){const order=Number(this.tool.slice(-1));if(t.bond!==undefined){this.snapshot();this.graph.bonds[t.bond].order=order;this.anchor=null;this.changed();return;}if(!this.anchor){if(a)this.anchor=a.id;else{this.snapshot();this.anchor=this.addAtom(p).id;this.changed();}this.render();return;}if(a?.id===this.anchor){this.anchor=null;this.render();return;}this.snapshot();const start=this.atom(this.anchor),end=a||this.addAtom(this.snapped(start,p));this.addBond(start.id,end.id,order);this.anchor=end.id;this.changed();return;}
 if(this.tool==='move'){this.anchor=a?.id||null;this.render();return;}
 if(this.tool==='erase'){this.eraseAt(p,t);return;}
 if(['positive','negative','neutral'].includes(this.tool)){if(!a)return;if(a.element==='Ph'&&this.tool!=='neutral'){$('p-atom-status').textContent='Place a formal charge on an atom; Ph represents a phenyl group.';return;}this.snapshot();const charge=this.tool==='positive'?1:this.tool==='negative'?-1:0;a.charge=a.charge===charge?0:charge;this.changed();return;}
 this.snapshot();if(this.tool==='OMe'){const o=a||this.addAtom(p,'O');o.element='O';o.charge=0;const methyl=this.addAtom({x:o.x+72,y:o.y},'C');this.addBond(o.id,methyl.id,1);}else if(a){a.element=this.tool;a.charge=0;}else this.addAtom(p,this.tool);this.anchor=null;this.changed();}
 down(e){if(this.locked||e.button>0)return;e.preventDefault();const p=this.point(e),t=this.target(e,p);this.cursor=p;this.drag={p,t,id:e.pointerId,moved:false,before:this.getGraph(),shift:e.shiftKey,previous:p};this.board.setPointerCapture?.(e.pointerId);if(this.tool==='erase')this.eraseStroke(p,t);}
 motion(e){if(!this.drag||e.pointerId!==this.drag.id)return;const p=this.point(e),d=this.drag;if(this.tool==='erase'){const from=d.previous,steps=Math.max(1,Math.ceil(Math.hypot(p.x-from.x,p.y-from.y)/4));for(let i=1;i<=steps;i++)this.eraseStroke({x:from.x+(p.x-from.x)*i/steps,y:from.y+(p.y-from.y)*i/steps});d.previous=p;return;}if(Math.hypot(p.x-d.p.x,p.y-d.p.y)<5&&!d.moved)return;d.moved=true;if(this.tool==='move'&&d.t.atom){const comp=ProductChem.components(d.before).find(c=>c.atoms.some(a=>a.id===d.t.atom)),ids=new Set(d.shift?comp.atoms.map(a=>a.id):[d.t.atom]);this.graph=cp(d.before);for(const a of this.graph.atoms)if(ids.has(a.id)){a.x+=p.x-d.p.x;a.y+=p.y-d.p.y;}this.render();}else if(this.tool.startsWith('bond')&&d.t.bond===undefined){const start=this.atom(d.t.atom)||d.p,end=this.target(e,p).atom?this.atom(this.target(e,p).atom):this.snapped(start,p);$('p-preview').innerHTML=`<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#44849b" stroke-width="2" stroke-dasharray="5 3"/>`;}}
 up(e){const d=this.drag;if(!d||d.id!==e.pointerId)return;const p=this.point(e),t=this.target(e,p);if(this.tool==='erase'){this.motion(e);this.drag=null;return;}this.drag=null;$('p-preview').innerHTML='';if(d.moved&&this.tool==='move'&&d.t.atom){this.history.push(d.before);this.future=[];this.changed();}else if(d.moved&&this.tool.startsWith('bond')&&d.t.bond===undefined){this.snapshot();const start=this.atom(d.t.atom)||this.addAtom(d.p),end=this.atom(t.atom)||this.addAtom(this.snapped(start,p));this.addBond(start.id,end.id,Number(this.tool.slice(-1)));this.anchor=null;this.changed();}else this.activate(p,t);}
 keydown(e){if(this.locked)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?this.redo():this.undo();return;}if(e.key==='Escape'){this.anchor=null;this.render();return;}const shortcuts={c:'C',o:'O',n:'N',h:'H','1':'bond1','2':'bond2','3':'bond3','+':'positive','-':'negative','−':'negative',Delete:'erase',Backspace:'erase'};if(shortcuts[e.key]||shortcuts[e.key.toLowerCase()]){e.preventDefault();this.setTool(shortcuts[e.key]||shortcuts[e.key.toLowerCase()]);return;}if(e.key.startsWith('Arrow')){e.preventDefault();this.cursor.x+=e.key==='ArrowLeft'?-20:e.key==='ArrowRight'?20:0;this.cursor.y+=e.key==='ArrowUp'?-20:e.key==='ArrowDown'?20:0;this.render(true);}else if(e.key==='Enter'||e.key===' '){e.preventDefault();this.activate(this.cursor,e.target.dataset.atom?{atom:e.target.dataset.atom}:e.target.dataset.bond!==undefined?{bond:Number(e.target.dataset.bond)}:{});}}
 tidy(){if(!this.graph.atoms.length)return;this.snapshot();let offset=75;for(const comp of ProductChem.components(this.graph)){const used=new Set(),by=new Map(comp.atoms.map(a=>[a.id,a]));const root=comp.atoms.filter(a=>a.element==='C').sort((a,b)=>comp.bonds.filter(e=>e.a===b.id||e.b===b.id).length-comp.bonds.filter(e=>e.a===a.id||e.b===a.id).length)[0]||comp.atoms[0];root.x=offset;root.y=185;function visit(a,parent,angle){used.add(a.id);const next=comp.bonds.filter(b=>b.a===a.id||b.b===a.id).map(b=>by.get(b.a===a.id?b.b:b.a)).filter(n=>!used.has(n.id));next.forEach((n,i)=>{const linear=comp.bonds.filter(b=>b.a===a.id||b.b===a.id).some(b=>b.order===3)||comp.bonds.filter(b=>(b.a===a.id||b.b===a.id)&&b.order===2).length===2;const theta=parent?angle+(next.length===1?(linear?0:Math.sin(angle)>0?-Math.PI/3:Math.PI/3):next.length===3?[-Math.PI/2,0,Math.PI/2][i]:[-Math.PI/3,Math.PI/3][i]):(next.length===4?[-Math.PI/4,Math.PI/4,3*Math.PI/4,5*Math.PI/4]:[-Math.PI/6,Math.PI/2,7*Math.PI/6])[i];const len=60+(a.element==='C'?0:a.element==='Ph'?17:12)+(n.element==='C'?0:n.element==='Ph'?17:12);n.x=a.x+Math.cos(theta)*len;n.y=a.y+Math.sin(theta)*len;visit(n,a,theta);});}visit(root,null,0);const min=Math.min(...comp.atoms.map(a=>a.x)),max=Math.max(...comp.atoms.map(a=>a.x));for(const a of comp.atoms)a.x+=offset-min;offset+=max-min+140;}this.anchor=null;this.changed();this.fit();}
 fit(){const a=this.graph.atoms;if(!a.length){this.board.setAttribute('viewBox','0 0 820 370');return;}const b=this.layout.bounds,w=Math.max(820,b.w+100),h=Math.max(370,b.h+100);const x=b.x+b.w/2-w/2,y=b.y+b.h/2-h/2;this.board.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);const background=$('p-grid-background');if(background)for(const[k,v]of Object.entries({x,y,width:w,height:h}))background.setAttribute(k,v);}
 render(cursor=false){this.board.dataset.tool=this.tool;const g=ProductChem.display(this.graph);this.hidden=new Set(g.atoms.filter(a=>a.hidden).map(a=>a.id));this.layout=layoutGraph(g,7,{compactOxygenBonds:true,tightPositiveOxygen:true,chargePairClearance:17,negativeChargeAbove:true,raisedNegativeCharges:true,cardinalPairs:true});$('p-molecules').innerHTML=additionMarkup(this.layout,{topic:'product'});let hits='';for(let i=0;i<this.graph.bonds.length;i++){const b=this.graph.bonds[i];if(this.hidden.has(b.a)||this.hidden.has(b.b))continue;const a=this.atom(b.a),n=this.atom(b.b);hits+=`<line class="editor-hit" data-bond="${i}" tabindex="0" role="button" aria-label="${b.order===1?'Single':b.order===2?'Double':'Triple'} bond" x1="${a.x}" y1="${a.y}" x2="${n.x}" y2="${n.y}" style="stroke-width:16"/>`;}for(const a of this.layout.atoms)hits+=`<circle class="editor-hit" data-atom="${a.id}" tabindex="0" role="button" aria-label="${a.element==='R'?'Phenyl':a.element}, formal charge ${a.charge||0}" cx="${a.x}" cy="${a.y}" r="19"/>`;$('p-hit').innerHTML=hits;const s=this.atom(this.anchor);$('p-selection').innerHTML=s?`<circle cx="${s.x}" cy="${s.y}" r="12" fill="none" stroke="#44849b" stroke-width="1.5"/>`:cursor?`<path d="M ${this.cursor.x-8} ${this.cursor.y} h16 M ${this.cursor.x} ${this.cursor.y-8} v16" stroke="#44849b"/>`:'';
 const comps=ProductChem.components(this.graph).filter(c=>c.atoms.some(a=>!this.hidden.has(a.id))).sort((a,b)=>ProductChem.visualBounds(a,this.layout).left-ProductChem.visualBounds(b,this.layout).left),boxes=comps.map(c=>ProductChem.visualBounds(c,this.layout));for(let i=1;i<boxes.length;i++){const left=boxes[i-1].right,right=boxes[i].left;if(right-left>36)$('p-molecules').innerHTML+=`<text class="product-separator" x="${(left+right)/2}" y="${(boxes[i-1].baseline+boxes[i].baseline)/2}" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="24" fill="#172532">+</text>`;}
 $('p-empty').hidden=!!this.graph.atoms.length;const names={bond1:'Single bond',bond2:'Double bond',bond3:'Triple bond',positive:'Positive charge',negative:'Negative charge',neutral:'Remove charge',move:'Move',erase:'Eraser'};$('p-tool-status').textContent=(names[this.tool]||this.tool+' atom')+(this.anchor&&this.tool.startsWith('bond')?' · choose the next atom or point':'');$('p-components').textContent=comps.length+' product'+(comps.length===1?'':'s')+' drawn';$('p-atom-status').textContent=ProductChem.validation(this.graph);$('p-undo').disabled=this.locked||!this.history.length;$('p-redo').disabled=this.locked||!this.future.length;document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===this.tool)));}
}
globalThis.StructureEditor=StructureEditor;
})();

/* Wedge tools are local to SN2; the previously reviewed editor is unchanged. */
(()=>{'use strict';class SN2Editor extends StructureEditor{
target(e,p){const t=super.target(e,p);if(t.atom||t.bond!==undefined)return t;const nearest=this.layout.bonds.filter(b=>!this.hidden.has(b.a)&&!this.hidden.has(b.b)).map(b=>({b,d:Math.min(...bondSegments(b).map(segment=>segmentDistance(p,segment.a,segment.b)))})).filter(x=>x.d<10).sort((a,b)=>a.d-b.d)[0];return nearest?{bond:this.graph.bonds.findIndex(b=>ProductChem.key(b.a,b.b)===ProductChem.key(nearest.b.a,nearest.b.b))}:t;}
motion(e){if(this.tool!=='wedge'&&this.tool!=='hash')return super.motion(e);const tool=this.tool;this.tool='bond1';try{super.motion(e);}finally{this.tool=tool;}}
up(e){const d=this.drag;if(!d||d.id!==e.pointerId)return;if(!d.moved&&d.t.bond!==undefined&&this.tool!=='erase'){this.drag=null;document.getElementById('p-preview').innerHTML='';this.activate(d.p,d.t);return;}if((this.tool==='wedge'||this.tool==='hash')&&d.moved&&d.t.bond===undefined){const p=this.point(e),t=this.target(e,p);this.drag=null;document.getElementById('p-preview').innerHTML='';if(d.t.atom&&d.t.atom===t.atom)return;this.snapshot();const start=this.atom(d.t.atom)||this.addAtom(d.p),end=this.atom(t.atom)||this.addAtom(this.snapped(start,p));this.addBond(start.id,end.id,1);const b=this.graph.bonds.find(b=>ProductChem.key(b.a,b.b)===ProductChem.key(start.id,end.id));b.stereo=this.tool;b.stereoFrom=start.id;this.anchor=null;this.changed();return;}super.up(e);}

activate(p,t={}){if(this.locked)return;if(this.tool==='wedge'||this.tool==='hash'){if(t.bond===undefined){const tool=this.tool,from=this.anchor;this.tool='bond1';try{super.activate(p,t);}finally{this.tool=tool;}if(from&&this.anchor&&from!==this.anchor){const b=this.graph.bonds.find(b=>ProductChem.key(b.a,b.b)===ProductChem.key(from,this.anchor));if(b){b.stereo=tool;b.stereoFrom=from;}}this.changed();return;}const b=this.graph.bonds[t.bond];if(b.order!==1){document.getElementById('p-atom-status').textContent='Wedges and dashed bonds apply to single bonds.';return;}this.snapshot();const previous=b.stereo;b.stereo=this.tool;if(previous===this.tool)b.stereoFrom=b.stereoFrom===b.a?b.b:b.a;else b.stereoFrom=b.a;this.anchor=null;this.changed();return;}if(this.tool.startsWith('bond')&&t.bond!==undefined){this.snapshot();const b=this.graph.bonds[t.bond];b.order=Number(this.tool.slice(-1));delete b.stereo;delete b.stereoFrom;this.anchor=null;this.changed();return;}super.activate(p,t);}
addBond(a,b,order){super.addBond(a,b,order);const edge=this.graph.bonds.find(e=>ProductChem.key(e.a,e.b)===ProductChem.key(a,b));if(order!==1){delete edge.stereo;delete edge.stereoFrom;}}
snapped(a,p){const angle=Math.round(Math.atan2(p.y-a.y,p.x-a.x)/(Math.PI/6))*Math.PI/6;return{x:a.x+110*Math.cos(angle),y:a.y+110*Math.sin(angle)};}
fit(){if(!this.graph.atoms.length){this.board.setAttribute('viewBox','0 0 800 520');return;}const b=this.layout.bounds,w=Math.max(800,b.w+100),h=Math.max(520,b.h+100),x=b.x+b.w/2-w/2,y=b.y+b.h/2-h/2;this.board.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);const background=document.getElementById('p-grid-background');for(const[k,v]of Object.entries({x,y,width:w,height:h}))background.setAttribute(k,v);}
tidy(){document.getElementById('p-atom-status').textContent='Use Move to adjust the drawing. Keeping the current geometry preserves your wedge and dashed-bond configuration.';}
render(cursor=false){super.render(cursor);if(this.tool==='wedge'||this.tool==='hash')document.getElementById('p-tool-status').textContent=this.tool==='wedge'?'Solid wedge · click a bond or drag to draw; click again to reverse its taper':'Dashed bond · click a bond or drag to draw; click again to reverse its taper';}
}
globalThis.SN2Editor=SN2Editor;})();
