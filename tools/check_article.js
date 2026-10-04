/* 检查某一篇的渲染结果: 有没有残留的 $$ / align 结构 */
'use strict';
const fs = require('fs');
const path = require('path');

global.window = {
	matchMedia: () => ({ matches: false }),
	katex: null,
	setTimeout: () => 0,
	addEventListener: () => {}
};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = {
	documentElement: { getAttribute: () => '', setAttribute: () => {} },
	getElementById: () => null,
	addEventListener: () => {},
	body: { getAttribute: () => '' }
};

const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8')
	.replace('(function () {', '')
	.replace(/\}\)\(\);\s*$/, '');
const Markdown = new Function(src + '\nreturn Markdown;')();

const rel = process.argv[2];
const text = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const md = new Markdown({ dir: '', subject: '高中数学笔记' });
const html = md.render(text);

/* 找出正文里露在外面的 TeX 痕迹 */
const plain = html
	.replace(/<span class="math[\s\S]*?<\/span>/g, ' MATH ')
	.replace(/<[^>]*>/g, '\u0000');
const marks = [
	[/\$\$/, '$$ 残留'], [/\\end\{align\*\}/, 'align 残留'], [/\\begin\{/, 'begin 残留'],
	[/\\dfrac|\\left|\\right|\\sin|\\cos|\\dfrac/, 'TeX 命令残留']
];
let bad = 0;
for (const [re, name] of marks) {
	const m = re.exec(plain);
	if (m) {
		bad++;
		console.log('!! ' + name + ': ' + JSON.stringify(plain.slice(Math.max(0, m.index - 80), m.index + 80)));
	}
}
console.log(bad ? '发现 ' + bad + ' 处' : '没有残留');
console.log('公式块数: ' + (html.match(/math-display/g) || []).length
	+ ', 行内公式: ' + ((html.match(/class="math /g) || []).length));
