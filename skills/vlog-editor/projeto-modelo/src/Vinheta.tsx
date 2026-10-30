import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";

// cantos escurecidos e puxados para o azul-petróleo (cor média dos cantos nos vídeos do Dalen)
// curva igual à do ffmpeg da v2: zero até 40% do raio, força total no canto, expoente 1,4
const comAlfa = (hex: string, a: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a.toFixed(3)})`;
};

type VinhetaProps = {
  readonly forca: number;
  readonly cor: string;
  readonly style?: React.CSSProperties;
};

const VinhetaInner: React.FC<VinhetaProps> = ({ forca, cor, style }) => {
  const paradas = [0.4, 0.55, 0.7, 0.85, 1]
    .map((r) => `${comAlfa(cor, forca * Math.pow((r - 0.4) / 0.6, 1.4))} ${r * 100}%`)
    .join(", ");

  return (
    <Interactive.Div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        pointerEvents: "none",
        background: `radial-gradient(ellipse farthest-corner at 50% 50%, ${paradas})`,
        ...style,
      }}
    />
  );
};

const vinhetaSchema = {
  forca: { type: "number", default: 0.6, min: 0, max: 1, step: 0.05, description: "Força", hiddenFromList: false },
  cor: { type: "color", default: "#26373F", description: "Cor dos cantos" },
} as const satisfies InteractivitySchema;

export const Vinheta = Interactive.withSchema({
  Component: VinhetaInner,
  componentName: "<Vinheta>",
  schema: vinhetaSchema,
  wrapInSequence: true,
});
