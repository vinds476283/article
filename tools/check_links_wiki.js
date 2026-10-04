/* 检查所有双链的目标文件与 #小节 锚点是否存在 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);
const ART = path.join(ROOT, 'article');
const src = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8')
	.replace('(function () {', '')
	.replace(/\}\)\(\);\s*$/, '');
global.window = { matchMedia: () => ({ matches: false }), katex: null, setTimeout: () => 0, addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = {
	documentElement: { getAttribute: () => '', setAttribute: () => {} },
	getElementById: () => null, addEventListener: () => {}, body: { getAttribute: () => '' }
};
const M = new Function(src + '\nreturn Markdown;')();

/* 收集 md 文件 */
const mds = [];
(function walk(dir) {
	for (const f of fs.readdirSync(dir)) {
		const full = path.join(dir, f);
		if (fs.statSync(full).isDirectory()) walk(full);
		else if (f.endsWith('.md')) mds.push(full);
	}
})(ART);

const byTitle = {};      // 文件名(不含 .md) -> 文件
const anchors = {};      // 文件 -> Set(锚点 + 别名)

function collectAnchors(file) {
	const text = fs.readFileSync(file, 'utf8');
	const set = new Set();
	const re = /^[ \t]{0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/gm;
	let m;
	while ((m = re.exec(text))) {
		const md2 = new M({ dir: '', subject: '' });
		const primary = md2.slug(m[2].replace(/[*_`]/g, ''));
		set.add(primary);
		const md3 = new M({ dir: '', subject: '' });
		md3.slugAliases(m[2].replace(/[*_`]/g, '')).forEach((a) => set.add(a));
	}
	return set;
}

for (const f of mds) {
	const title = path.basename(f, '.md');
	if (!byTitle[title]) byTitle[title] = f;
	anchors[f] = collectAnchors(f);
}

let links = 0, badFile = 0, badAnchor = 0;
const report = [];
for (const f of mds) {
	const text = fs.readFileSync(f, 'utf8');
	/* 跳过 ![[图片]] 这种图片引用 */
	const withoutImages = text.replace(/!\[\[[^\]]*\]\]/g, '');
	const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
	let m;
	while ((m = re.exec(withoutImages))) {
		const target = m[1].trim();
		const [page, hash] = target.split('#');
		links++;
		const targetFile = byTitle[(page || '').trim()] || f;
		if (page && !byTitle[page.trim()]) {
			badFile++;
			report.push('文件不存在: [[' + target + ']]  (在 ' + path.basename(f) + ')');
			continue;
		}
		if (hash) {
			const md2 = new M({ dir: '', subject: '' });
			const want = md2.slug(hash.trim());
			const md3 = new M({ dir: '', subject: '' });
			const aliasWant = md3.slugAliases(hash.trim());
			const ok = anchors[targetFile].has(want)
				|| aliasWant.some((a) => anchors[targetFile].has(a));
			if (!ok) {
				badAnchor++;
				report.push('锚点不存在: [[' + target + ']]  需要 #' + want
					+ '  (在 ' + path.basename(f) + ' -> ' + path.basename(targetFile) + ')');
			}
		}
	}
}
console.log('共 ' + links + ' 个双链: 文件缺失 ' + badFile + ', 锚点缺失 ' + badAnchor);
report.forEach((r) => console.log('  !! ' + r));
