const jwt = require('jsonwebtoken');

function protect(req, res, next) {
  if (typeof process.env.JWT_SECRET !== 'string' || process.env.JWT_SECRET.length < 32) {
    return res.status(503).json({
      message: 'إعداد JWT_SECRET ناقص أو قصير في إعدادات Vercel.'
    });
  }
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
}

module.exports = { protect, adminOnly };
