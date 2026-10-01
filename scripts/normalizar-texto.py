#!/usr/bin/env python3
"""Normaliza o texto da camada campanha e dos docs: glossário pt-PT (docs/glossario.md) e grafia do AO90.

Uso: python3 scripts/normalizar-texto.py [--so-grafia FICHEIRO ...]
Não toca em data/book/ nem em ids (valores kebab-case, campos de referência).
"""
import glob
import json
import re
import sys

B = r"(?<![\w-])"  # início de palavra que não cola a hífen (protege ids como a-ruidium)
E = r"(?![\w-])"

# ---------------------------------------------------------------- glossário
# Ordem importa: expressões longas antes das curtas.
GLOSSARIO = [
    (r"Library of the Cobalt Soul", "Biblioteca da Alma de Cobalto"),
    (r"Cobalt Soul", "Alma de Cobalto"),
    (r"Alma Cobalto", "Alma de Cobalto"),
    (r"The Myriad", "Miríade"),
    (r"\bdo Myriad", "da Miríade"),
    (r"\bno Myriad", "na Miríade"),
    (r"\bpelo Myriad", "pela Miríade"),
    (r"\bao Myriad", "à Miríade"),
    (r"\bo Myriad", "a Miríade"),
    (r"\bO Myriad", "A Miríade"),
    (r"Myriad", "Miríade"),
    (r"Míriade", "Miríade"),
    (r"The Revelry", "a Folia"),
    (r"Revelry", "Folia"),
    (r"Aurora Watch", "Vigília da Aurora"),
    (r"Vigia da Aurora", "Vigília da Aurora"),
    (r"Cerberus Assembly", "Assembleia de Cerberus"),
    (r"Assembleia de Cérbero", "Assembleia de Cerberus"),
    (r"Assembleia Cérbero", "Assembleia de Cerberus"),
    (r"Assembleia de Cerebrus", "Assembleia de Cerberus"),
    (r"\ba Assembly", "a Assembleia"),
    (r"\bda Assembly", "da Assembleia"),
    (r"\bà Assembly", "à Assembleia"),
    (r"\bpela Assembly", "pela Assembleia"),
    (B + r"Assembly" + E, "Assembleia"),
    (r"Kryn Dynasty", "Dinastia Kryn"),
    (B + r"Dynasty" + E, "Dinastia"),
    (r"Dwendalian Empire", "Império Dwendaliano"),
    (r"Bright Queen", "Rainha Brilhante"),
    (r"Rainha Luminosa", "Rainha Brilhante"),
    (B + r"[Bb]eacons" + E, "faróis"),
    (B + r"[Bb]eacon" + E, "farol"),
    (B + r"luzeiros" + E, "faróis"),
    (B + r"luzeiro" + E, "farol"),
    (B + r"ruídio" + E, "rubídio"),
    (B + r"ruidium" + E, "rubídio"),
    (B + r"Ruidium(?! Metamagic)" + E, "Rubídio"),
    (B + r"Jigow" + E, "Jigau"),
    (B + r"Xhorhas" + E, "Jorhas"),
    (B + r"Jorhás" + E, "Jorhas"),
    (r"Fort Venture", "Forte Ventura"),
    (r"Brokenveil Marsh", "Pântano do Véu-Quebrado"),
    (r"Brokenveil Bluffs", "Falésias do Véu-Quebrado"),
    (r"Brokenveil", "Véu-Quebrado"),
    (r"Véu Quebrado", "Véu-Quebrado"),
    (r"(?<!Guide to )Wildemount", "Monte Selvagem"),
    (r"Monte-Selvagem", "Monte Selvagem"),
    (r"Menagerie Coast", "Costa das Maravilhas"),
    (r"Costa da Menagerie", "Costa das Maravilhas"),
    (r"Clovis Concord", "Concílio de Clóvis"),
    (r"Concórdia de Clovis", "Concílio de Clóvis"),
    (r"Concílio de Clovis", "Concílio de Clóvis"),
    (r"Lucidian Ocean", "Oceano Lucídico"),
    (r"Blightshore", "Costa das Pragas"),
    (r"Costa da Podridão", "Costa das Pragas"),
    (r"Greying Wildlands", "Ermos Cinzentos"),
    (r"Festival of Merit", "Festival do Mérito"),
    (r"horizonback tortoises", "tartarugas-do-horizonte"),
    (r"horizonback tortoise", "tartaruga-do-horizonte"),
    (r"tartarugas-horizonte", "tartarugas-do-horizonte"),
    (r"tartaruga-horizonte", "tartaruga-do-horizonte"),
    (r"Halls? of Erudition", "Salão da Erudição"),
    (r"Righteous Brand", "Marca Justa"),
    (r"Crownsguard", "Guarda da Coroa"),
    (r"Children of Malice", "Filhos da Malícia"),
    (r"Plank King", "Rei da Prancha"),
    (r"Rei das Tábuas", "Rei da Prancha"),
    (r"Dawn City", "Cidade da Alvorada"),
    (B + r"consecution" + E, "consecução"),
    (B + r"dunamancy" + E, "dunamancia"),
    (r"War of (the )?Ash and Light", "Guerra da Luz & Cinza"),
    (r"Ashguard Garrison", "Guarnição da Cinza"),
    (r"Guarnição das Cinzas", "Guarnição da Cinza"),
    (r"Open Quay", "Porto Franco"),
    (r"Prime Deities", "Divindades Primárias"),
    (r"Divindades Primeiras", "Divindades Primárias"),
    (r"Betrayer Gods", "Deuses Traidores"),
    (r"Betrayer God", "Deus Traidor"),
    (r"Divine Gate", "Portão Divino"),
    (r"Age of Arcanum", "Idade do Arcano"),
    (r"Era do Arcano", "Idade do Arcano"),
    (r"\bthe Calamity", "a Calamidade"),
    (B + r"Calamity" + E, "Calamidade"),
    (B + r"Divergence" + E, "Divergência"),
    (r"Raven Queen", "Madrinha dos Corvos"),
    (r"Matron of Ravens", "Madrinha dos Corvos"),
    (r"Rainha Corvo", "Madrinha dos Corvos"),
    (r"Matrona dos Corvos", "Madrinha dos Corvos"),
    (r"Moon ?[Ww]eaver", "Tecelã da Lua"),
    (r"Wild ?[Mm]other", "Mãe Selvagem"),
    (r"Spider Queen", "Rainha das Teias"),
    (r"Rainha Aranha", "Rainha das Teias"),
    (r"Crawling King", "Rei Rastejante"),
    (r"Chained Oblivion", "Caos Aprisionado"),
    (r"Oblívio Acorrentado", "Caos Aprisionado"),
    (r"Strife Emperor", "Imperador do Conflito"),
    (r"Imperador da Discórdia", "Imperador do Conflito"),
    (r"\bthe Ruiner", "o Destruidor"),
    (B + r"Ruiner" + E, "Destruidor"),
    (B + r"Arruinador" + E, "Destruidor"),
    (B + r"Everlight" + E, "Luz Eterna"),
    (r"Dawn ?[Ff]ather", "Pai da Alvorada"),
    (r"Pai da Aurora", "Pai da Alvorada"),
    (r"Platinum Dragon", "Dragão de Platina"),
    (r"Law ?[Bb]earer", "Portadora da Lei"),
    (r"Guardiã das Leis", "Portadora da Lei"),
    (r"Knowing Mentor", "Mentora do Saber"),
    (r"Mentora Sapiente", "Mentora do Saber"),
    (r"Storm ?[Ll]ord", "Senhor da Tempestade"),
    (r"All-Hammer", "Martelo Supremo"),
    (r"Todo-Martelo", "Martelo Supremo"),
    (r"Change ?[Bb]ringer", "Senhora da Mudança"),
    (r"Portadora da Mudança", "Senhora da Mudança"),
    (r"Arch ?[Hh]eart", "Coração Arcano"),
    (r"Coração-Mor", "Coração Arcano"),
    (r"Lord of the Hells", "Senhor dos Infernos"),
    (r"Whispered One", "Sussurrado"),
    (r"Cloaked Serpent", "Serpente Oculta"),
    (r"Scaled Tyrant", "Tirana das Escamas"),
    (r"Tirana Escamada", "Tirana das Escamas"),
]

# ---------------------------------------------------------------- AO90 (pt-PT)
# raiz antiga -> raiz nova; aplicadas com sufixos flexionais.
GRAFIA_RAIZES = [
    ("acç", "aç"), ("facç", "faç"), ("direcç", "direç"), ("colecç", "coleç"), ("protecç", "proteç"),
    ("reacç", "reaç"), ("redacç", "redaç"), ("correcç", "correç"), ("selecç", "seleç"), ("infecç", "infeç"),
    ("detecç", "deteç"), ("abstracç", "abstraç"), ("activaç", "ativaç"), ("actuaç", "atuaç"),
    ("percepç", "perceç"), ("recepç", "receç"), ("concepç", "conceç"), ("decepç", "deceç"), ("excepç", "exceç"),
    ("fracç", "fraç"), ("atracç", "atraç"), ("extracç", "extraç"), ("transacç", "transaç"), ("interacç", "interaç"),
    ("infracç", "infraç"), ("contracç", "contraç"), ("direccion", "direcion"),
]
GRAFIA_PALAVRAS = [
    # (padrão sem fronteiras, substituição) — aplicados com \b...\b e sufixos opcionais
    (r"actua(l|is|lmente|lizar|lizad[oa]s?|lização|lizações|lizou|r|m|va|do|da|dos|das)", r"atua\1"),
    (r"objectiv(o|a|os|as|amente)", r"objetiv\1"),
    (r"objecto(s?)", r"objeto\1"),
    (r"projecto(s?)", r"projeto\1"),
    (r"projecta(r|do|da|dos|das|m|va)?", r"projeta\1"),
    (r"protector(a|es|as)?", r"protetor\1"),
    (r"adopta(r|do|da|dos|das|m|va|ram|ção)?", r"adota\1"),
    (r"adopt(o|ou|ei)", r"adot\1"),
    (r"óptim(o|a|os|as)", r"ótim\1"),
    (r"exact(o|a|os|as|amente|idão)", r"exat\1"),
    (r"activ(o|a|os|as|ar|ado|ada|ados|adas|am|ou|idade|idades|amente)", r"ativ\1"),
    (r"inactiv(o|a|os|as)", r"inativ\1"),
    (r"reactiv(ar|ado|ada|a)", r"reativ\1"),
    (r"acto(s?)", r"ato\1"),
    (r"Acto(s?)", r"Ato\1"),
    (r"baptiz(ado|ada|ados|adas|ar|ou)", r"batiz\1"),
    (r"baptismo", r"batismo"),
    (r"excepto", r"exceto"),
    (r"excepcion(al|ais|almente)", r"excecion\1"),
    (r"receptador(a|es|as)?", r"recetador\1"),
    (r"aspecto(s?)", r"aspeto\1"),
    (r"respectiv(o|a|os|as|amente)", r"respetiv\1"),
    (r"perspectiva(s?)", r"perspetiva\1"),
    (r"Egipto", r"Egito"),
    (r"detect(a|ar|ado|ada|ados|adas|am|ou|ável|or)", r"detet\1"),
    (r"detective(s?)", r"detetive\1"),
    (r"director(a|es|as)?", r"diretor\1"),
    (r"colectiv(o|a|os|as|amente)", r"coletiv\1"),
    (r"afect(a|ar|ado|ada|ados|adas|am|ou|ando)", r"afet\1"),
    (r"efectiv(o|a|os|as|amente)", r"efetiv\1"),
    (r"efectu(ar|ado|ada|a|am|ou)", r"efetu\1"),
    (r"eléctric(o|a|os|as)", r"elétric\1"),
    (r"electricidade", r"eletricidade"),
    (r"arquitect(o|a|os|as|ura|uras|ónico|ónica)", r"arquitet\1"),
    (r"correct(o|a|os|as|amente)", r"corret\1"),
    (r"incorrect(o|a|os|as)", r"incorret\1"),
    (r"dialecto(s?)", r"dialeto\1"),
    (r"insecto(s?)", r"inseto\1"),
    (r"tecto(s?)", r"teto\1"),
    (r"trajecto(s?)", r"trajeto\1"),
    (r"adjectivo(s?)", r"adjetivo\1"),
    (r"coleccion(ar|ador|adores|a|ou)", r"colecion\1"),
    (r"espectácul(o|os)", r"espetácul\1"),
    (r"espectador(es|a|as)?", r"espetador\1"),
    (r"actu(ar|a|am|ou|ando)", r"atu\1"),
    (r"inspector(a|es|as)?", r"inspetor\1"),
    (r"infect(ar|ado|ada|ados|adas|a|am|ou)", r"infet\1"),
    (r"óptic(o|a|os|as)", r"ótic\1"),
    (r"pára", r"para"),
    (r"Pára", r"Para"),
    (r"pêlo(s?)", r"pelo\1"),
]


def _case_variants(old, new):
    yield old, new
    if old[:1].islower():
        yield old[:1].upper() + old[1:], new[:1].upper() + new[1:]


def grafia(s: str) -> str:
    for old, new in GRAFIA_RAIZES:
        for o, n in _case_variants(old, new):
            s = re.sub(B + o + r"(\w*)", lambda m, n=n: n + m.group(1), s)
    for pat, rep in GRAFIA_PALAVRAS:
        s = re.sub(B + pat + E, rep, s)
        if pat[:1].islower():
            cap = pat[:1].upper() + pat[1:]
            caprep = rep[:1].upper() + rep[1:] if not rep.startswith("\\") else rep
            s = re.sub(B + cap + E, caprep, s)
    return s


# Termos de regras (feitiços, itens, capacidades) ficam em inglês: repor depois do glossário.
REGRAS = [
    (r"[Ff]arol of [Hh]ope", lambda m: "Beacon of Hope" if m.group(0)[0] == "F" else "beacon of hope"),
    (r"Vestiges? of Divergência", lambda m: m.group(0).replace("Divergência", "Divergence")),
    (r"Zone of Calamidade", lambda m: "Zone of Calamity"),
    (r"Rubídio (Domination|Strike|Corruption|Metamagic)", lambda m: "Ruidium " + m.group(1)),
]


def glossario(s: str) -> str:
    for pat, rep in GLOSSARIO:
        s = re.sub(pat, rep, s)
    for pat, rep in REGRAS:
        s = re.sub(pat, rep, s)
    return s


def texto(s: str, gloss=True) -> str:
    if gloss:
        s = glossario(s)
    return grafia(s)


# ---------------------------------------------------------------- JSON
REF_KEYS = {"id", "from", "to", "type", "kind", "source", "chapter", "location", "parent", "home", "pc",
            "ownerPc", "color", "fromBeat", "untilBeat", "attitude"}
KEBAB = re.compile(r"^[a-z0-9][a-z0-9-]*$")


def walk(v, key=None, pairs=None):
    if isinstance(v, dict):
        return {k: walk(x, k, pairs) for k, x in v.items()}
    if isinstance(v, list):
        return [walk(x, key, pairs) for x in v]
    if isinstance(v, str):
        if key in REF_KEYS or KEBAB.match(v):
            return v
        n = texto(v)
        if n != v and pairs is not None:
            pairs.append((v, n))
        return n
    return v


def main():
    changed = []
    for f in sorted(glob.glob("data/campaign/**/*.json", recursive=True)):
        raw = open(f, encoding="utf-8").read()
        data = json.loads(raw)
        pairs = []
        out = walk(data, pairs=pairs)
        if not pairs:
            continue
        if json.dumps(data, ensure_ascii=False, indent=2) + "\n" == raw:
            new = json.dumps(out, ensure_ascii=False, indent=2) + "\n"
        else:  # formato próprio: substituir só as strings, sem reformatar
            new = raw
            for old, rep in pairs:
                new = new.replace(json.dumps(old, ensure_ascii=False)[1:-1], json.dumps(rep, ensure_ascii=False)[1:-1])
            assert json.loads(new) == out, f
        if new != raw:
            open(f, "w", encoding="utf-8").write(new)
            changed.append(f)
    docs = sorted(glob.glob("docs/**/*.md", recursive=True)) + ["README.md"]
    for f in docs:
        raw = open(f, encoding="utf-8").read()
        new = texto(raw, gloss=not f.endswith("glossario.md"))
        if new != raw:
            open(f, "w", encoding="utf-8").write(new)
            changed.append(f)
    print("\n".join(changed))


if __name__ == "__main__":
    main()
