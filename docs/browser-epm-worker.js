import {calculateBrowserEpm} from './browser-engine.js';
self.onmessage=async({data})=>{try{const result=await calculateBrowserEpm(data.graph,message=>self.postMessage({type:'progress',message}));self.postMessage({type:'result',result});}catch(error){self.postMessage({type:'error',message:error.message||'The browser calculation failed.'});}};
