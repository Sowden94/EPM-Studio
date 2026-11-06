// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden. See LICENSE for terms.
const API='https://api.naturalproducts.net/latest';
const MAX=10*1024*1024;
const reply=(body        ,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(request        ){
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'Open the recognition tool from this website.'},403);
 const length=Number(request.headers.get('Content-Length'));
 if(length>MAX+65536)return reply({error:'Choose an image smaller than 10 MB.'},413);
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),90000);
 try{
  const body=await request.formData(),file=body.get('image');
  if(!(file instanceof File)||!file.size||file.size>MAX||!['image/png','image/jpeg','image/webp'].includes(file.type))return reply({error:'Choose a PNG, JPG or WebP image smaller than 10 MB.'},400);
  const upload=new FormData();upload.append('file',file,'structure.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type]||'png'));
  const result=await fetch(API+'/ocsr/process-upload',{method:'POST',body:upload,signal:controller.signal});
  if(!result.ok)return reply({error:'The recognition service could not read this image. Try a tightly cropped, clear image of one structure.'},502);
  const prediction=await result.json()                             ;
  const structures=Array.isArray(prediction.smiles)?prediction.smiles:prediction.smiles?[prediction.smiles]:[];
  if(structures.length!==1||!structures[0]?.trim()||structures[0].length>5000)return reply({error:structures.length>1?'Several structures were detected. Crop the image to one molecule and try again.':'No structure was recognised. Try a clearer image cropped to one molecule.'},422);
  const smiles=structures[0].trim();
  const coordinates=await fetch(API+'/convert/mol2D?'+new URLSearchParams({smiles,toolkit:'rdkit'}),{signal:controller.signal});
  if(!coordinates.ok)return reply({error:'The recognised structure could not be converted to an editable drawing.'},502);
  const text=await coordinates.text();let molblock=text;
  if(text.trim().startsWith('{')){try{molblock=JSON.parse(text).molblock}catch{return reply({error:'The structure service returned an unreadable drawing.'},502)}}
  if(typeof molblock!=='string'||!molblock.includes('V2000')||molblock.length>200000)return reply({error:'This structure is too complex for the current drawing editor.'},422);
  return reply({smiles,molblock,source:'DECIMER · Cheminformatics Microservice; RDKit 2D coordinates'});
 }catch(error){return reply({error:controller.signal.aborted?'Recognition timed out. Try a smaller, tightly cropped image.':'Recognition is unavailable right now.'},502)}finally{clearTimeout(timeout)}
}
