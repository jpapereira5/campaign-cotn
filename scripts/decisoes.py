#!/usr/bin/env python3
"""As decisões do DM (registo/decisoes.md) sem ler o ficheiro inteiro (decisão 2026-10-29 #2).

  python3 scripts/decisoes.py --desde AAAA-MM-DD
      Todas as decisões a partir dessa data, por inteiro (por exemplo, desde a última sessão).

  python3 scripts/decisoes.py TERMO [TERMO ...]
      Cada decisão (o item numerado inteiro, com «Ficam de fora» e a data) que mencione qualquer dos
      termos, de todas as datas. Sem distinguir maiúsculas nem acentos. Um termo que seja a id de uma
      ficha (c-…, l-…, f-…, i-…, r-…, b-…, a-…, t-…) junta sozinho o nome da ficha. Para não falhar
      decisões escritas com outras palavras, passa a id, o nome e as alcunhas («Bob Lin» «Boblin»
      «nixie» «familiar»).

  python3 scripts/decisoes.py --datas
      As datas que existem e quantas decisões tem cada uma.

Nunca escreve nada.
"""
import glob, os, re, sys, unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FICHEIRO = os.path.join(RAIZ, 'registo', 'decisoes.md')
SECCAO = re.compile(r'^## Decidido pelo DM \((\d{4}-\d{2}-\d{2})\)')
ITEM = re.compile(r'^(\d+)\. ')
ID = re.compile(r'^[a-z]{1,3}-[a-z0-9-]+$')


def normal(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')


def seccoes():
    """[(data, [(numero, texto do item)])] pela ordem do ficheiro."""
    out, data, itens, atual = [], None, [], None
    def fecha_item():
        nonlocal atual
        if atual:
            itens.append((atual[0], '\n'.join(atual[1]).rstrip()))
        atual = None
    for linha in open(FICHEIRO, encoding='utf-8').read().split('\n'):
        m = SECCAO.match(linha)
        if m or linha.startswith('## '):
            fecha_item()
            if data:
                out.append((data, itens))
            data, itens = (m.group(1) if m else linha[3:].strip()), []  # secções sem data (ex.: «Cânone da mesa») também contam na pesquisa
            continue
        if data is None:
            continue
        mi = ITEM.match(linha)
        if mi:
            fecha_item()
            atual = (int(mi.group(1)), [linha])
        elif atual:
            atual[1].append(linha)
        elif linha.strip():
            atual = (0, [linha])  # texto antes do primeiro item da secção (contexto do dia)
    fecha_item()
    if data:
        out.append((data, itens))
    return out


def nome_da_ficha(fid):
    for f in glob.glob(os.path.join(RAIZ, '**', fid + '.md'), recursive=True):
        for linha in open(f, encoding='utf-8'):
            if linha.startswith('nome:'):
                return linha.split(':', 1)[1].strip().strip('"\'')
    return None


def main(a):
    if not a or a[0] in ('-h', '--help'):
        print(__doc__)
        return
    sec = seccoes()
    if a[0] == '--datas':
        for data, itens in sec:
            print(f'{data}: {len(itens)}')
        return
    if a[0] == '--desde':
        desde = a[1]
        n = 0
        for data, itens in sec:
            if re.match(r'\d{4}-', data) and data >= desde:
                print(f'## {data}\n')
                for _, t in itens:
                    print(t + '\n')
                    n += 1
        print(f'— {n} decisões desde {desde}')
        return
    termos = []
    for t in a:
        termos.append(t)
        if ID.match(t):
            nome = nome_da_ficha(t)
            if nome:
                termos.append(nome)
    alvos = [normal(t) for t in termos]
    n = 0
    for data, itens in sec:
        for num, t in itens:
            if any(x in normal(t) for x in alvos):
                print(f'[{data} {"#" + str(num) if num else "(contexto)"}]\n{t}\n')
                n += 1
    print(f'— {n} decisões com: {", ".join(termos)}')


if __name__ == '__main__':
    main(sys.argv[1:])
