// ============================================
// fut.invest - API Service Layer
// ============================================
const API_BASE = (window.FUT_CONFIG && window.FUT_CONFIG.API_BASE) || 'http://localhost:3001/api';

const ApiService = {
    _token: localStorage.getItem('futinvest_token'),
    _refreshToken: localStorage.getItem('futinvest_refresh_token'),
    _refreshPromise: null,

    get token() { return this._token; },
    get isAuthenticated() { return !!this._token; },

    setToken(token) {
        this._token = token;
        if (token) {
            localStorage.setItem('futinvest_token', token);
        } else {
            localStorage.removeItem('futinvest_token');
        }
    },

    _setRefreshToken(token) {
        this._refreshToken = token;
        if (token) {
            localStorage.setItem('futinvest_refresh_token', token);
        } else {
            localStorage.removeItem('futinvest_refresh_token');
        }
    },

    async _tryRefresh() {
        if (!this._refreshToken) return false;
        if (this._refreshPromise) return this._refreshPromise;
        this._refreshPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: this._refreshToken }),
                });
                if (!res.ok) return false;
                const data = await res.json();
                this.setToken(data.accessToken);
                this._setRefreshToken(data.refreshToken);
                return true;
            } catch {
                return false;
            } finally {
                this._refreshPromise = null;
            }
        })();
        return this._refreshPromise;
    },

    _getCaptchaToken() {
        if (typeof grecaptcha !== 'undefined') {
            const widgetId = document.querySelector('#recaptcha-widget')?.dataset?.widgetId;
            if (widgetId) return grecaptcha.getResponse(parseInt(widgetId));
        }
        return null;
    },

    async _fetch(endpoint, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (this._token) {
            headers['Authorization'] = `Bearer ${this._token}`;
        }
        const captchaToken = this._getCaptchaToken();
        if (captchaToken) {
            headers['X-Captcha-Token'] = captchaToken;
        }

        let res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

        if (res.status === 401 && this._refreshToken) {
            const refreshed = await this._tryRefresh();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${this._token}`;
                res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
            }
        }

        if (res.status === 401) {
            this.setToken(null);
            this._setRefreshToken(null);
            const event = new CustomEvent('auth:expired');
            window.dispatchEvent(event);
            throw new Error('Sesión expirada');
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error de servidor');
        return data;
    },

    // Auth
    async login(email, password) {
        const data = await this._fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setToken(data.accessToken);
        this._setRefreshToken(data.refreshToken);
        return data.user;
    },

    async register(email, password, fullName) {
        const data = await this._fetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, fullName }),
        });
        this.setToken(data.accessToken);
        this._setRefreshToken(data.refreshToken);
        return data.user;
    },

    async me() {
        return this._fetch('/auth/me');
    },

    async forgotPassword(email) {
        return this._fetch('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    async resetPassword(token, newPassword) {
        return this._fetch('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword }),
        });
    },

    // Dashboard
    async getDashboard() {
        return this._fetch('/dashboard');
    },

    // Wallet
    async withdraw(asset, address, amount) {
        return this._fetch('/wallet/withdraw', {
            method: 'POST',
            body: JSON.stringify({ asset, address, amount }),
        });
    },

    async deposit(asset, amount) {
        return this._fetch('/wallet/deposit', {
            method: 'POST',
            body: JSON.stringify({ asset, amount }),
        });
    },

    async getTransactions() {
        return this._fetch('/wallet/transactions');
    },

    // Security
    async toggle2FA(enabled) {
        return this._fetch('/security/toggle-2fa', {
            method: 'POST',
            body: JSON.stringify({ enabled }),
        });
    },

    async verifyTOTP(code) {
        return this._fetch('/security/verify-totp', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    },

    async get2FAStatus() {
        return this._fetch('/security/2fa-status');
    },

    // Payments
    async getDepositStatus(transactionId) {
        return this._fetch(`/payments/deposit/${transactionId}/status`);
    },

    async getQuote(asset, network, amount) {
        return this._fetch('/payments/quote', {
            method: 'POST',
            body: JSON.stringify({ asset, network, amount }),
        });
    },

    async exportCSV() {
        const headers = { 'Content-Type': 'application/json' };
        if (this._token) headers['Authorization'] = `Bearer ${this._token}`;
        const res = await fetch(`${API_BASE}/payments/export/csv`, { headers });
        if (!res.ok) throw new Error('Error al exportar CSV');
        return res.text();
    },

    // Admin
    async getAdminStats() {
        return this._fetch('/admin/stats');
    },

    async getAdminUsers() {
        return this._fetch('/admin/users');
    },

    async getPendingWithdrawals() {
        return this._fetch('/admin/withdrawals/pending');
    },

    async getAllWithdrawals(status) {
        const query = status ? `?status=${status}` : '';
        return this._fetch(`/admin/withdrawals${query}`);
    },

    async approveWithdrawal(id) {
        return this._fetch(`/admin/withdrawals/${id}/approve`, { method: 'POST' });
    },

    async rejectWithdrawal(id, reason) {
        return this._fetch(`/admin/withdrawals/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },

    async getFeeConfigs() {
        return this._fetch('/admin/fees');
    },

    async updateFeeConfig(id, data) {
        return this._fetch(`/admin/fees/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    // Network
    async getNetwork() {
        return this._fetch('/network');
    },

    logout() {
        this.setToken(null);
        this._setRefreshToken(null);
        const event = new CustomEvent('auth:logout');
        window.dispatchEvent(event);
    },
};
