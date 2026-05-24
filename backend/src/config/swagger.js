const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'fut.invest API',
            version: '1.0.0',
            description: 'API REST del Panel de Inversión Institucional',
            contact: { name: 'fut.invest Soporte', email: 'soporte@futinvest.io' },
        },
        servers: [
            { url: process.env.SWAGGER_URL || 'http://localhost:3001', description: 'API base' },
            { url: (process.env.SWAGGER_URL || 'http://localhost:3001') + '/api/v1', description: 'API v1' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/*.js', './src/routes/v1.js', './src/controllers/*.js'],
};

module.exports = swaggerJsdoc(options);
