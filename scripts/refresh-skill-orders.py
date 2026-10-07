#!/usr/bin/env python3
"""Refresh numeric skill-order facts. Never fetch during rendering or infer matchup win rates.
Usage: python3 scripts/refresh-skill-orders.py [--cache /tmp/aegis-skill-pages]
Validate generated point paths with npm test before committing a new snapshot.
"""
import urllib.request,re,json,html,concurrent.futures,os,argparse,pathlib
root=str(pathlib.Path(__file__).resolve().parents[1])
args=argparse.ArgumentParser();args.add_argument('--cache',default='/tmp/aegis-skill-pages');cache=args.parse_args().cache
os.makedirs(cache,exist_ok=True)
data=json.load(open(root+'/public/data/pt_BR.json'))
def download(id):
 p=f'{cache}/{id}.html'
 if not os.path.exists(p):
  content=urllib.request.urlopen(f'https://metabot.gg/en/league/champion/{id}/abilities',timeout=22).read().decode()
  open(p,'w').write(content)
 return id
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for n,id in enumerate(pool.map(download,data['champions']),1):
  if n%20==0:print('Fetched',n,flush=True)
d=data;roles={'TOP':'Top','JUNGLE':'Jungle','MIDDLE':'Mid','BOTTOM':'Bot','UTILITY':'Support'};out={}
for id in d['champions']:
 p=f'{cache}/{id}.html'
 if not os.path.exists(p):continue
 s=open(p).read();source_patch=re.search(r'Skill Order \(Patch ([0-9.]+)\)',s)
 if not source_patch:raise ValueError(f'Missing source patch: {id}')
 actual=source_patch.group(1).split('.');expected=data['version'].split('.')
 if actual[1]!=expected[1] or int(actual[0]) not in [int(expected[0]),int(expected[0])+10]:raise ValueError(f'Patch mismatch for {id}: {source_patch.group(1)} / {data["version"]}')
 rs=re.findall(r'id="skill-role-(\w+)"',s);panels=re.split(r'<div class="[^" ]*__rolePanel">',s)[1:];lanes={}
 for role,p in zip(rs,panels):
  if role not in roles:continue
  lead=re.search(r'<p class="[^" ]*__lead">(.*?)</p>',p,re.S);txt=html.unescape(re.sub('<[^>]*>','',lead.group(1))) if lead else '';games=re.search(r'of ([\d,]+) games',txt);priority=re.findall(r'([QWER]) \(',txt)
  rows=re.findall(r'role="rowheader">([QWER])</span>((?:<span role="cell"[^>]*>[^<]*</span>){18})',p);seq=['']*18;valid=True
  for k,cells in rows:
   for i,v in enumerate(re.findall(r'<span role="cell"[^>]*>([^<]*)</span>',cells)):
    if v:
     if seq[i]:valid=False
     seq[i]=k
  if games and len(priority)>=3:lanes[roles[role]]={'sequence':seq if len(rows)==4 and all(seq) and valid else [],'priority':priority,'games':int(games.group(1).replace(',',''))}
 if not panels:
  m=re.search(r'<p class="[^" ]*__lead">(.*?)</p>',s,re.S);t=html.unescape(re.sub('<[^>]*>','',m.group(1))) if m else '';r=re.search(r' (Top|Jungle|Mid|Bot|Support) maxes',t)
  if r:rs=[next(k for k,v in roles.items() if v==r.group(1))];panels=[s]
 # Parse single-role pages too.
 for role,p in zip(rs,panels):
  if roles.get(role) in lanes:continue
  m=re.search(r'<p class="[^" ]*__lead">(.*?)</p>',p,re.S);t=html.unescape(re.sub('<[^>]*>','',m.group(1))) if m else '';g=re.search(r'of ([\d,]+) games',t);pr=re.findall(r'([QWER]) \(',t);seq=['']*18
  rows=re.findall(r'role="rowheader">([QWER])</span>((?:<span role="cell"[^>]*>[^<]*</span>){18})',p)
  for k,cells in rows:
   for i,v in enumerate(re.findall(r'<span role="cell"[^>]*>([^<]*)</span>',cells)):
    if v:seq[i]=k
  if g and len(pr)>=3:lanes[roles[role]]={'sequence':seq if len(rows)==4 and all(seq) else [],'priority':pr,'games':int(g.group(1).replace(',',''))}
 # Keep numeric alternative max orders as options, never as invented matchup outcomes.
 for role,p in zip(rs,panels):
  lane=roles.get(role)
  if lane not in lanes:continue
  alternatives=[]
  for tr in re.findall(r'<tr>(.*?)</tr>',p,re.S):
   order=re.search(r'<strong>([QWER] &gt; [QWER] &gt; [QWER])</strong>',tr)
   games=re.search(r'data-label="Games">([\d,]+)</td>',tr)
   if order and games:
    priority=html.unescape(order.group(1)).split(' > ');n=int(games.group(1).replace(',',''))
    if priority!=lanes[lane]['priority'] and n>=100:alternatives.append({'priority':priority,'games':n})
  lanes[lane]['alternatives']=alternatives[:2]
 out[id]={'url':f'https://metabot.gg/en/league/champion/{id}/abilities','lanes':lanes}
report={'patch':d['version'],'retrievedAt':__import__('datetime').datetime.now(__import__('datetime').timezone.utc).date().isoformat(),'source':'MetaBot.gg ranked level-up timelines','champions':out}
open(root+'/src/skillOrderSnapshot.ts','w').write('/* Numeric ranked skill-order snapshot; refreshed with scripts/refresh-skill-orders.py. */\nexport const skillOrderSnapshot = '+json.dumps(report,ensure_ascii=False,indent=1)+';\n')
print('Snapshot:',len(out),'champions;',sum(len(c['lanes']) for c in out.values()),'lanes;',sum(bool(l['sequence']) for c in out.values() for l in c['lanes'].values()),'full paths; missing',[id for id in d['champions'] if not out.get(id,{}).get('lanes')])
