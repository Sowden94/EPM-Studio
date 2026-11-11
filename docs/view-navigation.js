// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden.
export const MIN_ZOOM=.4,MAX_ZOOM=6;
export function viewBounds(radius,zoom,aspect,pan=[0,0]){
 const span=radius*1.12/zoom,x=span*Math.max(1,aspect),y=span*Math.max(1,1/aspect);
 return {left:pan[0]-x,right:pan[0]+x,top:pan[1]+y,bottom:pan[1]-y};
}
export function zoomAt(radius,zoom,pan,factor,aspect,anchor=[0,0]){
 const next=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,zoom*factor)),old=viewBounds(radius,zoom,aspect),now=viewBounds(radius,next,aspect);
 return {zoom:next,pan:[pan[0]+anchor[0]*(old.right-now.right),pan[1]+anchor[1]*(old.top-now.top)]};
}
export function panByPixels(radius,zoom,pan,width,height,dx,dy){
 const b=viewBounds(radius,zoom,width/height,pan);
 return [pan[0]-dx*(b.right-b.left)/width,pan[1]+dy*(b.top-b.bottom)/height];
}
