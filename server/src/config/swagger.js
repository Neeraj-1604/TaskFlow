const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../docs/swagger.json');

/**
 * Swagger/OpenAPI setup. The spec lives in `src/docs/swagger.json` and is
 * served interactively at `/api-docs` plus as raw JSON at `/api-docs.json`.
 */
module.exports = {
    swaggerUi,
    swaggerDocument,
};
