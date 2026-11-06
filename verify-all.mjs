// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden. See LICENSE for terms.
import {spawnSync} from 'node:child_process';
for(const file of ['verify-browser-epm.mjs','verify-sketcher.mjs','verify-image-import.mjs','verify.mjs','verify-package.mjs']){const result=spawnSync(process.execPath,[file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);}
