"""Clipes para o Remotion (remotion/public/clipes): 1080p, 30 fps, cor de cor.txt, -20 LUFS.
Opcional: VERTICAIS=nome1,nome2 (sem extensão) e TIMELAPSE=nome:6 (gera timelapse.mp4 sem som)."""
import os, shutil, subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
A = Path(__file__).parent; B = A / "brutos"; S = A / "remotion/public/clipes"
FF = shutil.which("ffmpeg")
COR = (A / "cor.txt").read_text().strip()
VERTICAIS = set(filter(None, os.environ.get("VERTICAIS", "").split(",")))

def audio(v):
    t = subprocess.run(["ffprobe","-v","error","-select_streams","a","-show_entries","stream=codec_name","-of","csv=p=0",str(v)],capture_output=True,text=True).stdout.split()
    return next(i for i, c in enumerate(t) if c in ("aac","pcm_s16be","pcm_s16le","pcm_s24le"))

def clipe(v):
    esc = "scale=1080:1920" if v.stem in VERTICAIS else "scale=1920:1080"
    subprocess.run([FF,"-hide_banner","-loglevel","error","-y","-i",str(v),"-map","0:v:0","-map",f"0:a:{audio(v)}",
                    "-vf",f"{esc}:flags=lanczos,fps=30,{COR},format=yuv420p","-af","aresample=48000,loudnorm=I=-20:TP=-2:LRA=11","-ac","2",
                    "-c:v","libx264","-crf","17","-preset","fast","-g","15","-c:a","aac","-b:a","192k","-movflags","+faststart",str(S/f"{v.stem}.mp4")], check=True)
    return v.name

S.mkdir(parents=True, exist_ok=True)
vids = sorted(p for p in B.iterdir() if p.suffix.lower() in (".mp4",".mov"))
with ThreadPoolExecutor(4) as ex:
    for n in ex.map(clipe, vids): print("ok", n, flush=True)
if os.environ.get("TIMELAPSE"):
    nome, vel = os.environ["TIMELAPSE"].split(":")
    v = next(p for p in vids if p.stem == nome)
    subprocess.run([FF,"-hide_banner","-loglevel","error","-y","-i",str(v),"-map","0:v:0","-an","-vf",f"setpts=PTS/{vel},scale=1920:1080:flags=lanczos,fps=30,{COR},format=yuv420p",
                    "-c:v","libx264","-crf","17","-preset","fast","-g","15","-movflags","+faststart",str(S/"timelapse.mp4")], check=True)
    print("timelapse ok", flush=True)
