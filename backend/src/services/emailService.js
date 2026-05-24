const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else if (process.env.SENDGRID_API_KEY) {
        transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY },
        });
    } else {
        transporter = nodemailer.createTransport({
            host: 'localhost',
            port: 1025,
            ignoreTLS: true,
        });
        logger.warn('Email service: usando transporte mock localhost:1025. Configurar SMTP_HOST o SENDGRID_API_KEY.');
    }

    return transporter;
}

const FROM = process.env.EMAIL_FROM || 'noreply@futinvest.io';
const BRAND = 'fut.invest';

function layout(body) {
    return `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0A0E1A;font-family:Inter,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:rgba(255,255,255,0.02);border:1px solid rgba(0,212,255,0.08);border-radius:16px;">
<tr><td style="padding:32px;text-align:center;">
<img src="https://futinvest.io/logo.png" alt="${BRAND}" width="48" style="border-radius:50%;margin-bottom:16px;">
${body}
<hr style="border:none;border-top:1px solid rgba(0,212,255,0.06);margin:24px 0;">
<p style="font-size:12px;color:#8890A8;">© ${new Date().getFullYear()} ${BRAND}. Todos los derechos reservados.<br>
Este es un mensaje automático, por favor no respondas a este correo.</p>
</td></tr></table></td></tr></table></body></html>`;
}

async function sendEmail({ to, subject, html }) {
    try {
        const info = await getTransporter().sendMail({
            from: `"${BRAND}" <${FROM}>`,
            to,
            subject: `[${BRAND}] ${subject}`,
            html: layout(html),
        });
        logger.info(`Email enviado a ${to}: ${subject} (id: ${info.messageId})`);
        return info;
    } catch (err) {
        logger.error(`Error enviando email a ${to}: ${err.message}`);
        throw err;
    }
}

function sendVerificationEmail(to, token) {
    const url = `${process.env.FRONTEND_URL || 'http://localhost:8000'}/verify-email?token=${token}`;
    return sendEmail({
        to,
        subject: 'Verifica tu correo electrónico',
        html: `<h2 style="color:#00D4FF;margin:0 0 16px;">Verifica tu email</h2>
<p style="color:#8890A8;font-size:14px;line-height:1.6;">Gracias por registrarte en ${BRAND}. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#00D4FF,#0099CC);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;margin:16px 0;">Verificar Email</a>
<p style="color:#8890A8;font-size:12px;">O copia este enlace en tu navegador:<br><code style="color:#00D4FF;">${url}</code></p>
<p style="color:#8890A8;font-size:12px;">Este enlace expira en 24 horas.</p>`,
    });
}

function sendPasswordResetEmail(to, token) {
    const url = `${process.env.FRONTEND_URL || 'http://localhost:8000'}/reset-password?token=${token}`;
    return sendEmail({
        to,
        subject: 'Restablece tu contraseña',
        html: `<h2 style="color:#00D4FF;margin:0 0 16px;">Restablecer contraseña</h2>
<p style="color:#8890A8;font-size:14px;line-height:1.6;">Recibimos una solicitud para restablecer tu contraseña en ${BRAND}. Haz clic en el siguiente enlace para continuar:</p>
<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#00D4FF,#0099CC);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;margin:16px 0;">Restablecer Contraseña</a>
<p style="color:#8890A8;font-size:12px;">Si no solicitaste esto, ignora este mensaje.<br>Este enlace expira en 1 hora.</p>`,
    });
}

function sendKycStatusEmail(to, status, notes) {
    const statusText = { approved: 'aprobada', rejected: 'rechazada' }[status] || status;
    return sendEmail({
        to,
        subject: `Verificación KYC ${statusText}`,
        html: `<h2 style="color:#00D4FF;margin:0 0 16px;">KYC ${status === 'approved' ? 'Aprobado ✅' : 'Rechazado ❌'}</h2>
<p style="color:#8890A8;font-size:14px;line-height:1.6;">Tu verificación de identidad ha sido <strong>${statusText}</strong>.</p>
${notes ? `<p style="color:#FF2D95;font-size:13px;">Notas: ${notes}</p>` : ''}
<p style="color:#8890A8;font-size:12px;">Puedes revisar el estado en tu panel de usuario.</p>`,
    });
}

function sendWithdrawalNotificationEmail(to, type, data) {
    const emoji = type === 'retiro_procesado' ? '🔄' : type === 'retiro_completado' ? '✅' : '❌';
    const title = type === 'retiro_procesado' ? 'Retiro en proceso' :
                  type === 'retiro_completado' ? 'Retiro completado' : 'Retiro fallido';
    return sendEmail({
        to,
        subject: title,
        html: `<h2 style="color:#00D4FF;margin:0 0 16px;">${emoji} ${title}</h2>
<p style="color:#8890A8;font-size:14px;line-height:1.6;">Tu retiro de <strong>$${data.amount} ${data.asset}</strong> ha cambiado de estado.</p>
${data.txHash ? `<p style="color:#8890A8;font-size:12px;">TX: <code style="color:#00D4FF;">${data.txHash}</code></p>` : ''}
${data.error ? `<p style="color:#FF2D95;font-size:13px;">Error: ${data.error}</p>` : ''}
<p style="color:#8890A8;font-size:12px;">Estado actual: <strong>${data.status}</strong></p>`,
    });
}

function sendDepositConfirmedEmail(to, data) {
    return sendEmail({
        to,
        subject: 'Depósito confirmado',
        html: `<h2 style="color:#00D4FF;margin:0 0 16px;">✅ Depósito recibido</h2>
<p style="color:#8890A8;font-size:14px;line-height:1.6;">Hemos recibido tu depósito de <strong>$${data.amount} ${data.asset}</strong>.</p>
${data.txHash ? `<p style="color:#8890A8;font-size:12px;">TX: <code style="color:#00D4FF;">${data.txHash}</code></p>` : ''}
<p style="color:#8890A8;font-size:12px;">Los fondos ya están disponibles en tu cuenta.</p>`,
    });
}

module.exports = {
    sendEmail, sendVerificationEmail, sendPasswordResetEmail,
    sendKycStatusEmail, sendWithdrawalNotificationEmail, sendDepositConfirmedEmail,
};
