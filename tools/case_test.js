/* 小样例自检: 检查引用块 / 公式块 / 列表 / 表格等边界情况 */
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
const Markdown = new Function(src + '\nreturn Markdown;')();

const cases = [
	['引用块内的公式块', '>使用二级结论, \n>$$\\begin{align*}\na&=1,\\\\\nb&=2.\n\\end{align*}$$\n>其中 $x$, 于是\n'],
	['引用块', '>第一行\n>第二行\n\n普通段落\n'],
	['引用块含列表', '>要注意:\n>1. 甲\n>2. 乙\n>\n>结束\n'],
	['嵌套列表', '1. 第一条\n   - 子项甲\n   - 子项乙\n2. 第二条\n'],
	['列表多段', '- 第一段\n\n  第二段\n- 下一项\n'],
	['表格', '| 甲 | 乙 |\n|:--|--:|\n| 1 | 2 |\n'],
	['公式块', '前文\n\n$$a=b$$\n\n后文\n'],
	['内联公式', '设 $x=1$, 则 $y=2$.\n'],
	['双链', '见[[(2) 习题答案#(3)° 求极限]]与[[(6)° 不等式]].\n'],
	['图片', '![[极限的定义.jpg]]\n'],
	['代码块', '```js\nvar a = 1;\n```\n'],
	['HTML 块', '<div align="right">\n铟子vinds<br />2026 年\n</div>\n'],
	['分割线', '甲\n\n---\n\n乙\n'],
	['强调', '这是 **加粗**, 这是 *斜体*, 这是 `代码`.\n'],
	['未闭合加粗', '**(2026广东质检) 已知函数 $f(x)=1$.\n'],
	['列表内公式块', '- 甲\n  $$a=b$$\n- 乙\n']
];

for (const [name, text] of cases) {
	const md = new Markdown({ dir: '', subject: '测试' });
	const html = md.render(text);
	console.log('### ' + name + '\n' + html.replace(/></g, '>\n<') + '\n');
}
