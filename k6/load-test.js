import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api';

const errorRate = new Rate('errors');
const loginTrend = new Trend('login_duration');
const dashboardTrend = new Trend('dashboard_duration');
const registerTrend = new Trend('register_duration');
const withdrawalTrend = new Trend('withdrawal_duration');

export const options = {
    stages: [
        { duration: '10s', target: 5 },
        { duration: '20s', target: 25 },
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '20s', target: 0 },
    ],
    thresholds: {
        errors: ['rate<0.05'],
        http_req_duration: ['p(95)<2000', 'avg<800'],
        login_duration: ['p(95)<3000'],
        dashboard_duration: ['p(95)<1500'],
        register_duration: ['p(95)<4000'],
    },
};

function randomEmail() {
    return `loadtest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.futinvest.io`;
}

export default function () {
    group('Health & Public', () => {
        const healthRes = http.get(`${BASE_URL}/health`);
        check(healthRes, { 'health ok': (r) => r.status === 200 });
        const docsRes = http.get(`${BASE_URL.replace('/api', '')}/api/docs`);
        check(docsRes, { 'docs ok': (r) => r.status === 200 || r.status === 301 });
    });

    group('Auth Flow', () => {
        const email = randomEmail();
        const registerRes = http.post(`${BASE_URL}/auth/register`, {
            email, password: 'Test123!', fullName: 'Load Tester',
        }, { tags: { endpoint: 'register' } });
        registerTrend.add(registerRes.timings.duration);
        const regOk = check(registerRes, {
            'register exitoso': (r) => r.status === 201 && r.json('accessToken') !== undefined,
        });
        errorRate.add(!regOk);

        const loginRes = http.post(`${BASE_URL}/auth/login`, {
            email: 'demo@futinvest.io', password: 'Demo123!',
        }, { tags: { endpoint: 'login' } });
        loginTrend.add(loginRes.timings.duration);
        const loginOk = check(loginRes, {
            'login exitoso': (r) => r.status === 200 && r.json('accessToken') !== undefined,
        });
        errorRate.add(!loginOk);
        if (!loginOk) { sleep(1); return; }

        const token = loginRes.json('accessToken');
        const authHeaders = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };

        group('Dashboard', () => {
            const dashRes = http.get(`${BASE_URL}/dashboard`, authHeaders);
            dashboardTrend.add(dashRes.timings.duration);
            errorRate.add(!check(dashRes, { 'dashboard ok': (r) => r.status === 200 }));
        });

        group('Wallet & Transactions', () => {
            const txRes = http.get(`${BASE_URL}/wallet/transactions`, authHeaders);
            check(txRes, { 'transactions ok': (r) => r.status === 200 });
            const quoteRes = http.post(`${BASE_URL}/payments/quote`,
                JSON.stringify({ asset: 'USDT', network: 'TRC20', amount: 100 }), authHeaders);
            check(quoteRes, { 'quote ok': (r) => r.status === 200 });
        });

        group('Withdrawal Quote', () => {
            const withdrawRes = http.post(`${BASE_URL}/wallet/withdraw`,
                JSON.stringify({ asset: 'USDT', amount: 50, address: 'TTestAddress123', network: 'TRC20' }), authHeaders);
            withdrawalTrend.add(withdrawRes.timings.duration);
            const wOk = withdrawRes.status === 201 || withdrawRes.status === 400;
            errorRate.add(!wOk);
        });

        group('Referral Stats', () => {
            const refRes = http.get(`${BASE_URL}/referrals/stats`, authHeaders);
            check(refRes, { 'referrals ok': (r) => r.status === 200 });
        });
    });

    sleep(0.5);
}
