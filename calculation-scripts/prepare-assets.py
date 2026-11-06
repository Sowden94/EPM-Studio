"""Split computed datasets for demand loading without changing scientific values."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]/'docs/data'
catalog=[]
for item in json.loads((root/'index.json').read_text()):
    d=json.loads((root/(item['id']+'.json')).read_text())
    meshes=d.pop('meshes');d['id']=item['id'];d['surfaceFiles']={}
    for level,mesh in meshes.items():
        name=f"{item['id']}-surface-{level}.json"
        (root/name).write_text(json.dumps(mesh,separators=(',',':')))
        d['surfaceFiles'][level]=name
    catalog.append(d)
(root/'catalog.json').write_text(json.dumps(catalog,separators=(',',':')))
