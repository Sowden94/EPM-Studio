// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 M. J. Sowden. See LICENSE for terms.
import {Molecule,ConformerGenerator,ForceFieldMMFF94,Resources} from './vendor/openchemlib/openchemlib.js';
import {partialCharges,graphMolfile,graphKey,surfaceMesh} from './browser-epm.js';
let ready=false;
export async function calculateBrowserEpm(graph,progress=()=>{},resources){
 if(!graph?.atoms?.length)throw Error('Draw a molecule first.');
 if(graph.atoms.filter(a=>a.element!=='H').length>40||graph.atoms.length>120)throw Error('Browser estimates currently support up to 40 non-hydrogen atoms and 120 drawn atoms.');
 progress('Loading the local chemistry engine…');
 if(!ready){Resources.register(resources||await (await fetch(new URL('./vendor/openchemlib/resources.json',import.meta.url))).text());ready=true;}
 const mol=Molecule.fromMolfile(graphMolfile(graph));mol.ensureHelperArrays(Molecule.cHelperParities);
 if(!mol||!mol.getAllAtoms())throw Error('The drawing could not be read.');
 if(mol.getFragmentNumbers(new Array(mol.getAllAtoms()).fill(0),false,false)>1)throw Error('Draw one connected molecule for a browser estimate. Calculate separate molecules individually.');
 progress('Generating a 3D conformer on this device…');
 const generator=new ConformerGenerator(42);if(!generator.initializeConformers(mol,{maxTorsionSets:400}))throw Error('Could not initialise a 3D structure for this molecule.');
 if(!generator.getNextConformerAsMolecule(mol))throw Error('Could not generate a valid 3D conformer. Try a simpler structure.');
 if(mol.getAllAtoms()>180)throw Error('The structure exceeds the browser limit after adding hydrogens.');
 let minimized=false;try{progress('Refining the geometry with MMFF94…');const ff=new ForceFieldMMFF94(mol,'MMFF94');minimized=ff.minimise({maxIts:500})===0;}catch{}
 const charges=partialCharges(mol),atoms=Array.from({length:mol.getAllAtoms()},(_,i)=>({el:mol.getAtomLabel(i),p:[mol.getAtomX(i),mol.getAtomY(i),mol.getAtomZ(i)]}));
 if(atoms.some(a=>a.p.some(v=>!Number.isFinite(v))))throw Error('The generated geometry contains invalid coordinates.');
 for(let i=0;i<atoms.length;i++)for(let j=0;j<i;j++)if(Math.hypot(...atoms[i].p.map((v,k)=>v-atoms[j].p[k]))<.35)throw Error('The generated geometry has overlapping atoms.');
 const centre=[0,1,2].map(k=>atoms.reduce((sum,a)=>sum+a.p[k],0)/atoms.length);atoms.forEach(a=>a.p=a.p.map((v,k)=>v-centre[k]));
 const bonds=Array.from({length:mol.getAllBonds()},(_,i)=>[mol.getBondAtom(0,i),mol.getBondAtom(1,i),mol.getBondOrder(i)]);
 progress('Calculating the estimated potential surface…');const mesh=surfaceMesh(atoms,charges),charge=Array.from({length:mol.getAllAtoms()},(_,i)=>mol.getAtomCharge(i)).reduce((a,b)=>a+b,0);
 return{name:mol.getMolecularFormula().formula+' · estimated EPM',atoms,bonds,charges,charge,estimated:true,meshes:{estimate:mesh},surfaceKind:'Smoothed van der Waals envelope; not an electron-density isosurface',method:'Gasteiger point-charge estimate',geometry:'OpenChemLib seeded conformer'+(minimized?' + MMFF94 minimisation':' (MMFF94 minimisation not converged or unavailable)'),geometryMinimized:minimized,software:'OpenChemLib 9.25.2; RDKit-derived Gasteiger parameters',grid:'Adaptive van der Waals surface grid',potentialUnits:'hartree/e (point-charge estimate)',potentialEvaluation:'Sum of Gasteiger atomic charges divided by distance in bohr; no quantum electron-density calculation',chargeIterations:12,multiplicity:'Not modelled',drawingKey:graphKey(graph),drawingGraph:graph};
}
