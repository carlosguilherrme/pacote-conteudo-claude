---
name: studio
description: Estúdio de edição de vídeo por conversa (repo mackswendhell/studio). Nível 1 grátis no Remotion com galeria de estilos prontos (textos, prints com zoom e marca-texto, tela dividida, legendas, gráficos) compostos por cima do vídeo gravado; Nível 2 com B-roll gerado na Higgsfield. Use para editar vídeo falado (Reels, aula, YouTube) com overlays e estilos, ou quando pedirem "studio", "estilo da galeria" ou "editar conversando".
---

# Studio

Se a pasta `~/studio` não existir, clone: `git clone https://github.com/mackswendhell/studio ~/studio`, depois `cd ~/studio && npm install`.

O método completo está em `~/studio/CLAUDE.md`. Leia esse arquivo e os guias que ele manda e siga como diretor de vídeo: perguntar o nível, montar `plano.md` para aprovação antes de programar, stills de revisão antes do render final. Projetos novos em `projetos/NNN. slug/`, entregas em `edicoes/NNN. slug/`.

Quando a pessoa quiser remontar o vídeo (montagem rápida, jump cuts, vlog), use a skill `vlog-editor`, porque a regra `locked-final-cut` do repo serve para vídeo falado com camadas por cima.
