"""把思源宋体（Noto Serif SC 可变字体）切成只含 index.html 用到的字的 woff2。

改了页面文字就重跑一次，否则新加的字会回落到系统宋体：
    python tools/subset-cjk.py [字体路径]
默认字体路径是本机已装的 C:\\Windows\\Fonts\\NotoSerifSC-VF.ttf（SIL OFL 1.1，可以随网页分发）。
"""
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r"C:\Windows\Fonts\NotoSerifSC-VF.ttf")
OUT = ROOT / "assets" / "fonts" / "noto-serif-sc-sub.woff2"
WEIGHT = 500  # 和 Instrument Serif 的笔画粗细放在一起看最接近

html = (ROOT / "index.html").read_text(encoding="utf-8")
chars = {c for c in html if c >= " "} | {chr(c) for c in range(0x20, 0x7F)}

font = TTFont(SRC)
opts = subset.Options()
opts.notdef_outline = True
sub = subset.Subsetter(opts)
sub.populate(text="".join(sorted(chars)))
sub.subset(font)                      # 先裁字，可变字体剩下的字很少，再定字重就快
font = instantiateVariableFont(font, {"wght": WEIGHT})
font.flavor = "woff2"
font.save(OUT)

cjk = sum(1 for c in chars if ord(c) >= 0x2E80)
print(f"{len(chars)} 个字符（其中中日韩 {cjk} 个）→ {OUT.relative_to(ROOT)}，{OUT.stat().st_size / 1024:.0f} KB")
