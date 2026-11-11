// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden.
export function insidePolygon(point, polygon){
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
export function selectionPolygon(points){
 if(points.length<2)return points;
 const left=Math.min(...points.map(p=>p.x)),right=Math.max(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y)),bottom=Math.max(...points.map(p=>p.y));
 let twiceArea=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];twiceArea+=a.x*b.y-b.x*a.y;}
 return Math.abs(twiceArea)<.3*(right-left)*(bottom-top)||points.length<3?[{x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}]:points;
}
export function selectionEditor(Base,$,announce=()=>{}){
 return class extends Base{
  get selected(){return this._selected??=new Set();}
  constructor(...args){
   super(...args);
   $('p-delete-selected').onclick=()=>this.deleteSelected();
   $('p-select-all').onclick=()=>this.selectAll();
   this.board.addEventListener('pointercancel',()=>this.cancelSelection(),{capture:true});
  }
  selectionBounds(){const atoms=this.graph.atoms.filter(a=>this.selected.has(a.id));if(!atoms.length)return null;return {left:Math.min(...atoms.map(a=>a.x))-28,right:Math.max(...atoms.map(a=>a.x))+28,top:Math.min(...atoms.map(a=>a.y))-32,bottom:Math.max(...atoms.map(a=>a.y))+32};}
  setGraph(g,record=true){this.selected.clear();return super.setGraph(g,record);}
  undo(){this.selected.clear();return super.undo();}
  redo(){this.selected.clear();return super.redo();}
  setTool(tool){if(this.locked)return;if(!['lasso','move'].includes(tool))this.selected.clear();super.setTool(tool);}
  selectAll(){if(this.locked)return;this.tool='lasso';this.anchor=null;this.selected.clear();for(const a of this.graph.atoms)this.selected.add(a.id);this.render();announce(this.selected.size+' atoms selected. Drag the highlighted area to move them, or choose Delete selected.');}
  deleteSelected(){
   if(this.locked||!this.selected.size)return;
   const count=this.selected.size;this.snapshot();this.graph.atoms=this.graph.atoms.filter(a=>!this.selected.has(a.id));this.graph.bonds=this.graph.bonds.filter(b=>!this.selected.has(b.a)&&!this.selected.has(b.b));this.selected.clear();this.anchor=null;this.changed();announce('Deleted '+count+' selected atoms and their attached bonds. Undo restores them.');this.board.focus({preventScroll:true});
  }
  activate(p,t={}){
   if(this.locked)return;
   if(t.bond!==undefined&&(this.tool.startsWith('bond')||this.tool==='move')){
    const b=this.graph.bonds[t.bond];if(!b)return;this.snapshot();b.order=b.order===1?2:b.order===2?3:1;delete b.stereo;delete b.stereoFrom;this.anchor=null;this.changed();announce((b.order===1?'Single':b.order===2?'Double':'Triple')+' bond. Click again to cycle bond order.');return;
   }
   if(this.tool==='lasso'){
    this.selected.clear();if(t.atom){const component=globalThis.ProductChem.components(this.graph).find(c=>c.atoms.some(a=>a.id===t.atom));for(const a of component?.atoms||[])this.selected.add(a.id);}this.render();return;
   }
   return super.activate(p,t);
  }
  down(e){
   if(this.locked||e.button>0)return;
   const p=this.point(e),bounds=this.selectionBounds();
   const within=bounds&&p.x>=bounds.left&&p.x<=bounds.right&&p.y>=bounds.top&&p.y<=bounds.bottom;
   if(this.tool==='lasso'||(this.tool==='move'&&within)){
    e.preventDefault();this.anchor=null;this.cursor=p;
    this.selectionDrag={mode:within?'move':'lasso',id:e.pointerId,start:p,points:[p],before:this.getGraph(),original:new Set(this.selected),previous:new Set(e.shiftKey?this.selected:[]),moved:false};
    this.drag={id:e.pointerId,selection:true};if(!within&&!e.shiftKey)this.selected.clear();this.board.setPointerCapture?.(e.pointerId);this.render();return;
   }
   return super.down(e);
  }
  motion(e){
   const d=this.selectionDrag;if(!d)return super.motion(e);if(e.pointerId!==d.id)return;
   const p=this.point(e);if(Math.hypot(p.x-d.start.x,p.y-d.start.y)<5&&!d.moved)return;d.moved=true;
   if(d.mode==='move'){
    this.graph=structuredClone(d.before);for(const a of this.graph.atoms)if(this.selected.has(a.id)){a.x+=p.x-d.start.x;a.y+=p.y-d.start.y;}this.render();
   }else{
    if(Math.hypot(p.x-d.points.at(-1).x,p.y-d.points.at(-1).y)>2)d.points.push(p);
    $('p-preview').innerHTML='<path d="M '+selectionPolygon(d.points).map(p=>p.x+' '+p.y).join(' L ')+' Z" fill="#3279c51c" stroke="#2869b4" stroke-width="2" stroke-dasharray="6 4" pointer-events="none"/>';
   }
  }
  up(e){
   const d=this.selectionDrag;if(!d)return super.up(e);if(e.pointerId!==d.id)return;
   this.motion(e);this.selectionDrag=null;this.drag=null;$('p-preview').replaceChildren();
   if(d.mode==='move'){
    if(d.moved){this.history.push(d.before);if(this.history.length>100)this.history.shift();this.future=[];this.changed();announce('Moved '+this.selected.size+' selected atoms.');}else this.render();
   }else if(d.moved&&d.points.length>=2){
    this.selected.clear();for(const id of d.previous)this.selected.add(id);for(const a of this.graph.atoms)if(insidePolygon(a,selectionPolygon(d.points)))this.selected.add(a.id);this.render();announce(this.selected.size?this.selected.size+' atoms selected. Drag the highlighted area to move them, or choose Delete selected.':'No atoms selected. Draw a loop around the structure.');
   }else this.activate(this.point(e),this.target(e,this.point(e)));
  }
  cancelSelection(){const d=this.selectionDrag;if(!d)return;if(d.mode==='move')this.graph=d.before;this.selected.clear();for(const id of d.original)this.selected.add(id);this.selectionDrag=null;this.drag=null;$('p-preview').replaceChildren();this.render();}
  keydown(e){
   if(this.locked)return;
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){e.preventDefault();this.selectAll();return;}
   if(e.key==='Escape'){this.cancelSelection();this.selected.clear();this.anchor=null;this.render();return;}
   if(this.selected.size&&['Delete','Backspace'].includes(e.key)){e.preventDefault();this.deleteSelected();return;}
   if(this.selected.size&&e.key.startsWith('Arrow')){e.preventDefault();this.snapshot();const step=e.shiftKey?20:5;for(const a of this.graph.atoms)if(this.selected.has(a.id)){a.x+=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0;a.y+=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;}this.changed();return;}
   return super.keydown(e);
  }
  render(cursor=false){
   super.render(cursor);for(const id of this.selected)if(!this.atom(id))this.selected.delete(id);
   const box=this.selectionBounds();if(box){
    let markup='<rect x="'+box.left+'" y="'+box.top+'" width="'+(box.right-box.left)+'" height="'+(box.bottom-box.top)+'" rx="12" fill="#3279c50a" stroke="#2869b4" stroke-width="1.8" stroke-dasharray="6 4"/>';
    for(const b of this.graph.bonds)if(this.selected.has(b.a)&&this.selected.has(b.b)){const a=this.atom(b.a),c=this.atom(b.b);markup+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+c.x+'" y2="'+c.y+'" stroke="#2876c2" stroke-opacity=".18" stroke-width="14" stroke-linecap="round"/>';}
    for(const a of this.graph.atoms)if(this.selected.has(a.id))markup+='<circle cx="'+a.x+'" cy="'+a.y+'" r="24" fill="none" stroke="#2876c2" stroke-width="2"/>';
    $('p-selection').innerHTML+=markup;
   }
   const button=$('p-delete-selected');button.hidden=!this.selected.size;button.disabled=this.locked||!this.selected.size;
   $('p-selected-status').textContent=this.selected.size?this.selected.size+' atoms selected':'';
   if(this.tool==='lasso')$('p-tool-status').textContent=this.selected.size?'Drag selection to move':'Lasso · draw a loop to select';
  }
 };
}
