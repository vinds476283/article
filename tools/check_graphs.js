/* 检查 desmos-graph 代码块是否都画成了 SVG */
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
const md = new Markdown({ dir: '', subject: 'x' });

/* 把每篇文章里的 desmos-graph 块抽出来单独渲染 */
const root = path.join(__dirname, '..');
let total = 0, ok = 0, fail = [];
for (const dir of walk(root + '/article')) {
	if (!dir.endsWith('.md')) continue;
	const text = fs.readFileSync(dir, 'utf8');
	const re = /```desmos-graph\r?\n([\s\S]*?)```/g;
	let m;
	while ((m = re.exec(text))) {
		total++;
		const html = md.code('desmos-graph', m[1]);
		const svg = /<svg[\s\S]*?<\/svg>/.exec(html);
		const paths = svg ? (svg[0].match(/<path /g) || []).length : 0;
		const bad = svg && /NaN|undefined/.test(svg[0]);
		if (svg && !bad) { ok++; }
		else {
			fail.push({ file: path.relative(root, dir), pos: m.index, reason: bad ? 'SVG 里有 NaN' : '回退成代码', first: m[1].split('\n')[0] });
		}
	}
}
console.log('desmos-graph 块: ' + total + ', 画成图: ' + ok + ', 未画: ' + (total - ok));
fail.forEach((f) => console.log('  !! ' + f.file + ' @' + f.pos + ' (' + f.reason + '): ' + f.first));

function* walk(p) {
	const st = fs.statSync(p);
	if (st.isFile()) { yield p; return; }
	for (const f of fs.readdirSync(p)) yield* walk(path.join(p, f));
}
