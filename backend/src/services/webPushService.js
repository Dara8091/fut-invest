const logger = require('../config/logger');

const subscriptions = new Map();

function addSubscription(userId, subscription) {
    if (!subscriptions.has(userId)) {
        subscriptions.set(userId, []);
    }
    const existing = subscriptions.get(userId);
    const dup = existing.find(s => s.endpoint === subscription.endpoint);
    if (!dup) {
        existing.push(subscription);
        logger.info(`WebPush: suscripción añadida para user #${userId}`);
    }
}

function removeSubscription(userId, endpoint) {
    if (subscriptions.has(userId)) {
        const filtered = subscriptions.get(userId).filter(s => s.endpoint !== endpoint);
        subscriptions.set(userId, filtered);
    }
}

function removeAllSubscriptions(userId) {
    subscriptions.delete(userId);
}

async function sendNotification(userId, title, body, icon = '/icon-192.png') {
    const userSubs = subscriptions.get(userId);
    if (!userSubs || userSubs.length === 0) return false;

    const payload = JSON.stringify({ title, body, icon, badge: '/icon-192.png', timestamp: Date.now() });
    const webpush = require('web-push');

    const results = await Promise.allSettled(
        userSubs.map(sub =>
            webpush.sendNotification(sub, payload).catch(err => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    removeSubscription(userId, sub.endpoint);
                }
                return null;
            })
        )
    );

    const sent = results.filter(r => r.value !== null).length;
    logger.info(`WebPush: ${sent}/${userSubs.length} notificaciones enviadas a user #${userId}`);
    return sent > 0;
}

async function broadcastNotification(title, body, userIds) {
    const results = await Promise.allSettled(
        userIds.map(userId => sendNotification(userId, title, body))
    );
    return results.filter(r => r.status === 'fulfilled').length;
}

module.exports = { addSubscription, removeSubscription, removeAllSubscriptions, sendNotification, broadcastNotification };
