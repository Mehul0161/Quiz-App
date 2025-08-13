const app = require('../server');
const serverless = require('serverless-http');

const handler = serverless(app);

module.exports = (req, res) => handler(req, res);
