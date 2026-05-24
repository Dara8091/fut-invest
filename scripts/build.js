const { minify } = require('html-minifier-terser');
const { transform } = require('lightningcss');
const Terser = require('terser');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');

async function build() {
    fs.mkdirSync(DIST, { recursive: true });

    // Minify HTML
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const minHtml = await minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true,
        removeOptionalTags: true,
    });
    fs.writeFileSync(path.join(DIST, 'index.html'), minHtml);

    // Minify CSS
    const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    const { code } = transform({
        filename: 'style.css',
        code: Buffer.from(css),
        minify: true,
    });
    fs.writeFileSync(path.join(DIST, 'style.css'), code);

    // Minify JS
    const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    const minJs = await Terser.minify(js, { compress: { drop_console: true }, mangle: true });
    fs.writeFileSync(path.join(DIST, 'app.js'), minJs.code);

    console.log(`Build complete: ${fs.readdirSync(DIST).join(', ')}`);
}

build().catch(err => { console.error(err); process.exit(1); });
