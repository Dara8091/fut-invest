// Supported currencies and their display config
const CURRENCIES = [
    { code: 'USDT', name: 'Tether USD', symbol: '₮', decimals: 2, minDeposit: 10, networks: ['TRC20', 'ERC20', 'BEP20'] },
    { code: 'BTC', name: 'Bitcoin', symbol: '₿', decimals: 8, minDeposit: 0.001, networks: ['BTC'] },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', decimals: 6, minDeposit: 0.01, networks: ['ERC20'] },
    { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, minDeposit: 1, networks: ['BANK'] },
];

function getCurrency(code) {
    return CURRENCIES.find(c => c.code === code) || CURRENCIES[3]; // USD fallback
}

function formatCurrency(amount, currencyCode) {
    const currency = getCurrency(currencyCode);
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return currency.symbol + value.toFixed(currency.decimals);
}

function listCurrencies() {
    return CURRENCIES.map(({ code, name, symbol, decimals, networks }) => ({
        code, name, symbol, decimals, networks,
    }));
}

module.exports = { CURRENCIES, getCurrency, formatCurrency, listCurrencies };
