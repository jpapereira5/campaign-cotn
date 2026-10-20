# Cópia do repositório na Drive

O repositório tem uma cópia de leitura na Drive, na pasta `DND/cotn_2026/copia_repo` (`1z1HPx3iNHSlvnyDiJfEelVZcKxfQGr0R`):

- `campaign-cotn.zip`: o repositório inteiro (`git archive` do último commit);
- `00 LEIA-ME.md` e um documento Markdown por área (`01 Personagens.md` … `11 Documentação.md`), com cada ficha sob um título com o nome e o caminho, e o cabeçalho YAML num bloco de código.

Quem a mantém é a GitHub Action `.github/workflows/copia-drive.yml`: corre a cada push para `main` (menos os «Guardar» da app, que só tocam `grelha/dm.json`), todos os dias às 04:17 UTC e à mão («Run workflow»). O script é `scripts/copia-drive.py` (`gerar` escreve os ficheiros, `enviar` substitui o conteúdo dos que já estão na pasta). A Drive guarda o histórico de versões de cada ficheiro.

A cópia é só de leitura. O que se escrever lá perde-se na próxima cópia; a fonte de verdade é o repositório.

## Ligar a Action à Drive (uma vez)

A Action entra na Drive com uma **conta de serviço** do Google Cloud. Enquanto o segredo não existir, a Action termina sem fazer nada.

1. Em <https://console.cloud.google.com/>, cria um projeto (por exemplo `cotn-copia`) e, em «APIs e serviços → Biblioteca», ativa a **Google Drive API**.
2. Em «IAM e administração → Contas de serviço», cria uma conta (por exemplo `copia-drive`). Não precisa de funções no projeto.
3. Na conta criada, separador «Chaves» → «Adicionar chave» → «JSON». Descarrega o ficheiro.
4. Na Drive, partilha a pasta `copia_repo` com o e-mail da conta de serviço (`copia-drive@<projeto>.iam.gserviceaccount.com`) como **Editor**.
5. No GitHub, `jpapereira5/campaign-cotn` → Settings → Secrets and variables → Actions → «New repository secret»: nome `GDRIVE_SA_KEY`, valor o conteúdo inteiro do JSON. Depois apaga o JSON do computador.
6. Em Actions → «Cópia na Drive» → «Run workflow», para a primeira cópia.

A chave fica só no segredo do GitHub: nunca entra no repositório (é público).

## Limites

- Uma conta de serviço não tem espaço próprio na Drive, por isso **não cria ficheiros**: só substitui o conteúdo dos que já estão na pasta (criados pelo dono). Uma área nova em `AREAS` (no script) precisa de um ficheiro com o mesmo nome criado antes na pasta; senão a Action falha e diz qual falta.
- Renomear um ficheiro na pasta tem o mesmo efeito: a Action deixa de o encontrar.
