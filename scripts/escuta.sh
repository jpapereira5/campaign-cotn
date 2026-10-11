#!/usr/bin/env bash
# Escuta da Grelha (docs/grelha.md, secção 12; skill /vigia): avisa quando a app guarda, isto é, quando há commits
# novos em origin/main. Espera que o DM pare de guardar (o ramo fica igual entre duas verificações) e junta tudo num aviso.
# Uso: a partir da raiz do repositório, num Monitor: bash scripts/escuta.sh
cd "$(dirname "$0")/.." || exit 1

remote_sha() { timeout 20 git ls-remote origin refs/heads/main 2>/dev/null | cut -f1; }

last=$(remote_sha)
[ -z "$last" ] && last=$(git rev-parse HEAD)
echo "ESCUTA LIGADA · main em ${last:0:7}"

while true; do
  sleep 10
  cur=$(remote_sha)
  if [ -z "$cur" ] || [ "$cur" = "$last" ]; then continue; fi

  # Espera que o DM pare de guardar: só avança quando o ramo não muda entre duas verificações.
  while true; do
    sleep 10
    nxt=$(remote_sha)
    if [ -n "$nxt" ] && [ "$nxt" != "$cur" ]; then cur=$nxt; else break; fi
  done

  if timeout 60 git fetch -q origin main 2>/dev/null; then
    echo "COMMITS NOVOS ($(git rev-list --count "$last..$cur" 2>/dev/null || echo '?')) ${last:0:7}..${cur:0:7}"
    git log --reverse --format='  %h %ad %s' --date=format:'%H:%M' "$last..$cur" 2>/dev/null | head -20
    echo "  ficheiros: $(git diff --name-only "$last" "$cur" 2>/dev/null | tr '\n' ' ' | cut -c1-400)"
  else
    echo "COMMITS NOVOS em ${cur:0:7} (o fetch falhou; ver à mão)"
  fi
  last=$cur
done
