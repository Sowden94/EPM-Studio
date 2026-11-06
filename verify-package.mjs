// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden. See LICENSE for terms.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from './functions/api/recognize.js';
const root='docs';
for(const name of ['index.html','app.js','style.css','browser-epm-worker.js','vendor/openchemlib/resources.json'])assert(fs.existsSync(path.join(root,name)),name);
for(const name of fs.readdirSync(root).filter(n=>n.endsWith('.js'))){const source=fs.readFileSync(path.join(root,name),'utf8');for(const match of source.matchAll(/(?:from\s+|import\s*)['"](\.\.?\/[^'"]+)['"]/g))assert(fs.existsSync(path.resolve(root,match[1])),name+' import '+match[1]);}
const html=fs.readFileSync('docs/index.html','utf8');for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const ref=m[1];if(!/^(https?:|data:)/.test(ref)&&!ref.includes('#'))assert(fs.existsSync(path.resolve(root,ref)),ref);}
assert.equal((await onRequestGet()).status,200);assert.equal((await (await onRequestGet()).json()).imageRecognition,true);
assert.equal((await onRequestPost({request:new Request('https://test.example/api/recognize',{method:'POST'})})).status,403);
const app=fs.readFileSync('docs/app.js','utf8');assert(!app.includes("fetch('/api/recognize'"));assert(app.includes("new URL('api/recognize',document.baseURI)"));
console.log('Portable static paths and Cloudflare Pages adapter checked.');
