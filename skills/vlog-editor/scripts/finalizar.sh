#!/bin/bash
# uso: ./finalizar.sh yt|reel  -> renderiza em saida/, normaliza (-20 YouTube, -14 Reel) e grava o .srt do YouTube
set -e
A="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$A/saida"; cd "$A/remotion"
lufs() { ffmpeg -hide_banner -i "$1" -af ebur128 -f null - 2>&1 | awk '/I:/{v=$2} END{print v}'; }
norm() { I=$(lufs "$1"); G=$(printf '%.2f' "$(echo "$2 - ($I)" | bc -l)")
  # alimiter level=0: sem auto-ganho (senão desfaz o volume)
  ffmpeg -hide_banner -loglevel error -y -i "$1" -c:v copy -af "volume=${G}dB,alimiter=limit=0.89:level=0" -c:a aac -b:a 256k "$3"
  echo "$3: $I -> $(lufs "$3") LUFS"; }
mkdir -p out
if [ "$1" = yt ]; then
  npx remotion render Vlog out/yt-raw.mp4 --log=error
  norm out/yt-raw.mp4 -20 "$A/saida/vlog.mp4"
  node -e '
const fs=require("fs");const t=fs.readFileSync("src/edl.ts","utf8");const L=JSON.parse(t.match(/export const LEGENDAS[^=]*= (\[.*\]);/)[1]);
const f=q=>{const ms=Math.round(q/30*1000);const p=(n,l=2)=>String(n).padStart(l,"0");return `${p(Math.floor(ms/3600000))}:${p(Math.floor(ms/60000)%60)}:${p(Math.floor(ms/1000)%60)},${p(ms%1000,3)}`};
fs.writeFileSync(process.argv[1],L.map((g,i)=>`${i+1}\n${f(g.ini)} --> ${f(g.fim)}\n${g.palavras.map(p=>p.w).join(" ")}\n`).join("\n"));' "$A/saida/vlog.srt"
else
  npx remotion render Reel out/reel-raw.mp4 --log=error
  norm out/reel-raw.mp4 -14 "$A/saida/reel.mp4"
fi
echo FIM $1
