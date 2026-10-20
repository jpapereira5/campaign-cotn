#!/usr/bin/env python3
"""Cópia do repositório para a Drive (pasta cotn_2026/copia_repo).

Dois passos, usados pela GitHub Action `.github/workflows/copia-drive.yml`:

  python3 scripts/copia-drive.py gerar SAIDA
      Escreve em SAIDA o `campaign-cotn.zip` (git archive do HEAD) e um documento
      Markdown legível por área do cânone (personagens, locais, fações…).

  python3 scripts/copia-drive.py enviar SAIDA
      Substitui o conteúdo dos ficheiros com o mesmo nome na pasta da Drive.
      Precisa das variáveis GDRIVE_SA_KEY (a chave JSON da conta de serviço, num
      segredo do GitHub) e GDRIVE_PASTA (a id da pasta). A conta de serviço não tem
      espaço próprio na Drive, por isso só atualiza ficheiros que já existam (criados
      pelo dono da pasta); um ficheiro em falta dá erro com o nome dele.

Nunca escreve no repositório.
"""
import datetime, glob, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIP = 'campaign-cotn.zip'

# (nome do documento, ficheiros que entram, por ordem)
AREAS = [
    ('01 Personagens', ['mundo/personagens/*.md']),
    ('02 Locais', ['mundo/locais/*.md']),
    ('03 Fações', ['mundo/facoes/*.md']),
    ('04 Itens', ['mundo/itens/*.md']),
    ('05 Segredos e lore', ['mundo/lore.md', 'mundo/segredos/*.md']),
    ('06 Campanha e beats', ['plano/campanha.md', 'plano/beats/*.md']),
    ('07 Fios', ['plano/fios/*.md']),
    ('08 Sessões', ['registo/sessoes/*.md']),
    ('09 Decisões', ['registo/decisoes.md']),
    ('10 Mesa', ['mesa/**/*.md', 'mesa/**/*.yaml']),
    ('11 Documentação', ['README.md', 'AGENTS.md', 'docs/*.md']),
]
LEIA_ME = '00 LEIA-ME'

FENCE = re.compile(r'^(```|~~~)')
HEAD = re.compile(r'^(#{1,6})(\s)')


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout.strip()


def ficheiros(padroes):
    vistos = []
    for p in padroes:
        for f in sorted(glob.glob(os.path.join(ROOT, p), recursive=True)):
            rel = os.path.relpath(f, ROOT)
            if rel not in vistos:
                vistos.append(rel)
    return vistos


def separar(texto):
    """(cabeçalho YAML ou '', corpo)."""
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


def documento(titulo, rels, rodape):
    partes = [f'# {titulo}', '', rodape, '', f'{len(rels)} ficheiros.', '']
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
    commit = git('rev-parse', '--short', 'HEAD')
    data = git('log', '-1', '--format=%cI')
    agora = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    rodape = (f'Cópia automática do repositório `jpapereira5/campaign-cotn`, commit `{commit}` ({data}), '
              f'gerada a {agora}. Só leitura: as mudanças fazem-se no repositório.')
    git('archive', '--format=zip', '-o', os.path.join(os.path.abspath(saida), ZIP), 'HEAD')
    indice = []
    for titulo, padroes in AREAS:
        rels = ficheiros(padroes)
        with open(os.path.join(saida, titulo + '.md'), 'w', encoding='utf-8') as f:
            f.write(documento(titulo, rels, rodape))
        indice.append(f'| {titulo} | {", ".join("`" + p + "`" for p in padroes)} | {len(rels)} |')
    leia = [f'# Cópia do repositório da CotN', '', rodape, '',
            f'- `{ZIP}`: o repositório inteiro (tudo o que está no git, incluindo `grelha/` e `livro/`).',
            '- Um documento por área do cânone, para ler ou pesquisar na Drive:', '',
            '| Documento | Ficheiros do repositório | N.º |', '| :-- | :-- | --: |', *indice, '',
            'Atualiza-se sozinha (GitHub Action `copia-drive`) a cada push para `main` e uma vez por dia. '
            'O que se escrever aqui perde-se na próxima cópia.', '']
    with open(os.path.join(saida, LEIA_ME + '.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(leia))
    for n in sorted(os.listdir(saida)):
        print(f'{os.path.getsize(os.path.join(saida, n)):>10}  {n}')


def enviar(saida):
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    chave = json.loads(os.environ['GDRIVE_SA_KEY'])
    pasta = os.environ['GDRIVE_PASTA']
    cred = service_account.Credentials.from_service_account_info(
        chave, scopes=['https://www.googleapis.com/auth/drive'])
    drive = build('drive', 'v3', credentials=cred, cache_discovery=False)
    existentes, token = {}, None
    while True:
        r = drive.files().list(q=f"'{pasta}' in parents and trashed = false",
                               fields='nextPageToken, files(id, name)', pageToken=token,
                               supportsAllDrives=True, includeItemsFromAllDrives=True).execute()
        existentes.update({f['name']: f['id'] for f in r['files']})
        token = r.get('nextPageToken')
        if not token:
            break
    faltam = []
    for n in sorted(os.listdir(saida)):
        if n not in existentes:
            faltam.append(n)
            continue
        tipo = 'application/zip' if n.endswith('.zip') else 'text/markdown'
        drive.files().update(fileId=existentes[n], media_body=MediaFileUpload(os.path.join(saida, n), mimetype=tipo),
                             supportsAllDrives=True).execute()
        print(f'atualizado: {n}')
    if faltam:
        sys.exit('Ficheiros em falta na pasta da Drive (cria-os lá, com estes nomes, como dono da pasta): '
                 + ', '.join(faltam))


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] not in ('gerar', 'enviar'):
        sys.exit(__doc__)
    {'gerar': gerar, 'enviar': enviar}[sys.argv[1]](sys.argv[2])
