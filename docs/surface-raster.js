// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden.
// Nearest visible surface only: interpolate colours, then apply opacity once.
export function rasterSurface(ctx, mesh, positions, colours, opacity) {
  const w=ctx.canvas.width,h=ctx.canvas.height,image=ctx.createImageData(w,h),out=image.data;
  const depth=new Float32Array(w*h);depth.fill(-Infinity);
  for(let i=0;i<out.length;i+=4){out[i]=252;out[i+1]=253;out[i+2]=255;out[i+3]=255;}
  const f=mesh.faces;
  for(let k=0;k<f.length;k+=3){
    const a=f[k]*3,b=f[k+1]*3,c=f[k+2]*3;
    const ax=positions[a],ay=positions[a+1],bx=positions[b],by=positions[b+1],cx=positions[c],cy=positions[c+1];
    const area=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(area)<1e-8)continue;
    const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(w-1,Math.ceil(Math.max(ax,bx,cx)));
    const y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(h-1,Math.ceil(Math.max(ay,by,cy)));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const u=((by-cy)*(x+.5-cx)+(cx-bx)*(y+.5-cy))/area;
      const v=((cy-ay)*(x+.5-cx)+(ax-cx)*(y+.5-cy))/area,t=1-u-v;
      if(u< -1e-6||v< -1e-6||t< -1e-6)continue;
      const z=u*positions[a+2]+v*positions[b+2]+t*positions[c+2],pixel=y*w+x;
      if(z<depth[pixel])continue;depth[pixel]=z;
      for(let j=0;j<3;j++)out[pixel*4+j]=[252,253,255][j]*(1-opacity)+255*opacity*(u*colours[a+j]+v*colours[b+j]+t*colours[c+j]);
    }
  }
  ctx.putImageData(image,0,0);
}
