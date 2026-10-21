#!/usr/bin/env bash
# Confere que as cópias das skills genéricas em .claude/skills/ são iguais às do dnd-skills (a cópia-mãe).
# Uso: bash scripts/skills-conferir.sh [caminho do clone do dnd-skills]   (por omissão ../dnd-skills)
set -euo pipefail
cd "$(dirname "$0")/.."
mae="${1:-../dnd-skills}"
[ -d "$mae/skills" ] || { echo "não encontro $mae/skills (clona jpapereira5/dnd-skills)"; exit 2; }
falhas=0
for d in "$mae"/skills/*/; do
  nome="$(basename "$d")"
  [ -d ".claude/skills/$nome" ] || { echo "falta aqui a skill genérica: $nome"; falhas=1; continue; }
  if ! diff -rq "$d" ".claude/skills/$nome" >/dev/null; then
    echo "diverge do dnd-skills: $nome"; diff -r "$d" ".claude/skills/$nome" | head -5; falhas=1
  fi
done
[ "$falhas" = 0 ] && echo "skills genéricas iguais ao dnd-skills"
exit $falhas
