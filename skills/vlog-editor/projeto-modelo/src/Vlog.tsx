import React from "react";
import { Audio, Video } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DURACAO, LEGENDAS, SEGS, TRILHAS } from "./edl";
import { Vinheta } from "./Vinheta";

// Vlog: a linha do tempo vem de gerar_edl.py (src/edl.ts).
// DNA Dalen: gancho, montagem rápida com trilha e rótulos à mão, depois fala longa (jump cut só nas pausas).
// Clipes já com a cor B cinema e -20 LUFS (preparar.py). Sony vertical entra em tríptico ou no centro com fundo desfocado.
// A linha do tempo vem da EDL (gerar_edl.py): os planos são gerados por um único template, de propósito.

loadFont({ family: "Instrument Serif", url: staticFile("fontes/InstrumentSerif-Regular.ttf"), weight: "400" });

const LEGENDA_GRAVADA = false; // true grava a legenda na imagem
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const mola = Easing.bezier(0.16, 1, 0.3, 1);
const BRANCO_PAPEL = "#F2EFE8";
type Seg = (typeof SEGS)[number];

const clipe = (src: string) => staticFile(`clipes/${src}.mp4`);
// v2 (21/10): trilha rock/trap em todo trecho sem fala; o som ambiente do clipe fica por baixo
const TRILHA_ARQ = "trilha/sem-fala.mp3";
const TRILHA_Q = 2700; // 90 s a 30 fps (trap, escolhida em 21/10); loop só se os trechos passarem disso
const volClipe = (s: Seg) => ("mus" in s && s.mus ? 0.55 : 1);

// ---------- layouts ----------

const Cheio: React.FC<{ s: Seg }> = ({ s }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Video src={clipe(s.src as string)} trimBefore={Math.round((s.ini as number) * fps)} muted={!("som" in s && s.som)} volume={volClipe(s)} style={{ width: 1920, height: 1080 }} />
      <Vinheta forca={0.85} cor="#26373F" />
    </AbsoluteFill>
  );
};

// vertical (1080×1920) no centro, com o próprio vídeo ampliado, desfocado e escurecido atrás
const Vertical: React.FC<{ s: Seg }> = ({ s }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const trim = Math.round((s.ini as number) * fps);
  const entra = interpolate(frame, [0, 10], [1.04, 1], { ...clamp, easing: mola });
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <AbsoluteFill style={{ filter: "blur(30px) brightness(0.62) saturate(0.95)", scale: "1.15" }}>
        <Video src={clipe(s.src as string)} trimBefore={trim} muted style={{ width: 1920, height: 1080, objectFit: "cover" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: (1920 - 608) / 2, top: 0, width: 608, height: 1080, scale: String(entra), boxShadow: "0 0 60px rgba(0,0,0,.55)" }}>
        <Video src={clipe(s.src as string)} trimBefore={trim} muted={!("som" in s && s.som)} volume={volClipe(s)} style={{ width: 608, height: 1080 }} />
      </div>
      <Vinheta forca={0.6} cor="#26373F" />
    </AbsoluteFill>
  );
};

// três verticais lado a lado; o som (quando há) vem só do meio
const Triptico: React.FC<{ s: Seg }> = ({ s }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const srcs = s.src as readonly string[];
  const inis = s.ini as readonly number[];
  const L = (1920 - 2 * 8) / 3;
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {srcs.map((src, i) => {
        const atraso = i * 3; // escalonado: um painel por vez
        const p = interpolate(frame, [atraso, atraso + 9], [0, 1], { ...clamp, easing: mola });
        return (
          <div key={i} style={{ position: "absolute", left: i * (L + 8), top: 0, width: L, height: 1080, overflow: "hidden", opacity: p, translate: `0px ${(1 - p) * 40}px` }}>
            <Video src={clipe(src)} trimBefore={Math.round(inis[i] * fps)} muted={!("som" in s && s.som) || i !== 1} volume={volClipe(s)} style={{ width: L, height: 1080, objectFit: "cover" }} />
          </div>
        );
      })}
      <Vinheta forca={0.55} cor="#26373F" />
    </AbsoluteFill>
  );
};

// foto "impressa" sobre papel claro, levemente girada, com zoom lento (Dalen)
const Foto: React.FC<{ s: Seg; idx: number }> = ({ s, idx }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const entra = spring({ frame, fps, config: { damping: 200 } });
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.05], clamp);
  const giro = idx % 2 === 0 ? -2.2 : 1.8;
  return (
    <AbsoluteFill style={{ backgroundColor: BRANCO_PAPEL }}>
      <div
        style={{
          position: "absolute", left: "50%", top: "50%", height: 940, aspectRatio: "1350 / 2400",
          translate: `-50% ${-50 + (1 - entra) * 6}%`, rotate: `${giro}deg`, scale: String(zoom * (0.94 + 0.06 * entra)),
          backgroundColor: "white", padding: 14, boxShadow: "0 30px 60px rgba(40,30,20,.25)",
        }}
      >
        <Img src={staticFile(`fotos/${s.src}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      {"cama" in s && s.cama ? (
        <Audio src={clipe(s.cama.src)} trimBefore={Math.round(s.cama.ini * fps)} volume={0.6 * volClipe(s)} />
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- camadas por cima ----------

const Rotulo: React.FC<{ texto: string; sobreBranco: boolean }> = ({ texto, sobreBranco }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fim = Math.min(durationInFrames, 75);
  const p = interpolate(frame, [0, 8], [0, 1], { ...clamp, easing: mola });
  const sai = interpolate(frame, [fim - 5, fim], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute", left: 96, top: 72, fontFamily: "'Instrument Serif'", fontWeight: 400, fontSize: 88, lineHeight: 1, letterSpacing: "-0.02em", textTransform: "uppercase",
        color: sobreBranco ? "#0B1F3A" : "#FFFFFF", opacity: p * sai, translate: `${(1 - p) * -14}px 0px`,
        textShadow: sobreBranco ? "none" : "0 2px 4px rgba(0,0,0,.75), 0 0 14px rgba(0,0,0,.5)",
      }}
    >
      {texto}
    </div>
  );
};

const Legenda: React.FC = () => {
  const frame = useCurrentFrame();
  const g = LEGENDAS.find((x) => frame >= x.ini && frame < x.fim);
  if (!g) return null;
  const ditas = g.palavras.filter((p) => frame >= p.s);
  if (ditas.length === 0) return null;
  return (
    <div style={{ position: "absolute", left: 200, right: 200, bottom: 64, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 14px" }}>
      {ditas.map((p, i) => (
        <span
          key={p.s}
          style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", fontWeight: 800, fontSize: 46,
            color: "white", opacity: i === ditas.length - 1 ? 1 : 0.62, textShadow: "0 2px 6px rgba(0,0,0,.7), 0 0 18px rgba(0,0,0,.45)",
          }}
        >
          {p.w}
        </span>
      ))}
    </div>
  );
};

// ---------- composição ----------

export const Vlog: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let fotos = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {SEGS.map((s, i) => {
        const idxFoto = s.tipo === "foto" ? fotos++ : 0;
        return (
          <Sequence key={i} name={`${s.bloco} · ${Array.isArray(s.src) ? (s.src as readonly string[]).join("+") : s.src}`} from={s.from} durationInFrames={s.q} premountFor={fps}>
            {s.tipo === "cheio" ? <Cheio s={s} /> : null}
            {s.tipo === "vertical" ? <Vertical s={s} /> : null}
            {s.tipo === "triptico" ? <Triptico s={s} /> : null}
            {s.tipo === "foto" ? <Foto s={s} idx={idxFoto} /> : null}
            {"rot" in s && s.rot ? <Rotulo texto={s.rot} sobreBranco={(s.tipo as string) === "foto"} /> : null}
          </Sequence>
        );
      })}
      {TRILHAS.map((tr, i) => (
        <Sequence key={`trilha${i}`} name={`Trilha ${i + 1}`} from={tr.from} durationInFrames={tr.q} premountFor={fps}>
          <Audio
            src={staticFile(TRILHA_ARQ)}
            loop
            trimBefore={tr.offset % TRILHA_Q}
            volume={(f) => interpolate(f, [0, 6, tr.q - 18, tr.q], [0, tr.comSom ? 0.5 : 0.85, tr.comSom ? 0.5 : 0.85, 0], clamp)}
          />
        </Sequence>
      ))}
      {LEGENDA_GRAVADA ? <Legenda /> : null}
      <AbsoluteFill style={{ backgroundColor: "black", opacity: interpolate(frame, [DURACAO - 15, DURACAO], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
