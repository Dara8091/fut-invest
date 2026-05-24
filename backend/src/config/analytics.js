const logger = require('./logger');

const ANALYTICS_PROVIDER = process.env.ANALYTICS_PROVIDER || '';
const ANALYTICS_ID = process.env.ANALYTICS_ID || '';
const ANALYTICS_HOST = process.env.ANALYTICS_HOST || '';

// Plausible Analytics compatible
async function trackEvent(event, props = {}) {
    if (!ANALYTICS_ID || !ANALYTICS_PROVIDER) return;

    try {
        const http = require('http');
        const data = JSON.stringify({
            domain: ANALYTICS_ID,
            name: event,
            url: props.url || 'https://futinvest.io',
            props,
        });

        const options = {
            hostname: ANALYTICS_HOST || 'plausible.io',
            path: '/api/event',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'futinvest-analytics/1.0',
                'X-Forwarded-For': props.ip || '',
            },
        };

        const req = http.request(options);
        req.write(data);
        req.end();
    } catch (err) {
        logger.warn(`Analytics error: ${err.message}`);
    }
}

// Server-side event tracking for key actions
function trackConversion(userId, event, metadata = {}) {
    trackEvent(event, { userId: String(userId), ...metadata });
    logger.info(`Analytics: ${event} (user #${userId})`);
}

module.exports = { trackEvent, trackConversion };
