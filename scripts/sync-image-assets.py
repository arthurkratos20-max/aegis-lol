import json,pathlib,urllib.request,concurrent.futures,time,io
from PIL import Image
root=pathlib.Path(__file__).resolve().parent.parent/'public/assets/riot'
d=json.load(open(root.parents[1]/'data/pt_BR.json'));v=d['version'];jobs={}
def icon(kind,name):
 path='icons/'+kind+'/'+name;jobs[path]=(f'https://ddragon.leagueoflegends.com/cdn/{v}/img/{kind}/{name}',False)
for c in d['champions'].values():
 icon('champion',c['image']['full']);icon('passive',c['passive']['image']['full'])
 for sp in c['spells']:icon('spell',sp['image']['full'])
 jobs[f'splash/{c["id"]}_0.webp']=(f'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{c["id"]}_0.jpg',True)
for id,it in d['items'].items():icon('item',it['image']['full'])
for t in d['runes']:
 for name in [t['icon']]+[r['icon'] for row in t['slots'] for r in row['runes']]:jobs['icons/'+name]=(f'https://ddragon.leagueoflegends.com/cdn/img/{name}',False)
def fetch(job):
 name,(url,convert)=job;p=root/name
 if p.exists():return None
 for n in range(3):
  try:
   raw=urllib.request.urlopen(url,timeout=20).read()
   if convert:
    im=Image.open(io.BytesIO(raw));im.thumbnail((960,540));b=io.BytesIO();im.save(b,'WEBP',quality=76);raw=b.getvalue()
   elif not raw.startswith(b'\x89PNG'):raise ValueError('Not PNG')
   p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw);return None
  except Exception as e:
   if n==2:return {'path':name,'error':str(e)}
errors=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=64) as pool:
 for i,e in enumerate(pool.map(fetch,jobs.items()),1):
  if e:errors.append(e)
  if i%200==0:print(f'{i}/{len(jobs)} images',flush=True)
(root/'manifest.json').write_text(json.dumps({'patch':v,'paths':list(jobs),'errors':errors},indent=2))
print(json.dumps({'total':len(jobs),'errors':errors,'bytes':sum(p.stat().st_size for p in root.rglob('*') if p.is_file())}),flush=True)
if errors:raise SystemExit(1)
