// CDN Configuration for fut.invest
// Servir assets estáticos desde CDN con fingerprinting

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const CDN_URL = process.env.CDN_URL || '';
const ASSETS_DIR = path.resolve(__dirname, '../../public');

// Generate asset manifest with integrity hashes
function generateManifest() {
    if (!fs.existsSync(ASSETS_DIR)) return {};

    const manifest = {};
    const files = fs.readdirSync(ASSETS_DIR);

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!['.js', '.css', '.html', '.svg', '.png', '.jpg', '.ico', '.webp'].includes(ext)) continue;

        const filePath = path.join(ASSETS_DIR, file);
        const content = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha384').update(content).digest('base64');
        const versioned = file.replace(ext, `.v${Date.now()}${ext}`);

        manifest[file] = {
            versionedName: versioned,
            integrity: `sha384-${hash}`,
            size: content.length,
            type: ext.slice(1),
            cdnUrl: CDN_URL ? `${CDN_URL}/assets/${versioned}` : null,
        };
    }

    return manifest;
}

function cdnUrl(assetPath) {
    if (!CDN_URL) return assetPath;
    return `${CDN_URL}/assets/${assetPath}`;
}

module.exports = { generateManifest, cdnUrl, CDN_URL };
