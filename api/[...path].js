require('dotenv').config();
const app = require('../server/app');
const connectDatabase = require('../server/config/db');

module.exports = async (req, res) => {
  try {
    await connectDatabase();
    const requestUrl = new URL(req.url, 'http://localhost');
    if (requestUrl.pathname === '/' || requestUrl.pathname === '/api') {
      const path = req.query?.path;
      const route = Array.isArray(path) ? path.join('/') : path;
      requestUrl.pathname = route
        ? `/api/${String(route).replace(/^\/?(?:api\/)?/, '')}`
        : '/api';
      requestUrl.searchParams.delete('path');
    } else if (!requestUrl.pathname.startsWith('/api/')) {
      requestUrl.pathname = `/api${requestUrl.pathname}`;
    }
    req.url = `${requestUrl.pathname}${requestUrl.search}`;
    return app(req, res);
  } catch (error) {
    console.error('API request could not connect to MongoDB:', error);
    return res.status(503).json({ message: 'الخدمة غير متاحة حاليًا. حاول مجددًا.' });
  }
};
