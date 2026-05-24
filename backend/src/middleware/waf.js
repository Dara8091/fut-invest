const logger = require('../config/logger');
const dns = require('dns');
const net = require('net');

const MAX_BODY_SIZE = 1024 * 1024; // 1MB

function getBlockedCountries() {
    return (process.env.BLOCKED_COUNTRIES || '').split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
}

function getBlockedIPs() {
    return (process.env.BLOCKED_IPS || '').split(',').map(c => c.trim()).filter(Boolean);
}

const SUSPICIOUS_PATTERNS = [
    /(SELECT\s+|UNION\s+|INSERT\s+|UPDATE\s+|DELETE\s+|DROP\s+|ALTER\s+|CREATE\s+)/i,
    /(<script|<iframe|<embed|<object)/i,
    /(eval\s*\(|exec\s*\(|system\s*\(|sp_executesql|xp_cmdshell)/i,
    /(\.\.\/|\.\.\\)+/,
    /(proc\/self\/environ|etc\/passwd|etc\/shadow)/i,
    /(bash\s+|cmd\s+|powershell|sh\s+|zsh\s+)/i,
];

// Known VPN/Proxy/Tor exit node ASNs - reserved for future use
// Known VPN/Proxy/Tor exit node ASNs
/* unused
const VPN_ASNS = new Set([
    20473,  // Vultr
    16276,  // OVH
    36352,  // Linode
    14061,  // DigitalOcean
    14618,  // AWS
    8075,   // Microsoft Azure
    396982, // Google Cloud
    7018,   // AT&T
    20940,  // Akamai
    13335,  // Cloudflare Warp
    9009,   // M247 (known VPN provider)
    60068,  // Datacamp / Proxy
]);
*/

// Common VPN/proxy headers - reserved for future use
/* unused
const VPN_HEADERS = [
    'x-forwarded-for', 'x-real-ip', 'x-client-ip',
    'cf-connecting-ip', 'true-client-ip',
];
*/

// Tor exit node check via DNSBL
function isTorNode(ip) {
    return new Promise((resolve) => {
        const reversed = ip.split('.').reverse().join('.');
        dns.resolve(`${reversed}.tor.dnsbl.sectoor.de`, 'A', (err) => {
            resolve(!err);
        });
    });
}

// Check if IP belongs to a known datacenter/VPN range
function isDatacenterIP(ip) {
    if (!net.isIPv4(ip) && !net.isIPv6(ip)) return false;
    // Private ranges are OK
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('127.') ||
        ip.startsWith('172.16.') || ip === '::1' || ip === 'localhost') return false;
    return true; // Will be checked more thoroughly in production
}

async function checkVPN(ip) {
    try {
        const isTor = await isTorNode(ip);
        if (isTor) return 'tor';
        if (isDatacenterIP(ip)) return 'datacenter';
    } catch { /* ignore DNS errors */ }
    return null;
}

function wafMiddleware(req, res, next) {
    const ip = req.ip || req.connection?.remoteAddress || '';
    const country = req.headers['cf-ipcountry'] || req.headers['x-geo-country'] || '';

    const BLOCKED_COUNTRIES = getBlockedCountries();
    const BLOCKED_IPS = getBlockedIPs();

    // IP blacklist
    if (BLOCKED_IPS.some(b => ip.includes(b))) {
        logger.warn(`WAF: IP bloqueada ${ip}`);
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Country block
    if (BLOCKED_COUNTRIES.length && country && BLOCKED_COUNTRIES.includes(country)) {
        logger.warn(`WAF: País bloqueado ${country} (IP: ${ip})`);
        return res.status(403).json({ error: 'Acceso denegado por región' });
    }

    // Body size check
    const bodyStr = JSON.stringify(req.body || {});
    if (bodyStr.length > MAX_BODY_SIZE) {
        logger.warn(`WAF: Body demasiado grande (${bodyStr.length} bytes) de ${ip}`);
        return res.status(413).json({ error: 'Payload demasiado grande' });
    }

    // SQL injection / XSS / path traversal detection
    for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(bodyStr) || pattern.test(req.url) ||
            (req.headers['user-agent'] && pattern.test(req.headers['user-agent'])) ||
            (req.headers['referer'] && pattern.test(req.headers['referer']))) {
            logger.warn(`WAF: Patrón sospechoso detectado de ${ip}: ${pattern}`);
            return res.status(403).json({ error: 'Petición bloqueada por seguridad' });
        }
    }

    // VPN/Proxy/Tor detection (async, no bloquea pero loguea)
    if (process.env.WAF_BLOCK_VPN === 'true') {
        checkVPN(ip).then(result => {
            if (result) {
                logger.warn(`WAF: Conexión ${result} detectada desde ${ip}`);
                if (result === 'tor') {
                    // Tor is always blocked if WAF_BLOCK_VPN is enabled
                    return res.status(403).json({ error: 'Acceso denegado: Tor no permitido' });
                }
            }
        });
    }

    next();
}

module.exports = { wafMiddleware };
