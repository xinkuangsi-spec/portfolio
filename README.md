# 天衍灵泽 · 项目展示

在线访问：https://xinkuangsi-spec.github.io/portfolio/

王嘉栾和匡思鑫两人团队的项目展示页：7 个精选项目、13 个明细栏项目、两项获奖、按方向归类的项目索引，最后是成员分工和联系方式。纯静态（HTML + CSS + 原生 JS），没有构建步骤；字体和图片都在仓库里，断网也能打开。

## 本地预览

```bash
python -m http.server 8000      # 浏览器开 http://localhost:8000
```

## 文件

| 文件 | 内容 |
|---|---|
| `index.html` | 页面内容，部分项目配图是内联 SVG 结构图 |
| `styles.css` | 版式、配色、响应式 |
| `main.js` | 进场动效、数字滚动、首屏图纸网格、状态栏翻牌字、描边字、纸纹、角标光标、复制微信号、移动端菜单 |
| `assets/` | 字体（许可证见 `assets/fonts/OFL.txt`）、项目截图 |
| `tools/subset-cjk.py` | 按页面用字裁剪中文标题字体 |

## 改了页面文字之后

中文标题用的是思源宋体子集，只含页面里出现过的字。改完文字要重跑一次，否则新加的字会回落到系统宋体：

```bash
python tools/subset-cjk.py
```

## 致谢

整体界面依据 claude-directory 收录的 `meridian-drafthouse-h54` 规格；首屏图纸网格、翻牌字、纸纹、描边字和角标光标移植自 react-bits 的 `CursorGrid`、`SplitFlapText`、`Noise`、`StrokeText`、`TargetCursor`（都改成了零依赖原生实现）；字体为 Instrument Serif、Space Grotesk、Noto Serif SC。详见 `THIRD_PARTY_NOTICES.md`。
