import itertools, json
PL={"noir":"noirs","rouge":"rouges","vert":"verts","jaune":"jaunes","blanc":"blancs","bleu":"bleus"}
ORD={1:"premier",2:"deuxième",3:"troisième",4:"quatrième",5:"cinquième",6:"sixième",7:"septième",8:"huitième"}
NUM={1:"un",2:"deux",3:"trois",4:"quatre"}
def ctext(c):
    k=c[0]
    if k=="gt": return f"il y a plus de fils {PL[c[1]]} que de fils {PL[c[2]]}"
    if k=="eq":
        n=c[2]; return f"il y a exactement un fil {c[1]}" if n==1 else f"il y a exactement {NUM[n]} fils {PL[c[1]]}"
    if k=="ge": return f"il y a au moins {NUM[c[2]]} fils {PL[c[1]]}"
    if k=="last": return f"le dernier fil est {c[1]}"
    if k=="first": return f"le premier fil est {c[1]}"
    if k=="pos": return f"le {ORD[c[1]]} fil est {c[2]}"
    if k=="adj": return f"deux fils {PL[c[1]]} se suivent"
    if k=="pil_eq": return f"la bombe porte {c[1]} piles"
    if k=="pil_ge": return f"la bombe porte au moins {c[1]} piles"
    if k=="pil_le": return f"la bombe porte au plus {c[1]} piles"
def atext(a):
    k=a[0]
    if k=="pos": return f"coupez le {ORD[a[1]]} fil"
    if k=="last": return "coupez le dernier fil"
    if k=="first": return "coupez le premier fil"
    if k=="penult": return "coupez l’avant-dernier fil"
    if k=="lastc": return f"coupez le dernier fil {a[1]}"
    if k=="firstc": return f"coupez le premier fil {a[1]}"
def ceval(c,w,p):
    k=c[0]
    if k=="gt": return w.count(c[1])>w.count(c[2])
    if k=="eq": return w.count(c[1])==c[2]
    if k=="ge": return w.count(c[1])>=c[2]
    if k=="last": return w[-1]==c[1]
    if k=="first": return w[0]==c[1]
    if k=="pos": return w[c[1]-1]==c[2]
    if k=="adj": return any(w[i]==w[i+1]==c[1] for i in range(len(w)-1))
    if k=="pil_eq": return p==c[1]
    if k=="pil_ge": return p>=c[1]
    if k=="pil_le": return p<=c[1]
def aeval(a,w):
    k=a[0]; n=len(w)
    if k=="pos": return a[1]-1
    if k=="last": return n-1
    if k=="first": return 0
    if k=="penult": return n-2
    if k=="lastc": return max(i for i,x in enumerate(w) if x==a[1])
    if k=="firstc": return w.index(a[1])
# pages: (n, colours, [(cond, action)], final action, stamp)
F=[]
def P(n,cols,rules,final,stamp=None): F.append(dict(n=n,cols=cols,rules=rules,final=final,stamp=stamp))
# famille A : 5 fils
P(5,["noir","rouge","jaune"],[(("eq","rouge",2),("lastc","rouge")),(("last","noir"),("pos",2)),(("pil_ge",3),("firstc","jaune"))],("last",),"À VÉRIFIER")
P(5,["noir","rouge","bleu"],[(("eq","rouge",2),("firstc","rouge")),(("last","noir"),("pos",3)),(("pil_ge",3),("firstc","bleu"))],("last",))
P(5,["noir","vert","jaune"],[(("eq","vert",2),("lastc","vert")),(("first","noir"),("pos",4)),(("pil_le",3),("firstc","jaune"))],("pos",2),"ORDRE IMPÉRATIF")
# famille B : 6 fils
P(6,["blanc","rouge","bleu"],[(("gt","blanc","rouge"),("lastc","blanc")),(("adj","bleu"),("firstc","bleu")),(("pil_eq",4),("pos",3))],("last",),"LECTURE AVANT ACTION")
P(6,["blanc","rouge","vert"],[(("gt","blanc","rouge"),("firstc","blanc")),(("adj","vert"),("lastc","vert")),(("pil_eq",2),("pos",4))],("last",))
P(6,["blanc","bleu","vert"],[(("gt","blanc","bleu"),("lastc","blanc")),(("adj","vert"),("firstc","vert")),(("pil_ge",3),("pos",2))],("penult",),"DOUBLE CONTRÔLE")
# famille C : 4 fils
P(4,["rouge","jaune"],[(("gt","rouge","jaune"),("lastc","rouge")),(("last","jaune"),("pos",2)),(("pil_ge",4),("firstc","jaune"))],("first",))
P(4,["rouge","bleu"],[(("gt","bleu","rouge"),("lastc","bleu")),(("first","rouge"),("pos",3)),(("pil_le",3),("lastc","rouge"))],("pos",2),"ORDRE IMPÉRATIF")
P(4,["vert","jaune"],[(("gt","jaune","vert"),("firstc","jaune")),(("last","vert"),("pos",2)),(("pil_eq",2),("lastc","vert"))],("last",))
# famille D : 7 fils
P(7,["noir","blanc","jaune"],[(("ge","noir",3),("lastc","noir")),(("pos",4,"jaune"),("pos",2)),(("pil_ge",3),("firstc","jaune"))],("last",),"À VÉRIFIER")
P(7,["noir","blanc","vert"],[(("ge","noir",3),("firstc","noir")),(("pos",4,"vert"),("pos",6)),(("pil_ge",3),("lastc","vert"))],("pos",3))
P(7,["noir","blanc","bleu"],[(("ge","noir",3),("lastc","noir")),(("pos",4,"bleu"),("pos",5)),(("pil_le",3),("firstc","bleu"))],("penult",),"LECTURE AVANT ACTION")

def stats(pg):
    n=pg["n"]; cols=pg["cols"]; tot=0
    fire=[0]*len(pg["rules"]); fin=0; pos=[0]*n
    for w in itertools.product(cols,repeat=n):
        if set(w)!=set(cols): continue
        for p in (2,3,4):
            tot+=1
            done=False
            for i,(c,a) in enumerate(pg["rules"]):
                if ceval(c,w,p):
                    fire[i]+=1; pos[aeval(a,w)]+=1; done=True; break
            if not done:
                fin+=1; pos[aeval(pg["final"],w)]+=1
    return tot,[round(100*x/tot) for x in fire],round(100*fin/tot),[round(100*x/tot) for x in pos]
if __name__=="__main__":
    for i,pg in enumerate(F):
        print(i+1,pg["n"],pg["cols"],stats(pg)[1:])
