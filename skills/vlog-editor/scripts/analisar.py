"""Folha de contato (8 quadros) + transcrição com tempo por palavra de cada clipe em brutos/."""
import json, shutil, subprocess
from pathlib import Path
from faster_whisper import WhisperModel

A = Path(__file__).parent; B = A / "brutos"
FF = shutil.which("ffmpeg")
(A / "folhas").mkdir(exist_ok=True); (A / "transcricao").mkdir(exist_ok=True)
videos = sorted(p for p in B.iterdir() if p.suffix.lower() in (".mp4", ".mov"))
for v in videos:
    dur = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(v)],capture_output=True,text=True).stdout)
    passo = max(dur / 8, 0.2)
    subprocess.run([FF,"-hide_banner","-loglevel","error","-y","-i",str(v),"-vf",f"fps=1/{passo:.3f},scale=-2:300,tile=8x1:padding=3","-frames:v","1","-q:v","4",str(A/"folhas"/f"{v.stem}.jpg")])
print("folhas ok", flush=True)
m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
saida = {}
for v in videos:
    wav = A / "transcricao" / f"{v.stem}.wav"
    # iPhone em áudio espacial grava APAC (ilegível) + AAC: usar a AAC/PCM
    trilhas = subprocess.run(["ffprobe","-v","error","-select_streams","a","-show_entries","stream=codec_name","-of","csv=p=0",str(v)],capture_output=True,text=True).stdout.split()
    idx = next(i for i, c in enumerate(trilhas) if c in ("aac","pcm_s16be","pcm_s16le","pcm_s24le"))
    subprocess.run([FF,"-hide_banner","-loglevel","error","-y","-i",str(v),"-map",f"0:a:{idx}","-vn","-ac","1","-ar","16000",str(wav)])
    segs = list(m.transcribe(str(wav), language="pt", word_timestamps=True, vad_filter=True)[0])
    saida[v.name] = [{"s": round(s.start,2), "e": round(s.end,2), "t": s.text.strip(),
                      "w": [{"w": w.word.strip(), "s": round(w.start,2), "e": round(w.end,2)} for w in (s.words or [])]} for s in segs]
    print(f"{v.name}: " + " | ".join(f"[{s['s']:.1f}] {s['t']}" for s in saida[v.name]), flush=True)
(A/"transcricao"/"tudo.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1))
