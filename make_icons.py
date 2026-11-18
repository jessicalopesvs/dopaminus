# Gera os ícones PNG (círculo vermelho com barra) usando só a biblioteca padrão.
import math, struct, zlib, os

def make(n, path, ss=4):
    raw = bytearray()
    c = n / 2
    outer, inner, bar = 0.47 * n, 0.33 * n, 0.075 * n
    for y in range(n):
        raw.append(0)
        for x in range(n):
            r = g = b = a = 0
            for sy in range(ss):
                for sx in range(ss):
                    px, py = x + (sx + .5) / ss - c, y + (sy + .5) / ss - c
                    d = math.hypot(px, py)
                    if d > outer:
                        continue
                    red = d >= inner or abs(px - py) / math.sqrt(2) < bar
                    col = (217, 48, 37) if red else (255, 255, 255)
                    r += col[0]; g += col[1]; b += col[2]; a += 255
            k = ss * ss
            cov = a / 255
            if cov:
                raw += bytes((round(r / cov), round(g / cov), round(b / cov), round(a / k)))
            else:
                raw += b"\0\0\0\0"
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", n, n, 8, 6, 0, 0, 0)) \
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    open(path, "wb").write(png)

for n in (16, 32, 48, 128):
    make(n, os.path.join(os.path.dirname(__file__) or ".", "icons", f"icon{n}.png"))
