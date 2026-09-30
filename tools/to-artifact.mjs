// dist/index.html → body fragment for claude.ai Artifact publishing (assets + media published alongside)
import fs from 'node:fs';
const html = fs.readFileSync('dist/index.html', 'utf8');
const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
const keep = (head.match(/<link rel="stylesheet"[^>]*>|<script type="application\/ld\+json">[\s\S]*?<\/script>|<link rel="icon"[^>]*>/g) || []);
const mods = head.match(/<script type="module"[^>]*><\/script>/g) || [];
const out = ['<title>On Court Tennis Club</title>', ...keep, body, ...mods].join('\n');
fs.mkdirSync('dist-artifact', { recursive: true });
fs.writeFileSync('dist-artifact/oncourt.html', out);
const files = {};
for (const d of ['assets', 'media']) for (const f of fs.readdirSync('dist/' + d)) files[`${d}/${f}`] = `dist/${d}/${f}`;
fs.writeFileSync('dist-artifact/files.json', JSON.stringify(files));
console.log('fragment', (out.length / 1024).toFixed(0) + 'KB', 'files', Object.keys(files).length);
