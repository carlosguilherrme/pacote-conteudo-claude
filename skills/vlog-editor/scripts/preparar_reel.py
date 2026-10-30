"""Recortes verticais 1080x1920 do 4K (remotion/public/reel). x = centro do recorte em fração da largura: rosto nas falas, centro no B-roll."""
import shutil, subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
A = Path(__file__).parent; B = A / "brutos"; S = A / "remotion/public/reel"
FF = shutil.which("ffmpeg")
COR = (A / "cor.txt").read_text().strip()
CLIPES = {  # arquivo: (x, início, fim)
    "CLIPE_FECHO.MP4": (0.5, 0, 120),
    "CLIPE_RUA.MOV": (0.5, 0, 10),
}

def clipe(item):
    nome, (x, ini, fim) = item
    out = S / f"{Path(nome).stem}.mp4"
    crop = f"crop=ih*9/16:ih:max(0\\,min(iw-ih*9/16\\,iw*{x}-ih*9/32)):0"
    subprocess.run([FF,"-hide_banner","-loglevel","error","-y","-ss",str(ini),"-to",str(fim),"-i",str(B/nome),"-map","0:v:0","-map","0:a:0",
                    "-vf",f"{crop},scale=1080:1920:flags=lanczos,fps=30,{COR},format=yuv420p",
                    "-af","aresample=48000,loudnorm=I=-20:TP=-2:LRA=11","-ac","2",
                    "-c:v","libx264","-crf","18","-preset","fast","-g","15","-c:a","aac","-b:a","192k","-movflags","+faststart",str(out)], check=True)
    return out.name

S.mkdir(parents=True, exist_ok=True)
with ThreadPoolExecutor(3) as ex:
    for n in ex.map(clipe, CLIPES.items()): print("ok", n, flush=True)
