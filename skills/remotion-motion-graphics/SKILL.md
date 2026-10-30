---
name: remotion-motion-graphics
description: "Acabamento de motion design para vídeos Remotion (fonte haidrrrry/claude-remotion-skill, MIT, adaptada em 15/10/2026). Use para CENAS de motion graphics: intro/outro, card, lower third, tela cheia de frase, contador, gráfico, anúncio ou promo animado do zero, e quando um vídeo pedir menos genérico ou mais profissional. Dá o ofício de movimento (mola, escalonamento, saída rápida, camadas, grão) e o ciclo renderizar, olhar os quadros e corrigir. NÃO use para vídeo falado ou vlog com a câmera como protagonista: nesses valem as skills vlog-editor e remotion-best-practices."
---

# Remotion Motion Graphics

Remotion renders React components frame-by-frame into video. Code quality is not the
bottleneck — **motion design craft is**. Untrained generation produces linear easing,
opacity-only fades, simultaneous entrances, flat colors, and no texture. That is the
"generic AI video" look. This skill exists to prevent it.

## Ajustes (valem sobre as regras abaixo)

Esta skill foi escrita para vídeo feito do zero. Ela convive com `remotion-best-practices` (API do Remotion, Studio interativo) e com `studio` (vídeo falado). Em conflito, manda o que está aqui:

- **Vídeo:** usar `<Video>` de `@remotion/media` (guia remotion-markup/video-editing.md), nunca `<OffthreadVideo>` do texto abaixo. Estrutura editável: um nó JSX por clipe, `premountFor={fps}`, `Interactive.withSchema` para componentes reutilizáveis.
- **Vídeo falado e vlog:** NÃO aplicar a pilha de 5 camadas nem grade/grão/vinheta pesados. Pele real e imagem limpa; a cor é a do projeto ("B cinema" no YouTube). Vale só o ofício de movimento nas camadas por cima (rótulos, chips, lema, legenda): mola, escalonamento, saída mais rápida que a entrada.
- **Regras 5 e 6 (camadas, Ken Burns):** só em cena de motion graphics sem câmera ou em imagem estática. Nunca em cima do rosto.
- **Mantém sempre:** easing em todo `interpolate`, tempo derivado de `fps`, tema único, e o ciclo de verificar quadros (`npx remotion still`) antes de entregar.
- **Texto/idioma:** português do Brasil; sem emoji como ícone; sem texto dentro de imagem gerada por IA.

## Non-negotiable rules (apply to EVERY composition)

1. **NEVER use linear interpolation.** Every `interpolate()` gets an easing curve;
   every entrance prefers `spring()`. Always `extrapolateLeft/Right: "clamp"`.
2. **Entrances animate 2–3 properties together** (opacity + translateY + scale).
   A lone fade is forbidden.
3. **Stagger everything.** Lists, words, rays, cards: 3–6 frame offsets. Nothing
   enters simultaneously.
4. **Exits exist and are faster than entrances** (~10 frames vs ~20).
5. **Five-layer stack in every scene**, bottom to top: background mesh → assets →
   graphics/type → color grade → grain + vignette. Never a flat solid background.
6. **Every still image gets Ken Burns** (slow scale 1→1.08 + pan). Every video asset
   uses `<OffthreadVideo>`, never `<Video>`.
7. **Idle elements breathe**: anything on screen >2s gets sin-wave micro-motion.
8. **All timing derives from `fps`** via `useVideoConfig()`. No magic frame numbers.
9. **One theme object** at the top of the project (colors, easings, spring presets,
   fonts). Never inline a hex color or easing in a component.
10. **Render, extract frames, LOOK at them, fix, re-render.** Never deliver an
    unverified render. This loop is mandatory — see Verification below.

## Workflow

### Step 1 — Scope
Determine: duration, fps (30 default; 60 only for heavy fast motion), dimensions
(1080×1920 Reels/Shorts, 1920×1080 landscape), what assets exist (images, footage,
audio, logos), and whether this is a new composition or an edit to an existing project.
If editing an existing project: read `src/` fully first, find the theme (or create one),
and refactor violations of the rules above before adding features.

### Step 2 — Setup
New project:
```bash
npm install remotion @remotion/cli react react-dom
# optional: @remotion/transitions @remotion/motion-blur @remotion/google-fonts
```
Copy `assets/theme.ts` from this skill into `src/theme.ts` and adjust the palette to
the user's brand. Structure: `src/index.ts` (registerRoot) → `src/Root.tsx`
(Composition, duration/fps/size) → `src/scenes/*.tsx` → `src/components/*.tsx`.
User assets go in `public/`, loaded via `staticFile()`.

### Step 3 — Build
Read `references/motion-patterns.md` for the reusable component implementations
(BgMesh, Grade, Grain, Vignette, KenBurns, WordReveal, Stagger, Counter, Spark,
transitions, parallax). Compose scenes from those patterns. For pacing, rhythm,
typography, color palettes, and sound design rules, read
`references/design-rules.md`.

Scene rhythm: HIT → hold (15–20 still frames) → build → HIT. Something must move
in the first 15 frames. Never >90 frames without a new visual element.

### Step 4 — Render
```bash
npx remotion render src/index.ts <CompId> out/video.mp4 --codec h264 --crf 17
```
Remotion needs a Chromium binary. If its auto-download fails (sandboxes, offline CI),
find one and pass it explicitly:
```bash
which chromium chromium-browser google-chrome 2>/dev/null
ls /opt/pw-browsers 2>/dev/null   # Playwright installs live here
npx remotion render ... --browser-executable=<path>
```
If full Chrome errors with "Old Headless mode has been removed", use a
`headless_shell` binary instead (Playwright ships one as
`chromium_headless_shell-*/chrome-linux/headless_shell`).

### Step 5 — VERIFY (mandatory, never skip)
Extract frames at key moments and visually inspect each one. The portable
method — works on machines with no system ffmpeg, renders the exact frame:
```bash
for f in 15 45 90 150; do
  npx remotion still src/index.ts <CompId> out/check_$f.png --frame $f --overwrite
done
```
If system ffmpeg IS available, extracting from the finished mp4 also verifies
the encode itself (`-ss` seeking is more portable than `select=` filters, whose
quoting breaks in some shells and in Remotion's bundled ffmpeg):
```bash
ffmpeg -v error -ss 1.5 -i out/video.mp4 -frames:v 1 check_1.png
```
Look for, and fix, in order of frequency:
- **Spacing bugs**: `gap`/`margin` in `em` resolves against the PARENT font-size
  (often 16px), not the text size — use px values in flex containers around big type.
- Text overflowing or touching frame edges (keep critical content in middle 75%
  vertically for 9:16 — platform UI covers top/bottom).
- Elements visible before their entrance or after their exit (missing clamp).
- Color/contrast failures: hero color on >1 element per frame, dim text unreadable
  over the grade.
- Layer order mistakes (grain/vignette must be on top, grade above content).
Fix → re-render → re-extract → re-inspect. Only deliver after a clean pass.
Then run the final checklist at the bottom of `references/design-rules.md`.

### Editing the user's existing footage
To enhance an existing mp4 (captions, grade, intro/outro) rather than build from
scratch: put the file in `public/`, render it as the asset layer with
`<OffthreadVideo src={staticFile("clip.mp4")} />`, set composition duration from the
clip length, and stack graphics/grade/grain above it. Get the clip's duration and fps
with `ffprobe` before setting up the composition. For word-synced captions over
speech, see the captions section of `references/motion-patterns.md`.

## Reference files
- `references/motion-patterns.md` — copy-paste component library: backgrounds,
  grade/grain/vignette, Ken Burns, text reveals, counters, transitions, parallax,
  audio sync, captions. Read before writing components.
- `references/design-rules.md` — palettes, typography rules, scene architecture,
  sound design, pre-delivery checklist. Read before designing scenes and before
  final delivery.
- `assets/theme.ts` — the theme template to copy into every project.

## Common failure modes to actively avoid
- **Emoji as icons.** Emoji render as full-color platform glyphs (green ✳️,
  blue 🌐) that ignore your palette and silently break the one-hero-color rule,
  and they sit on whatever background you gave them (orange mascot on orange
  tile = invisible). Draw glyphs with CSS/SVG in theme colors, or verify every
  emoji against the extracted frames.
- **No SFX assets is not a reason to ship silent.** Synthesize a minimal kit as
  16-bit WAVs from a Node script (noise-burst whoosh, pitch-drop pop, sine-thump
  kick/bass, detuned-sine pad) into `public/sfx/` — see `examples/scripts/` in
  the repo. Zero downloads, fully deterministic.
- Generating one giant component instead of themed, reusable pieces.
- `durationInFrames` mismatch between Composition and scene content (dead air).
- Forgetting `--overwrite` on re-renders, then inspecting the stale file.
- Fonts: never rely on system defaults for hero text; load a display font via
  `@remotion/google-fonts` or `@font-face` + `staticFile`.
- Trying to "describe" the result to the user instead of rendering and verifying it.
