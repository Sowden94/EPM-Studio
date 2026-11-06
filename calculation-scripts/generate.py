import os,json,numpy as np
from pathlib import Path
os.chdir(Path(__file__).resolve().parents[1])
os.environ['OMP_NUM_THREADS']='2'
from rdkit import Chem
from rdkit.Chem import AllChem
from pyscf import gto,scf,lib,df
from pyscf.tools import cubegen
from skimage.measure import marching_cubes
lib.num_threads(2)
items=[('formaldehyde','Formaldehyde','C=O'),('ethanol','Ethanol','CCO'),('acetone','Acetone','CC(=O)C'),('benzene','Benzene','c1ccccc1'),('acetic-acid','Acetic acid','CC(=O)O'),('methylamine','Methylamine','CN')]
index=[]
for slug,name,smi in items:
 m=Chem.AddHs(Chem.MolFromSmiles(smi));AllChem.EmbedMolecule(m,randomSeed=42);AllChem.MMFFOptimizeMolecule(m)
 p=np.array(m.GetConformer().GetPositions());p-=p.mean(axis=0)
 mol=gto.M(atom=[(a.GetSymbol(),p[a.GetIdx()]) for a in m.GetAtoms()],basis='6-31g*',verbose=0)
 mf=scf.RHF(mol);mf.conv_tol=1e-9;energy=mf.kernel()
 assert mf.converged
 cube=cubegen.Cube(mol,nx=64,ny=64,nz=64,margin=4)
 coords=cube.get_coords();dm=mf.make_rdm1();rho=np.empty(len(coords))
 from pyscf.dft import numint
 for i in range(0,len(coords),8000):
  ao=mol.eval_gto('GTOval_sph',coords[i:i+8000]);rho[i:i+8000]=numint.eval_rho(mol,ao,dm)
 rho=rho.reshape(64,64,64);cube.write(rho,'docs/data/'+slug+'.cube','RHF/6-31G* total electron density e/bohr^3; MMFF94 geometry')
 origin=coords[0];spacing=np.array([np.linalg.norm(cube.box[i])/(63) for i in range(3)])
 def potential(points):
  values=np.empty(len(points))
  for i in range(0,len(points),400):
   pts=points[i:i+400]
   vn=sum(mol.atom_charge(j)/np.linalg.norm(pts-mol.atom_coord(j),axis=1) for j in range(mol.natm))
   ints=df.incore.aux_e2(mol,gto.fakemol_for_charges(pts))
   values[i:i+400]=vn-np.einsum('ijp,ij->p',ints,dm)
  return values
 esp=potential(coords).reshape(64,64,64)
 assert np.isfinite(esp).all()
 cube.write(esp,'docs/data/'+slug+'-esp.cube','RHF/6-31G* molecular electrostatic potential in atomic units (hartree/e); MMFF94 geometry')
 meshes={}
 for level in [.001,.002,.005]:
  verts,faces,_,_=marching_cubes(rho,level=level,spacing=spacing)
  pot=potential(verts+origin)
  verts=(verts+origin)*lib.param.BOHR
  meshes[str(level)]={'vertices':np.round(verts,4).ravel().tolist(),'faces':faces.ravel().tolist(),'potential':np.round(pot,7).tolist(),'potentialMin':float(pot.min()),'potentialMax':float(pot.max())}
 result={'name':name,'smiles':smi,'atoms':[{'el':a.GetSymbol(),'p':np.round(p[a.GetIdx()],5).tolist()} for a in m.GetAtoms()], 'bonds':[[b.GetBeginAtomIdx(),b.GetEndAtomIdx(),b.GetBondTypeAsDouble()] for b in m.GetBonds()], 'meshes':meshes,'potentialUnits':'hartree/e (atomic units)','potentialEvaluation':'Nuclear Coulomb potential minus electronic Coulomb integral; directly evaluated at each surface vertex','method':'RHF/6-31G*','geometry':'RDKit ETKDG embedding + MMFF94 optimization; no quantum geometry optimization','charge':0,'multiplicity':1,'energy':float(energy),'converged':bool(mf.converged),'electrons':mol.nelectron,'software':'PySCF '+__import__('pyscf').__version__,'grid':'64 × 64 × 64; 4 bohr margin'}
 open('docs/data/'+slug+'.json','w').write(json.dumps(result,separators=(',',':')))
 index.append({'id':slug,'name':name,'smiles':smi});print(name,energy,flush=True)
open('docs/data/index.json','w').write(json.dumps(index))

# Publish demand-loaded assets from the exact calculated datasets.
import subprocess,sys
subprocess.run([sys.executable, "calculation-scripts/prepare-assets.py"],check=True)
