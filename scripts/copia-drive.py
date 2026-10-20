#!/usr/bin/env python3
"""Cópia de leitura do repositório na Drive (pasta cotn_2026/github_repo).

Quem a envia é o Claude, numa tarefa agendada diária (docs/copia-drive.md). Como o
Claude escreve na Drive reescrevendo o conteúdo de cada ficheiro, a cópia vai em
peças pequenas (até ~65 KB cada) e só se reenviam as que mudaram.

  python3 scripts/copia-drive.py gerar SAIDA
      Escreve em SAIDA um documento Markdown por peça, o `00 LEIA-ME.md` e o
      `manifesto.json` (commit e sha256 de cada peça).

  python3 scripts/copia-drive.py diferencas SAIDA MANIFESTO_ANTIGO
      Compara com o manifesto que está na Drive e diz, em JSON, que peças enviar
      (novas ou mudadas) e que nomes apagar (já não existem). MANIFESTO_ANTIGO pode
      não existir (primeira cópia: envia tudo).

  python3 scripts/copia-drive.py espelho REPO SAIDA
      Para repositórios de código (como o jpapereira5/dnd-soundboard): copia para
      SAIDA/ficheiros/ cada ficheiro do git tal como está (mesmos caminhos) e escreve o
      `00 LEIA-ME.md` e o `manifesto.json` (sha256, tamanho e tipo de cada ficheiro,
      com o caminho como nome). O `diferencas` serve para os dois.

Nunca escreve no repositório.
"""
import datetime, glob, hashlib, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEIA_ME = '00 LEIA-ME.md'
MANIFESTO = 'manifesto.json'
LIMITE = 80_000  # aviso acima disto: partir a peça

FENCE = re.compile(r'^(```|~~~)')
HEAD = re.compile(r'^(#{1,6})(\s)')


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout.strip()


def ficheiros(*padroes, letras=None, exceto=None):
    """Ficheiros (relativos à raiz) por ordem; `letras` filtra pela primeira letra depois do prefixo `x-`."""
    vistos = []
    for p in padroes:
        for f in sorted(glob.glob(os.path.join(ROOT, p), recursive=True)):
            rel = os.path.relpath(f, ROOT)
            base = os.path.basename(rel)
            if exceto and re.match(exceto, base):
                continue
            if letras:
                ini = base.split('-', 1)[1][:1].lower() if '-' in base else base[:1].lower()
                if not (letras[0] <= ini <= letras[1]):
                    continue
            if rel not in vistos:
                vistos.append(rel)
    return vistos


def pecas():
    """(nome da peça, ficheiros) por ordem."""
    out = []
    for f in ficheiros('mundo/personagens/c-pc-*.md'):
        out.append((f'01 Personagens · PC {os.path.basename(f)[5:-3]}', [f]))
    for a, b in [('a', 'b'), ('c', 'f'), ('g', 'k'), ('l', 'n'), ('o', 'r'), ('s', 'u'), ('v', 'z')]:
        out.append((f'01 Personagens · NPCs {a}–{b}', ficheiros('mundo/personagens/c-*.md', letras=(a, b), exceto=r'c-pc-')))
    out.append(('02 Locais · a–m', ficheiros('mundo/locais/*.md', letras=('a', 'm'))))
    out.append(('02 Locais · n–z', ficheiros('mundo/locais/*.md', letras=('n', 'z'))))
    out.append(('03 Fações', ficheiros('mundo/facoes/*.md')))
    out.append(('04 Itens', ficheiros('mundo/itens/*.md')))
    out.append(('05 Segredos e lore', ficheiros('mundo/lore.md', 'mundo/segredos/*.md')))
    out.append(('06 Campanha', ficheiros('plano/campanha.md')))
    caps = sorted({re.match(r'b-([^-]+)-', os.path.basename(f)).group(1) for f in ficheiros('plano/beats/b-*.md')},
                  key=lambda c: (len(c), c))
    for c in caps:
        out.append((f'06 Beats · capítulo {c}', ficheiros(f'plano/beats/b-{c}-*.md')))
    out.append(('07 Fios', ficheiros('plano/fios/*.md')))
    out.append(('08 Sessões · índice', ficheiros('registo/sessoes/README.md')))
    for f in ficheiros('registo/sessoes/s*.md'):
        out.append((f'08 Sessão {os.path.basename(f)[1:3]}', [f]))
    out.append(('09 Decisões', ficheiros('registo/decisoes.md')))
    out.append(('10 Mesa · regras', ficheiros('mesa/regras.md')))
    out.append(('10 Mesa · resto', [f for f in ficheiros('mesa/**/*.md', 'mesa/**/*.yaml') if f != 'mesa/regras.md']))
    out.append(('11 Documentação · geral', ficheiros('README.md', 'AGENTS.md', 'docs/fluxo.md', 'docs/metodo.md',
                                                    'docs/glossario.md', 'docs/batalhas.md', 'docs/copia-drive.md')))
    out.append(('11 Documentação · arquitetura', ficheiros('docs/arquitetura.md')))
    out.append(('11 Documentação · grelha', ficheiros('docs/grelha.md')))
    usados = {f for _, fs in out for f in fs}
    resto = [f for f in ficheiros('docs/*.md') if f not in usados]
    if resto:
        out.append(('11 Documentação · outros', resto))
    return [(n, fs) for n, fs in out if fs]


def separar(texto):
    if texto.startswith('---\n'):
        fim = texto.find('\n---\n', 4)
        if fim != -1:
            return texto[4:fim], texto[fim + 5:]
    return '', texto


def descer(corpo, niveis=1):
    """Desce os títulos do corpo `niveis` nível (máximo ######), fora dos blocos de código."""
    out, dentro = [], False
    for linha in corpo.split('\n'):
        if FENCE.match(linha):
            dentro = not dentro
        elif not dentro:
            m = HEAD.match(linha)
            if m:
                linha = '#' * min(6, len(m.group(1)) + niveis) + linha[len(m.group(1)):]
        out.append(linha)
    return '\n'.join(out)


def nome_de(rel, cab):
    m = re.search(r'^(?:nome|titulo|title):\s*(.+)$', cab, re.M)
    return m.group(1).strip().strip('"\'') if m else os.path.splitext(os.path.basename(rel))[0]


def documento(titulo, rels):
    partes = [f'# {titulo}', '',
              'Cópia de leitura do repositório `jpapereira5/campaign-cotn` (o commit está no `00 LEIA-ME`). '
              'As mudanças fazem-se no repositório; o que se escrever aqui perde-se na próxima cópia.', '',
              f'{len(rels)} ficheiro(s).', '']
    for rel in rels:
        texto = open(os.path.join(ROOT, rel), encoding='utf-8').read()
        if rel.endswith('.yaml'):
            partes += [f'## {os.path.basename(rel)} · `{rel}`', '', '```yaml', texto.rstrip(), '```', '']
            continue
        cab, corpo = separar(texto)
        partes += [f'## {nome_de(rel, cab)} · `{rel}`', '']
        if cab.strip():
            partes += ['```yaml', cab.rstrip(), '```', '']
        partes += [descer(corpo.strip()), '']
    return '\n'.join(partes).rstrip() + '\n'


def gerar(saida):
    os.makedirs(saida, exist_ok=True)
    for n in os.listdir(saida):
        os.remove(os.path.join(saida, n))
    commit, data = git('rev-parse', '--short', 'HEAD'), git('log', '-1', '--format=%cI')
    agora = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    hashes, linhas = {}, []
    for titulo, rels in pecas():
        texto = documento(titulo, rels)
        nome = titulo + '.md'
        open(os.path.join(saida, nome), 'w', encoding='utf-8').write(texto)
        hashes[nome] = hashlib.sha256(texto.encode()).hexdigest()
        tam = len(texto.encode())
        linhas.append(f'| {titulo} | {len(rels)} | {tam // 1000} KB |')
        if tam > LIMITE:
            print(f'AVISO: «{nome}» tem {tam // 1000} KB; parte-a em pecas() no script', file=sys.stderr)
    leia = ['# Cópia do repositório da CotN', '',
            f'Cópia de leitura do repositório `jpapereira5/campaign-cotn`, commit `{commit}` ({data}), gerada a {agora}.', '',
            'A fonte de verdade é o repositório: o que se escrever aqui perde-se na próxima cópia. '
            'O Claude atualiza esta pasta uma vez por dia (tarefa agendada) e só reenvia as peças que mudaram; '
            'o `manifesto.json` diz que versão de cada peça está aqui. O repositório inteiro descarrega-se do GitHub '
            '(Code → Download ZIP).', '',
            '| Peça | Ficheiros | Tamanho |', '| :-- | --: | --: |', *linhas, '']
    open(os.path.join(saida, LEIA_ME), 'w', encoding='utf-8').write('\n'.join(leia))
    json.dump({'commit': commit, 'data': data, 'gerado': agora, 'pecas': hashes},
              open(os.path.join(saida, MANIFESTO), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(hashes)} peças, commit {commit}')


TIPOS = {'.md': 'text/markdown', '.json': 'application/json', '.html': 'text/html', '.css': 'text/css',
         '.js': 'text/javascript', '.yml': 'text/yaml', '.yaml': 'text/yaml'}


def espelho(repo, saida):
    repo = os.path.abspath(repo)
    os.makedirs(saida, exist_ok=True)
    subprocess.run(['rm', '-rf', os.path.join(saida, 'ficheiros')], check=True)
    run = lambda *a: subprocess.run(['git', *a], cwd=repo, check=True, capture_output=True, text=True).stdout.strip()
    nome, commit, data = os.path.basename(repo), run('rev-parse', '--short', 'HEAD'), run('log', '-1', '--format=%cI')
    agora = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    hashes, info = {}, {}
    for rel in run('ls-files').split('\n'):
        dados = open(os.path.join(repo, rel), 'rb').read()
        destino = os.path.join(saida, 'ficheiros', rel)
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        open(destino, 'wb').write(dados)
        hashes[rel] = hashlib.sha256(dados).hexdigest()
        info[rel] = {'bytes': len(dados), 'tipo': TIPOS.get(os.path.splitext(rel)[1], 'text/plain')}
    leia = [f'# Cópia do repositório {nome}', '',
            f'Cópia de leitura de `jpapereira5/{nome}`, commit `{commit}` ({data}), gerada a {agora}.', '',
            'Cada ficheiro do repositório está aqui com o mesmo caminho e o mesmo conteúdo. A fonte de verdade é o '
            'GitHub: o que se mudar aqui perde-se na próxima cópia. O Claude atualiza esta pasta uma vez por dia e só '
            'reenvia os ficheiros que mudaram (`manifesto.json`). Para reconstruir o projeto: descarrega a pasta, '
            '`npm ci` e `npm run dev`.', '', f'{len(hashes)} ficheiros.', '']
    open(os.path.join(saida, LEIA_ME), 'w', encoding='utf-8').write('\n'.join(leia))
    json.dump({'repo': f'jpapereira5/{nome}', 'commit': commit, 'data': data, 'gerado': agora, 'pecas': hashes,
               'ficheiros': info}, open(os.path.join(saida, MANIFESTO), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(hashes)} ficheiros, commit {commit}')


def diferencas(saida, antigo):
    novo = json.load(open(os.path.join(saida, MANIFESTO), encoding='utf-8'))
    velho = json.load(open(antigo, encoding='utf-8')) if os.path.exists(antigo) else {'commit': None, 'pecas': {}}
    enviar = [n for n, h in novo['pecas'].items() if velho['pecas'].get(n) != h]
    apagar = [n for n in velho['pecas'] if n not in novo['pecas']]
    igual = velho.get('commit') == novo['commit'] or (not enviar and not apagar)
    print(json.dumps({'commit_antigo': velho.get('commit'), 'commit_novo': novo['commit'], 'nada_a_fazer': igual,
                      'enviar': enviar, 'apagar': apagar}, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == 'gerar':
        gerar(sys.argv[2])
    elif len(sys.argv) == 4 and sys.argv[1] == 'espelho':
        espelho(sys.argv[2], sys.argv[3])
    elif len(sys.argv) == 4 and sys.argv[1] == 'diferencas':
        diferencas(sys.argv[2], sys.argv[3])
    else:
        sys.exit(__doc__)
