const logger = require('./logger');

const VAULT_ADDR = process.env.VAULT_ADDR || '';
const VAULT_TOKEN = process.env.VAULT_TOKEN || '';
const VAULT_SECRET_PATH = process.env.VAULT_SECRET_PATH || 'secret/futinvest';

let cachedSecrets = null;

async function loadFromVault() {
    if (!VAULT_ADDR || !VAULT_TOKEN) {
        logger.info('Vault no configurado, usando variables .env');
        return null;
    }

    try {
        const http = require('http');
        const url = new URL(`${VAULT_ADDR}/v1/${VAULT_SECRET_PATH}`);
        const data = await new Promise((resolve, reject) => {
            const req = http.get(url.toString(), { headers: { 'X-Vault-Token': VAULT_TOKEN } }, (res) => {
                let body = '';
                res.on('data', (c) => body += c);
                res.on('end', () => {
                    try { resolve(JSON.parse(body)); } catch { reject(new Error('Vault response parse error')); }
                });
            });
            req.on('error', reject);
            req.end();
        });

        if (data?.data?.data) {
            cachedSecrets = data.data.data;
            logger.info(`Secretos cargados desde Vault: ${VAULT_SECRET_PATH}`);
            // Override .env vars with Vault values
            for (const [key, value] of Object.entries(cachedSecrets)) {
                if (!process.env[key]) process.env[key] = String(value);
            }
            return cachedSecrets;
        }
    } catch (err) {
        logger.warn(`Error conectando a Vault (${VAULT_ADDR}): ${err.message}`);
    }
    return null;
}

function getSecret(key) {
    if (cachedSecrets && cachedSecrets[key]) return cachedSecrets[key];
    return process.env[key] || null;
}

module.exports = { loadFromVault, getSecret };
