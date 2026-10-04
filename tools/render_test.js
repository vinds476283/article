/* 本地自检: 用 Node 直接运行 Markdown 渲染器, 检查真实文章是否渲染正常。
   用法: node tools/render_test.js "article/高中数学笔记/1. 分析/(1) 泰勒展开 & 麦克劳林公式 & 拉格朗日余项定理.md" */
'use strict';
const fs = require('fs');
const path = require('path');

global.window = {
	matchMedia: function () { return { matches: false }; },
	katex: null,
	setTimeout: function () { return 0; },
	addEventListener: function () {}
};
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };
global.document = {
	documentElement: { getAttribute: function () { return ''; }, setAttribute: function () {} },
	getElementById: function () { return null; },
	addEventListener: function () {},
	body: { getAttribute: function () { return ''; } }
};

const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8')
	.replace('(function () {', '')
	.replace(/\}\)\(\);\s*$/, '');

const factory = new Function(src + '\nreturn Markdown;');
const Markdown = factory();
global.Markdown = Markdown;

const files = process.argv.slice(2);
const dump = files[0] === '--dump';
if (dump) files.shift();
if (!files.length) {
	console.error('用法: node tools/render_test.js [--dump] <md 文件> [...]');
	process.exit(1);
}

let bad = 0;
for (const rel of files) {
	const full = path.join(__dirname, '..', rel);
	const text = fs.readFileSync(full, 'utf8');
	const md = new Markdown({
		dir: rel.slice('article/'.length).replace(/[^/]*$/, ''),
		subject: rel.split('/')[1]
	});
	const html = md.render(text);
	/* 只检查标签之间的正文, 忽略属性(如 data-tex 里的原文公式) */
	const plain = html
		.replace(/<span class="math[\s\S]*?<\/span>/g, ' MATH ')
		.replace(/<[^>]*>/g, '\u0000');
	const checks = [
		[/\$\$?[^$]*\$\$?/, '残留的 $ 公式标记'],
		[/\[\[/, '残留的双链标记'],
		[/!\[\[/, '残留的图片标记'],
		[/\*\*/, '残留的 ** 标记'],
		[/undefined/, '出现 undefined'],
		[/\[object/, '出现 [object Object]']
	];
	for (const [re, what] of checks) {
		const m = re.exec(plain);
		if (m) {
			bad++;
			const anchor = plain.slice(Math.max(0, m.index - 24), m.index).replace(/[\u0000]/g, '');
			const at = anchor ? html.indexOf(anchor.slice(-16)) : -1;
			console.log('!! ' + rel + ' -> ' + what + ': '
				+ JSON.stringify(plain.slice(Math.max(0, m.index - 40), m.index + 40)) + '\n   HTML: '
				+ JSON.stringify(at >= 0 ? html.slice(Math.max(0, at - 60), at + 200) : '(未定位)'));
		}
	}
	console.log('== ' + rel + '  html=' + html.length + ' 字符  h=' + (html.match(/<h\d/g) || []).length
		+ '  p=' + (html.match(/<p>/g) || []).length
		+ '  li=' + (html.match(/<li>/g) || []).length
		+ '  table=' + (html.match(/<table>/g) || []).length
		+ '  pre=' + (html.match(/<pre>/g) || []).length);
	if (dump) {
		const at = text.indexOf('|');
		console.log('----- 输出 -----');
		console.log(html.replace(/></g, '>\n<'));
		console.log('----- 结束 -----');
	}
}

console.log(bad ? '发现 ' + bad + ' 处问题' : '自检通过');
