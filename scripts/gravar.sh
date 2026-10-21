#!/usr/bin/env bash
# Grava o repositório: normaliza, valida, testa, commit, pull --rebase e push.
# Uso: npm run gravar -- "mensagem do commit"
#      (as linhas de atribuição da sessão vão no fim da mensagem, como sempre)
# Sem mensagem, mostra o que mudou e para. Com --sem-push, fica no commit.
set -euo pipefail
cd "$(dirname "$0")/.."
msg="${1:-}"; push=1
for a in "$@"; do [ "$a" = "--sem-push" ] && push=0; done
if [ -z "$msg" ] || [ "$msg" = "--sem-push" ]; then git status --short; echo "uso: npm run gravar -- \"mensagem\" [--sem-push]"; exit 1; fi
python3 scripts/normalizar-texto.py >/dev/null
npm run -s validate
npm test 2>&1 | grep -E "^# (pass|fail)" | tr '\n' ' '; echo
if npm test 2>&1 | grep -q "^# fail [1-9]"; then echo "testes a falhar"; exit 1; fi
git add -A
if git diff --cached --quiet; then echo "nada para gravar"; exit 0; fi
git commit -q -m "$msg"
if [ "$push" = 1 ]; then
  git pull -q --rebase origin main
  git push -q origin main
fi
git log --oneline -1
