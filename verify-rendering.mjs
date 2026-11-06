// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import {rasterSurface} from './docs/surface-raster.js';
import {muxWebM} from './docs/video-export.js';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const ctx={canvas:{width:8,height:8},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(image){this.image=image;}};
const mesh={faces:[0,1,2]},positions=[0,0,1,8,0,1,0,8,1],colours=[1,0,0,0,1,0,0,0,1];
rasterSurface(ctx,mesh,positions,colours,.5);const first=ctx.image.data.slice();
rasterSurface(ctx,{faces:[0,1,2,0,1,2]},positions,colours,.5);
assert.deepEqual(ctx.image.data,first,'Repeated coplanar triangles must not darken the surface');
assert(first[4]>130&&first[5]>130&&first[6]>130,'Surface colour is smoothly interpolated');
rasterSurface(ctx,{faces:[3,4,5,0,1,2]},[...positions,0,0,-1,8,0,-1,0,8,-1],[...colours,0,0,0,0,0,0,0,0,0],.5);
assert.deepEqual(ctx.image.data,first,'Hidden back surface must not affect the visible colour');
console.log('Surface raster: smooth colour, nearest depth, no duplicate alpha accumulation passed.');
// Optional integration check with a real VP8 bitstream and ffprobe.
try{
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=size=320x180:rate=30','-t','1','-c:v','libvpx','-f','ivf','-y','/tmp/epm-quality.ivf']);
 const ivf=fs.readFileSync('/tmp/epm-quality.ivf'),chunks=[];let cursor=32;
 while(cursor<ivf.length){const length=ivf.readUInt32LE(cursor),timestamp=Number(ivf.readBigUInt64LE(cursor+4))*1e6/30,data=new Uint8Array(ivf.subarray(cursor+12,cursor+12+length));chunks.push({data,timestamp,key:!(data[0]&1)});cursor+=12+length;}
 fs.writeFileSync('/tmp/epm-quality.webm',new Uint8Array(await muxWebM(chunks,320,180,30,'vp8').arrayBuffer()));
 const result=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json','/tmp/epm-quality.webm'],{encoding:'utf8'}));
 assert.equal(result.streams[0].width,320);assert.equal(result.streams[0].height,180);assert.equal(Number(result.streams[0].nb_read_frames),30);assert(Math.abs(Number(result.format.duration)-1)<.01);
 console.log('WebM mux: ffprobe decoded all 30 VP8 frames; dimensions and 1-second duration passed.');
}catch(error){if(error.code==='ENOENT')console.log('ffmpeg unavailable; optional bitstream check skipped.');else throw error;}
