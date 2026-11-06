// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden. See LICENSE for terms.
import {POST} from '../../server/recognize.js';
export function onRequestGet(){return Response.json({imageRecognition:true},{headers:{'Cache-Control':'no-store'}});}
export function onRequestPost({request}){return POST(request);}
