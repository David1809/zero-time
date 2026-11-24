#!/usr/bin/env python3
"""Construit le catalogue du manuel (pages utiles + leurres) et écrit la migration SQL de seed.
Source unique : les spécifications structurées (spec) ; le texte affiché en est dérivé ici.
Usage : python3 tools/catalog_build.py > supabase/migrations/028_seed_pages.sql"""
import json, itertools, random, re, sys
sys.path.insert(0, __file__.rsplit("/",1)[0])
from catalog_wires_def import F, ctext, atext, PL
EN={"noir":"black","rouge":"red","vert":"green","jaune":"yellow","blanc":"white","bleu":"blue"}
def en(x):
    return [EN.get(t,t) if isinstance(t,str) else t for t in x]
def bold(t): return re.sub(r"\b(noirs?|rouges?|verts?|jaunes?|blancs?|bleus?)\b",r"<strong>\1</strong>",t)
def si(cond,first):
    t=ctext(cond); 
    if t.startswith("il "): return ("S’" if first else "Sinon, s’")+t
    return ("Si " if first else "Sinon, si ")+t
FAM={4:"FA",5:"FB",6:"FC",7:"FD"}
pages=[]
for i,pg in enumerate(F):
    spec={"n":pg["n"],"cols":sorted(EN[c] for c in pg["cols"]),
          "rules":[{"c":en(list(c)),"a":en(list(a))} for c,a in pg["rules"]],"final":en(list(pg["final"]))}
    cols=pg["cols"]; lst=", ".join(cols[:-1])+" et "+cols[-1] if len(cols)>2 else " et ".join(cols)
    txt={"sig":f"{pg['n']} fils — exactement {lst}",
         "rules":[bold(si(c,j==0)+", "+atext(a)+".") for j,(c,a) in enumerate(pg["rules"])],
         "end":bold("Dans tous les autres cas, "+atext(pg["final"])+"."),
         "note":"Fils numérotés de haut en bas. Arrêtez-vous à la première consigne qui s’applique.",
         "stamp":pg["stamp"]}
    pages.append(dict(id=f"F{i+1:02d}",module="wires",family=FAM[pg["n"]],sig={"n":pg["n"],"cols":spec["cols"]},spec=spec,txt=txt))
# ---------------- digicode ----------------
random.seed(20261124)
PERMS=[p for p in itertools.permutations(range(10),4)]
def rtest(r,d):
    t=r["t"]
    return (d%2==0) if t=="even" else (d%2==1) if t=="odd" else (d>=r["k"]) if t=="ge" else (d<=r["k"])
def lamps(p,spec): return (sum(rtest(spec["red"],d) for d in p),sum(rtest(spec["blue"],d) for d in p))
def clue_ok(c,p):
    t=c["t"]
    if t=="sum": return sum(p)==c["v"]
    if t=="max": return max(p)==c["v"]
    if t=="min": return min(p)==c["v"]
    if t=="has": return c["v"] in p
    return c["v"] not in p
def mk_clue(p):
    t=random.choice(["sum","max","min","has","not"])
    if t=="sum": return {"t":t,"v":sum(p)}
    if t=="max": return {"t":t,"v":max(p)}
    if t=="min": return {"t":t,"v":min(p)}
    if t=="has": return {"t":t,"v":random.choice(p)}
    return {"t":t,"v":random.choice([d for d in range(10) if d not in p])}
def ctxt(c):
    return {"sum":f"la somme des quatre chiffres vaut {c.get('v')}","max":f"le plus grand chiffre est {c.get('v')}",
            "min":f"le plus petit chiffre est {c.get('v')}","has":f"le code contient le chiffre {c.get('v')}",
            "not":f"le code ne contient pas le chiffre {c.get('v')}"}[c["t"]]
def rtxt(r):
    return {"even":"un voyant par chiffre pair du code (le 0 est pair)","odd":"un voyant par chiffre impair du code",
            "ge":f"un voyant par chiffre du code supérieur ou égal à {r.get('k')}","le":f"un voyant par chiffre du code inférieur ou égal à {r.get('k')}"}[r["t"]]
def cand(spec,sig,clues):
    return [p for p in PERMS if lamps(p,spec)==sig and all(clue_ok(c,p) for c in clues)]
def sp(n): return "s" if n>1 else ""
PIN=[ # (famille, source, rouge, bleu, signatures, tampons)
 ("DA","piles",{"t":"even"},{"t":"ge","k":6},[(2,1,"VÉRIFIER LES PILES"),(2,2,None),(1,2,None)]),
 ("DB","serie",{"t":"odd"},{"t":"le","k":3},[(3,1,"ATTENTION AUX ERREURS"),(3,2,None),(1,3,None)])]
n=0
for fam,src,red,blue,sigs in PIN:
    for (r,b,stamp) in sigs:
        n+=1; spec={"red":red,"blue":blue,"src":src}
        base=cand(spec,(r,b),[])
        assert base,(r,b)
        groups=[]
        if src=="piles":
            for k in (2,3,4):
                while True:
                    w=random.choice(base); cl=[mk_clue(w),mk_clue(w)]
                    if cl[0]["t"]==cl[1]["t"]: continue
                    m=len(cand(spec,(r,b),cl))
                    key=sorted(json.dumps(c,sort_keys=True) for c in cl)
                    if 2<=m<=25 and all(key!=sorted(json.dumps(c,sort_keys=True) for c in g["c"]) for g in groups) and not any(json.dumps(cl[0],sort_keys=True)==json.dumps(c,sort_keys=True) or json.dumps(cl[1],sort_keys=True)==json.dumps(c,sort_keys=True) for g in groups for c in g["c"]): groups.append({"w":["piles",k],"c":cl}); break
        else:
            while True:
                A=[mk_clue(random.choice(base)) for _ in range(2)]; B=[mk_clue(random.choice(base)) for _ in range(2)]
                if A[0]==A[1] or B[0]==B[1] or A[0]["t"]==B[0]["t"] or A[0]["t"]==B[1]["t"] or A[1]["t"]==B[0]["t"] or A[1]["t"]==B[1]["t"]: continue
                ok=all(2<=len(cand(spec,(r,b),[A[x],B[y]]))<=25 for x in range(2) for y in range(2))
                if ok: break
            groups=[{"w":["somme_paire",True],"c":[A[0]]},{"w":["somme_paire",False],"c":[A[1]]},
                    {"w":["voyelle",True],"c":[B[0]]},{"w":["voyelle",False],"c":[B[1]]}]
        spec["clues"]=groups
        rules=[f"<strong>Voyants rouges (ronds)</strong> : {rtxt(red)}.",f"<strong>Voyants bleus (carrés)</strong> : {rtxt(blue)}."]
        if src=="piles":
            for g in groups: rules.append(f"<strong>{g['w'][1]} piles</strong> : {ctxt(g['c'][0])} ; {ctxt(g['c'][1])}.")
            note="Comptez d’abord les piles de la bombe. Les quatre chiffres du code sont tous différents ; un code refusé compte comme une erreur."
        else:
            for g in groups:
                lab={("somme_paire",True):"Si la somme des deux chiffres du numéro de série est <strong>paire</strong>",("somme_paire",False):"Si cette somme est <strong>impaire</strong>",
                     ("voyelle",True):"Si le numéro de série contient <strong>une voyelle</strong> (A, E, U ou Y)",("voyelle",False):"Si le numéro de série ne contient <strong>aucune voyelle</strong>"}[(g["w"][0],g["w"][1])]
                rules.append(f"{lab} : {ctxt(g['c'][0])}.")
            note="Appliquez un indice sur la somme et un indice sur les voyelles. Les quatre chiffres du code sont tous différents ; un code refusé compte comme une erreur."
        txt={"sig":f"Voyants allumés — {r} rouge{sp(r)} et {b} bleu{sp(b)}","rules":rules,
             "end":"Annoncez les quatre chiffres à l’opérateur, un par un, dans cet ordre.","note":note,"stamp":stamp}
        pages.append(dict(id=f"D{n:02d}",module="pin",family=fam,sig={"r":r,"b":b},spec=spec,txt=txt))
def q(x): return "$j$"+json.dumps(x,ensure_ascii=False,separators=(",",":"))+"$j$::jsonb"
print("-- Généré par tools/catalog_build.py — catalogue du manuel V2 (12 pages de fils, 6 pages de digicode)\ndelete from zt.pages;")
for p in pages:
    print(f"insert into zt.pages(id,module,family,sig,spec,txt) values ('{p['id']}','{p['module']}','{p['family']}',{q(p['sig'])},{q(p['spec'])},{q(p['txt'])});")
json.dump(pages,open("/tmp/carnet/pages.json","w"),ensure_ascii=False)
