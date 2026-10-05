/* 校验: 每个页面里 brand / navlink / sidebar-home / PAGE.home 都指向文章站主页 */
'use strict';
const fs = require('fs');
const path = require('path');
const posix = path.posix;
const ROOT = path.dirname(__dirname);

let n = 0, bad = 0;
(function walk(dir) {
	for (const f of fs.readdirSync(dir)) {
		const full = path.join(dir, f);
		if (fs.statSync(full).isDirectory()) {
			if (f === 'tools' || f === '.git') continue;
			walk(full);
		} else if (f.endsWith('.html')) {
			n++;
			const rel = path.relative(ROOT, full).replace(/\\/g, '/');
			const text = fs.readFileSync(full, 'utf8');
			const dataRoot = (/data-root="([^"]*)"/.exec(text) || [])[1];
			const brand = (/<a class="brand" href="([^"]*)"/.exec(text) || [])[1];
			const nav = (/<a class="navlink" href="([^"]*)"/.exec(text) || [])[1];
			const side = (/<p class="side-home"><a id="sidebar-home" href="([^"]*)"/.exec(text) || [])[1];
			const ph = (/"home": "([^"]*)"/.exec(text) || [])[1];

			/* 每个链接都解析成"从站点根开始"的路径, 应当都是 index.html */
			var pageDir = posix.dirname(rel);
			function resolve(href) {
				if (href === undefined) return '(无)';
				if (href.startsWith('/')) return href.slice(1);
				return posix.normalize(posix.join(pageDir, href));
			}
			const targets = {
				brand: resolve(brand),
				navlink: resolve(nav),
				sidebarHome: resolve(side),
				pageHome: resolve(ph)
			};
			var wrong = Object.keys(targets).filter((k) => targets[k] !== '(无)' && targets[k] !== 'index.html');
			if (wrong.length) {
				bad++;
				console.log('!! ' + rel + '  ->  ' + JSON.stringify(targets));
			} else if (n <= 3) {
				console.log('  ' + rel + '  ->  ' + JSON.stringify(targets));
			}
		}
	}
})(ROOT);
console.log('检查 ' + n + ' 个页面, 有问题的 ' + bad);
