"""Linha do tempo: edite BLOCOS e rode. Gera remotion/src/edl.ts (quadros a 30 fps + legendas no tempo do vídeo).
fala() faz o jump cut nas pausas."""
import json
from pathlib import Path

A = Path(__file__).parent
FPS = 30
TX = json.loads((A / "transcricao/tudo.json").read_text())
PAUSA, ANTES, DEPOIS = 0.45, 0.10, 0.18


# a fala dele é coloquial; o whisper formaliza e erra siglas
TROCAS = {"para": "pra", "está": "tá"}  # palavra -> como escrever na legenda
# correção em um tempo exato: (clipe, início da palavra) -> palavra
FIXOS = {}


def palavras(src):
    nome = next(k for k in TX if Path(k).stem == src)
    ws = [dict(w) for s in TX[nome] for w in s["w"]]
    out = []
    for w in ws:
        if out and w["w"][:1] in "-'":
            out[-1]["w"] += w["w"]
            out[-1]["e"] = w["e"]
        else:
            out.append(w)
    for w in out:
        base = w["w"].lower().strip(".,!?")
        if base in TROCAS:
            pont = w["w"][len(w["w"].rstrip(".,!?")):]
            w["w"] = TROCAS[base] + pont
        w["w"] = FIXOS.get((src, w["s"]), w["w"])
    return out



def c(src, ini, fim, **k):
    return {"tipo": "cheio", "src": src, "ini": ini, "dur": round(fim - ini, 3), **k}


def broll(src, ini, fim, **k):  # imagem do evento, som ambiente por baixo da trilha
    return c(src, ini, fim, som=True, mus=True, **k)


def mudo(src, ini, fim, **k):  # imagem só com a trilha (som do clipe tem fala de palestrante)
    return c(src, ini, fim, mus=True, **k)


def fala(src, ini, fim, rot=None):
    """Trecho falado cortado nas pausas maiores que PAUSA (jump cut estilo Dalen)."""
    ws = [w for w in palavras(src) if ini - 0.05 <= w["s"] < fim]
    blocos, atual = [], [ws[0]]
    for w in ws[1:]:
        if w["s"] - atual[-1]["e"] > PAUSA:
            blocos.append(atual)
            atual = []
        atual.append(w)
    blocos.append(atual)
    out = []
    for i, b in enumerate(blocos):
        a, z = max(ini, b[0]["s"] - ANTES), min(fim, b[-1]["e"] + DEPOIS)
        out.append(c(src, round(a, 2), round(z, 2), som=True, leg=True, **({"rot": rot} if rot and i == 0 else {})))
    return out


BLOCOS = [  # exemplo: troque pelos seus clipes (nome do arquivo sem extensão)
    ("gancho", fala("CLIPE_FECHO", 14.0, 22.0)),
    ("montagem", [
        mudo("CLIPE_RUA", 0.3, 2.3, rot="quinta, 29/10"),
        mudo("CLIPE_LUGAR", 1.0, 3.0),
    ]),
    ("abertura", fala("CLIPE_MANHA", 0.0, 50.0, rot="9h40")),
    ("lugar", [broll("CLIPE_LUGAR", 3.0, 7.0, rot="nome do lugar")]),
    ("fecho", fala("CLIPE_FECHO", 0.0, 120.0)),
]


if __name__ == "__main__":
    segs, legendas, cursor = [], [], 0
    for bloco, itens in BLOCOS:
        for it in itens:
            q = round(it["dur"] * FPS)
            segs.append({**it, "bloco": bloco, "from": cursor, "q": q})
            if it.get("leg"):
                ws = [w for w in palavras(it["src"]) if it["ini"] - 0.05 <= w["s"] < it["ini"] + it["dur"] - 0.05]
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
    for s_ in segs:
        if not s_.get("mus"):
            continue
        if trilhas and trilhas[-1]["from"] + trilhas[-1]["q"] == s_["from"]:
            trilhas[-1]["q"] += s_["q"]
        else:
            trilhas.append({"from": s_["from"], "q": s_["q"], "offset": pos, "comSom": True})
        pos += s_["q"]

    (A / "remotion/src/edl.ts").write_text(
        "// Gerado por gerar_edl.py. Não editar à mão.\n"
        f"export const DURACAO = {cursor};\n"
        f"export const TRILHAS: {{from: number; q: number; offset: number; comSom: boolean}}[] = {json.dumps(trilhas)};\n"
        f"export const SEGS = {json.dumps(segs, ensure_ascii=False)} as const;\n"
        f"export const LEGENDAS: {{ini: number; fim: number; palavras: {{w: string; s: number}}[]}}[] = {json.dumps(grupos, ensure_ascii=False)};\n",
        encoding="utf-8",
    )
    print(f"{len(segs)} planos, {len(grupos)} legendas, {cursor / FPS:.1f} s; trilha {pos / FPS:.1f} s em {len(trilhas)} trechos")
    for b, _ in BLOCOS:
        ss = [s for s in segs if s["bloco"] == b]
        print(f"  {b:10s} {ss[0]['from'] / FPS:6.1f}s  {sum(s['q'] for s in ss) / FPS:5.1f}s  {len(ss)} planos")
