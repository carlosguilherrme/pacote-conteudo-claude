---
name: vlog-editor
description: Edita vlog do YouTube a partir de vários clipes brutos: transcreve, escolhe a sequência, corta as pausas automaticamente, aplica cor de cinema, coloca trilha nos trechos sem fala e gera Reel 9:16 de resumo, no Remotion. Use quando pedirem para editar um vlog, juntar vídeos de um dia ou evento, fazer um resumo ou Reel de melhores momentos, ou time-lapse de um trecho.
---

# Vlog Editor

Fluxo completo de vlog no estilo documental: gancho curto, montagem rápida com música, fala com jump cut nas pausas, fecho com chamada para ação.

## Requisitos

Node 20+, ffmpeg, Python 3 com `pip install faster-whisper`. Chrome instalado para o render do Remotion.

## Passo a passo

1. **Projeto novo:** crie `~/Movies/vlog-<data>/`, copie para lá `scripts/*` desta skill e copie `projeto-modelo/` como `remotion/`. Rode `npm install` em `remotion/`. Pegue uma trilha instrumental e salve como `remotion/public/trilha/sem-fala.mp3` (mínimo 90 s).
2. **Brutos:** copie os clipes para `brutos/` com nomes simples, sem espaço. Nunca edite direto do cartão.
3. **Análise:** `python analisar.py`. Gera `folhas/*.jpg` (8 quadros por clipe) e `transcricao/tudo.json` (fala com tempo por palavra). Leia as folhas e as transcrições antes de decidir.
4. **Plano:** escolha a ordem e mostre à pessoa em blocos com duração. Ordem que funciona:
   - gancho de 5 a 8 s com a frase mais forte do dia;
   - montagem de 12 a 14 s, planos de 2 s com trilha;
   - manhã ou abertura falada;
   - imagens do lugar com trilha;
   - fala principal;
   - fecho completo, sempre com a chamada para ação inteira.
   Abertura longa cansa: a pessoa acha que o vídeo é só aquilo.
5. **Preparação:** `python preparar.py` gera os clipes 1080p 30 fps com cor e volume. Para time-lapse: `TIMELAPSE=clipe:6 python preparar.py` gera `timelapse.mp4` a ×6. Vídeo vertical: `VERTICAIS=clipe1,clipe2`.
6. **Linha do tempo:** edite `BLOCOS` em `gerar_edl.py` e rode. Use:
   - `fala(src, ini, fim, rot="rótulo")` para trecho falado, com corte automático nas pausas maiores que 0,45 s;
   - `broll(src, ini, fim, rot=...)` para imagem com som ambiente baixo por baixo da trilha;
   - `mudo(src, ini, fim)` para imagem só com trilha, quando o som do clipe tem fala de outra pessoa.
   Corrija erros do Whisper em `TROCAS` (palavra sempre) e `FIXOS` (palavra em um tempo exato).
7. **Revisão:** `npx remotion studio` em `remotion/` e confira a composição `Vlog`. Olhe stills antes do render final.
8. **Reel:** preencha `CLIPES` em `preparar_reel.py` com o `x` do rosto em cada clipe, rode, edite `PLANOS` em `gerar_reel.py` e rode. Sai 9:16 com recorte do 4K.
9. **Final:** `./finalizar.sh yt` e `./finalizar.sh reel`. YouTube sai em −20 LUFS, Reel em −14, mais `.srt` do vídeo.

## Ajustes rápidos

- **Legenda na imagem:** `LEGENDA_GRAVADA` no topo de `Vlog.tsx` e `Reel.tsx`.
- **Cor:** troque `scripts/cor.txt`, um filtro de ffmpeg. O padrão é um look de cinema com sombra azulada e pele quente.
- **Rótulos:** fonte Instrument Serif em caixa alta, branca. A fonte vem em `public/fontes`.
- **Arroba do Reel:** procure `@seu_arroba` em `Reel.tsx`.

## Pegadinhas

- `alimiter` precisa de `level=0`, senão desfaz o ajuste de volume (`finalizar.sh` já faz).
- iPhone com áudio espacial grava duas trilhas e o ffmpeg não lê a APAC: `analisar.py` e `preparar.py` já escolhem a AAC.
- Whisper formaliza a fala e erra siglas e nomes. Leia a transcrição inteira antes do render.
- Antes de usar uma música, rode o Whisper nela para confirmar que não tem voz.
