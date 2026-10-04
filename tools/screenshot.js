const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const url = process.argv[2];
const png = process.argv[3];
const dark = process.argv[4] === 'dark';

const out = path.join(process.env.TEMP, 'shot-' + Date.now() + '.png');
const args = [
	'--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
	'--user-data-dir=' + path.join(process.env.TEMP, 'dsh-edge-shot'),
	'--window-size=1400,1000',
	'--virtual-time-budget=9000',
	'--screenshot=' + out,
	url
];
if (dark) args.unshift('--force-dark-mode');
execFileSync(EDGE, args, { stdio: 'ignore' });
fs.copyFileSync(out, png);
console.log('saved ' + png + ' (' + fs.statSync(png).size + ' bytes)');
