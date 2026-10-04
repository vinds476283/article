const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.argv[2] || 'http://127.0.0.1:8766';

const pages = [
	['站点主页', '/'],
	['专题主页', '/article/%E9%AB%98%E4%B8%AD%E6%95%B0%E5%AD%A6%E7%AC%94%E8%AE%B0/index.html'],
	['文章(含公式)', '/article/%E9%AB%98%E4%B8%AD%E6%95%B0%E5%AD%A6%E7%AC%94%E8%AE%B0/1.%20%E5%88%86%E6%9E%90/(1)%20%E6%B3%B0%E5%8B%92%E5%B1%95%E5%BC%80%20&%20%E9%BA%A6%E5%85%8B%E5%8A%B3%E6%9E%97%E5%85%AC%E5%BC%8F%20&%20%E6%8B%89%E6%A0%BC%E6%9C%97%E6%97%A5%E4%BD%99%E9%A1%B9%E5%AE%9A%E7%90%86.html'],
	['文章(含图片)', '/article/%E9%AB%98%E4%B8%AD%E6%95%B0%E5%AD%A6%E7%AC%94%E8%AE%B0/1.%20%E5%88%86%E6%9E%90/(3)%C2%B0%20%E6%B1%82%E6%9E%81%E9%99%90.html']
];

for (const [name, p] of pages) {
	let dom = '';
	try {
		dom = execFileSync(EDGE, [
			'--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
			'--user-data-dir=' + path.join(process.env.TEMP, 'dsh-edge-profile'),
			'--virtual-time-budget=9000', '--dump-dom', BASE + p
		], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
	} catch (e) {
		console.log(name + ': 渲染失败 ' + e.message);
		continue;
	}
	const treeLinks = (dom.match(/<div id="sidebar-tree">[\s\S]*?<\/aside>/) || [''])[0];
	const report = {
		'导航树条目': (treeLinks.match(/<a /g) || []).length,
		'文件夹名': (treeLinks.match(/class="folder-name"/g) || []).length,
		'正文标题': (dom.match(/<h[1-6] id="/g) || []).length,
		'KaTeX 公式': (dom.match(/class="katex/g) || []).length,
		'图片': (dom.match(/<img /g) || []).length,
		'页脚': dom.includes('Copyright © 2026-present') ? 1 : 0,
		'主题按钮': dom.includes('id="theme-btn"') ? 1 : 0,
		'待加载提示': /class="status"/.test(dom) ? 1 : 0,
		'报错': /无法加载|没有找到站点/.test(dom) ? 1 : 0
	};
	console.log(name + ': ' + JSON.stringify(report, null, 0));
}
