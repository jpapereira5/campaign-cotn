#!/usr/bin/env python3
"""Transcreve uma faixa de sessão com os nomes próprios da campanha já carregados.

As transcrições das sessões 1–3 trazem todas o mesmo aviso: «nomes próprios podem
vir mal grafados». Este script ataca isso por duas vias, porque o `initial_prompt`
do Whisper só aceita ~224 tokens e não leva a campanha toda:

1. **Antes de transcrever:** um prompt curto com os nomes que estão em jogo na
   cena — os participantes de um beat, mais os PCs e os NPCs sempre presentes —
   na grafia da casa (o prompt diz «Bolbara», não «Bol'bara»).
2. **Depois:** uma passagem sobre o texto produzido que compara cada palavra
   capitalizada a meio da frase com o vocabulário do repositório, por letra e
   por som («Corvello» → «Corvelo», «Nalha» → «Nália», «Krin» → «Kryn»).

**A grafia da casa é a do repositório, por esta ordem:** a prosa dos `docs/`
(é lá que está «Bolbara»), o glossário, as fichas da camada campanha e, por
fim, as do livro. Uma palavra que já apareça na prosa nunca é sinalizada; só
conta como alvo de correção se aparecer mais de uma vez.

Testado contra os resumos das sessões 1–3, o cânone e o lore: zero sugestões
falsas. Por omissão só sugere; `--aplicar` aplica as de semelhança ≥ 0.9.

Uso:
    python3 scripts/transcrever-sessao.py --listar-nomes [--beat b-0-patrulha-imperio]
    python3 scripts/transcrever-sessao.py AUDIO [--beat ID] [--modelo small] [--saida DIR]
    python3 scripts/transcrever-sessao.py --corrigir transcricao.txt [--aplicar]

Precisa de `faster-whisper` só para transcrever (`pip install faster-whisper`);
o `--listar-nomes` e o `--corrigir` funcionam sem dependências. Numa máquina com
GPU, trocar `device="cpu"` por `device="cuda"` em `transcrever()` muda tudo no
tempo. Depois de transcrever, passar o texto pelo `normalizar-texto.py
--so-grafia` para a grafia ficar como no repositório.
"""
import argparse
import difflib
import glob
import json
import os
import re
import sys
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Nomes que valem sempre, mesmo que o beat não os liste.
SEMPRE = ["c-pc-quasi", "c-pc-lucan", "c-pc-isco", "c-pc-lia",
          "c-morgid", "c-alberto-gnomis", "c-bolbara", "c-buhfal"]

# Termos de regras que a mesa diz em inglês e que o Whisper troca por palavras
# portuguesas parecidas. Entram no prompt para ele os reconhecer.
REGRAS = ["Survival", "Perception", "Insight", "Investigation", "Persuasion",
          "Deception", "Stealth", "Athletics", "Arcana", "long rest", "short rest",
          "d20", "CA", "PV", "inspiração"]

COLECOES = ("characters", "locations", "factions")


def _sem_acentos(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


_FONETICA = [("lh", "li"), ("nh", "ni"), ("ph", "f"), ("ss", "s"), ("ll", "l"),
             ("rr", "r"), ("tt", "t"), ("mm", "m"), ("nn", "n"), ("ck", "c"),
             ("k", "c"), ("y", "i"), ("w", "v"), ("z", "s"), ("ç", "c"), ("'", "")]


def _fonetico(s):
    """Reduz as trocas que o Whisper faz em português: Nalha→nalia, Corvello→corvelo."""
    s = _sem_acentos(s).lower()
    for de, para in _FONETICA:
        s = s.replace(de, para)
    return re.sub(r"(.)\1+", r"\1", s)


def _limpar(nome):
    """«Sargento Vasco Corvelo, escrivão» → Vasco Corvelo; tira título, aposto e aspas."""
    nome = re.sub(r"\s*\([^)]*\)", "", nome)
    nome = nome.split(",")[0]  # corta o aposto («…, escrivão de Vesh»)
    nome = re.sub(r"^(Sargento|Soldado|Cabo|Recruta|Batedora?|Acólito|Padre|Pároco|"
                  r"Comandante|Intendente|Anciã|Ancião|Ogre Lorde|Capitã|Capitão|"
                  r"Taskhand|Sunbreaker)\s+", "", nome)
    return nome.strip(" —-")


def _nomes(texto):
    """Do nome da ficha, guarda a forma limpa e as alcunhas entre aspas.

    «Soldado Gilberto Mendanha, «Casqueiro»» → {Gilberto Mendanha, Casqueiro}
    """
    fora = set()
    # as alcunhas saem do nome original, antes de se cortar o aposto
    for grupo in re.findall(r"«([^»]+)»|\"([^\"]+)\"", texto):
        for alcunha in grupo:
            if alcunha and 2 < len(alcunha.strip()) < 40:
                fora.add(alcunha.strip())
    inteiro = _limpar(texto)
    if inteiro:
        fora.add(re.sub(r"[«»\"]", "", inteiro).strip())
    return {n for n in fora if 2 < len(n) < 40}


def carregar_entidades():
    """Todas as entidades das duas camadas, por id, com nome e participação."""
    ents = {}
    for camada in ("book", "campaign"):
        for col in COLECOES:
            for f in sorted(glob.glob(os.path.join(RAIZ, "data", camada, col, "*.json"))):
                try:
                    dados = json.load(open(f, encoding="utf-8"))
                except (json.JSONDecodeError, OSError) as e:
                    print(f"aviso: {f} ignorado ({e})", file=sys.stderr)
                    continue
                for x in dados if isinstance(dados, list) else []:
                    if isinstance(x, dict) and x.get("id") and x.get("name"):
                        ents[x["id"]] = {"nome": x["name"], "col": col, "camada": camada}
    return ents


def carregar_beats():
    beats = {}
    for camada in ("book", "campaign"):
        for f in sorted(glob.glob(os.path.join(RAIZ, "data", camada, "beats", "*.json"))):
            try:
                dados = json.load(open(f, encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                continue
            for x in dados if isinstance(dados, list) else []:
                if isinstance(x, dict) and x.get("id"):
                    beats[x["id"]] = x
    return beats


def nomes_do_glossario():
    """A coluna pt-PT das tabelas do glossário."""
    fora = set()
    caminho = os.path.join(RAIZ, "docs", "glossario.md")
    if not os.path.exists(caminho):
        return fora
    for linha in open(caminho, encoding="utf-8"):
        celulas = [c.strip() for c in linha.split("|")]
        if len(celulas) < 4 or set(celulas[2]) <= set("-: "):
            continue
        termo = re.sub(r"[*`]", "", celulas[2])
        termo = re.sub(r"\s*\([^)]*\)", "", termo).strip()
        if not termo or not (2 < len(termo) < 40):
            continue
        if termo[0].isupper():
            fora.add(termo)
        elif " " not in termo:
            # «abissal», «rubídio»: no texto aparecem capitalizados a meio da frase
            fora.add(termo.capitalize())
    return fora


def grafia_da_casa(nome, vocab_por_som):
    """Se a prosa do repositório escreve o mesmo nome de outra maneira, vale a dela."""
    return vocab_por_som.get(_fonetico(nome), nome)


def nomes_em_jogo(beat_id, ents, beats, vocab=()):
    """Os nomes para o prompt: participantes do beat + os de sempre."""
    por_som = {}
    for v in vocab:
        por_som.setdefault(_fonetico(v), v)
    ids = list(SEMPRE)
    if beat_id:
        b = beats.get(beat_id)
        if not b:
            sys.exit(f"beat desconhecido: {beat_id}")
        ids += list(b.get("participants", []))
        if b.get("location"):
            ids.append(b["location"])
    fora = []
    for i in ids:
        if i in ents:
            for n in sorted(_nomes(ents[i]["nome"])):
                n = grafia_da_casa(n, por_som)
                if n not in fora:
                    fora.append(n)
    return fora


PALAVRAS_COMUNS = {
    "Sessão", "Forte", "Padre", "Pároco", "Pântano", "Cemitério", "Dinastia",
    "Soldado", "Sargento", "Cabo", "Recruta", "Acólito", "Batedora", "Templo",
    "Império", "Imperial", "Conselho", "Ogre", "Lorde", "Anciã", "Ancião",
    "Vigia", "Aurora", "Casco", "Carapaça", "Guardião", "Musgo", "Ritual",
    "Nota", "Dia", "Noite", "Manhã", "Tarde", "Dentro", "Depois", "Quando",
    "Como", "Onde", "Antes", "Agora", "Ainda", "Mais", "Mesa", "Isto", "Essa",
}


def _tokens(nome):
    """Palavras isoladas que valem como nome próprio (Corvelo, Nália, Kryn)."""
    fora = set()
    for t in re.findall(r"[A-ZÁÂÃÀÉÊÍÓÔÕÚÇ][\wÁÂÃÀÉÊÍÓÔÕÚÇáâãàéêíóôõúç'-]{3,}", nome):
        if t not in PALAVRAS_COMUNS:
            fora.add(t)
    return fora


def vocabulario(ents):
    """O que está bem escrito, segundo o repositório.

    Devolve (alvos, conhecidas): `alvos` é o que serve de correção; `conhecidas`
    é tudo o que aparece no repositório, mesmo uma só vez — basta estar lá para
    nunca ser sinalizado.

    Por esta ordem de autoridade: a prosa dos `docs/` (é onde está a grafia da
    casa — «Bolbara», não «Bol'bara»), o glossário, e os nomes das fichas da
    camada campanha; os do livro só para quem não existe na campanha.
    """
    conhecidas = []  # por ordem de autoridade: a primeira grafia ganha
    vistas = set()   # tudo o que aparece na prosa, mesmo uma só vez

    def juntar(*itens):
        for i in itens:
            if i and i not in conhecidas:
                conhecidas.append(i)

    # 1. prosa dos docs: palavras capitalizadas que aparecem mais de uma vez
    contagem = {}
    for f in glob.glob(os.path.join(RAIZ, "docs", "*.md")) + \
             glob.glob(os.path.join(RAIZ, "docs", "sessoes", "*.md")):
        texto = open(f, encoding="utf-8").read()
        for t in re.findall(r"[A-ZÁÂÃÀÉÊÍÓÔÕÚÇ][\wÁÂÃÀÉÊÍÓÔÕÚÇáâãàéêíóôõúç'-]{3,}", texto):
            contagem[t] = contagem.get(t, 0) + 1
    for t, n in sorted(contagem.items(), key=lambda kv: -kv[1]):
        vistas.add(t)
        if n > 1 and t not in PALAVRAS_COMUNS:
            juntar(t)

    # 2. glossário e 3. fichas (campanha antes do livro, já tratado no carregamento)
    for n in nomes_do_glossario():
        juntar(n, *_tokens(n))
    for camada in ("campaign", "book"):
        for e in ents.values():
            if e["camada"] != camada:
                continue
            for n in _nomes(e["nome"]):
                juntar(n, *_tokens(n))

    return conhecidas, vistas | set(conhecidas)


def prompt_inicial(nomes, max_palavras=170):
    """Frase em português com os nomes, cortada antes do limite do Whisper."""
    cabeca = ("Sessão de Dungeons & Dragons em português de Portugal, campanha "
              "Call of the Netherdeep. Nomes e termos que aparecem: ")
    usados, total = [], len(cabeca.split())
    for n in nomes + REGRAS:
        custo = len(n.split()) + 1
        if total + custo > max_palavras:
            break
        usados.append(n)
        total += custo
    return cabeca + ", ".join(usados) + "."


def ts(segundos):
    h, resto = divmod(int(segundos), 3600)
    m, s = divmod(resto, 60)
    ms = int((segundos - int(segundos)) * 1000)
    return h, m, s, ms


def escrever_saidas(segmentos, base):
    with open(base + ".txt", "w", encoding="utf-8") as txt, \
         open(base + ".srt", "w", encoding="utf-8") as srt:
        for i, seg in enumerate(segmentos, 1):
            h1, m1, s1, x1 = ts(seg["inicio"])
            h2, m2, s2, x2 = ts(seg["fim"])
            txt.write(f"[{h1:02d}:{m1:02d}:{s1:02d}] {seg['texto'].strip()}\n")
            srt.write(f"{i}\n{h1:02d}:{m1:02d}:{s1:02d},{x1:03d} --> "
                      f"{h2:02d}:{m2:02d}:{s2:02d},{x2:03d}\n{seg['texto'].strip()}\n\n")
    return base + ".txt", base + ".srt"


def transcrever(audio, modelo, prompt, saida):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("falta o faster-whisper: pip install faster-whisper\n"
                 "(numa máquina com GPU, troca device=\"cpu\" por device=\"cuda\" "
                 "em transcrever(); ver o cabeçalho do script)")
    print(f"modelo {modelo} (CPU, int8) · {os.path.basename(audio)}", file=sys.stderr)
    m = WhisperModel(modelo, device="cpu", compute_type="int8")
    segs, info = m.transcribe(audio, language="pt", initial_prompt=prompt,
                              vad_filter=True, condition_on_previous_text=False)
    print(f"duração {info.duration / 60:.0f} min", file=sys.stderr)
    out = []
    for s in segs:
        out.append({"inicio": s.start, "fim": s.end, "texto": s.text})
        print(f"\r{s.end / 60:6.1f} min", end="", file=sys.stderr)
    print("", file=sys.stderr)
    return escrever_saidas(out, saida)


def sugerir(caminho, nomes, vistas=(), aplicar=False, limiar=0.82):
    """Compara palavras capitalizadas com o vocabulário, por letra e por som."""
    texto = open(caminho, encoding="utf-8").read()
    por_letra = {_sem_acentos(n).lower(): n for n in nomes}
    ja_vistas = {_sem_acentos(v).lower() for v in vistas}
    por_som = {}
    for n in nomes:
        por_som.setdefault(_fonetico(n), n)
    # só o que está capitalizado a meio da frase: no início pode ser palavra comum
    palavras = {m.group(1) for m in re.finditer(
        r"(?<![.!?:;\n\]]\s)(?<![.!?:;\n\]])\s"
        r"([A-ZÁÂÃÀÉÊÍÓÔÕÚÇ][\wÁÂÃÀÉÊÍÓÔÕÚÇáâãàéêíóôõúç'-]{3,})", texto)}
    sugestoes = []
    for p in sorted(palavras):
        if p in PALAVRAS_COMUNS:  # «Forte», «Padre», «Templo»: não são nomes
            continue
        chave = _sem_acentos(p).lower()
        if chave in por_letra or chave in ja_vistas:
            continue
        som = _fonetico(p)
        if som in por_som and por_som[som] != p:
            sugestoes.append((p, por_som[som], 1.0))  # mesmo som: quase certo
            continue
        perto = difflib.get_close_matches(chave, por_letra, n=1, cutoff=limiar)
        if perto:
            sugestoes.append((p, por_letra[perto[0]],
                              difflib.SequenceMatcher(None, chave, perto[0]).ratio()))
    if aplicar:
        for errado, certo, r in sugestoes:
            if r >= 0.9:
                texto = re.sub(rf"\b{re.escape(errado)}\b", certo, texto)
        open(caminho, "w", encoding="utf-8").write(texto)
    return sugestoes


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio", nargs="?", help="faixa a transcrever (.m4a, .wav, …)")
    ap.add_argument("--beat", help="id do beat em jogo, para escolher os nomes do prompt")
    ap.add_argument("--modelo", default="small", help="tiny, base, small, medium (omissão: small)")
    ap.add_argument("--saida", help="prefixo dos ficheiros de saída (omissão: ao lado do áudio)")
    ap.add_argument("--listar-nomes", action="store_true", help="mostra o prompt e sai")
    ap.add_argument("--corrigir", metavar="TXT", help="só a passagem de correção sobre um texto")
    ap.add_argument("--aplicar", action="store_true", help="aplica as correções com semelhança ≥ 0.9")
    a = ap.parse_args()

    ents = carregar_entidades()
    beats = carregar_beats()
    nomes_todos, vistas = vocabulario(ents)
    nomes_prompt = nomes_em_jogo(a.beat, ents, beats, nomes_todos)
    prompt = prompt_inicial(nomes_prompt)

    if a.listar_nomes:
        print(f"{len(ents)} entidades · {len(nomes_todos)} alvos de correção · "
              f"{len(vistas)} palavras conhecidas\n")
        print("--- initial_prompt (cabe no limite de ~224 tokens) ---")
        print(prompt)
        print(f"\n({len(prompt.split())} palavras; {len(nomes_prompt)} nomes em jogo"
              + (f", do beat {a.beat}" if a.beat else ", só os de sempre") + ")")
        return

    if a.corrigir:
        s = sugerir(a.corrigir, nomes_todos, vistas, aplicar=a.aplicar)
        if not s:
            print("nada a sugerir")
        for errado, certo, r in s:
            marca = "aplicado" if a.aplicar and r >= 0.9 else "sugestão"
            print(f"{marca}: {errado} → {certo} ({r:.2f})")
        return

    if not a.audio:
        ap.error("falta o ficheiro de áudio (ou usa --listar-nomes / --corrigir)")
    if not os.path.exists(a.audio):
        sys.exit(f"não encontro {a.audio}")

    base = a.saida or os.path.splitext(a.audio)[0]
    txt, srt = transcrever(a.audio, a.modelo, prompt, base)
    print(f"escrito: {txt}\nescrito: {srt}")
    s = sugerir(txt, nomes_todos, vistas)
    if s:
        print(f"\n{len(s)} nomes possivelmente mal grafados "
              f"(corre --corrigir {txt} --aplicar para tratar deles):")
        for errado, certo, r in s[:20]:
            print(f"  {errado} → {certo} ({r:.2f})")
    print(f"\na seguir: python3 scripts/normalizar-texto.py --so-grafia {txt}")


if __name__ == "__main__":
    main()
