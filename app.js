/* ==========================================================================
   铟子vinds 文章站 — 全站脚本
   1. 白天 / 夜间模式切换
   2. 左侧导航树 (由 build_site.py 生成的 site-data.js 提供数据)
   3. 轻量 Markdown 渲染 (标题 / 段落 / 列表 / 表格 / 引用 / 代码 / 公式 / 双链)
   ========================================================================== */
(function () {
'use strict';

var SITE = window.SITE || null;
var doc = document;
var root = doc.documentElement.getAttribute('data-root') || '';
var themeBtn = null;

/* window.SITE 由 site-data.js 提供(全部文章), window.PAGE 由页面内联脚本提供
   (当前专题 / 当前目录 / 当前文章)。两者都是 defer, 所以真正要用的时候再取一次。 */
function site() {
	return window.SITE || SITE || null;
}

function pageInfo() {
	return window.PAGE || null;
}

/* ------------------------------------------------------------ 主题切换 */

function currentTheme() {
	var saved = null;
	try { saved = localStorage.getItem('theme'); } catch (e) { saved = null; }
	if (saved === 'light' || saved === 'dark') return saved;
	return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
	doc.documentElement.setAttribute('data-theme', theme);
	if (themeBtn) {
		themeBtn.textContent = theme === 'dark' ? '☀' : '☾';
		themeBtn.setAttribute('aria-label', theme === 'dark' ? '切换到白天模式' : '切换到夜间模式');
	}
}

/* 本脚本在 <head> 里加载, 那时候按钮还不存在, 所以初始化要等 DOM 就绪 */
function initTheme() {
	themeBtn = doc.getElementById('theme-btn');
	applyTheme(currentTheme());
	if (themeBtn) {
		themeBtn.addEventListener('click', function () {
			var next = doc.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
			try { localStorage.setItem('theme', next); } catch (e) { /* 忽略 */ }
			applyTheme(next);
		});
	}

	var menuBtn = doc.getElementById('menu-btn');
	if (menuBtn) {
		menuBtn.addEventListener('click', function () {
			doc.body.classList.toggle('side-open');
		});
	}
}

/* ---------------------------------------------------------------- 工具 */

var enc = typeof encodeURI === 'function' ? encodeURI : function (s) { return s; };

function esc(s) {
	return String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function encPath(p) {
	return String(p).split('/').map(function (s) { return enc(s); }).join('/');
}

function dirOf(p) {
	var i = String(p).lastIndexOf('/');
	return i < 0 ? '' : p.slice(0, i + 1);
}

function joinPath(base, rel) {
	var parts = (base ? base.split('/') : []).concat(String(rel).split('/'));
	var out = [];
	for (var i = 0; i < parts.length; i++) {
		var s = parts[i];
		if (s === '' || s === '.') continue;
		if (s === '..') { out.pop(); continue; }
		out.push(s);
	}
	return out.join('/');
}

/* --------------------------------------------------------- 文件索引表 */

var articleBySel = {};    // "专题|子目录|标题" -> 文章地址
var articleByTitle = {};  // 标题 -> 文章地址(跨专题时取第一个)
var imageByName = {};     // 图片文件名 -> 站点内路径(用于 ![[图片.png]] 这种写法)
var indexed = false;

/* dir 形如 "article/高中数学笔记/1. 分析/", 要转成 "1. 分析" */
function subDir(dir) {
	return String(dir)
		.replace(/^article\//, '')
		.replace(/^[^/]*\//, '')
		.replace(/\/$/, '');
}

function indexArticles() {
	var SITE = site();
	if (!SITE || indexed) return;
	indexed = true;
	(SITE.subjects || []).forEach(function (sub) {
		sub.folder.items = sub.folder.items || [];
		(sub.folder.images || []).forEach(function (p) {
			var base = p.split('/').pop();
			imageByName[p] = p;                 // 完整相对路径优先
			if (!imageByName[base]) imageByName[base] = p;
		});
		walk(sub.folder, sub.name, '');

		function walk(node, subject, base) {
			(node.items || []).forEach(function (it) {
				articleBySel[subject + '|' + base + '|' + it.title] = it.url;
				if (!articleByTitle[it.title]) articleByTitle[it.title] = it.url;
			});
			(node.groups || []).forEach(function (g) {
				walk(g, subject, base ? base + '/' + g.name : g.name);
			});
		}
	});
}

/* 图片地址: 先按站内索引找, 找不到就按文章所在目录算 */
function imgSrc(articleDir, src) {
	var url = lookupImage(src);
	if (url) return root + encPath(url);
	if (articleDir) {
		var base = src.split('/').pop();
		var guess = joinPath(articleDir, '图片/' + base);
		if (imageByName[guess]) return root + encPath(imageByName[guess]);
	}
	return root + encPath(joinPath(articleDir, src));
}

/* 在图片索引里找一个名字(顺带处理 URL 编码与去括号的写法) */
function lookupImage(src) {
	var cands = [src];
	var base = String(src).split('/').pop();
	cands.push(base);
	try {
		var dec = decodeURIComponent(String(src).replace(/\+/g, '%20'));
		if (dec !== src) {
			cands.push(dec);
			cands.push(dec.split('/').pop());
		}
	} catch (e) { /* 不是合法的编码 */ }
	var keys = Object.keys(imageByName);
	for (var c = 0; c < cands.length; c++) {
		if (imageByName[cands[c]]) return imageByName[cands[c]];
		/* 去掉括号与空格再模糊比一次 */
		var loose = cands[c].replace(/[（）()\s]/g, '');
		for (var k = 0; k < keys.length; k++) {
			if (keys[k].replace(/[（）()\s]/g, '') === loose) return imageByName[keys[k]];
		}
	}
	return null;
}

/* --------------------------------------------------------------- 导航树 */

/* 建一个元素 */
function el(tag, cls, text) {
	var e = doc.createElement(tag);
	if (cls) e.className = cls;
	if (text !== undefined && text !== null) e.textContent = text;
	return e;
}

function buildTree(node, currentPath) {
	var ul = el('ul', 'tree');
	var groups = node.groups || [];
	var i;

	for (i = 0; i < groups.length; i++) {
		ul.appendChild(treeFolder(groups[i], currentPath));
	}
	for (i = 0; i < (node.items || []).length; i++) {
		ul.appendChild(treeItem(node.items[i], currentPath));
	}
	return ul;
}

function treeFolder(group, currentPath) {
	var inner = buildTree(group, currentPath);

	var mark = el('span', 'mark', '−');
	var title = el('span', null, group.name);
	var head = el('div', 'folder-name');
	head.appendChild(mark);
	head.appendChild(title);

	var li = el('li');
	li.appendChild(head);
	li.appendChild(inner);

	head.addEventListener('click', function () {
		var closed = li.classList.toggle('closed');
		mark.textContent = closed ? '+' : '−';
	});

	return li;
}

function treeItem(item, currentPath) {
	var a = el('a', null, item.title);
	a.href = root + encPath(item.url);
	if (currentPath && item.url === currentPath) a.className = 'current';

	var li = el('li');
	li.appendChild(a);
	return li;
}

function filterTree(box, query) {
	var q = String(query || '').trim().toLowerCase();
	var lis = box.querySelectorAll('.tree li');
	var i;
	for (i = 0; i < lis.length; i++) lis[i].classList.remove('hidden');
	if (!q) return;

	var links = box.querySelectorAll('.tree a');
	var shown = [];
	for (i = 0; i < links.length; i++) {
		var hit = links[i].textContent.toLowerCase().indexOf(q) >= 0;
		var li = links[i].parentNode;
		li.classList.toggle('hidden', !hit);
		if (hit) shown.push(li);
	}

	/* 让命中项的各级祖先重新显示 */
	shown.forEach(function (li) {
		var p = li.parentNode;
		while (p && p !== box) {
			if (p.tagName === 'LI') p.classList.remove('hidden');
			p = p.parentNode;
		}
	});
}

function initSidebar() {
	var box = doc.getElementById('sidebar-tree');
	var PAGE = pageInfo();
	if (!box || !PAGE) return;

	box.appendChild(buildTree(PAGE.currentFolder || {}, PAGE.currentPath || ''));

	var search = doc.getElementById('sidebar-search');
	if (search) {
		search.addEventListener('input', function () { filterTree(box, search.value); });
	}

	var a = doc.getElementById('sidebar-subject');
	if (a && PAGE.subject && PAGE.subject.home) a.href = root + encPath(PAGE.subject.home);

	/* 侧栏的"主页"链接: PAGE.home 已经是相对本站主页的地址 */
	var homeLink = doc.getElementById('sidebar-home');
	if (homeLink && PAGE.home) homeLink.href = PAGE.home;
}

/* ------------------------------------------------------ Markdown 渲染器 */

var WIKI_BAD = 'wiki-missing';

function Markdown(opts) {
	this.dir = opts.dir || '';          // 当前 md 所在目录, 用于解析相对图片
	this.file = opts.file || '';        // 当前 md 全路径
	this.subject = opts.subject || '';
	this.slugs = {};
	this.folder = opts.folder || null;
}

/* 标题原文 -> 锚点 id, 用于把链接里的 #片段 也按同样规则归一化 */
var slugRegistry = {};

/* 把标题里的 $公式$ 转成便于阅读的文本, 再生成锚点 id。
   例如 "$\varepsilon-N$ 极限求法" -> "ε-N 极限求法" */function mathToText(tex) {
	var s = texToExpr(tex);
	try {
		/* eslint-disable no-new-func */
		var v = new Function(FUNC_SCOPE + 'return (' + s + ');')();
		if (typeof v === 'number' && isFinite(v)) return String(Math.round(v * 1000) / 1000);
	} catch (e) { /* 不是常数 */ }
	return prettyText(tex);
}

Markdown.prototype.slug = function (text) {
	var base = this.slugText(text);
	if (!base) base = 'section';
	var id = base, n = 1;
	while (Object.prototype.hasOwnProperty.call(this.slugs, id)) { id = base + '-' + (++n); }
	this.slugs[id] = true;
	/* 记下"原文 -> id", 供链接里的 #片段 反查 */
	if (!Object.prototype.hasOwnProperty.call(slugRegistry, text)) slugRegistry[text] = id;
	return id;
};

/* 标题文本 -> 锚点字符串(不含去重) */
Markdown.prototype.slugText = function (text) {
	return String(text)
		.replace(/<[^>]*>/g, ' ')
		.replace(/\[\[([^\]|]*)(?:\|([^\]]*))?\]\]/g, function (m, a, b) { return b || a; })
		/* 行内 / 块级公式换成可读文本 */
		.replace(/\$\$([\s\S]*?)\$\$/g, function (m, a) { return mathToText(a); })
		.replace(/\$([^$\n]*?)\$/g, function (m, a) { return mathToText(a); })
		.replace(/[`*_~]/g, '')
		.trim()
		.toLowerCase()
		.replace(/[\s\u3000]+/g, '-')
		.replace(/[!-\/:-@\[-`{-~]/g, '');
};

/* 同一个标题可能被写成多种形式(比如索引里会省略括号里的外文人名),
   这里额外注册一个不带括号的别名, 两种写法都能跳到位 */
Markdown.prototype.slugAliases = function (text) {
	var t = String(text);
	if (!/[（(][^）)]*[）)]/.test(t)) return [];
	var plain = t.replace(/[（(][^）)]*[）)]/g, '');
	var a = this.slugText(plain);
	if (!a) return [];
	var id = a, n = 1;
	while (Object.prototype.hasOwnProperty.call(this.slugs, id)) { id = a + '-' + (++n); }
	this.slugs[id] = true;
	return [id];
};

Markdown.prototype.wikiHref = function (target) {
	var parts = String(target).split('#');
	var page = parts[0].trim();
	var hash = parts.length > 1 ? parts.slice(1).join('#').trim() : '';
	var tail = hash ? '#' + enc(hash) : '';

	if (!page) return tail || '#';

	var url = articleBySel[this.subject + '|' + subDir(this.dir) + '|' + page]
		|| articleByTitle[page];
	/* 写成 "名字%20(2026.7.4)" 或带 URL 编码的写法时, 还原成真实标题再找一次 */
	if (!url && (page.indexOf('%') >= 0 || page.indexOf('+') >= 0)) {
		var plain;
		try { plain = decodeURIComponent(page.replace(/\+/g, '%20')).trim(); }
		catch (e) { plain = ''; }
		if (plain && plain !== page) {
			url = articleBySel[this.subject + '|' + subDir(this.dir) + '|' + plain]
				|| articleByTitle[plain];
		}
	}

	if (!url && page === this.subject) {
		var SITE = site();
		var sub = SITE ? (SITE.subjects || []).filter(function (s) { return s.name === page; })[0] : null;
		if (sub && sub.home) return root + encPath(sub.home) + tail;
	}
	if (!url) return null;

	return root + encPath(url) + tail;
};

Markdown.prototype.inline = function (text) {
	var Self = this;
	var s = String(text);
	/* 逐行处理: 这样某行落单的 $ 不会跨行去和下一行的 $ 配对 */
	if (s.indexOf('\n') < 0) return this.inlineLine(s);
	return s.split('\n').map(function (ln) { return Self.inlineLine(ln); }).join('\n');
};

Markdown.prototype.inlineLine = function (text) {
	var self = this;
	var out = '';
	var i = 0;
	var s = String(text);
	var n = s.length;

	function findClose(from, ch) {
		for (var j = from; j < n; j++) {
			if (s.charAt(j) === '\\') { j++; continue; }
			if (s.charAt(j) === ch) return j;
		}
		return -1;
	}

	while (i < n) {
		var c = s.charAt(i);

		/* 转义: 必须在 esc() 之前判断, 否则反斜杠已经被转成实体了 */
		if (c === '\\' && i + 1 < n && '\\`*_{}[]()#+-.!$~'.indexOf(s.charAt(i + 1)) >= 0) {
			out += esc(s.charAt(i + 1));
			i += 2;
			continue;
		}

		/* 行内代码 */
		if (c === '`') {
			var e1 = findClose(i + 1, '`');
			if (e1 > i) {
				out += '<code>' + esc(s.slice(i + 1, e1)) + '</code>';
				i = e1 + 1;
				continue;
			}
		}

		/* 公式: $...$ 与 $$...$$ */
		if (c === '$' && !/\s/.test(s.charAt(i + 1) || ' ')) {
			var display = s.substr(i, 2) === '$$';
			if (display) {
				var close = displayClose(s.slice(i + 2));
				if (close >= 0) {
					var dtex = s.slice(i + 2, i + 2 + close);
					out += '<span class="math math-display" data-tex="' + esc(dtex)
						+ '" data-display="1">$$' + esc(dtex) + '$$</span>';
					i = i + 2 + close + 2;
					continue;
				}
			} else {
				/* 行内公式: 收尾的 $ 前面不能是空白(否则前面那段的收尾被漏掉了) */
				var e2 = -1;
				for (var k2 = i + 1; k2 < s.length; k2++) {
					if (s.charAt(k2) === '\\') { k2++; continue; }
					if (s.charAt(k2) !== '$') continue;
					if (k2 === i + 1) break;                                 /* $$ 不成对 */
					if (/\s/.test(s.charAt(k2 - 1))) continue;               /* 前面是空白, 说明是"收尾被漏掉" */
					e2 = k2;
					break;
				}
				if (e2 > i) {
					var tex = s.slice(i + 1, e2);
					out += '<span class="math" data-tex="' + esc(tex)
						+ '" data-display="0">$' + esc(tex) + '$</span>';
					i = e2 + 1;
					continue;
				}
			}
		}

		/* 图片(![[名字.png]]) */
		if (c === '!' && s.charAt(i + 1) === '[' && s.charAt(i + 2) === '[') {
			var m2 = /^!\[\[([^\]]+)\]\]/.exec(s.slice(i));
			if (m2) {
				var src = m2[1].split('|')[0].trim();
				out += '<img src="' + esc(imgSrc(this.dir, src)) + '" alt="' + esc(src) + '">';
				i += m2[0].length;
				continue;
			}
		}

		/* 图片(![说明](地址)) */
		if (c === '!' && s.charAt(i + 1) === '[') {
			var im = parseLinkAt(s, i, true);
			if (im) {
				out += '<img src="' + esc(imgSrc(this.dir, im.href)) + '" alt="' + esc(im.label) + '">';
				i += im.length;
				continue;
			}
		}

		/* 普通链接 */
		if (c === '[') {
			var lk = parseLinkAt(s, i, false);
			if (lk) {
				var href = lk.href;
				var external = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href) || href.charAt(0) === '#' || href.charAt(0) === '/';
				var url = external ? href : root + encPath(joinPath(this.dir, href));
				out += '<a href="' + esc(url) + '"'
					+ (/^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '')
					+ '>' + self.inline(lk.label) + '</a>';
				i += lk.length;
				continue;
			}
		}

		/* 双链 [[]] */
		if (c === '[' && s.charAt(i + 1) === '[') {
			var m4 = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(s.slice(i));
			if (m4) {
				var target = m4[1].trim();
				var label = (m4[2] || m4[1]).trim();
				var url2 = this.wikiHref(target);
				if (url2 === null) {
					out += '<span class="' + WIKI_BAD + '" title="站内没有找到: ' + esc(target) + '">'
						+ self.inline(label) + '</span>';
				} else {
					out += '<a href="' + esc(url2) + '">' + self.inline(label) + '</a>';
				}
				i += m4[0].length;
				continue;
			}
		}

		/* 加粗 / 斜体 / 删除线 */
		if (c === '*' || c === '_' || c === '~') {
			var run = 1;
			while (s.charAt(i + run) === c && run < 3) run++;
			var marker = s.substr(i, run);
			var e3 = run === 1 ? s.indexOf(c, i + 1) : s.indexOf(marker, i + run);
			/* 单符号强调的收尾符号前不能是空格; 加粗/删除线则允许(笔记里常写成 "**…** ") */
			var okClose = e3 > i + run
				&& (run > 1 ? true : !/\s/.test(s.charAt(e3 - 1)));
			if (okClose) {
				var inner = s.slice(i + run, e3);
				out += run === 1 ? '<em>' + self.inline(inner) + '</em>'
					: run === 2 ? (c === '~' ? '<del>' + self.inline(inner) + '</del>'
						: '<strong>' + self.inline(inner) + '</strong>')
						: '<strong><em>' + self.inline(inner) + '</em></strong>';
				i = e3 + run;
				continue;
			}
			/* 收尾星号被漏掉时(如 "**题目…" 且整段没有闭合), 仍按加粗渲染 */
			if (run === 2 && e3 < 0 && s.charAt(i + 2) !== ' ') {
				out += '<strong>' + self.inline(s.slice(i + 2)) + '</strong>';
				i = n;
				continue;
			}
		}

		/* 高亮 */
		if (c === '=' && s.substr(i, 2) === '==') {
			var e4 = s.indexOf('==', i + 2);
			if (e4 > i + 1) {
				out += '<mark>' + self.inline(s.slice(i + 2, e4)) + '</mark>';
				i = e4 + 2;
				continue;
			}
		}

		/* 行内 HTML 标签原样输出 */
		if (c === '<') {
			var m5 = /^<\/?[a-zA-Z][^>]*>/.exec(s.slice(i));
			if (m5) {
				out += m5[0];
				i += m5[0].length;
				continue;
			}
		}

		out += esc(c);
		i++;
	}

	return out;
};

/* --- 块级 --- */

/* 在一行里找收尾的 $$, 允许后面跟空白; 找不到返回 -1 */
function displayClose(s) {
	var i = 0;
	while (i < s.length) {
		if (s.charAt(i) === '\\') { i += 2; continue; }
		if (s.substr(i, 2) === '$$' && !/\S/.test(s.slice(i + 2))) return i;
		i++;
	}
	return -1;
}

/* 这一行是否开启了一个跨行的块级公式
   ($$ 没有在本行收尾, 或者是单独一行 $$ 后面跟着 \begin{align*} 之类的环境) */
function opensDisplayMath(line) {
	var at = line.indexOf('$$');
	if (at < 0) return false;
	if (displayClose(line.slice(at + 2)) >= 0) return false;   /* 本行就收尾了 */
	if (/\S/.test(line.slice(at + 2))) return true;            /* $$ 后面还有内容, 却没收尾 */
	return /\\begin\s*\{[a-zA-Z*]+\}/.test(line);              /* 单独的 $$, 后面才写环境 */
}

Markdown.prototype.render = function (src) {
	src = String(src).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
	var lines = src.split('\n');
	var out = '';
	var para = [];

	/* 每行里如果有落单的 $ (作者漏写了收尾), 把最后一个转义掉,
	   免得它和后面几行的 $ 配成一段乱七八糟的公式 */
	var fixLine = function (ln) {
		if (ln.indexOf('$') < 0) return ln;
		var cnt = 0;
		var k = 0;
		while (k < ln.length) {
			if (ln.charAt(k) === '\\') { k += 2; continue; }
			if (ln.charAt(k) === '$') cnt++;
			k++;
		}
		if (cnt % 2 === 0) return ln;
		/* 落单: 把最后一个还没被转义的 $ 转义掉 */
		for (var q = ln.length - 1; q >= 0; q--) {
			if (ln.charAt(q) !== '$') continue;
			var bs = 0;
			for (var r = q - 1; r >= 0 && ln.charAt(r) === '\\'; r--) bs++;
			if (bs % 2 === 1) continue;
			return ln.slice(0, q) + '\\$' + ln.slice(q + 1);
		}
		return ln;
	};

	/* 段落内: 每行分别处理行内公式(落单的 $ 不会跨行去配),
	   并且按 Obsidian 的习惯把"单个换行"当成换行(而不是像 CommonMark 那样当空格)。
	   - 连续两行都是普通文字时插 <br>
	   - 以 < 开头的是 HTML 块, 用作者自己写的 <br />
	   - 独占一行的链接(如名词索引里的 [[...]] 与 "见[[...]].")各自成段, 不并在一起 */
	function renderPara(text) {
		var self = this;
		var parts = text.split('\n');
		var out2 = '';
		for (var p = 0; p < parts.length; p++) {
			var ln = parts[p];
			if (p > 0) {
				var prev = parts[p - 1];
				var soloLink = /^\s*(\[\[|!\[\[|见|详见)/;
				var join = prev.trim() && ln.trim()
					&& prev.charAt(0) !== '<' && ln.charAt(0) !== '<'
					&& !soloLink.test(ln) && !soloLink.test(prev);
				out2 += join ? '<br>' : '\n';
			}
			out2 += self.inline(fixLine(ln));
		}
		return out2;
	}

	var flush = function () {
		if (!para.length) return;
		out += '<p>' + renderPara.call(this, para.join('\n')) + '</p>';
		para = [];
	}.bind(this);

	var i = 0;
	while (i < lines.length) {
		var line = lines[i];

		if (!line.trim()) { flush(); i++; continue; }

		/* 分割线 */
		if (/^[ \t]{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
			flush();
			out += '<hr>';
			i++;
			continue;
		}

		/* ATX 标题 */
		var h = /^[ \t]{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
		if (h) {
			flush();
			var lv = h[1].length;
			var id = this.slug(h[2].replace(/[*_`]/g, ''));
			var alias = this.slugAliases(h[2].replace(/[*_`]/g, ''));
			out += '<h' + lv + ' id="' + esc(id) + '"'
				+ (alias.length ? ' data-alias="' + esc(alias.join(' ')) + '"' : '')
				+ '>' + this.inline(h[2])
				+ '<a class="anchor" href="#' + esc(id) + '">#</a></h' + lv + '>';
			i++;
			continue;
		}

		/* 独占一行的公式块 $$...$$ (可以跨多行, 例如 $$ + \begin{align*} … \end{align*}$$) */
		var dm = /^[ \t]{0,3}\$\$(.*)$/.exec(line);
		if (dm) {
			var tex = dm[1];
			var buf2 = [];
			var closed = false;
			var j = i;
			var inlineClose = displayClose(tex);

			if (inlineClose >= 0 && !/\S/.test(tex.slice(inlineClose + 2))) {
				/* 本行就 $$...$$ 收尾 */
				buf2 = [tex.slice(0, inlineClose)];
				closed = true;
			} else {
				/* 跨行: $$ 后面还有内容却没在行尾收尾, 或者干脆是新起一行写 \begin{...} */
				if (/\S/.test(tex)) buf2.push(tex);
				j++;
				while (j < lines.length) {
					var cur = lines[j];
					var at2 = displayClose(cur);
					if (at2 >= 0) {
						if (/\S/.test(cur.slice(0, at2))) buf2.push(cur.slice(0, at2));
						closed = true;
						break;
					}
					buf2.push(cur);
					j++;
				}
			}

			if (closed) {
				flush();
				var src2 = buf2.join('\n').trim();
				out += '<span class="math math-display" data-tex="'
					+ esc(src2) + '" data-display="1">$$' + esc(src2) + '$$</span>';
				i = j + 1;
				continue;
			}
			/* 找不到收尾的 $$: 当作普通段落, 免得把后面的正文一起吞掉 */
		}

		/* 表格: 表头 + 分隔行 + 若干数据行 */
		if (line.indexOf('|') >= 0 && i + 1 < lines.length
			&& /^[ \t]{0,3}\|?[ :\-|]*-[ :\-|]*\|?\s*$/.test(lines[i + 1])
			&& lines[i + 1].indexOf('-') >= 0) {
			flush();
			var head = line;
			var sep = lines[i + 1];
			var bodyRows = [];
			i += 2;
			while (i < lines.length && lines[i].indexOf('|') >= 0 && lines[i].trim()) {
				bodyRows.push(lines[i]);
				i++;
			}
			out += this.table(head, sep, bodyRows);
			continue;
		}

		/* 引用 */
		if (/^[ \t]{0,3}>/.test(line)) {
			flush();
			var frame = this.collect(lines, i, true, function (l) {
				return !/^[ \t]{0,3}>\s*$/.test(l);
			});
			out += '<blockquote>' + this.render(frame.text) + '</blockquote>';
			i = frame.next;
			continue;
		}

		/* fenced 代码块 */
		var fence = /^[ \t]{0,3}(```|~~~)(.*)$/.exec(line);
		if (fence) {
			flush();
			var buf = [];
			i++;
			while (i < lines.length && !new RegExp('^[ \t]{0,3}' + fence[1]).test(lines[i])) {
				buf.push(lines[i]);
				i++;
			}
			i++;
			out += this.code(fence[2].trim(), buf.join('\n'));
			continue;
		}

		/* HTML 块 */
		if (/^[ \t]{0,3}<[a-zA-Z!/]/.test(line)) {
			flush();
			var hb = this.collect(lines, i, false);
			out += this.htmlBlock(hb.text);
			i = hb.next;
			continue;
		}

		/* 列表 */
		if (/^[ \t]{0,3}(?:[-+*]|\d{1,9}[.)])\s+/.test(line)) {
			flush();
			var frame2 = this.collect(lines, i, false);
			out += this.list(frame2.text);
			i = frame2.next;
			continue;
		}

		para.push(fixLine(line.trim()));
		i++;
	}

	flush();
	return out;
};

/* 行首空白宽度(制表符按 4 个空格算) */
function indentWidth(s) {
	var t = String(s).replace(/^([ \t]*).*$/, '$1').replace(/\t/g, '    ');
	return t.length;
}

/* 取出同一缩进层级的连续块
   stripQuote 为真时按引用块处理: 引用行去掉 ">" 前缀, 没有 ">" 的行按
   Markdown 的"惰性续行"规则继续归入引用块(笔记里常把公式块拆成不带 ">" 的多行)。
   isEmpty 用来判断"空行", 引用块的 ">" / "> " 也算空行。 */
Markdown.prototype.collect = function (lines, start, stripQuote, isEmpty) {
	var min = Infinity;
	var picked = [];
	var i = start;
	var inMath = false;   /* 正在一个跨行的 $$ 公式块之中 */
	var isBlank = isEmpty || function (l, next) {
		if (l.trim()) return false;
		/* 空行后面还跟着更深缩进的内容时, 不算块结束 */
		return !(next && next.trim() && indentWidth(next) > min);
	};

	for (; i < lines.length; i++) {
		var s = lines[i];

		/* 公式块内部: 原样收下(引用行仍然去掉 ">") */
		if (inMath) {
			var m0 = /^[ \t]{0,3}>[ \t]?/.exec(s);
			var body = m0 ? s.slice(m0[0].length) : s;
			picked.push(body);
			if (displayClose(body) >= 0) inMath = false;
			continue;
		}

		var m = stripQuote ? /^[ \t]{0,3}>[ \t]?/.exec(s) : null;
		if (stripQuote && !m) {
			/* 惰性续行: 空行结束, 遇到新块(标题/列表/引用/围栏)也结束 */
			if (!s.trim()) break;
			if (/^[ \t]{0,3}(#{1,6}\s|[-+*]\s|\d{1,9}[.)]\s|>|```|~~~)/.test(s)) break;
		}

		var line = m ? s.slice(m[0].length) : s;
		if (!stripQuote && isBlank(s, lines[i + 1]) && picked.length) break;
		picked.push(line);

		/* 出现了跨行的块级公式, 接下来几行都属于它 */
		if (opensDisplayMath(line) || opensDisplayMath(line.replace(/^\s+/, ''))) inMath = true;

		if (line.trim()) {
			var ind = indentWidth(line);
			if (ind < min) min = ind;
		}
	}

	/* 结尾的空行不属于本块 */
	var end = picked.length;
	while (end > 0 && !picked[end - 1].trim()) end--;
	picked = picked.slice(0, end);
	var next = i;

	if (min === Infinity) min = 0;

	var text = picked.map(function (l) {
		if (!l.trim()) return '';
		var ind2 = l.length - l.replace(/^[ \t]+/, '').length;
		return l.slice(Math.min(min, ind2));
	}).join('\n');

	return { text: text, next: next };
};

/* ----------------------------------------------------- desmos-graph 矢量图 */
/* 把 Obsidian 的 desmos-graph 代码块直接画成 SVG(不联网, 不依赖 Desmos)。
   支持: left/right/top/bottom/width/height/grid/hideAxisNumbers 设置,
   形如 y=f(x) 的函数曲线(可用 |dashed|color|label:`…` 修饰), x=常数 的竖直直线,
   (x,y) 点, 以及 \{a\le x\le b\} 这样的自变量区间。 */

/* 希腊字母用 ASCII 名字, 这样能直接当变量名求值 */
var GREEK = {
	alpha: 'alpha', beta: 'beta', gamma: 'gamma', delta: 'delta', epsilon: 'epsilon',
	varepsilon: 'epsilon', zeta: 'zeta', eta: 'eta', theta: 'theta', iota: 'iota',
	kappa: 'kappa', lambda: 'lambda', mu: 'mu', nu: 'nu', xi: 'xi', pi: 'pi',
	rho: 'rho', sigma: 'sigma', tau: 'tau', upsilon: 'upsilon', phi: 'phi',
	varphi: 'phi', chi: 'chi', psi: 'psi', omega: 'omega',
	Gamma: 'Gamma', Delta: 'Delta', Theta: 'Theta', Lambda: 'Lambda', Xi: 'Xi',
	Pi: 'Pi', Sigma: 'Sigma', Upsilon: 'Upsilon', Phi: 'Phi', Psi: 'Psi', Omega: 'Omega'
};

var SAFE_EXPR = /^[\x20-\x7e]*$/;

/* 取出 \cmd{...} 的花括号参数(支持嵌套), 用 fn 处理里面的内容 */
function braceInner(s, openIdx) {
	var depth = 0;
	var start = -1;
	for (var k = openIdx; k < s.length; k++) {
		var ch = s.charAt(k);
		if (ch === '{') {
			depth++;
			if (depth === 1) start = k + 1;
		} else if (ch === '}') {
			depth--;
			if (depth === 0) return { inner: s.slice(start, k), end: k + 1 };
		}
	}
	return null;
}

function braceArg(s, openIdx, fn) {
	var got = braceInner(s, openIdx);
	if (!got) return null;
	return { text: s.slice(0, openIdx) + fn(got.inner) + s.slice(got.end) };
}

/* 反复处理 \dfrac{a}{b} / \sqrt{a} 这类命令, 每次替换后从头再扫一遍 */
function texCommands(s, list) {
	var changed = true;
	var guard = 0;
	while (changed && guard++ < 400) {
		changed = false;
		for (var t = 0; t < list.length && !changed; t++) {
			var spec = list[t];
			var at = s.indexOf(spec.head);
			if (at < 0) continue;
			var bra = s.indexOf('{', at + spec.head.length);
			if (bra < 0) continue;
			var got = braceArg(s, bra, spec.fn);
			if (!got) continue;
			s = got.text;
			changed = true;
		}
	}
	return s;
}

/* \frac{a}{b} / \dfrac / \tfrac -> ((a)/(b)), 允许省略花括号(\frac12) */
var TEX_GROUP = '(?:\\{(?:[^{}]|\\{[^{}]*\\})*\\}|\\\\[a-zA-Z]+|[0-9a-zA-Z])';
var FRAC_RE = new RegExp('\\\\(?:d|t)?frac\\s*(' + TEX_GROUP + ')\\s*(' + TEX_GROUP + ')', 'g');

function texFrac(s) {
	var guard = 0;
	while (FRAC_RE.test(s) && guard++ < 300) {
		FRAC_RE.lastIndex = 0;
		s = s.replace(FRAC_RE, function (all, a, b) {
			return '((' + stripBraces(a) + ')/(' + stripBraces(b) + '))';
		});
	}
	FRAC_RE.lastIndex = 0;
	return s;
}

function stripBraces(a) {
	var t = String(a).replace(/^\s+|\s+$/g, '');
	if (t.charAt(0) === '{' && t.charAt(t.length - 1) === '}') t = t.slice(1, -1);
	return t;
}

/* \sqrt{..} 与 \sqrt3 -> sqrt(..) */
function texSqrt(s) {
	var guard = 0;
	var re = new RegExp('\\\\sqrt\\s*(?:\\[([^\\]]*)\\])?\\s*(' + TEX_GROUP + ')');
	while (guard++ < 200) {
		var m = re.exec(s);
		if (!m) break;
		var body = stripBraces(m[2]);
		var rep = m[1] !== undefined ? '((' + body + ')^(1/(' + m[1] + ')))' : 'sqrt(' + body + ')';
		s = s.slice(0, m.index) + rep + s.slice(m.index + m[0].length);
	}
	return s;
}

/* \sin x / \sin^2 x -> \sin(x) / \sin(x)^2 */
var TEX_FUNCS = ['sinh', 'cosh', 'tanh', 'coth', 'arcsinh', 'arccosh', 'arctanh',
	'arcsin', 'arccos', 'arctan', 'csc', 'sec', 'cot', 'sin', 'cos', 'tan',
	'ln', 'log', 'exp', 'max', 'min', 'abs', 'floor', 'ceil', 'round', 'sign'];
var TEX_FUNC_SET = {};
TEX_FUNCS.forEach(function (n) { TEX_FUNC_SET[n] = true; });

function isAlnum(ch) {
	return ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' || ch >= '0' && ch <= '9';
}

/* 取一个 LaTeX 参数: {...} / \cmd / 一串字母数字与 ^ 上下标 */
function texArg(s, i) {
	if (s.charAt(i) === '{') {
		var got = braceInner(s, i);
		if (!got) return null;
		return { arg: got.inner, end: got.end };
	}
	var j = i;
	var out = '';
	while (j < s.length) {
		var ch = s.charAt(j);
		if (ch === '\\') {
			var cm = /^\\[a-zA-Z]+/.exec(s.slice(j));
			if (!cm) break;
			out += cm[0];
			j += cm[0].length;
			continue;
		}
		if (isAlnum(ch)) {
			out += ch;
			j++;
			while (j < s.length && s.charAt(j) === '^') {
				out += '^';
				j++;
				if (s.charAt(j) === '{') {
					var g2 = braceInner(s, j);
					if (!g2) break;
					out += '{' + g2.inner + '}';
					j = g2.end;
				} else {
					out += s.charAt(j);
					j++;
				}
			}
			continue;
		}
		break;
	}
	if (!out) return null;
	return { arg: out, end: j };
}

function wrapFunctions(s) {
	var out = '';
	var i = 0;
	while (i < s.length) {
		if (s.charAt(i) !== '\\') { out += s.charAt(i); i++; continue; }
		var m = /^\\([a-zA-Z]+)/.exec(s.slice(i));
		if (!m || !TEX_FUNC_SET[m[1]]) { out += s.charAt(i); i++; continue; }
		i += m[0].length;
		while (s.charAt(i) === ' ') i++;
		if (s.charAt(i) === '^') {
			i++;
			while (s.charAt(i) === ' ') i++;
			var pw;
			if (s.charAt(i) === '{') {
				var g = braceInner(s, i);
				pw = g ? '{' + g.inner + '}' : '';
				i = g ? g.end : i;
			} else {
				var pm = /^[a-zA-Z0-9]/.exec(s.slice(i));
				pw = pm ? pm[0] : '';
				i += pw.length;
			}
			var g2 = texArg(s, i);
			if (g2) { out += '\\' + m[1] + '(' + g2.arg + ')^' + pw; i = g2.end; }
			else out += '\\' + m[1];
			continue;
		}
		var a = texArg(s, i);
		if (a) { out += '\\' + m[1] + '(' + a.arg + ')'; i = a.end; }
		else out += '\\' + m[1];
	}
	return out;
}

/* 把 \left(...\right) 之类的定界符还原成普通括号 */
function normDelims(s) {
	return String(s)
		.replace(/\\(left|right)\s*\\?([|.])/g, '$1|$2|')
		.replace(/\\(left|right)\s*([([{)\]])/g, '$2')
		.replace(/\|l\|/g, '|').replace(/\|r\|/g, '|')
		.replace(/\\\{/g, '(').replace(/\\\}/g, ')');
}

/* 一元负号 + 幂: -x^2 / -(x-1)^2 在 JS 里要写成 -((x)**2) 才合法且数学上正确 */
function fixUnaryPow(s) {
	var out = '';
	var i = 0;
	while (i < s.length) {
		var ch = s.charAt(i);
		var prev = i === 0 ? '(' : s.charAt(i - 1);
		if (ch === '-' && '(,=+-*/^'.indexOf(prev) >= 0) {
			var j = i + 1;
			while (s.charAt(j) === ' ') j++;
			var base = '';
			if (s.charAt(j) === '(') {
				var depth = 0;
				var k = j;
				for (; k < s.length; k++) {
					if (s.charAt(k) === '(') depth++;
					else if (s.charAt(k) === ')') {
						depth--;
						if (depth === 0) { k++; break; }
					}
				}
				base = s.slice(j, k);
				j = k;
			} else {
				while (j < s.length && /[a-zA-Z0-9.]/.test(s.charAt(j))) { base += s.charAt(j); j++; }
			}
			while (s.charAt(j) === ' ') j++;
			if (base && s.charAt(j) === '^') {
				var p = j + 1;
				while (s.charAt(p) === ' ') p++;
				var pw = '';
				if (s.charAt(p) === '(') {
					var d2 = 0;
					var k2 = p;
					for (; k2 < s.length; k2++) {
						if (s.charAt(k2) === '(') d2++;
						else if (s.charAt(k2) === ')') {
							d2--;
							if (d2 === 0) { k2++; break; }
						}
					}
					pw = s.slice(p, k2);
					p = k2;
				} else {
					pw = s.charAt(p);
					p++;
				}
				out += '-(' + base + '^' + pw + ')';
				i = p;
				continue;
			}
		}
		out += ch;
		i++;
	}
	return out;
}

/* 从 text[start] 开始解析 [说明](地址 "标题") 或 ![说明](地址),
   返回 {label, href, length} 或 null。

   地址用 (...) 包裹, 按标准做法要求里面的括号成对出现; 但笔记里常写
   ".../%20(2026.7.4)" 这种不成对的写法(收尾那个 ) 直接被当成地址的一部分),
   这里做个宽容处理: 先按成对扫描, 若地址里还有没配平的 ( 就把它补成成对的。 */
function parseLinkAt(text, start, isImage) {
	var i = start;
	if (isImage) {
		if (text.charAt(i) !== '!' || text.charAt(i + 1) !== '[') return null;
		i++;
	}
	if (text.charAt(i) !== '[') return null;
	i++;

	/* 说明部分: 找不转义的 ] */
	var label = '';
	while (i < text.length && text.charAt(i) !== ']') {
		if (text.charAt(i) === '\\' && i + 1 < text.length) { label += text.charAt(i + 1); i += 2; continue; }
		label += text.charAt(i);
		i++;
	}
	if (text.charAt(i) !== ']' || text.charAt(i + 1) !== '(') return null;
	i += 2;

	/* 地址部分: 找收尾的 )。
	   写成 ".../%20(2026.7.4)" 时, 第一个 ) 会被当成收尾, 但后面紧跟着又有一个 ) —
	   这说明真正的收尾在更后面, 于是继续往下找。 */
	var depth = 0;
	var j = i;
	while (j < text.length) {
		var ch = text.charAt(j);
		if (ch === '\\') { j += 2; continue; }
		if (ch === '(') { depth++; j++; continue; }
		if (ch === ')') {
			if (depth === 0) {
				if (text.charAt(j + 1) === ')') { j++; continue; }
				break;
			}
			depth--;
			j++;
			continue;
		}
		j++;
	}
	if (j >= text.length || text.charAt(j) !== ')') return null;

	var href = text.slice(i, j).replace(/^\s+|\s+$/g, '');
	/* 标准写法 <地址> : 把尖括号去掉 */
	if (href.charAt(0) === '<' && href.charAt(href.length - 1) === '>') {
		href = href.slice(1, -1).trim();
	}

	/* 写成 ".../%20(2026.7.4)" 这种没配平括号的地址时, 把漏掉的收尾 ) 补回去 */
	var openCount = 0;
	for (var k = 0; k < href.length; k++) {
		if (href.charAt(k) === '\\') { k++; continue; }
		if (href.charAt(k) === '(') openCount++;
		else if (href.charAt(k) === ')') openCount--;
	}
	if (openCount > 0) href += ')'.repeat(openCount);

	var length = j + 1 - start;

	/* 地址后面跟的 "标题" 归链接, 不算正文 */
	var tailRe = /^\s*"[^"]*"/.exec(text.slice(j + 1));
	if (tailRe) length += tailRe[0].length;

	return { label: label, href: href, length: length };
}

/* 把 LaTeX 转成可以求值的 JS 表达式 */
function texToExpr(tex) {
	var s = String(tex);

	/* 去掉只起排版作用的命令与定界符 */
	s = s.replace(/\\[,;:!]|\\quad|\\qquad|\\displaystyle|\\limits|\\nolimits/g, ' ');
	s = normDelims(s);
	s = s.replace(/\\lvert|\\rvert|\\vert|\\lVert|\\rVert|\\Vert/g, '|');

	/* \sin x -> \sin(x), 这样后面的隐式乘法不会把函数名里的字母拆开 */
	s = wrapFunctions(s);

	/* \mathrm{..} / \text{..} / \operatorname{..} 这类纯文字命令展开 */
	s = texCommands(s, [
		{ head: '\\mathrm', fn: function (a) { return a; } },
		{ head: '\\operatorname', fn: function (a) { return a; } },
		{ head: '\\text', fn: function (a) { return a; } }
	]);
	/* 分数 / 根号 */
	s = texFrac(s);
	s = texSqrt(s);

	s = s.replace(/\\(sinh|cosh|tanh|coth|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|ln|log|exp|max|min|abs|floor|ceil|round|sign)/g,
		function (all, name) { return '\u0002' + name; });

	var names = Object.keys(GREEK);
	var i;
	for (i = 0; i < names.length; i++) {
		s = s.split('\\' + names[i]).join(GREEK[names[i]]);
	}
	/* 关系运算符换成可求值的形式 */
	s = s.replace(/\\le\b|\\leq\b/g, '<=')
		.replace(/\\ge\b|\\geq\b/g, '>=')
		.replace(/\\ne\b|\\neq\b/g, '!=')
		.replace(/\\cdot|\\times/g, '*');
	s = s.replace(/\\[a-zA-Z]+/g, ' ');        /* 剩下的命令丢掉 */
	s = s.replace(/\\/g, ' ');                 /* 剩下孤零零的反斜杠也丢掉 */
	s = s.replace(/[{}]/g, '');

	/* 一元负号 + 幂运算在 JS 里必须加括号, 否则是语法错误 */
	s = fixUnaryPow(s);
	s = s.replace(/\^/g, '\u0003');            /* 先占位, 免得和隐式乘法的 * 混在一起 */

	/* 隐式乘法 */
	for (i = 0; i < 5; i++) {
		s = s.replace(/(\d)\s*([a-zA-Z(])/g, '$1*$2')
			.replace(/\)\s*(\d)/g, ')*$1')
			.replace(/([a-zA-Z])\s*\u0002/g, '$1*\u0002')
			.replace(/\)\s*\u0002/g, ')*\u0002')
			.replace(/\)\s*([a-zA-Z])/g, ')*$1')
			.replace(/([a-zA-Z])\s*\(/g, function (all, ch) {
				return 'nstcdeglr'.indexOf(ch) >= 0 ? all : ch + '*(';
			});
		if (s.indexOf('\u0002') >= 0) s = s.replace(/\u0002/g, '');
	}
	s = s.replace(/\u0002/g, '');
	s = s.replace(/\s+/g, '');
	s = s.replace(/\u0003/g, '**');
	return s;
}
var FUNC_SCOPE = (function () {
	var names = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'sinh', 'cosh', 'tanh',
		'asin', 'acos', 'atan', 'asinh', 'acosh', 'atanh', 'sqrt', 'abs', 'exp',
		'ln', 'log', 'log10', 'log2', 'floor', 'ceil', 'round', 'sign', 'min', 'max', 'pow'];
	var body = 'var E=Math.E,e=Math.E,Pi=Math.PI,pi=Math.PI,tau=2*Math.PI;';
	body += 'var cot=function(v){return 1/Math.tan(v);};';
	body += 'var sec=function(v){return 1/Math.cos(v);};';
	body += 'var csc=function(v){return 1/Math.sin(v);};';
	body += 'var coth=function(v){return 1/Math.tanh(v);};';
	body += 'var ln=Math.log, log=Math.log, log10=Math.log10, log2=Math.log2;';
	body += 'var sign=Math.sign, round=Math.round, floor=Math.floor, ceil=Math.ceil;';
	names.forEach(function (n) {
		if (['ln', 'log', 'log10', 'log2', 'sign', 'round', 'floor', 'ceil'].indexOf(n) < 0
			&& typeof Math[n] === 'function') {
			body += 'var ' + n + '=Math.' + n + ';';
		}
	});
	return body;
})();

function compileExpr(expr) {
	if (!SAFE_EXPR.test(expr) || !expr.trim()) return null;
	try {
		/* eslint-disable no-new-func */
		return new Function('x', FUNC_SCOPE + 'return (' + expr + ');');
	} catch (e) {
		return null;
	}
}

function evalAt(fn, x) {
	try {
		var v = fn(x);
		return typeof v === 'number' && isFinite(v) ? v : NaN;
	} catch (e) {
		return NaN;
	}
}

/* 把 LaTeX 片段转成纯文本, 用于坐标标签 */
function texToText(tex) {
	var s = texToExpr(tex);
	try {
		/* eslint-disable no-new-func */
		var v = new Function(FUNC_SCOPE + 'return (' + s + ');')();
		if (typeof v === 'number' && isFinite(v)) {
			var t = Math.abs(v) < 1 ? v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') : String(Math.round(v * 1000) / 1000);
			return t;
		}
	} catch (e) { /* 落回文本形式 */ }
	return s.replace(/\*\*/g, '^').replace(/\*/g, '');
}

function prettyText(raw) {
	var s = String(raw).replace(/^\\left|\\right$/g, '');
	var t = texToExpr(s);
	/* 括号里的点标签: 分别把两个坐标算成数字, 更直观 */
	var m = /^\(([^,]+),([^,]+)\)$/.exec(t);
	if (m) {
		var a = numText(m[1]);
		var b = numText(m[2]);
		if (a !== null && b !== null) return '(' + a + ', ' + b + ')';
	}
	return s
		.replace(/\\(dfrac|frac|tfrac|sqrt|left|right|mathrm|operatorname|,)/g, ' ')
		.replace(/[\\{}]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/* 能算成数字就返回数字文本, 否则 null */
function numText(expr) {
	if (!expr.trim()) return null;
	try {
		/* eslint-disable no-new-func */
		var v = new Function(FUNC_SCOPE + 'return (' + expr + ');')();
		if (typeof v === 'number' && isFinite(v)) {
			var r = Math.round(v * 1000) / 1000;
			return String(r);
		}
	} catch (e) { /* 不是常数 */ }
	return null;
}

function num(s, dflt) {
	var v = parseFloat(String(s).replace(/[^0-9.eE+-]/g, ''));
	return isFinite(v) ? v : dflt;
}

/* 把 "(x, y)" 拆成两个表达式, 只认最外层的逗号 */
function splitTopComma(s) {
	var depth = 0;
	var j;
	for (j = 0; j < s.length; j++) {
		var ch = s.charAt(j);
		if (ch === '(' || ch === '[' || ch === '{') depth++;
		else if (ch === ')' || ch === ']' || ch === '}') depth--;
		else if (ch === ',' && depth === 0) return [s.slice(0, j), s.slice(j + 1)];
	}
	return null;
}

function parsePoint(expr) {
	var t = expr.trim();
	if (t.charAt(0) !== '(' || t.charAt(t.length - 1) !== ')') return null;
	var pair = splitTopComma(t.slice(1, -1));
	if (!pair) return null;
	return { x: compileExpr(texToExpr(pair[0])), y: compileExpr(texToExpr(pair[1])) };
}

/* 范围端点可能是 \frac{-1-\sqrt3}2 这样的式子, 先试着求值, 不行再当普通数字读 */
function evalConst(text, dflt) {
	var t = stripBraces(String(text).trim());
	if (!t) return dflt;
	var fn = compileExpr(texToExpr(t));
	if (fn) {
		var v = evalAt(fn, 0);
		if (isFinite(v)) return v;
	}
	return num(t, dflt);
}

function renderGraph(text, fallback) {
	var DEBUG = window.GRAPH_DEBUG && typeof console !== 'undefined' && console.error;
	var fail = function (why) {
		dropped++;
		if (DEBUG) console.error('renderGraph: ' + why);
		return null;
	};
	var lines = String(text).replace(/\r\n?/g, '\n').split('\n');
	var cfg = {
		left: -10, right: 10, bottom: -10, top: 10,
		width: 800, height: 320, grid: false, hideAxisNumbers: false
	};
	var body = [];
	var i, j;

	for (i = 0; i < lines.length; i++) {
		var l = lines[i];
		if (/^\s*---\s*$/.test(l)) {
			for (j = i + 1; j < lines.length; j++) body.push(lines[j]);
			break;
		}
		/* 一行里可能有多个设置: "left = -1.5; right = 6.5;" */
		var setRe = /([A-Za-z]+)\s*=\s*([^;]+)/g;
		var sm;
		while ((sm = setRe.exec(l))) {
			var key = sm[1];
			if (!Object.prototype.hasOwnProperty.call(cfg, key)) continue;
			if (key === 'grid' || key === 'hideAxisNumbers') cfg[key] = /true/i.test(sm[2]);
			else cfg[key] = num(sm[2], cfg[key]);
		}
	}

	var W = Math.max(240, Math.min(1600, cfg.width));
	var H = Math.max(160, Math.min(900, cfg.height));
	var pad = 40;
	var x0 = cfg.left, x1 = cfg.right, y0 = cfg.bottom, y1 = cfg.top;
	if (x1 <= x0) x1 = x0 + 1;
	if (y1 <= y0) y1 = y0 + 1;

	function px(x) { return pad + (x - x0) / (x1 - x0) * (W - 2 * pad); }
	function py(y) { return H - pad - (y - y0) / (y1 - y0) * (H - 2 * pad); }

	var out = [];
	var shapes = [];
	var dropped = 0;

	/* 网格 */
	if (cfg.grid) {
		var step = niceStep((x1 - x0) / 8);
		var gx = Math.ceil(x0 / step) * step;
		for (; gx <= x1; gx += step) {
			shapes.push('<line x1="' + px(gx).toFixed(1) + '" y1="' + py(y0).toFixed(1)
				+ '" x2="' + px(gx).toFixed(1) + '" y2="' + py(y1).toFixed(1)
				+ '" stroke="currentColor" stroke-opacity=".12" stroke-width="1"/>');
		}
		var stepY = niceStep((y1 - y0) / 6);
		var gy = Math.ceil(y0 / stepY) * stepY;
		for (; gy <= y1; gy += stepY) {
			shapes.push('<line x1="' + px(x0).toFixed(1) + '" y1="' + py(gy).toFixed(1)
				+ '" x2="' + px(x1).toFixed(1) + '" y2="' + py(gy).toFixed(1)
				+ '" stroke="currentColor" stroke-opacity=".12" stroke-width="1"/>');
		}
	}

	/* 坐标轴 */
	shapes.push('<line x1="' + px(x0).toFixed(1) + '" y1="' + py(0).toFixed(1)
		+ '" x2="' + px(x1).toFixed(1) + '" y2="' + py(0).toFixed(1)
		+ '" stroke="currentColor" stroke-width="1.2"/>');
	shapes.push('<line x1="' + px(0).toFixed(1) + '" y1="' + py(y0).toFixed(1)
		+ '" x2="' + px(0).toFixed(1) + '" y2="' + py(y1).toFixed(1)
		+ '" stroke="currentColor" stroke-width="1.2"/>');

	if (!cfg.hideAxisNumbers) {
		var labels = [];
		var st = niceStep((x1 - x0) / 8);
		var vx = Math.ceil(x0 / st) * st;
		for (; vx <= x1; vx += st) {
			if (Math.abs(vx) < st / 100) continue;
			labels.push('<text x="' + px(vx).toFixed(1) + '" y="' + (py(0) + 13).toFixed(1)
				+ '" font-size="11" text-anchor="middle" fill="currentColor" fill-opacity=".55">'
				+ (Math.round(vx * 1000) / 1000) + '</text>');
		}
		var sy = niceStep((y1 - y0) / 6);
		var vy = Math.ceil(y0 / sy) * sy;
		for (; vy <= y1; vy += sy) {
			if (Math.abs(vy) < sy / 100) continue;
			labels.push('<text x="' + (px(0) - 5).toFixed(1) + '" y="' + (py(vy) + 4).toFixed(1)
				+ '" font-size="11" text-anchor="end" fill="currentColor" fill-opacity=".55">'
				+ (Math.round(vy * 1000) / 1000) + '</text>');
		}
		shapes.push(labels.join(''));
	}

	/* 逐条解析 */
	var curves = [];
	for (i = 0; i < body.length; i++) {
		var raw = body[i].trim();
		if (!raw) continue;

		var parts = raw.split('|');
		var expr = parts[0].trim();
		var style = { dashed: false, color: 'currentColor', label: '' };
		for (j = 1; j < parts.length; j++) {
			var opt = parts[j].trim();
			if (/^dashed$/i.test(opt) || /^dot/i.test(opt)) style.dashed = true;
			var lb = /^label\s*:\s*`([\s\S]*)`$/.exec(opt);
			if (lb) style.label = lb[1];
			if (/^(black|blue|red|green|orange|purple)$/i.test(opt)) style.color = 'currentColor';
		}

		/* 自变量区间 \{a\le x\le b\} 或 \left( a\le x\le b \right) */
		var lo = x0, hi = x1;
		var ATOM = '(?:\\\\[a-zA-Z]+|\\{(?:[^{}]|\\{[^{}]*\\})*\\}|[^}(){}])';
		var REL = '(?:\\\\leq|\\\\geq|\\\\le|\\\\ge)';
		var OPEN = '(?:\\\\?\\{\\\\?|\\\\left\\s*[\\\\({[|])';
		var CLOSE = '(?:\\\\?\\}|\\\\right\\s*[\\\\)}\\]|])';
		var RL = new RegExp('(?:' + OPEN + ')\\s*(' + ATOM + '*?)\\s*(' + REL + ')\\s*x\\s*' + REL + '\\s*(' + ATOM + '*?)\\s*(?:' + CLOSE + ')');
		var rl = RL.exec(expr);
		if (rl) {
			if (/ge/.test(rl[2])) {
				hi = evalConst(rl[1], x1);
				lo = evalConst(rl[3], x0);
			} else {
				lo = evalConst(rl[1], x0);
				hi = evalConst(rl[3], x1);
			}
			expr = expr.replace(rl[0], '');
		}

		/* 因变量区间 a\le y\le b (竖直直线的范围) */
		var ylo = null, yhi = null;
		var RY = new RegExp('(?:' + OPEN + ')\\s*(' + ATOM + '*?)\\s*' + REL + '\\s*y\\s*' + REL + '\\s*(' + ATOM + '*?)\\s*(?:' + CLOSE + ')');
		var ry = RY.exec(expr);
		if (ry) {
			ylo = evalConst(ry[1], null);
			yhi = evalConst(ry[2], null);
			expr = expr.replace(ry[0], '');
		}
		expr = normDelims(expr.trim());

		/* 点 */
		if (/^\(/.test(expr)) {
			var pt = parsePoint(expr);
			if (pt) {
				var cx = evalAt(pt.x, 0);
				var cy = evalAt(pt.y, 0);
				if (isFinite(cx) && isFinite(cy)) {
					curves.push({
						kind: 'point', x: cx, y: cy, label: style.label,
						color: style.color, dashed: style.dashed
					});
					continue;
				}
			}
			fail('点解析失败: ' + expr);
			continue;
		}

		/* x = 常数 */
		var mvert = /^x\s*=\s*(.+)$/.exec(expr);
		if (mvert) {
			var vfn = compileExpr(texToExpr(mvert[1]));
			var vx2 = vfn ? evalAt(vfn, 0) : NaN;
			if (isFinite(vx2)) {
				curves.push({
					kind: 'vline', x: vx2, dashed: style.dashed, label: style.label,
					ya: ylo === null ? y0 : ylo, yb: yhi === null ? y1 : yhi
				});
				continue;
			}
			fail('竖直线解析失败: ' + expr);
			continue;
		}

		/* y = f(x); 没写 "y=" 的(Desmos 里就是隐式方程 y=…) 也当函数处理 */
		var body2 = expr.replace(/^y\s*=\s*/, '');
		var converted = texToExpr(body2);
		var fn = compileExpr(converted);
		if (!fn) { fail('式子解析失败: ' + expr + '  ->  ' + converted); continue; }
		curves.push({
			kind: 'fn', fn: fn, lo: Math.max(lo, x0), hi: Math.min(hi, x1),
			dashed: style.dashed, label: style.label, color: style.color
		});
	}

	/* 画曲线 */
	var N = 900;
	if (dropped) return null;      /* 有画不出来的元素就整块退回代码显示, 免得图是残缺的 */
	for (i = 0; i < curves.length; i++) {
		var c = curves[i];
		var dash = c.dashed ? ' stroke-dasharray="7 5"' : '';

		if (c.kind === 'point') {
			shapes.push('<circle cx="' + px(c.x).toFixed(1) + '" cy="' + py(c.y).toFixed(1)
				+ '" r="3" fill="currentColor"/>');
			if (c.label) {
				shapes.push(label(c.label, px(c.x) + 6, py(c.y) - 6));
			}
			continue;
		}

		if (c.kind === 'vline') {
			var ya = c.ya === undefined ? y0 : c.ya;
			var yb = c.yb === undefined ? y1 : c.yb;
			shapes.push('<line x1="' + px(c.x).toFixed(1) + '" y1="' + py(ya).toFixed(1)
				+ '" x2="' + px(c.x).toFixed(1) + '" y2="' + py(yb).toFixed(1)
				+ '" stroke="currentColor" stroke-width="1.6" stroke-dasharray="6 4"/>');
			if (c.label) shapes.push(label(c.label, px(c.x) + 6, py(yb) - 6));
			continue;
		}

		/* 点到 x 轴的虚线与点本身 */
		if (c.kind === 'point') {
			shapes.push('<circle cx="' + px(c.x).toFixed(1) + '" cy="' + py(c.y).toFixed(1)
				+ '" r="3.2" fill="currentColor"/>');
			if (c.label) shapes.push(label(c.label, px(c.x) + 7, py(c.y) - 7));
			continue;
		}

		var d = '';
		var pen = false;
		var jump = (c.hi - c.lo) / N * 6;
		var prevY = null;
		var span2 = y1 - y0;
		for (j = 0; j <= N; j++) {
			var xv = c.lo + (c.hi - c.lo) * j / N;
			var yv = evalAt(c.fn, xv);
			/* 超出画布太多的点直接断开, 不要画到屏幕外面去 */
			if (!isFinite(yv) || yv < y0 - span2 || yv > y1 + span2) {
				pen = false;
				prevY = null;
				continue;
			}
			if (prevY !== null && Math.abs(yv - prevY) > span2 * 0.6) pen = false;
			var cx2 = px(xv).toFixed(1);
			var cy2 = py(yv).toFixed(1);
			if (!pen) { d += 'M' + cx2 + ' ' + cy2; pen = true; } else { d += 'L' + cx2 + ' ' + cy2; }
			prevY = yv;
		}
		if (d) {
			shapes.push('<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.8"'
				+ dash + ' stroke-linejoin="round"/>');
		}
		if (c.label) {
			var lx = px((c.lo + c.hi) / 2);
			var ly = py(evalAt(c.fn, (c.lo + c.hi) / 2));
			if (isFinite(ly)) shapes.push(label(c.label, lx + 6, ly - 8));
		}
	}

	function label(raw, x, y) {
		var txt = prettyText(raw);
		return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1)
			+ '" font-size="12" fill="currentColor" fill-opacity=".85">'
			+ esc(txt) + '</text>';
	}

	function niceStep(raw) {
		var v = Math.abs(raw) || 1;
		var e = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
		var m = v / e;
		var s = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
		return s * e;
	}

	return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H
		+ '" role="img" aria-label="函数图像" xmlns="http://www.w3.org/2000/svg">'
		+ shapes.join('') + '</svg>';
}

Markdown.prototype.code = function (lang, body) {
	if (lang === 'desmos-graph') {
		var svg = null;
		try { svg = renderGraph(body); } catch (e) { svg = null; }
		if (svg) return '<div class="graph-block">' + svg + '</div>';
		return '<div class="graph-block"><pre><code>' + esc(body) + '</code></pre></div>';
	}
	return '<pre><code>' + esc(body) + '</code></pre>';
};

Markdown.prototype.htmlBlock = function (text) {
	var self = this;
	return text.split('\n').map(function (l) {
		return /^\s*</.test(l) ? l : self.inline(l);
	}).join('\n');
};

Markdown.prototype.table = function (headLine, sepLine, bodyRows) {
	var self = this;
	function cells(line) {
		var t = String(line).trim();
		t = t.replace(/^\|/, '').replace(/\|$/, '');
		return t.split('|').map(function (c) { return c.trim(); });
	}
	var head = cells(headLine);
	var aligns = cells(sepLine).map(function (c) {
		if (/^:-+:$/.test(c)) return ' style="text-align:center"';
		if (/^-+:$/.test(c)) return ' style="text-align:right"';
		if (/^:-+$/.test(c)) return ' style="text-align:left"';
		return '';
	});
	var html = '<div class="table-wrap"><table><thead><tr>';
	head.forEach(function (c, idx) {
		html += '<th' + (aligns[idx] || '') + '>' + self.inline(c) + '</th>';
	});
	html += '</tr></thead><tbody>';
	(bodyRows || []).forEach(function (r) {
		var cs = cells(r);
		html += '<tr>';
		for (var k = 0; k < head.length; k++) {
			html += '<td' + (aligns[k] || '') + '>' + self.inline(cs[k] || '') + '</td>';
		}
		html += '</tr>';
	});
	return html + '</tbody></table></div>';
};

/* 一段文字里是否有没配对的 $$ */
function oddDisplay(s) {
	var n = 0;
	var i = 0;
	while (i < s.length) {
		if (s.charAt(i) === '\\') { i += 2; continue; }
		if (s.substr(i, 2) === '$$') { n++; i += 2; continue; }
		i++;
	}
	return n % 2 === 1;
}

/* 列表: 支持嵌套、有序/无序、任务清单、多段条目 */
Markdown.prototype.list = function (blk) {
	var self = this;
	var lines = blk.split('\n');
	var idx = 0;

	function marker(line) {
		var m = /^([ \t]*)([-+*]|\d{1,9}[.)])([ \t]+)/.exec(line);
		if (!m) return null;
		return {
			indent: m[1].replace(/\t/g, '    ').length,
			ordered: /\d/.test(m[2]),
			width: m[0].length
		};
	}

	function indentOf(line) {
		return line.length - line.replace(/^[ \t]+/, '').length;
	}

	/* 收集一个条目的原始行(不含标记本身) */
	function takeItem(indent, width) {
		var body = [lines[idx].slice(width)];
		idx++;
		while (idx < lines.length) {
			var l = lines[idx];
			if (!l.trim()) {
				/* 空行后若还有更深缩进的内容, 则属于同一个条目 */
				var blank = 0;
				while (idx + blank < lines.length && !lines[idx + blank].trim()) blank++;
				var nx = idx + blank < lines.length ? lines[idx + blank] : null;
				if (nx && (!marker(nx) || marker(nx).indent > indent) && indentOf(nx) > indent) {
					body.push('');
					idx = idx + blank;
					continue;
				}
				break;
			}
			var mk = marker(l);
			if (mk && mk.indent <= indent) break;
			var ind = indentOf(l);
			if (ind > indent) {
				body.push(l.slice(Math.min(ind, indent + 2)));
				idx++;
				continue;
			}
			/* 同层懒续行 */
			body.push(l.trim());
			idx++;
		}
		return body.join('\n');
	}

	function parseList(indent, ordered) {
		var tag = ordered ? 'ol' : 'ul';
		var res = '<' + tag + '>';
		while (idx < lines.length) {
			/* 条目之间夹着的空行不算列表结束 */
			var look = idx;
			while (look < lines.length && !lines[look].trim()) look++;
			var mk = marker(lines[look] || '');
			if (!mk || mk.indent !== indent) break;
			idx = look;

			var body = takeItem(indent, mk.width);
			var task = /^\[([ xX])\]\s+/.exec(body);
			var html;

			if (task) {
				html = (task[1].toLowerCase() === 'x' ? '☑ ' : '☐ ')
					+ self.inline(body.slice(task[0].length));
			} else {
				var parts = body.split('\n');
				var head = [];
				var rest = [];
				var k = 0;
				for (; k < parts.length; k++) {
					var p = parts[k];
					if (!p.trim()) { if (head.length) break; else continue; }
					if (/^\s*(?:[-+*]|\d{1,9}[.)])\s+/.test(p)
						|| /^\s*#{1,6}\s+/.test(p) || /^\s*>/.test(p) || /^\s*```/.test(p)
						|| /^\s*\$\$/.test(p) || /^\s*\|/.test(p)) break;
					head.push(p.trim());
				}
				rest = parts.slice(k);
				/* head 里如果开了 $$ 却没关, 把那一行交给 render, 免得公式被 inline 拆坏 */
				var guard2 = 0;
				while (head.length && oddDisplay(head.join('\n')) && guard2++ < 200) {
					rest.unshift(head.pop());
				}
				html = self.inline(head.join('\n'));
				if (rest.join('').trim()) html += self.render(rest.join('\n'));
			}

			res += '<li>' + html + '</li>';
		}
		return res + '</' + tag + '>';
	}

	var first = marker(lines[0]);
	return parseList(first ? first.indent : 0, !!(first && first.ordered));
};

/* ------------------------------------------------------------ 公式渲染 */

function hydrateMath(container) {
	var Walker = doc.defaultView && doc.defaultView.NodeFilter;
	if (!container || !Walker || typeof doc.createTreeWalker !== 'function') return;

	var textNodes = [];
	var walker = doc.createTreeWalker(container, Walker.SHOW_TEXT, null);
	var node;
	while ((node = walker.nextNode())) {
		var p = node.parentNode;
		var bad = false;
		while (p && p !== container) {
			if (p.nodeType === 1 && (p.tagName === 'CODE' || p.tagName === 'PRE'
				|| p.classList.contains('math'))) { bad = true; break; }
			p = p.parentNode;
		}
		if (!bad && node.nodeValue && node.nodeValue.indexOf('$') >= 0) textNodes.push(node);
	}

	textNodes.forEach(function (tn) {
		var frag = mathFrag(tn.nodeValue);
		if (frag) tn.parentNode.replaceChild(frag, tn);
	});

	function makeMath(tex, display) {
		var span = doc.createElement('span');
		span.className = display ? 'math math-display' : 'math math-inline';
		span.setAttribute('data-tex', tex);
		if (window.katex && typeof window.katex.render === 'function') {
			try {
				window.katex.render(tex, span, {
					displayMode: !!display,
					throwOnError: true,
					errorColor: 'inherit'
				});
				return span;
			} catch (e) { /* 原文有笔误, 退回原样显示 */ }
		}
		span.className = display ? 'math math-display math-raw' : 'math math-inline math-raw';
		span.textContent = (display ? '$$' : '$') + tex + (display ? '$$' : '$');
		return span;
	}

	/* KaTeX 是 defer 加载的, 加载完成后把它换成真正的公式排版 */
	function upgrade() {
		if (!window.katex || typeof window.katex.render !== 'function') return;
		var list = container.querySelectorAll('span.math[data-tex]:not([data-katex])');
		for (var i = 0; i < list.length; i++) {
			var el2 = list[i];
			var tex = el2.getAttribute('data-tex');
			var display = el2.getAttribute('data-display') === '1';
			try {
				window.katex.render(tex, el2, {
					displayMode: display,
					throwOnError: true,
					errorColor: 'inherit'
				});
				el2.setAttribute('data-katex', '1');
			} catch (e) {
				/* 渲染不了就保持 LaTeX 原文, 不要显示红色的报错 */
				el2.className = (display ? 'math math-display' : 'math math-inline') + ' math-raw';
				el2.textContent = (display ? '$$' : '$') + tex + (display ? '$$' : '$');
				el2.setAttribute('data-katex', 'raw');
			}
		}
	}

	upgrade();
	window.addEventListener('load', upgrade);
	window.setTimeout(upgrade, 1500);
	window.setTimeout(upgrade, 4000);

	function mathFrag(text) {
		var frag = doc.createDocumentFragment();
		var i = 0;
		var hit = false;
		while (i < text.length) {
			var ch = text.charAt(i);
			if (ch !== '$') { frag.appendChild(doc.createTextNode(ch)); i++; continue; }

			/* 统计连续 $ 的个数(考虑反斜杠转义) */
			var j = i;
			while (j < text.length && text.charAt(j) === '$') j++;
			var k = j;
			while (k < text.length && text.charAt(k) !== '$') k++;
			var next = k < text.length ? text.charAt(k) : '';
			var run = j - i;

			/* 规范写法里 $ 与公式内容之间没有空格, 否则视为普通字符 */
			if (/\s/.test(text.charAt(j)) || (next && /\s/.test(next))) {
				frag.appendChild(doc.createTextNode(text.slice(i, j)));
				i = j;
				continue;
			}

			var display = run >= 2;
			var delim = display ? '$$' : '$';

			var closeAt = text.indexOf(delim, j);
			if (closeAt < 0) {
				frag.appendChild(doc.createTextNode(text.slice(i, j)));
				i = j;
				continue;
			}
			var tex = text.slice(j, closeAt);
			if (!tex.trim()) {
				frag.appendChild(doc.createTextNode(text.slice(i, j)));
				i = j;
				continue;
			}
			frag.appendChild(makeMath(tex, display));
			i = closeAt + delim.length;
			hit = true;
		}
		return hit ? frag : null;
	}
}

/* ------------------------------------------------------------ 页面装配 */

function setStatus(msg) {
	var el = doc.getElementById('content');
	if (el) el.innerHTML = '<p class="status">' + esc(msg) + '</p>';
}

function renderMarkdown(mdPath, text, into, withTitle) {
	var PAGE = pageInfo();
	var body = String(text);
	/* 每篇正文顶部自动补一个一级标题(文章名), 本来就以 # 开头的就不再补 */
	if (withTitle && !/^\s*#\s+/.test(body)) {
		body = '# ' + mdPath.split('/').pop().replace(/\.md$/i, '') + '\n\n' + body;
	}
	var html = new Markdown({
		dir: dirOf(mdPath),
		file: mdPath,
		subject: PAGE && PAGE.currentSubject ? PAGE.currentSubject : '',
		folder: PAGE && PAGE.currentFolder ? PAGE.currentFolder : null
	}).render(body);
	into.innerHTML = html;
	hydrateMath(into);
}

/* 上一篇 / 下一篇 */
function buildPager(mdPath) {
	var SITE = site();
	var list = (SITE && SITE.articles) || [];
	var idx = -1;
	var i;
	for (i = 0; i < list.length; i++) {
		if (list[i].url === mdPath.replace(/\.md$/i, '.html')) { idx = i; break; }
	}
	if (idx < 0) return null;

	var nav = el('nav', 'pager');
	var prev = idx > 0 ? list[idx - 1] : null;
	var next = idx < list.length - 1 ? list[idx + 1] : null;

	if (prev) {
		var a = el('a', 'prev', '← 上一篇: ' + prev.title);
		a.href = root + encPath(prev.url);
		nav.appendChild(a);
	} else {
		nav.appendChild(el('span', 'prev none', '← 已经是第一篇'));
	}
	if (next) {
		var b = el('a', 'next', '下一篇: ' + next.title + ' →');
		b.href = root + encPath(next.url);
		nav.appendChild(b);
	} else {
		nav.appendChild(el('span', 'next none', '已经是最后一篇 →'));
	}
	return nav;
}

/* 某个专题的第一篇文章(用于没有说明文件的专题) */
function firstArticle(SITE, subjectName) {
	var list = (SITE && SITE.articles) || [];
	for (var i = 0; i < list.length; i++) {
		if (list[i].subject === subjectName) {
			return {
				title: list[i].title,
				md: list[i].url.replace(/\.html$/i, '.md')
			};
		}
	}
	return null;
}

function boot() {
	var PAGE = pageInfo();
	if (!site() || !PAGE) { setStatus('没有找到站点数据文件 site-data.js。'); return; }

	indexArticles();
	initSidebar();

	var page = doc.body.getAttribute('data-page');
	var content = doc.getElementById('content');
	if (!content) return;

	if (page === 'subject') {
		var sub = PAGE.subject;
		if (!sub) { setStatus('没有找到这个专题。'); return; }
		doc.title = site().title + ' | ' + sub.name;
		if (sub.doc) {
			setStatus('正在加载…');
			fetch(root + encPath(sub.doc)).then(function (r) {
				if (!r.ok) throw new Error('HTTP ' + r.status);
				return r.text();
			}).then(function (text) {
				content.innerHTML = '<p class="doc-title">' + esc(sub.name) + ' · 专题说明</p>';
				var box = doc.createElement('div');
				content.appendChild(box);
				renderMarkdown(sub.doc, text, box);
			}).catch(function (e) {
				setStatus('无法加载专题说明 (' + e.message + ')。');
			});
		} else {
			/* 专题没有说明文件: 直接把第一篇当正文显示 */
			var first = firstArticle(site(), sub.name);
			if (first) {
				doc.title = site().title + ' | ' + first.title;
				setStatus('正在加载文章…');
				fetch(root + encPath(first.md)).then(function (r) {
					if (!r.ok) throw new Error('HTTP ' + r.status);
					return r.text();
				}).then(function (text) {
					var box = doc.createElement('div');
					renderMarkdown(first.md, text, box, true);
					content.innerHTML = '';
					content.appendChild(box);
					var pager = buildPager(first.md);
					if (pager) content.appendChild(pager);
				}).catch(function (e) {
					setStatus('无法加载文章 (' + e.message + ')。');
				});
			} else {
				setStatus('这个专题还没有文章。');
			}
		}
		return;
	}

	if (page === 'article') {
		var md = doc.body.getAttribute('data-md');
		if (!md) { setStatus('没有指定文章文件。'); return; }
		var title = md.split('/').pop().replace(/\.md$/i, '');
		doc.title = site().title + ' | ' + title;
		setStatus('正在加载文章…');
		fetch(root + encPath(md)).then(function (r) {
			if (!r.ok) throw new Error('HTTP ' + r.status);
			return r.text();
		}).then(function (text) {
			var box = doc.createElement('div');
			renderMarkdown(md, text, box, true);
			content.innerHTML = '';
			content.appendChild(box);

			var pager = buildPager(md);
			if (pager) content.appendChild(pager);

			goHash();
		}).catch(function (e) {
			setStatus('无法加载文章 ' + md + ' (' + e.message + ')。');
		});
	}
}

/* 跳到 #锚点: 先按原样找, 再用和标题同样的规则归一化后找, 最后看别名 */
function goHash() {
	var hash = doc.location.hash;
	if (!hash) return;
	var key = decodeURIComponent(hash.slice(1));
	var target = doc.getElementById(key);

	if (!target) {
		var Probe = new Markdown({ dir: '', subject: '' });
		var want = Probe.slugText(key);
		if (want) {
			target = doc.getElementById(want)
				|| doc.getElementById(slugRegistry[key] || '');
		}
	}
	if (!target) {
		var list = doc.querySelectorAll('h1[data-alias],h2[data-alias],h3[data-alias],h4[data-alias],h5[data-alias],h6[data-alias]');
		for (var i = 0; i < list.length; i++) {
			if ((' ' + list[i].getAttribute('data-alias') + ' ').indexOf(' ' + key + ' ') >= 0) {
				target = list[i];
				break;
			}
		}
	}
	if (target && target.scrollIntoView) target.scrollIntoView();
}

window.addEventListener('hashchange', function () { window.setTimeout(goHash, 60); });

/* 等数据脚本(site-data.js / 页面内联的 window.PAGE)就绪再渲染 */
function waitForSite(deadline) {
	if (site() && pageInfo()) { boot(); return; }
	if (Date.now() > deadline) {
		setStatus('没有找到站点数据文件 site-data.js。');
		return;
	}
	window.setTimeout(function () { waitForSite(deadline); }, 50);
}

function start() {
	initTheme();
	waitForSite(Date.now() + 4000);
}

if (doc.readyState === 'loading') {
	doc.addEventListener('DOMContentLoaded', start);
} else {
	start();
}

/* 供构建脚本自检使用 */
window.Markdown = Markdown;

})();
