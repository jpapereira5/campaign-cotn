#!/usr/bin/env python3
"""As notas da Grelha (grelha/revisao.json → notes) sem ler o ficheiro inteiro (decisão 2026-10-29 #2).

  python3 scripts/notas.py                    as notas abertas (o que está por resolver), compactas
  python3 scripts/notas.py --linha ID         as notas de uma linha da Grelha (abertas; --todas junta as fechadas)
  python3 scripts/notas.py --procura TERMO…   todas as notas, abertas e fechadas, que mencionem um dos termos
                                              (histórico: as fechadas ficam no ficheiro e não se perdem)
  python3 scripts/notas.py --resumo           quantas notas há, por estado e por tipo

Nunca escreve nada: as notas novas escrevem-se em grelha/revisao.json, como diz o AGENTS.md.
"""
import json, os, sys, unicodedata
from collections import Counter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOTAS = json.load(open(os.path.join(RAIZ, 'grelha', 'revisao.json'), encoding='utf-8'))['notes']


def normal(s):
    return ''.join(c for c in unicodedata.normalize('NFD', str(s).lower()) if unicodedata.category(c) != 'Mn')


def mostra(n):
    alvo = n.get('target') or {}
    sitio = f"{alvo.get('row', '?')} · {alvo.get('col', '-')}"
    tags = f" {n['tags']}" if n.get('tags') else ''
    print(f"[{n['id']}] {n.get('status')} · {n.get('kind')} · {sitio}{tags} · {n.get('at', '')[:10]}")
    print(f"  {n.get('text', '')}")
    if n.get('suggestion'):
        print(f"  → {n['suggestion']}")
    if n.get('because'):
        print(f"  porque: {'; '.join(n['because'])}")


def main(a):
    if a and a[0] in ('-h', '--help'):
        print(__doc__)
        return
    todas = '--todas' in a
    a = [x for x in a if x != '--todas']
    if a and a[0] == '--resumo':
        print(Counter(n.get('status') for n in NOTAS))
        print(Counter((n.get('status'), n.get('kind')) for n in NOTAS))
        return
    if a and a[0] == '--procura':
        alvos = [normal(t) for t in a[1:]]
        sel = [n for n in NOTAS if any(x in normal(json.dumps(n, ensure_ascii=False)) for x in alvos)]
    elif a and a[0] == '--linha':
        sel = [n for n in NOTAS if (n.get('target') or {}).get('row') == a[1] and (todas or n.get('status') == 'aberta')]
    else:
        sel = [n for n in NOTAS if todas or n.get('status') == 'aberta']
    for n in sel:
        mostra(n)
    print(f'— {len(sel)} notas')


if __name__ == '__main__':
    main(sys.argv[1:])
