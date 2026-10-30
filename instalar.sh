#!/bin/bash
# Instala o pacote no Claude Code: as skills deste repositório + as de terceiros, direto das fontes originais.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p ~/.claude/skills
for s in "$DIR"/skills/*/; do
  n="$(basename "$s")"
  if [ -e ~/.claude/skills/"$n" ]; then echo "já existe, mantive: $n"; else cp -R "$s" ~/.claude/skills/"$n"; echo "instalada: $n"; fi
done
npx -y skills add remotion-dev/skills -g -a claude-code -s '*' -y
npx -y skills add higgsfield-ai/skills -g -a claude-code -s '*' -y
npx -y skills add affaan-m/everything-claude-code -g -a claude-code -s video-editing -y
echo "Pronto. Abra uma conversa nova no Claude Code."
