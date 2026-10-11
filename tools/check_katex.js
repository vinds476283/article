/* 下载 KaTeX 并检查笔记里所有公式是否能正常渲染 */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.dirname(__dirname);
const CACHE = path.join(process.env.TEMP, 'katex-check');

function download(url, file) {
	return new Promise((resolve, reject) => {
		https.get(url, (res) => {
			if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); return; }
			const chunks = [];
			res.on('data', (c) => chunks.push(c));
			res.on('end', () => {
				fs.mkdirSync(path.dirname(file), { recursive: true });
				fs.writeFileSync(file, Buffer.concat(chunks));
				resolve(file);
			});
		}).on('error', reject);
	});
}

(async () => {
	const katexFile = path.join(CACHE, 'katex.min.js');
	if (!fs.existsSync(katexFile) || fs.statSync(katexFile).size < 100000) {
		console.log('下载 katex…');
		await download('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js', katexFile);
	}
	const katex = require(katexFile);
	console.log('KaTeX ' + katex.version);

	/* mhchem 扩展提供 \ce{} / \pu{}, 页面里也是加载它的, 这里要保持一致。
	   它是 UMD 包, 在 Node 里会去 require("katex"), 所以给它一个假的 require。 */
	const mhchemFile = path.join(CACHE, 'mhchem.min.js');
	if (!fs.existsSync(mhchemFile) || fs.statSync(mhchemFile).size < 1000) {
		console.log('下载 mhchem…');
		await download('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/mhchem.min.js', mhchemFile);
	}
	global.window = global.window || {};
	global.window.katex = katex;
	const fakeRequire = function (name) {
		if (name === 'katex') return katex;
		return require(name);
	};
	new Function('window', 'katex', 'require', 'module', 'exports',
		fs.readFileSync(mhchemFile, 'utf8'))(global.window, katex, fakeRequire, { exports: {} }, {});
	try {
		katex.__parse('\\ce{Ti}', { throwOnError: true });
		console.log('mhchem 扩展已加载');
	} catch (e) {
		console.log('!! mhchem 扩展加载失败: ' + e.message);
	}

	/* 用渲染器自己的逻辑取出公式, 再逐个用 KaTeX 检查 */
	const src = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8')
		.replace('(function () {', '')
		.replace(/\}\)\(\);\s*$/, '');
	global.window = {
		matchMedia: () => ({ matches: false }), katex: null, setTimeout: () => 0,
		addEventListener: () => {}
	};
	global.localStorage = { getItem: () => null, setItem: () => {} };
	global.document = {
		documentElement: { getAttribute: () => '', setAttribute: () => {} },
		getElementById: () => null, addEventListener: () => {}, body: { getAttribute: () => '' }
	};
	const M = new Function(src + '\nreturn Markdown;')();

	const files = [];
	(function walk(dir) {
		for (const f of fs.readdirSync(dir)) {
			const full = path.join(dir, f);
			if (fs.statSync(full).isDirectory()) walk(full);
			else if (f.endsWith('.md')) files.push(full);
		}
	})(path.join(ROOT, 'article'));

	let total = 0, badCount = 0;
	const bad = {};
	const allBad = [];
	const SPAN = /<span class="math[^"]*" data-tex="([^"]*)" data-display="(\d)"/g;
	for (const file of files) {
		const rel = path.relative(ROOT, file);
		const text = fs.readFileSync(file, 'utf8');
		const md = new M({ dir: '', subject: '高中数学笔记' });
		const html = md.render(text);
		let m;
		while ((m = SPAN.exec(html))) {
			const tex = m[1]
				.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"');
			total++;
			try {
				katex.__parse(tex, { displayMode: m[2] === '1', throwOnError: true, strict: false });
			} catch (e) {
				badCount++;
				allBad.push({ file: rel, tex: tex, err: e.message });
				const key = e.message;
				bad[key] = bad[key] || { count: 0, samples: [] };
				bad[key].count++;
				if (bad[key].samples.length < 10) {
					bad[key].samples.push({ file: rel, tex: tex.slice(0, 160) });
				}
			}
		}
		SPAN.lastIndex = 0;
	}
	console.log('\n渲染器产出 ' + total + ' 个公式, ' + badCount + ' 个会报错\n');
	Object.keys(bad).forEach((k) => {
		console.log('### ' + k + '  (x' + bad[k].count + ')');
		bad[k].samples.forEach((s) => console.log('   ' + s.file + '  ::  ' + JSON.stringify(s.tex)));
	});
	if (process.argv[2] === '--all') {
		console.log('\n=== 全部明细 ===');
		allBad.forEach((s) => console.log(s.file + '  ::  ' + JSON.stringify(s.tex.slice(0, 220))));
	}
})();
