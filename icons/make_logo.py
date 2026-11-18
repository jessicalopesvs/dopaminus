"""Gera a logo do Dopaminus em SVG a partir da fórmula estrutural da dopamina.

A molécula (anel de benzeno + 2 hidroxilas + cadeia etilamina) fica na diagonal,
fazendo o papel da barra do símbolo de "proibido".

Uso:  python3 icons/make_logo.py
Gera: icons/logo.svg        completa, com HO / NH₂ (128px e README)
      icons/logo-medium.svg sem rótulos (48px)
      icons/logo-small.svg  sem ligações duplas, traço grosso (32px)
      icons/logo-tiny.svg   só anel + cadeia, traço mais grosso (16px)
Os PNGs são exportados a partir desses SVGs.
"""
import math
import os

RED = "#d93025"
WHITE = "#ffffff"
SIZE = 512
C = SIZE / 2

VARIANTS = {
    #          rótulos  duplas  OH     espessura do anel  traço (fração da ligação)
    "full":   dict(labels=True,  double=True,  oh=True,  chain=3, ring_w=34, bond=0.24),
    "medium": dict(labels=False, double=True,  oh=True,  chain=3, ring_w=44, bond=0.36),
    "small":  dict(labels=False, double=False, oh=True,  chain=3, ring_w=50, bond=0.40),
    "tiny":   dict(labels=False, double=False, oh=True,  chain=2, ring_w=64, bond=0.52),
}

FONT = 0.66  # tamanho do rótulo, em comprimentos de ligação


def pt(angle_deg, length=1.0, origin=(0.0, 0.0)):
    a = math.radians(angle_deg)
    return (origin[0] + length * math.cos(a), origin[1] + length * math.sin(a))


def molecule():
    """Dopamina com ligação = 1 (anel centrado em 0,0)."""
    v = {a: pt(a) for a in (-90, -30, 30, 90, 150, 210)}
    oh_top = pt(210, 1, v[210])   # 3-OH
    oh_bot = pt(150, 1, v[150])   # 4-OH
    c1 = pt(-30, 1, v[-30])        # CH2
    c2 = pt(30, 1, c1)             # CH2
    n = pt(-30, 1, c2)             # NH2
    return v, oh_top, oh_bot, c1, c2, n


def build(name):
    cfg = VARIANTS[name]
    v, oh_top, oh_bot, c1, c2, n = molecule()

    # Eixo da molécula: do meio das duas OH até o N (ou do anel até o N, sem OH).
    tail = [c1, c2, n][cfg["chain"] - 1]
    start = ((oh_top[0] + oh_bot[0]) / 2, (oh_top[1] + oh_bot[1]) / 2) if cfg["oh"] else (0.0, 0.0)
    axis = math.atan2(tail[1] - start[1], tail[0] - start[0])
    rot = math.radians(45) - axis  # alinha o eixo com a diagonal do "proibido"

    def rotate(p):
        return (p[0] * math.cos(rot) - p[1] * math.sin(rot),
                p[0] * math.sin(rot) + p[1] * math.cos(rot))

    # Pontos (e caixas dos rótulos) que precisam caber dentro do círculo.
    pts = list(v.values()) + [c1, c2, n][: cfg["chain"]] + ([oh_top, oh_bot] if cfg["oh"] else [])
    extents = [rotate(p) for p in pts]
    if cfg["labels"]:
        f = FONT
        for p, left, right in ((oh_top, 1.25 * f, 0.45 * f), (oh_bot, 1.25 * f, 0.45 * f), (n, 0.45 * f, 1.55 * f)):
            x, y = rotate(p)
            extents += [(x - left, y - 0.5 * f), (x - left, y + 0.5 * f),
                        (x + right, y - 0.5 * f), (x + right, y + 0.6 * f)]

    # Centraliza pela caixa e escala para ocupar o círculo interno.
    xs, ys = [e[0] for e in extents], [e[1] for e in extents]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    ring_w = cfg["ring_w"]
    ring_r = SIZE / 2 - ring_w / 2 - 4
    inner = ring_r - ring_w / 2
    margin = inner * (0.05 if cfg["labels"] else 0.10)
    reach = max(math.hypot(x - cx, y - cy) for x, y in extents)
    L = (inner - margin) / reach  # comprimento da ligação em px

    def T(p):
        x, y = rotate(p)
        return (C + (x - cx) * L, C + (y - cy) * L)

    bond_w = cfg["bond"] * L

    def line(a, b, w=None):
        (x1, y1), (x2, y2) = T(a), T(b)
        return (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
                f'stroke="{RED}" stroke-width="{(w or bond_w):.1f}" stroke-linecap="round"/>')

    def toward(a, b, keep):
        """Ponto entre a e b a uma distância `keep` (em ligações) de a."""
        d = math.dist(a, b)
        return (a[0] + (b[0] - a[0]) * keep / d, a[1] + (b[1] - a[1]) * keep / d)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" width="{SIZE}" height="{SIZE}">',
        "<title>Dopaminus</title>",
        f'<circle cx="{C}" cy="{C}" r="{ring_r:.1f}" fill="{WHITE}" stroke="{RED}" stroke-width="{ring_w}"/>',
    ]

    # Anel de benzeno
    ring_pts = " ".join("{:.1f},{:.1f}".format(*T(v[a])) for a in (-90, -30, 30, 90, 150, 210))
    parts.append(f'<polygon points="{ring_pts}" fill="none" stroke="{RED}" '
                 f'stroke-width="{bond_w:.1f}" stroke-linejoin="round"/>')

    # Ligações duplas: linhas internas em lados alternados
    if cfg["double"]:
        for a, b in ((-90, -30), (30, 90), (150, 210)):
            p, q = pt(a, 0.6), pt(b, 0.6)
            parts.append(line(toward(p, q, 0.1), toward(q, p, 0.1), bond_w * 0.75))

    # Substituintes (com espaço antes do rótulo, quando houver rótulo)
    gap = 0.42 * FONT if cfg["labels"] else 0
    if cfg["oh"]:
        parts.append(line(v[210], toward(v[210], oh_top, 1 - gap)))
        parts.append(line(v[150], toward(v[150], oh_bot, 1 - gap)))
    parts.append(line(v[-30], c1))
    if cfg["chain"] >= 2:
        parts.append(line(c1, c2))
    if cfg["chain"] >= 3:
        parts.append(line(c2, toward(c2, n, 1 - gap)))

    # Rótulos na horizontal; o "O" e o "N" ficam exatamente no ponto do átomo.
    if cfg["labels"]:
        fpx = FONT * L

        def label(p, text, anchor, dx):
            x, y = T(p)
            return (f'<text x="{x + dx * fpx:.1f}" y="{y:.1f}" fill="{RED}" font-size="{fpx:.1f}" '
                    f'font-weight="800" text-anchor="{anchor}" dominant-baseline="central" '
                    f'font-family="Helvetica Neue, Helvetica, Arial, sans-serif">{text}</text>')

        parts.append(label(oh_top, "HO", "end", 0.42))
        parts.append(label(oh_bot, "HO", "end", 0.42))
        sub = f'<tspan font-size="{fpx * 0.62:.1f}" dy="{fpx * 0.22:.1f}">2</tspan>'
        parts.append(label(n, f"NH{sub}", "start", -0.40))

    parts.append("</svg>")
    return "\n".join(parts) + "\n"


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    for variant, fname in (("full", "logo.svg"), ("medium", "logo-medium.svg"),
                           ("small", "logo-small.svg"), ("tiny", "logo-tiny.svg")):
        with open(os.path.join(here, fname), "w", encoding="utf-8") as f:
            f.write(build(variant))
        print("gerado", fname)
