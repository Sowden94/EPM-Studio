// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden. See LICENSE for terms.
import {calculateBrowserEpm} from './browser-engine.js';
self.onmessage=async({data})=>{try{const result=await calculateBrowserEpm(data.graph,message=>self.postMessage({type:'progress',message}));self.postMessage({type:'result',result});}catch(error){self.postMessage({type:'error',message:error.message||'The browser calculation failed.'});}};
