import {explicitHydrogenGraph} from '../docs/explicit-hydrogens.js';
import assert from 'node:assert/strict';
import {planarModel,projectionPixels} from '../docs/flat-projection.js';
import {rotateSelection,trackballPoint,trackballRotation,dragRotation} from '../docs/free-rotation.js';
import {skeletalLabels,renderBondLine} from '../docs/bond-line.js';
const graph={atoms:[{id:'a',element:'C',x:0,y:0},{id:'b',element:'N',charge:1,x:110,y:0},{id:'c',element:'C',x:220,y:50}],bonds:[{a:'a',b:'b',order:1,stereo:'wedge',stereoFrom:'a'},{a:'b',b:'c',order:1}]};
const model=planarModel(graph);
assert.equal(model.atoms.filter(a=>a.el==='H').length,8);
assert.equal(model.atoms.find(a=>a.el==='N').charge,1);
assert.ok(Math.abs(model.charges.reduce((a,b)=>a+b)-1)<1e-7);
assert.ok(model.atoms.every(a=>a.p[2]===0));
assert.ok(model.atoms[2].p[1]<model.atoms[1].p[1], 'Screen-down drawing coordinates must project down, not mirror vertically');
assert.equal(model.bonds.find(b=>b[3]==='wedge')[3],'wedge');
assert.equal(skeletalLabels(model.atoms,model.bonds)[0],'');
assert.equal(skeletalLabels(model.atoms,model.bonds,true)[0],'');
const all=new Set(graph.atoms.map(a=>a.id)),rotated=rotateSelection(graph,all,1.15);
for(const b of graph.bonds){const distance=g=>{const a=g.atoms.find(a=>a.id===b.a),c=g.atoms.find(a=>a.id===b.b);return Math.hypot(a.x-c.x,a.y-c.y)};assert.ok(Math.abs(distance(rotated)-distance(graph))<1e-10);}
assert.deepEqual(rotated.bonds,graph.bonds);assert.equal(graph.atoms[0].x,0);
const partial=rotateSelection(graph,new Set(['a','b']),.2);assert.deepEqual(partial.atoms[2],graph.atoms[2]);
const rect={width:500,height:500,left:0,top:0},centre=trackballPoint(250,250,rect),edge=trackballPoint(500,250,rect);
const q=trackballRotation(centre,edge);assert.ok(centre.clone().applyQuaternion(q).distanceTo(edge)<1e-10);
assert.ok(Math.abs(trackballPoint(-1000,800,rect).length()-1)<1e-12);
const pixels=projectionPixels(model,48,v=>[v>0?1:0,0,v<0?1:0]);assert.ok(pixels.some((x,i)=>i%4===3&&x===255));assert.equal(pixels[3],0);
const text=[],ctx=new Proxy({save(){},restore(){},measureText(t){return {width:t.length*8}},fillText(t){text.push(t)}},{get:(o,k)=>k in o?o[k]:()=>{}});
renderBondLine(ctx,model.atoms,model.bonds,p=>p,50,true);assert.ok(text.includes('+'));assert.equal(text.filter(t=>t==='H').length,8);assert.ok(!text.some(t=>t.includes('₃')));
console.log('Passed: valence and charge conservation, planar geometry, H toggle, selected rotation, bond/stereo preservation, trackball mapping, projected field, charge labels.');

const formaldehyde={atoms:[{id:'c',element:'C',x:0,y:0},{id:'o',element:'O',x:110,y:0}],bonds:[{a:'c',b:'o',order:2}]};
const expanded=explicitHydrogenGraph(formaldehyde),hydrogens=expanded.atoms.filter(a=>a.element==='H');assert.equal(hydrogens.length,2);assert.equal(expanded.bonds.length,3);assert.equal(formaldehyde.atoms.length,2);
for(const h of hydrogens){assert.ok(Math.abs(Math.hypot(h.x,h.y)-110)<1e-8);assert.ok(Math.abs(h.x+55)<1e-8);assert.ok(Math.abs(Math.abs(h.y)-110*Math.sqrt(3)/2)<1e-8);}
const planar=planarModel(formaldehyde);assert.equal(planar.atoms.filter(a=>a.el==='H').length,2);assert.equal(planar.bonds.length,3);
console.log('Passed: explicit hydrogen bonds, trigonal formaldehyde angles, display-only expansion.');

const normal=dragRotation(40,20,.7),fine=dragRotation(40,20,.14);assert.ok(Math.abs(normal.angleTo(dragRotation(0,0))-5*fine.angleTo(dragRotation(0,0)))<1e-10);assert.ok(Math.abs(normal.length()-1)<1e-12);assert.ok(Math.abs(dragRotation(20,0,1,true).z)>0);console.log('Passed: uniform drag sensitivity, fine adjustment and independent roll.');
