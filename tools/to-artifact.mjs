// Turns dist-single/index.html into a body fragment for claude.ai Artifact publishing
import fs from 'node:fs';
const html = fs.readFileSync('dist-single/index.html', 'utf8');
const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
const title = head.match(/<title>[\s\S]*?<\/title>/)[0];
const styles = head.match(/<style[\s\S]*?<\/style>/g) || [];
const scripts = head.match(/<script[\s\S]*?<\/script>/g) || [];
const out = ['<title>OnCourt Tennis Club</title>', ...styles, body, ...scripts].join('\n');
fs.mkdirSync('dist-artifact', { recursive: true });
fs.writeFileSync('dist-artifact/oncourt.html', out);
console.log('artifact fragment', (out.length / 1024).toFixed(0) + ' KB', 'scripts:', scripts.length, 'styles:', styles.length);
