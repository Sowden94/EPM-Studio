// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden.
// Orthographic sphere/capsule renderer for the software fallback.
// Each fragment has real model depth, so atom/bond overlaps are resolved together.
const cache=new WeakMap(),light=[-6,9,14],lightLength=Math.hypot(...light);
light.forEach((v,i)=>light[i]=v/lightLength);
export function atomColour(rgb,nx,ny,nz,z,radius,strength,visibility=1,fadeStrength=strength){
 const diffuse=Math.max(0,nx*light[0]+ny*light[1]+nz*light[2]);
 const gain=1-strength+strength*(.19+.81*diffuse*visibility);
 let fog=0;if(fadeStrength){const t=Math.max(0,Math.min(1,(radius-z)/(2*radius/fadeStrength)));fog=t*t*(3-2*t);}
 return rgb.map((c,j)=>{const lit=c*gain;return lit*(1-fog)+[252,253,255][j]*fog;});
}
export function renderBallStick(ctx,atoms,bonds,points,scale,colours,strength,radius,fadeStrength=strength){
 const {width:w,height:h}=ctx.canvas,image=ctx.getImageData(0,0,w,h),pixels=image.data;
 let buffers=cache.get(ctx.canvas);if(!buffers||buffers.w!==w||buffers.h!==h){buffers={w,h,depth:new Float32Array(w*h),owners:new Int16Array(w*h)};cache.set(ctx.canvas,buffers);}
 const {depth,owners}=buffers;depth.fill(-Infinity);owners.fill(-2);
 const rgb=hex=>hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16));
 const spheres=points.map((p,i)=>({x:(p[0]-w/2)/scale,y:-(p[1]-h/2)/scale,z:p[2],r:atoms[i].el==='H'?.20:.34,i}));
 let blockers=[];
 const nearby=(p,reach,owner)=>spheres.filter(a=>a.i!==owner&&Math.hypot(a.x-(p[0]-w/2)/scale,a.y+(p[1]-h/2)/scale,a.z-p[2])<reach);
 const paint=(x,y,z,nx,ny,nz,colour,owner,coverage)=>{
  const pixel=y*w+x;if(z<depth[pixel])return;depth[pixel]=z;owners[pixel]=owner;
  let visibility=1;
  if(strength&&blockers.length){const px=(x+.5-w/2)/scale+nx*.008,py=-(y+.5-h/2)/scale+ny*.008,pz=z+nz*.008;for(const a of blockers){const dx=a.x-px,dy=a.y-py,dz=a.z-pz,t=dx*light[0]+dy*light[1]+dz*light[2];if(t<=.01||t>3)continue;const distance=Math.sqrt(Math.max(0,dx*dx+dy*dy+dz*dz-t*t)),edge=(distance-a.r+.06)/.12;if(edge<1)visibility=Math.min(visibility,.25+.75*Math.max(0,edge));}}
  const lit=atomColour(colour,nx,ny,nz,z,radius,strength,visibility,fadeStrength);
  for(let j=0;j<3;j++)pixels[pixel*4+j]=pixels[pixel*4+j]*(1-coverage)+lit[j]*coverage;
 };
 const sphere=(p,r,colour,owner)=>{
  blockers=nearby(p,2.5,owner);
  const rp=r*scale,x0=Math.max(0,Math.floor(p[0]-rp-1)),x1=Math.min(w-1,Math.ceil(p[0]+rp+1)),y0=Math.max(0,Math.floor(p[1]-rp-1)),y1=Math.min(h-1,Math.ceil(p[1]+rp+1));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const px=x+.5-p[0],py=y+.5-p[1],distance=Math.hypot(px,py);if(distance>rp+.5)continue;
   const nx=px/rp,ny=-py/rp,nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny));paint(x,y,p[2]+r*nz,nx,ny,nz,colour,owner,Math.min(1,rp+.5-distance));
  }
 };
 const capsule=(a,b,r,colour)=>{
  const dx=(b[0]-a[0])/scale,dy=-(b[1]-a[1])/scale,dz=b[2]-a[2],length=Math.hypot(dx,dy,dz);if(length<1e-8)return;
  blockers=nearby(a,length+2.5,-1);
  const kx=dx/length,ky=dy/length,kz=dz/length,A=1-kz*kz,rp=r*scale,sx=b[0]-a[0],sy=b[1]-a[1],screenLength=sx*sx+sy*sy;
  const x0=Math.max(0,Math.floor(Math.min(a[0],b[0])-rp-1)),x1=Math.min(w-1,Math.ceil(Math.max(a[0],b[0])+rp+1)),y0=Math.max(0,Math.floor(Math.min(a[1],b[1])-rp-1)),y1=Math.min(h-1,Math.ceil(Math.max(a[1],b[1])+rp+1));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const t=screenLength?Math.max(0,Math.min(1,((x+.5-a[0])*sx+(y+.5-a[1])*sy)/screenLength)):0,distance=Math.hypot(x+.5-a[0]-t*sx,y+.5-a[1]-t*sy);if(distance>rp+.5)continue;
   const u=(x+.5-a[0])/scale,v=-(y+.5-a[1])/scale,q=u*kx+v*ky,B=-2*q*kz,C=u*u+v*v-q*q-r*r,disc=B*B-4*A*C;
   let front=-Infinity,nx=0,ny=0,nz=1;
   if(A>1e-10&&disc>=0){const z=(-B+Math.sqrt(disc))/(2*A),along=q+z*kz;if(along>=0&&along<=length){front=z;nx=(u-kx*along)/r;ny=(v-ky*along)/r;nz=(z-kz*along)/r;}}
   for(const end of [[0,0,0],[dx,dy,dz]]){const ex=u-end[0],ey=v-end[1],d=r*r-ex*ex-ey*ey;if(d>=0){const ez=Math.sqrt(d),z=end[2]+ez;if(z>front){front=z;nx=ex/r;ny=ey/r;nz=ez/r;}}}
   if(Number.isFinite(front))paint(x,y,a[2]+front,nx,ny,nz,colour,-1,Math.min(1,rp+.5-distance));
  }
 };
 for(const [i,j,order] of bonds){const a=points[i],b=points[j],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,n=order>=2?Math.round(order):1;for(let k=0;k<n;k++){const offset=(k-(n-1)/2)*scale*.19,ox=-dy/length*offset,oy=dx/length*offset;capsule([a[0]+ox,a[1]+oy,a[2]],[b[0]+ox,b[1]+oy,b[2]],.075,[101,120,142]);}}
 atoms.forEach((atom,i)=>sphere(points[i],atom.el==='H'?.20:.34,rgb(colours[atom.el]||'#7b6b9b'),i));
 ctx.putImageData(image,0,0);
 return points.map((p,i)=>{const x=Math.round(p[0]),y=Math.round(p[1]);return x>=0&&x<w&&y>=0&&y<h&&owners[y*w+x]===i;});
}
