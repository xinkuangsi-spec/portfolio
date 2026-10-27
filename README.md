# 天衍灵泽 · 团队作品集

在线访问：https://xinkuangsi-spec.github.io/portfolio/

王亦和匡思鑫的两人团队作品集：团队作品、各自的作品、成员介绍、获奖和联系方式。纯静态（HTML + CSS + 原生 JS），没有构建步骤；字体和图片都在仓库里，断网也能打开。

## 本地预览

```bash
python -m http.server 8000      # 浏览器开 http://localhost:8000
```

## 文件

| 文件 | 内容 |
|---|---|
| `index.html` | 页面内容，部分作品配图是内联 SVG 结构图 |
| `styles.css` | 版式、配色、响应式 |
| `main.js` | 进场动效、数字滚动、首屏图纸网格、状态栏翻牌字、移动端菜单 |
| `assets/` | 字体（许可证见 `assets/fonts/OFL.txt`）、成员照片、作品截图 |
| `tools/subset-cjk.py` | 按页面用字裁剪中文标题字体 |

## 改了页面文字之后

中文标题用的是思源宋体子集，只含页面里出现过的字。改完文字要重跑一次，否则新加的字会回落到系统宋体：

```bash
python tools/subset-cjk.py
```

## 致谢

整体界面依据 claude-directory 收录的 `meridian-drafthouse-h54` 规格；首屏图纸网格和翻牌字移植自 react-bits 的 `CursorGrid`、`SplitFlapText`；字体为 Instrument Serif、Space Grotesk、Noto Serif SC。详见 `THIRD_PARTY_NOTICES.md`。
