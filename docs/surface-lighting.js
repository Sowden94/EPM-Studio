// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden.
const normalCache=new WeakMap();
// Weld only for lighting, and reconcile triangle winding before averaging.
// The original surface coordinates, topology and potential values are untouched.
export function surfaceNormals(mesh){
 if(normalCache.has(mesh))return normalCache.get(mesh);
 const {vertices:p,faces:f}=mesh,count=p.length/3,ids=new Int32Array(count),keys=new Map();
 for(let i=0;i<count;i++){const key=[0,1,2].map(j=>Math.round(p[i*3+j]*1e4)).join(',');if(!keys.has(key))keys.set(key,keys.size);ids[i]=keys.get(key);}
 const triangles=f.length/3,adj=Array.from({length:triangles},()=>[]),edges=new Map();
 for(let i=0;i<triangles;i++)for(let j=0;j<3;j++){
  const a=ids[f[i*3+j]],b=ids[f[i*3+(j+1)%3]];if(a===b)continue;
  const key=Math.min(a,b)*keys.size+Math.max(a,b),direction=a<b?1:-1,other=edges.get(key);
  if(other){const relation=-direction*other.direction;adj[i].push([other.face,relation]);adj[other.face].push([i,relation]);}else edges.set(key,{face:i,direction});
 }
 const orientation=new Int8Array(triangles);
 for(let start=0;start<triangles;start++)if(!orientation[start]){
  const component=[start];orientation[start]=1;let volume=0;
  for(let cursor=0;cursor<component.length;cursor++){
   const face=component[cursor],a=f[face*3]*3,b=f[face*3+1]*3,c=f[face*3+2]*3;
   volume+=orientation[face]*(p[a]*(p[b+1]*p[c+2]-p[b+2]*p[c+1])+p[a+1]*(p[b+2]*p[c]-p[b]*p[c+2])+p[a+2]*(p[b]*p[c+1]-p[b+1]*p[c]));
   for(const [next,relation] of adj[face])if(!orientation[next]){orientation[next]=orientation[face]*relation;component.push(next);}
  }
  if(volume<0)for(const face of component)orientation[face]*=-1;
 }
 const sums=new Float64Array(keys.size*3);
 for(let i=0;i<triangles;i++){
  const a=f[i*3]*3,b=f[i*3+1]*3,c=f[i*3+2]*3,ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2];
  const nx=(uy*vz-uz*vy)*orientation[i],ny=(uz*vx-ux*vz)*orientation[i],nz=(ux*vy-uy*vx)*orientation[i];
  for(let j=0;j<3;j++){const k=ids[f[i*3+j]]*3;sums[k]+=nx;sums[k+1]+=ny;sums[k+2]+=nz;}
 }
 const normals=new Float32Array(p.length);
 for(let i=0;i<count;i++){const k=ids[i]*3,length=Math.hypot(sums[k],sums[k+1],sums[k+2]);if(length>1e-12){for(let j=0;j<3;j++)normals[i*3+j]=sums[k+j]/length;}else normals[i*3+2]=1;}
 normalCache.set(mesh,normals);return normals;
}
const L=[-.45,.65,1],length=Math.hypot(...L);L.forEach((v,i)=>L[i]=v/length);
const H=[L[0],L[1],L[2]+1],hl=Math.hypot(...H);H.forEach((v,i)=>H[i]=v/hl);
export function lightVertex(nx,ny,nz,relativeDepth,strength){
 const length=Math.hypot(nx,ny,nz)||1,sign=nz<0?-1:1;nx=nx/length*sign;ny=ny/length*sign;nz=nz/length*sign;
 const diffuse=Math.max(0,nx*L[0]+ny*L[1]+nz*L[2]),edge=Math.min(1,Math.max(0,nz/.55)),rim=.70+.30*edge*edge*(3-2*edge);
 const depth=.96+.04*Math.max(0,Math.min(1,relativeDepth)),shade=(.58+.42*diffuse)*rim*depth;
 return [1-strength+strength*shade,strength*.10*Math.pow(Math.max(0,nx*H[0]+ny*H[1]+nz*H[2]),40)];
}
export function installSurfaceLighting(material){
 const uniforms={depthStrength:{value:0},depthCentre:{value:1},depthRadius:{value:1}};
 material.userData.depthLighting=uniforms;
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 epmNormal; varying vec3 epmView;');
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nepmNormal = normalMatrix * normal; epmView = -mvPosition.xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 epmNormal; varying vec3 epmView; uniform float depthStrength; uniform float depthCentre; uniform float depthRadius;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec3 epmN=normalize(epmNormal);if(epmN.z<0.0)epmN=-epmN;
   vec3 epmL=normalize(vec3(-.45,.65,1.0));vec3 epmH=normalize(epmL+vec3(0.0,0.0,1.0));
   float epmDiffuse=max(0.0,dot(epmN,epmL));float epmRim=.70+.30*smoothstep(0.0,.55,epmN.z);
   float epmDepth=.96+.04*clamp(.5+(depthCentre-epmView.z)/(2.0*depthRadius),0.0,1.0);
   float epmGain=mix(1.0,(.58+.42*epmDiffuse)*epmRim*epmDepth,depthStrength);
   float epmSpec=depthStrength*.10*pow(max(0.0,dot(epmN,epmH)),40.0);
   diffuseColor.rgb=diffuseColor.rgb*epmGain+vec3(epmSpec);
  `);
 };
 material.customProgramCacheKey=()=>'epm-smooth-depth-v1';
 return material;
}
