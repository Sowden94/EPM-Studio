// SPDX-License-Identifier: GPL-3.0-only
import {Vector3,Quaternion} from './vendor/three.module.js';
export function trackballPoint(x,y,rect){const s=Math.min(rect.width,rect.height),v=new Vector3((2*(x-rect.left)-rect.width)/s,(rect.height-2*(y-rect.top))/s,0),d=v.x*v.x+v.y*v.y;v.z=d<=.5?Math.sqrt(1-d):.5/Math.sqrt(d);return v.normalize();}
export function trackballRotation(from,to){return new Quaternion().setFromUnitVectors(from,to);}
export function rotateSelection(graph,ids,radians){const atoms=graph.atoms.filter(a=>ids.has(a.id));if(!atoms.length)return graph;const x=atoms.reduce((s,a)=>s+a.x,0)/atoms.length,y=atoms.reduce((s,a)=>s+a.y,0)/atoms.length,c=Math.cos(radians),s=Math.sin(radians);return {...graph,atoms:graph.atoms.map(a=>{if(!ids.has(a.id))return {...a};const dx=a.x-x,dy=a.y-y;return {...a,x:x+dx*c-dy*s,y:y+dx*s+dy*c};}),bonds:graph.bonds.map(b=>({...b}))};}
// Uniform screen-axis rotation avoids the sensitivity changes at trackball edges.
export function dragRotation(dx,dy,sensitivity=1,roll=false){
 if(roll)return new Quaternion().setFromAxisAngle(new Vector3(0,0,1),-dx*.006*sensitivity);
 const distance=Math.hypot(dx,dy);return distance?new Quaternion().setFromAxisAngle(new Vector3(dy,dx,0).normalize(),distance*.006*sensitivity):new Quaternion();
}
