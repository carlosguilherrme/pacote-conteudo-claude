# Pacote Conteúdo para Claude Code

Skills para produzir vídeo com o Claude Code: vlog para YouTube, Reels, motion graphics, thumbnails e geração de imagem e vídeo com IA. Você manda os clipes brutos, conversa com o Claude e recebe o vídeo pronto.

## Instalar

Precisa de [Claude Code](https://claude.com/claude-code), Node 20+, ffmpeg, Google Chrome e Python 3.

```bash
git clone https://github.com/carlosguilherrme/pacote-conteudo-claude
cd pacote-conteudo-claude
./instalar.sh
pip install faster-whisper
```

Abra uma conversa nova no Claude Code e peça, por exemplo: "edita esse vlog com os vídeos da pasta X".

## O que vem

| Skill | Para que serve | Origem |
|---|---|---|
| `vlog-editor` | Transcreve os clipes, monta a sequência, corta as pausas, aplica cor de cinema, trilha, rótulos, time-lapse e Reel 9:16 de resumo | este repositório |
| `studio` | Edição de vídeo falado por conversa, com galeria de estilos | wrapper para [mackswendhell/studio](https://github.com/mackswendhell/studio) |
| `remotion-motion-graphics` | Intro, cards, letreiros e anúncios animados | adaptada de [haidrrrry/claude-remotion-skill](https://github.com/haidrrrry/claude-remotion-skill) |
| `remotion-*` | API do Remotion para o Claude escrever vídeo em código | [remotion-dev/skills](https://github.com/remotion-dev/skills), baixada pelo instalador |
| `higgsfield-*` | Geração de imagem e vídeo, thumbnail, Soul ID, explainer | [higgsfield-ai/skills](https://github.com/higgsfield-ai/skills), baixada pelo instalador |
| `video-editing` | Corte, legenda e ritmo | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), baixada pelo instalador |

Opcional, para o Claude assistir vídeos de referência: [oxbshw/watch-skill](https://github.com/oxbshw/watch-skill). Dentro do Claude Code:

```
/plugin marketplace add oxbshw/watch-skill
```

## Contas e custos

- **Remotion** é grátis para pessoas físicas e empresas pequenas. Empresas maiores precisam de [licença própria](https://www.remotion.dev/license).
- **Higgsfield** usa conta e créditos próprios.
- **Trilha:** o `vlog-editor` espera um `.mp3` instrumental de pelo menos 90 s. Use uma música com licença para o seu uso.

## Personalizar

Tudo do `vlog-editor` fica em `skills/vlog-editor`: a cor em `scripts/cor.txt`, o arroba em `projeto-modelo/src/Reel.tsx`, e a legenda gravada na imagem em `LEGENDA_GRAVADA`, no topo de `Vlog.tsx` e `Reel.tsx`.

## Licença

MIT. As skills de terceiros seguem as licenças dos repositórios originais. A fonte Instrument Serif segue a SIL OFL (`projeto-modelo/public/fontes/OFL.txt`).
