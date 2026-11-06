// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden.
// Small WebM writer for a single VP8/VP9 video track. No external encoder service.
const bytes=(...parts)=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let i=0;for(const p of parts){out.set(p,i);i+=p.length;}return out;};
const hex=s=>Uint8Array.from(s.match(/../g),x=>parseInt(x,16));
function size(n){for(let width=1;width<=8;width++)if(n<2**(7*width)-1){const b=new Uint8Array(width);let value=n;for(let i=width-1;i>=0;i--){b[i]=value%256;value=Math.floor(value/256);}b[0]|=1<<(8-width);return b;}throw Error('Video is too large.');}
function uint(n){const a=[];do{a.unshift(n%256);n=Math.floor(n/256);}while(n);return Uint8Array.from(a);}
const text=s=>new TextEncoder().encode(s),element=(id,data)=>bytes(hex(id),size(data.length),data),number=(id,n)=>element(id,uint(n));
export function muxWebM(chunks,width,height,fps,codec){
  if(!chunks.length)throw Error('The video encoder produced no frames.');
  const header=element('1a45dfa3',bytes(number('4286',1),number('42f7',1),number('42f2',4),number('42f3',8),element('4282',text('webm')),number('4287',4),number('4285',2)));
  const duration=new Uint8Array(8);new DataView(duration.buffer).setFloat64(0,(Math.max(...chunks.map(c=>c.timestamp))+1000000/fps)/1000);
  const info=element('1549a966',bytes(number('2ad7b1',1000000),element('4d80',text('EPM Studio')),element('5741',text('EPM Studio')),element('4489',duration)));
  const tracks=element('1654ae6b',element('ae',bytes(number('d7',1),number('73c5',1),number('83',1),number('9c',0),element('86',text(codec==='vp8'?'V_VP8':'V_VP9')),number('23e383',Math.round(1e9/fps)),element('e0',bytes(number('b0',width),number('ba',height))))));
  const clusters=[];let start=-1,blocks=[];
  const finish=()=>{if(blocks.length)clusters.push(element('1f43b675',bytes(number('e7',start),...blocks)));blocks=[];};
  for(const chunk of chunks){const stamp=Math.round(chunk.timestamp/1000);if(start<0||stamp-start>=1000){finish();start=stamp;}const relative=stamp-start;blocks.push(element('a3',bytes(Uint8Array.of(0x81,(relative>>8)&255,relative&255,chunk.key?0x80:0),chunk.data)));}finish();
  return new Blob([header,element('18538067',bytes(info,tracks,...clusters))],{type:'video/webm'});
}
export async function videoConfig(width,height,fps){
  if(!globalThis.VideoEncoder||!globalThis.VideoFrame)return null;
  for(const codec of ['vp09.00.10.08','vp8']){const config={codec,width,height,framerate:fps,bitrate:width>=3840?40000000:width>=2560?24000000:14000000,latencyMode:'quality'};try{if((await VideoEncoder.isConfigSupported(config)).supported)return config;}catch{}}
  return null;
}
export async function encodeRotation(canvas,config,seconds,renderFrame,onProgress){
  const fps=config.framerate,total=Math.round(seconds*fps),chunks=[];let failure;
  const encoder=new VideoEncoder({output(chunk){const data=new Uint8Array(chunk.byteLength);chunk.copyTo(data);chunks.push({data,timestamp:chunk.timestamp,key:chunk.type==='key'});},error(error){failure=error;}});
  try{encoder.configure(config);for(let i=0;i<total;i++){
    if(failure)throw failure;await renderFrame(i/total);
    const frame=new VideoFrame(canvas,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});
    try{encoder.encode(frame,{keyFrame:i%fps===0});}finally{frame.close();}
    if(encoder.encodeQueueSize>4)await encoder.flush();
    onProgress((i+1)/total);if(i%4===0)await new Promise(r=>setTimeout(r,0));
  }await encoder.flush();if(failure)throw failure;return muxWebM(chunks,canvas.width,canvas.height,fps,config.codec);
  }finally{if(encoder.state!=='closed')encoder.close();}
}
