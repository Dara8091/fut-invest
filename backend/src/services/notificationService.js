const logger = require('../config/logger');

class NotificationService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
    }

    setIO(io) {
        this.io = io;
    }

    trackConnection(userId, socketId) {
        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId).add(socketId);
    }

    trackDisconnection(userId, socketId) {
        const sockets = this.connectedUsers.get(userId);
        if (sockets) {
            sockets.delete(socketId);
            if (sockets.size === 0) this.connectedUsers.delete(userId);
        }
    }

    isUserOnline(userId) {
        const sockets = this.connectedUsers.get(userId);
        return sockets && sockets.size > 0;
    }

    sendToUser(userId, event, data) {
        if (!this.io) return;
        this.io.to(`user:${userId}`).emit(event, data);
        logger.debug(`Notificación enviada a user ${userId}: ${event}`);
    }

    sendToAll(event, data) {
        if (!this.io) return;
        this.io.emit(event, data);
    }

    notifyDeposit(userId, { amount, asset, txHash }) {
        this.sendToUser(userId, 'notification:deposit', {
            title: 'Depósito Confirmado',
            body: `$${amount} ${asset} recibido. ${txHash ? 'TX: ' + txHash.slice(0, 16) + '...' : ''}`,
            timestamp: new Date().toISOString(),
            type: 'success',
        });
    }

    notifyWithdrawal(userId, { amount, asset, status, address }) {
        const statusLabels = { pending: 'Pendiente', processing: 'Procesando', completed: 'Completado', failed: 'Fallido' };
        this.sendToUser(userId, 'notification:withdrawal', {
            title: `Retiro ${statusLabels[status] || status}`,
            body: `${amount} ${asset} → ${address?.slice(0, 8)}...`,
            timestamp: new Date().toISOString(),
            type: status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info',
        });
    }

    notifyKycStatus(userId, status) {
        const labels = { approved: 'aprobada', rejected: 'rechazada' };
        this.sendToUser(userId, 'notification:kyc', {
            title: 'KYC Actualizado',
            body: `Tu verificación fue ${labels[status] || status}`,
            timestamp: new Date().toISOString(),
            type: status === 'approved' ? 'success' : 'error',
        });
    }
}

module.exports = new NotificationService();
