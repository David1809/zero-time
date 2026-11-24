#!/usr/bin/env python3
"""Génère la migration 031 (ROTARY V1) : 5 fiches (signature = nb de symboles anguleux au départ) + vérification de solvabilité."""
import json, itertools, sys
ANG = {0, 2, 3, 4}  # triangle, carré, croix, losange ; ronds : cercle 1, onde 5, étoile 6, cible 7
NAMES = "ABCD"
PAGES = {
 0: dict(off=[1,-1,1,0],  links=[(0,2,2),(2,3,3),(3,1,-1)], stamp=None),
 1: dict(off=[-1,1,1,-1], links=[(1,0,1),(3,2,-2),(0,3,2)], stamp="À VÉRIFIER"),
 2: dict(off=[1,1,-1,-1], links=[(2,0,-1),(0,1,3),(3,1,2)], stamp="ORDRE IMPÉRATIF"),
 3: dict(off=[0,1,-1,1],  links=[(3,0,2),(1,2,-3),(0,2,1)], stamp=None),
 4: dict(off=[1,0,-1,1],  links=[(1,3,-2),(2,1,1),(0,2,2)], stamp="DOUBLE CONTRÔLE"),
}
def topo(links):
    order, left = [], set(range(4))
    while left:
        for k in sorted(left):
            if not any(l[1] == k and l[0] in left for l in links):
                order.append(k); left.discard(k); break
        else: raise SystemExit("cycle")
    return order
def solve(start, target, links):
    cur = list(start); g = 0
    for k in topo(links):
        if cur[k] != target[k]:
            cur[k] = target[k]; g += 1
            for f, t, d in links:
                if f == k: cur[t] = (cur[t] + d) % 8
    return cur == list(target), g
def check():
    for ang, p in PAGES.items():
        for start in itertools.product(range(8), repeat=4):
            if sum(1 for s in start if s in ANG) != ang: continue
            for piles in (2, 3, 4):
                tg = [(start[i] + p['off'][i] * piles) % 8 for i in range(4)]
                ok, g = solve(start, tg, p['links'])
                assert ok, (ang, start, piles)
                assert tg != list(start)
def txt(ang, p):
    ang_t = {0:"aucun symbole anguleux (4 ronds)",1:"1 symbole anguleux et 3 ronds",2:"2 symboles anguleux et 2 ronds",3:"3 symboles anguleux et 1 rond",4:"4 symboles anguleux (aucun rond)"}[ang]
    rules = []
    for i, o in enumerate(p['off']):
        n = NAMES[i]
        if o > 0: rules.append("Molette <strong>%s</strong> : position finale = départ <strong>+ nombre de piles</strong> crans vers la droite." % n)
        elif o < 0: rules.append("Molette <strong>%s</strong> : position finale = départ <strong>− nombre de piles</strong> crans (vers la gauche)." % n)
        else: rules.append("Molette <strong>%s</strong> : position finale = <strong>départ</strong> (ne pas la déplacer, sauf si elle est entraînée)." % n)
    for f, t, d in p['links']:
        w = ("avance de <strong>%d cran%s</strong> vers la droite" if d > 0 else "recule de <strong>%d cran%s</strong> vers la gauche") % (abs(d), "s" if abs(d) > 1 else "")
        rules.append("Quand on relâche <strong>%s</strong> sur un autre symbole, <strong>%s</strong> %s." % (NAMES[f], NAMES[t], w))
    return dict(sig="Molettes au départ — %s" % ang_t, rules=rules,
        end="Réglez chaque molette une seule fois, et toujours <strong>après</strong> celles qui l’entraînent.",
        note="L’entraînement est fixe, quel que soit le nombre de crans tournés. Anguleux : triangle, carré, croix, losange. Ronds : cercle, onde, étoile, cible. Piles : nombre affiché sur la bombe.",
        stamp=p['stamp'])
def q(s): return "'" + json.dumps(s, ensure_ascii=False).replace("'", "''") + "'::jsonb"
def main():
    check()
    out = ["-- ROTARY V1 : généré par tools/rotary_build.py\n"]
    for ang, p in PAGES.items():
        spec = dict(off=p['off'], links=[dict(f=f, t=t, d=d) for f, t, d in p['links']])
        out.append("insert into zt.pages(id, module, family, sig, spec, txt) values ('R0%d','rot','RA',%s,%s,%s) on conflict (id) do update set spec=excluded.spec, txt=excluded.txt, sig=excluded.sig;"
                   % (ang + 1, q(dict(ang=ang)), q(spec), q(txt(ang, p))))
    print("\n".join(out))
if __name__ == "__main__": main()
