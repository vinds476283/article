# 铟子vinds 文章站

一个纯静态的中文文章站, 直接部署到 Cloudflare Pages / GitHub Pages / Netlify 等平台即可。

- **站点主页** `index.html` —— 列出 `article/` 下所有专题
- **专题主页** `article/<专题>/index.html` —— 左侧导航树 + 右侧专题说明
- **文章阅读页** `article/<专题>/<子目录>/<文章>.html` —— 文档页排版: 正文顶部自动加一级标题,
  文末是"上一篇 / 下一篇", 左侧是可收起的导航树
- **导航栏**: 左边的 "铟子vinds" 和右边的 "主页" 都指向本站主页(即 `index.html`),
  悬浮时 0.5 秒渐变到 `#0ff`, 且不出现下划线; 最右边是白天/夜间模式切换按钮
- **页脚**: `GitHub | Copyright © 2026-present | 铟子vinds`
- 所有页面都用根目录的 `favicon.ico`

页面只依赖系统默认字体, 白天白底黑字, 夜间黑底白字, 链接默认无下划线、悬浮才出现。
浏览器标题统一是 `vinds | <文章名>`。

## 目录结构

```
/
├── index.html              站点主页(所有专题的主页)
├── style.css               全站样式
├── app.js                  全站脚本(导航树 / 主题切换 / Markdown 渲染 / 画图)
├── site-data.js            自动生成: 全部文章、图片与阅读顺序的索引
├── 404.html                自动生成
├── favicon.ico             站点图标(所有页面都用它)
├── _headers                Cloudflare Pages 的响应头(让 .md 以纯文本返回)
├── robots.txt
├── .nojekyll               关闭 GitHub Pages 的 Jekyll 处理
├── assets/
│   └── favicon.svg         备用图标(现在没用到, 留着以防万一)
├── tools/                  开发时用的小工具, 部署时可以不管
│   ├── render_test.js      Markdown 渲染自检
│   ├── check_article.js    单篇渲染自检(找残留的公式标记)
│   ├── check_katex.js      用 KaTeX 逐条检查公式能不能渲染(需要联网下载一次)
│   ├── check_graphs.js     desmos-graph 是否都画成了 SVG
│   ├── check_links_wiki.js 双链的目标文件与 #锚点 是否都存在
│   ├── case_test.js        各种边角语法的小样例自检
│   ├── check_links.py      检查生成页面里的站内链接是否都存在
│   ├── audit_scripts.py    检查每个页面的 script 加载顺序
│   ├── browser_check.js    用无头浏览器跑一遍, 看渲染结果
│   ├── browser_dump.js     把某个页面的 DOM 抓下来看
│   └── screenshot.js       截图
├── build_site.py           页面生成脚本
└── article/                ← 文章放这里
    └── <专题>/             一级子文件夹 = 一个专题主页
        ├── <专题>.md       该专题主页的说明文字(可选)
        ├── 图片/           图片等资源(不会被当成文章)
        ├── <文章>.md
        └── <子目录>/
            └── <文章>.md
```

## 日常使用流程

1. 把 Markdown 文章放进 `article/<专题>/`(可以再分子文件夹, 层数不限)。
2. 生成页面:

   ```bash
   python build_site.py
   ```

   它会:

   - 给每篇 `.md` 生成同名 `.html` 阅读页;
   - 给每个专题生成 `article/<专题>/index.html`;
   - 重新生成 `index.html`、`site-data.js`、`404.html`、`.nojekyll`。

3. 整个仓库推到 GitHub, 在 Cloudflare Pages 里连上该仓库即可。

> **只改文章内容**时其实不必重新生成 —— 阅读页是在浏览器里现场读取 `.md` 渲染的,
> 保存后刷新就能看到。重新生成是为了让**新增 / 删除 / 改名**的文章出现在导航树和列表里。

## 部署到 Cloudflare Pages

| 设置项 | 值 |
| --- | --- |
| Framework preset | None |
| Build command | (留空) |
| Build output directory | `/` |

根目录的 `_headers` 会把 `*.md` 以 `text/plain; charset=utf-8` 返回, 这样页面里的
`fetch()` 一定能读到文章原文, 不会因为 `text/markdown` 被浏览器当成下载文件。
(即使没有生效, `fetch()` 本身也不受影响, 只是更保险。)

## Markdown 支持范围

阅读页内置了一个轻量渲染器, 支持:

- 标题 `#` ~ `######` (自动生成锚点)、段落、换行
- **加粗**、*斜体*、`行内代码`、~~删除线~~、==高亮==
- 有序 / 无序 / 嵌套列表、任务清单 `- [x]`
- 引用 `>`(可嵌套, 引用块里也能放公式块)、分割线 `---`、表格(含对齐)
- 围栏代码块 ```` ``` ````; `desmos-graph` 代码块会直接画成 SVG 矢量图(见下)
- 图片 `![说明](路径)` 与 `![[图片文件名]]`
- 链接 `[文字](地址)`, 以及双链 `[[文章标题]]`、`[[文章标题#小节标题]]`
- 数学公式 `$行内$`、`$$独立成行$$`, 以及跨多行的 `$$ … $$`

### 关于换行 (和 Obsidian 保持一致)

按 Obsidian 的习惯处理: **源码里一个换行就是一次换行**(渲染成 `<br>`),
**两个换行才是段落之间的大间距**。也就是说

```
第一行
第二行

第三段
```

会显示成「第一行」换行「第二行」, 空一行之后另起一段。

有两个例外, 免得把结构性内容挤在一起:

- 以 `<` 开头的行(比如 `<div align="right">` 落款)按 HTML 块处理, 用你自己写的 `<br />`;
- 独占一行的链接(例如名词索引里的 `[[(6)° 不等式]]` 和紧随其后的 `见[[#阿贝尔变换]].`)
  各自成一段, 不会并成一行。

### 关于公式

公式用 [KaTeX](https://katex.org/) 排版, 通过 CDN 加载
(`build_site.py` 顶部的 `KATEX_CSS` / `KATEX_JS` / `KATEX_MHCHEM` 可改)。它和页面其它脚本一样是
`defer` 加载的, 打开页面时会先把公式当成 LaTeX 源码显示, 加载完成后自动替换成排版好的公式;
**万一 CDN 打不开, 页面其它内容完全不受影响**, 只是公式保持源码样式。

**化学公式**: 页面额外加载了 KaTeX 的 [mhchem](https://mhchem.github.io/MathJax-mhchem/) 扩展,
所以 `$\ce{Ti6Al2C4}$`、`$\ce{2H2 + O2 -> 2H2O}$`、`$\pu{1.5 mol}$` 这类写法都能正常排版
(不加载这个扩展的话, `\ce` 会被当成未知命令而渲染失败)。扩展脚本必须排在 `katex.min.js` **之后**。

想完全离线 / 不依赖 CDN, 把 KaTeX 的 `dist` 目录放进站点(例如 `assets/katex/`),
再把 `KATEX_CSS` / `KATEX_JS` / `KATEX_MHCHEM` 改成相对路径即可 —— 它们是直接拼在页面
`data-root` 前缀后面的, 所以填 `assets/katex/katex.min.css` 这样的相对路径就行。

### 关于 desmos-graph

Obsidian 的 `desmos-graph` 代码块会由 `app.js` 里的一个小渲染器**直接画成 SVG**,
不联网、不依赖 Desmos。支持:

- 设置: `left` / `right` / `top` / `bottom` / `width` / `height` / `grid` /
  `hideAxisNumbers`(一行里写多个用 `;` 隔开也可以), 以及 `---` 分隔线
- `y=f(x)` 形式的函数曲线, 可加 `|dashed`、`|black`、`` |label:`…` ``
- `x=常数` 的竖直直线, 可带 `\left\{ a\le y\le b \right\}` 限定范围
- `(x, y)` 点(标签支持 LaTeX 写法, 坐标是常数时会自动算成数字)
- `\{a\le x\le b\}` 或 `\left( a\le x\le b \right)` 限定自变量范围

**只要有任何一个元素画不出来, 整块会退回显示原始代码**, 而不是画出一张残缺的图。
`node tools/check_graphs.js` 可以检查所有代码块是否都画成功了。

## 本地预览

不要直接双击 `.html` 文件 —— 浏览器禁止 `file://` 下用 `fetch` 读取 `.md`,
文章会显示"无法加载文章"。开一个本地服务器即可:

```bash
python -m http.server 8000
# 然后访问 http://localhost:8000/
```

## 自检

改完渲染器或生成脚本后可以跑:

```bash
python build_site.py            # 重新生成
python tools/check_links.py     # 站内链接是否都指向真实文件
python tools/audit_scripts.py   # 每个页面都加载了哪些脚本、顺序对不对
node tools/check_katex.js       # 所有公式能不能被 KaTeX 渲染
node tools/check_graphs.js      # desmos-graph 代码块是否都画成了 SVG
node tools/check_links_wiki.js  # 双链的文件与 #锚点 是否存在
node tools/check_article.js "article/专题/文章.md"   # 单篇有没有残留公式标记
node tools/case_test.js         # 各种边角语法
node tools/render_test.js --dump "article/专题/文章.md"   # 单篇渲染结果
node tools/browser_check.js     # 用无头 Edge 跑一遍并统计渲染结果
```

## 约定与注意事项

**双链 `[[...]]` 怎么找文件?**
按"文件名(不含 `.md`)"匹配, 可以带 `#小节标题`。同名文件优先用同一目录下的那一个,
找不到就退回到全站第一个同名文件, 再找不到会显示成灰色的 `wiki-missing`。

**文章里的排序是怎么定的?**
同一个文件夹内, **文件名括号里带日期的按日期从新到旧排在前面**(例如 `梦 (2026.9.25)` 在
`雨 (2026.6.5)` 之前); 不带日期的文章保持文件名的排序, 接在后面。日期的写法支持
`(2026.9.25)`、`（2025-12-31）`、`(2025年12月31日)` 这几种。这套顺序同时决定了
左侧导航、专题主页里的文章列表, 以及"上一篇 / 下一篇"的走向
(顺序写在 `site-data.js` 的 `articles` 字段里, 由 `build_site.py` 生成)。

**`#小节标题` 的锚点怎么来的?**
由小节标题自动生成, 规则是: 先把 `$公式$` 换成可读文本(例如 `$\varepsilon-N$` -> `ε-N`),
再去掉 `**` 之类的标记与所有标点, 转小写, 空格换成 `-`。
所以 `### (6) 介值定理 & 中值定理` 的锚点是 `6介值定理中值定理`。
标题里带括号的写法(如 `### 罗尔 (Rolle) 中值定理`)会**额外注册**一个去掉括号的别名 `罗尔中值定理`,
两种写法都能跳到位。链接里的 `#片段` 也会按同一规则归一化后再匹配, 所以
`[[(2) 习题答案#(6) 介值定理 & 中值定理]]` 也能正确跳到那一节。

**文章里有一处公式写错了(比如 `$` 没配对)怎么办?**
渲染器会尽量把它当普通文字处理, 不显示红色的报错; 实在渲染不出来的公式会原样显示 LaTeX 源码
(灰色小字)。`node tools/check_katex.js` 可以把这类地方全列出来。

**图片为什么要写 `![[名字.jpg]]`?**
生成脚本会把专题目录下所有图片的路径记进 `site-data.js`, 所以只写文件名也能找到
(放在 `图片/` 子文件夹里也没问题)。写成 `![说明](相对路径)` 同样支持。

**哪些文件夹会被当成专题?**
`article/` 下的一级子文件夹, 且里面至少有一篇 `.md`。只放图片的空文件夹会被忽略。
专题目录里与文件夹同名的 `.md`(比如 `article/高中数学笔记/高中数学笔记.md`)会被当作
该专题主页的说明文字, 而不是一篇文章; **如果没有这个说明文件, 进入专题主页会直接显示第一篇**。

**要不要提交生成的 `.html`?**
要。这些 `.html` 是静态页面本体, 部署时需要它们。

**"上一篇 / 下一篇"的顺序是怎么定的?**
按导航树里的顺序(先文件夹里的, 再下一层文件夹), 也就是左侧导航从上到下的顺序。
顺序由 `build_site.py` 写进 `site-data.js` 的 `articles` 字段。

**文章标题为什么要手动加?**
不用手动加 —— 阅读页渲染时会自动在正文最前面补一个一级标题(就是文章名)。
如果你的 Markdown 本来就以 `#` 开头, 就不会重复补。
