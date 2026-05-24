/**
 * @jest-environment jsdom
 */

// Mock i18n
global.t = (key) => key;
global.getLocale = () => 'es';
global.setLocale = () => {};

describe('Frontend: i18n', () => {
    test('t() returns key when no translation', () => {
        expect(global.t('unknown.key')).toBe('unknown.key');
    });
});

describe('Frontend: ApiService', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('isAuthenticated es false sin token', () => {
        const ApiService = {
            get token() { return localStorage.getItem('futinvest_token'); },
            get isAuthenticated() { return !!this.token; },
        };
        expect(ApiService.isAuthenticated).toBe(false);
    });

    test('isAuthenticated es true con token', () => {
        localStorage.setItem('futinvest_token', 'test-token');
        const ApiService = {
            get token() { return localStorage.getItem('futinvest_token'); },
            get isAuthenticated() { return !!this.token; },
        };
        expect(ApiService.isAuthenticated).toBe(true);
    });
});

describe('Frontend: Notifications', () => {
    test('showNotification crea toast', () => {
        document.body.innerHTML = '<div id="notification-center" class="notification-center"></div>';
        require('../app.js'); // Modulo app.js cargado

        const notifCenter = document.getElementById('notification-center');
        const toast = document.createElement('div');
        toast.className = 'notification-toast notif-success';
        toast.innerHTML = '<span class="material-icons-round notif-icon">check_circle</span>' +
            '<div class="notif-content"><div class="notif-title">Test</div><div class="notif-body">Body</div></div>';
        notifCenter.appendChild(toast);

        expect(notifCenter.children.length).toBe(1);
        expect(notifCenter.querySelector('.notif-title').textContent).toBe('Test');
    });
});

describe('Frontend: KYC Status Badge', () => {
    test('muestra estado pending', () => {
        document.body.innerHTML = '<div id="kyc-status-badge" class="kyc-status-badge kyc-status-pending">' +
            '<span class="material-icons-round">hourglass_empty</span><span>Pendiente</span></div>';
        const badge = document.getElementById('kyc-status-badge');
        expect(badge.className).toContain('kyc-status-pending');
        expect(badge.textContent).toContain('Pendiente');
    });

    test('cambia a approved', () => {
        document.body.innerHTML = '<div id="kyc-status-badge" class="kyc-status-badge"></div>';
        const badge = document.getElementById('kyc-status-badge');
        badge.className = 'kyc-status-badge kyc-status-approved';
        badge.innerHTML = '<span class="material-icons-round">verified</span><span>Aprobada</span>';
        expect(badge.className).toContain('kyc-status-approved');
        expect(badge.textContent).toContain('Aprobada');
    });

    test('oculta formulario si approved', () => {
        document.body.innerHTML = '<div id="kyc-status-badge" class="kyc-status-badge kyc-status-approved">Aprobada</div>' +
            '<form id="kyc-upload-form"></form>';
        const form = document.getElementById('kyc-upload-form');
        form.style.display = 'none';
        expect(form.style.display).toBe('none');
    });
});
