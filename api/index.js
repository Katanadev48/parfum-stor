require('dotenv').config();
const app = require('../server/app');

module.exports = (req, res) => {
  const requestUrl = new URL(req.url, 'http://localhost');
  const route = req.query?.path;
  const routePath = Array.isArray(route) ? route.join('/') : route;
  requestUrl.pathname = routePath
    ? `/api/${String(routePath).replace(/^\/?(?:api\/)?/, '')}`
    : '/api';
  requestUrl.searchParams.delete('path');
  req.url = `${requestUrl.pathname}${requestUrl.search}`;
  return app(req, res);
};
