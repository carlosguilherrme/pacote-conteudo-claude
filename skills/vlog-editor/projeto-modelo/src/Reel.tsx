import React from "react";
import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { REEL_DURACAO, REEL_LEGENDAS, REEL_SEGS, REEL_TRILHAS } from "./reel-dados";

// Reel 9:16: a linha do tempo vem de gerar_reel.py (src/reel-dados.ts).
// tela cheia + faixa de vidro fosco colada embaixo com a legenda preta, barra de progresso e @, rótulos à mão no alto.
// Trilha trap nos trechos sem fala (escolhida em 21/10).

const LEGENDA_GRAVADA = false; // true grava a legenda na imagem
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const mola = Easing.bezier(0.16, 1, 0.3, 1);
const FAIXA = { top: 1640, altura: 280 };
const FONTE = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
type Seg = (typeof REEL_SEGS)[number];

const Plano: React.FC<{ s: Seg }> = ({ s }) => {
  const { fps } = useVideoConfig();
  if ("foto" in s && s.foto) {
    return <Img src={staticFile(`${s.pasta}/${s.src}.jpg`)} style={{ width: 1080, height: 1920, objectFit: "cover" }} />;
  }
  const som = "som" in s && s.som;
  return (
    <Video
      src={staticFile(`${s.pasta}/${s.src}.mp4`)}
      trimBefore={Math.round(s.ini * fps)}
      muted={!som}
      style={{ width: 1080, height: 1920, objectFit: "cover" }}
    />
  );
};

const Rotulo: React.FC<{ texto: string }> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fim = Math.min(durationInFrames, 75);
  const p = interpolate(frame, [0, 8], [0, 1], { ...clamp, easing: mola });
  const sai = interpolate(frame, [fim - 5, fim], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute", left: 70, top: 120, right: 70, fontFamily: "'Instrument Serif'", fontWeight: 400, fontSize: 96, lineHeight: 1, letterSpacing: "-0.02em", textTransform: "uppercase", color: "#FFFFFF",
        opacity: p * sai, translate: `${(1 - p) * -14}px 0px`, textShadow: "0 2px 4px rgba(0,0,0,.75), 0 0 14px rgba(0,0,0,.5)",
      }}
    >
      {texto}
    </div>
  );
};

const Legenda: React.FC = () => {
  const frame = useCurrentFrame();
  const g = REEL_LEGENDAS.find((x) => frame >= x.ini && frame < x.fim);
  if (!g) return null;
  const ditas = g.palavras.filter((p) => frame >= p.s);
  if (!ditas.length) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: FAIXA.top + FAIXA.altura / 2 - 40, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px" }}>
      {ditas.map((p, i) => (
        <span key={p.s} style={{ fontFamily: FONTE, fontWeight: 800, fontSize: 66, lineHeight: 1.12, color: "white", opacity: i === ditas.length - 1 ? 1 : 0.75, WebkitTextStroke: "2px rgba(0,0,0,.55)", textShadow: "0 3px 10px rgba(0,0,0,.85), 0 0 24px rgba(0,0,0,.6)" }}>
          {p.w}
        </span>
      ))}
    </div>
  );
};

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {REEL_SEGS.map((s, i) => (
        <Sequence key={i} name={String(s.src)} from={s.from} durationInFrames={s.q} premountFor={fps}>
          <Plano s={s} />
          {"rot" in s && s.rot ? <Rotulo texto={s.rot} /> : null}
        </Sequence>
      ))}
      {REEL_TRILHAS.map((tr, i) => (
        <Sequence key={`t${i}`} name={`Trilha ${i + 1}`} from={tr.from} durationInFrames={tr.q} premountFor={fps}>
          <Audio
            src={staticFile("trilha/sem-fala.mp3")}
            trimBefore={tr.offset}
            volume={(f) => interpolate(f, [0, 4, tr.q - 10, tr.q], [0, 0.9, 0.9, 0], clamp)}
          />
        </Sequence>
      ))}
      {/* sem faixa de vidro fosco (pedido de 21/10): legenda branca com sombra direto sobre o vídeo */}
      {LEGENDA_GRAVADA ? <Legenda /> : null}
      <div style={{ position: "absolute", left: 0, top: 0, height: 6, width: (1080 * frame) / REEL_DURACAO, backgroundColor: "white", boxShadow: "0 0 8px rgba(0,0,0,.4)" }} />
      <div style={{ position: "absolute", left: 40, top: 26, fontFamily: "'SF Mono', Menlo, monospace", fontSize: 30, fontWeight: 600, color: "white", opacity: 0.85, textShadow: "0 2px 8px rgba(0,0,0,.6)" }}>
        @seu_arroba
      </div>
      <AbsoluteFill style={{ backgroundColor: "black", opacity: interpolate(frame, [REEL_DURACAO - 8, REEL_DURACAO], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
