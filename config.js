// ============================================
// fut.invest - Configuración del Frontend
// ============================================
// Las URLs pueden sobrescribirse definiendo window.__FUT_CONFIG__ antes de
// cargar este script, o mediante variables de entorno en el servidor.

(function() {
    const defaults = {
        API_BASE: 'http://localhost:3001/api',
        WS_URL: 'http://localhost:3001',
    };

    const userConfig = window.__FUT_CONFIG__ || {};
    const config = { ...defaults, ...userConfig };

    window.FUT_CONFIG = config;
})();
