"""Reel 9:16: edite PLANOS e rode. Gera remotion/src/reel-dados.ts. Recortes em remotion/public/reel (preparar_reel.py)."""
import json
from pathlib import Path

import gerar_edl as edl

A = Path(__file__).parent
FPS = 30


def fala(src, ini, fim, rot=None):
    return [{**s, "pasta": "reel", "fala": src} for s in edl.fala(src, ini, fim, rot)]


def b(src, ini, fim, **k):
    return {"src": src, "pasta": "reel", "ini": ini, "dur": fim - ini, "mus": True, **k}


PLANOS = [  # exemplo
    *fala("CLIPE_FECHO", 14.0, 22.0),
    b("CLIPE_RUA", 0.3, 1.8, rot="nome do lugar"),
    b("CLIPE_LUGAR", 1.0, 2.5),
    *fala("CLIPE_FECHO", 40.0, 60.0),
]

segs, legendas, cursor = [], [], 0
for it in PLANOS:
    q = round(it["dur"] * FPS)
    segs.append({**it, "from": cursor, "q": q})
    if it.get("leg"):
        ws = [w for w in edl.palavras(it["fala"]) if it["ini"] - 0.05 <= w["s"] < it["ini"] + it["dur"] - 0.05]
        grupo, ult = [], 0
        for w in ws:
            if grupo and (len(grupo) == 3 or w["s"] - ult > 0.35 or grupo[-1]["w"][-1] in ".,!?"):
                legendas.append(grupo)
                grupo = []
            ult = w["e"]
            grupo.append({"w": w["w"], "s": cursor + round((w["s"] - it["ini"]) * FPS), "e": min(cursor + q, cursor + round((w["e"] - it["ini"]) * FPS))})
        if grupo:
            legendas.append(grupo)
    cursor += q

grupos = []
for i, g in enumerate(legendas):
    fim = min(g[-1]["e"] + 8, legendas[i + 1][0]["s"] if i + 1 < len(legendas) else cursor)
    grupos.append({"ini": g[0]["s"], "fim": fim, "palavras": [{"w": w["w"], "s": w["s"]} for w in g]})

trilhas, pos = [], 0
for s in segs:
    if not s.get("mus"):
        continue
    if trilhas and trilhas[-1]["from"] + trilhas[-1]["q"] == s["from"]:
        trilhas[-1]["q"] += s["q"]
    else:
        trilhas.append({"from": s["from"], "q": s["q"], "offset": pos})
    pos += s["q"]

(A / "remotion/src/reel-dados.ts").write_text(
    "// Gerado por gerar_reel.py. Não editar à mão.\n"
    f"export const REEL_DURACAO = {cursor};\n"
    f"export const REEL_TRILHAS: {{from: number; q: number; offset: number}}[] = {json.dumps(trilhas)};\n"
    f"export const REEL_SEGS = {json.dumps(segs, ensure_ascii=False)} as const;\n"
    f"export const REEL_LEGENDAS: {{ini: number; fim: number; palavras: {{w: string; s: number}}[]}}[] = {json.dumps(grupos, ensure_ascii=False)};\n",
    encoding="utf-8",
)
print(f"Reel: {len(segs)} planos, {len(grupos)} legendas, {cursor / FPS:.1f} s, trilhas {trilhas}")
