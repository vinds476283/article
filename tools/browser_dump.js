const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const urls = process.argv.slice(2);
if (!urls.length) { console.error('用法: node tools/browser_dump.js <url> [...]'); process.exit(1); }

for (const url of urls) {
	const out = path.join(process.env.TEMP, 'dsh-dom-' + Date.now() + '.html');
	let dom = '';
	try {
		dom = execFileSync(EDGE, [
			'--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
			'--user-data-dir=' + path.join(process.env.TEMP, 'dsh-edge-profile'),
			'--virtual-time-budget=8000', '--dump-dom', url
		], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
	} catch (e) {
		dom = (e.stdout || '') + '\n[stderr]\n' + (e.stderr || '') + '\n[error] ' + e.message;
	}
	fs.writeFileSync(out, dom, 'utf8');
	console.log('===== ' + url + '  (' + dom.length + ' 字符) -> ' + out);

	const m = /<pre id="out">([\s\S]*?)<\/pre>/.exec(dom);
	if (m) console.log('DIAG:\n' + m[1]);

	for (const hook of ['sidebar-tree', 'class="doc"']) {
		const i = dom.indexOf(hook);
		if (i >= 0) console.log('--- ' + hook + ' 附近 ---\n' + dom.slice(Math.max(0, i - 80), i + 600));
	}
}
