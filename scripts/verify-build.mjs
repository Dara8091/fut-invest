import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const checks = [
    { file: 'index.html', msg: 'index.html exists' },
    { file: 'style.css', msg: 'style.css exists' },
    { file: 'app.js', msg: 'app.js exists' },
    { file: 'config.js', msg: 'config.js exists' },
    { file: 'manifest.json', msg: 'manifest.json exists' },
    { file: 'service-worker.js', msg: 'service-worker.js exists' },
];

let ok = true;
for (const c of checks) {
    const exists = fs.existsSync(path.join(root, c.file));
    if (!exists) { console.error(`FAIL: ${c.file}`); ok = false; }
    else console.log(`OK: ${c.msg}`);
}

// Basic HTML structure check
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!html.includes('fut.invest')) { console.error('FAIL: HTML missing title'); ok = false; }
if (!html.includes('</html>')) { console.error('FAIL: HTML incomplete'); ok = false; }

// Basic CSS check
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
if (!css.includes('root')) { console.error('FAIL: CSS missing variables'); ok = false; }

// Basic JS check
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
if (!js.includes('addEventListener')) { console.error('FAIL: JS missing event listeners'); ok = false; }

process.exit(ok ? 0 : 1);
