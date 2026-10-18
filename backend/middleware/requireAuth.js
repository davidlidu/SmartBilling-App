// Exige sesión en la API. Antes, las rutas de clientes, facturas, pagos y ajustes respondían sin token.
//
// Acepta:
//  - El JWT que emite /api/auth/login (header Authorization: Bearer <token>).
//  - Solo para lecturas (GET): la clave EXPORT_API_KEY, si está definida. La usa la importación desde
//    DeerSystems Partners; quítala del entorno cuando termines de migrar.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET no está definido: se usa un valor por defecto inseguro. Defínelo en el entorno.');
}

const sameSecret = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

module.exports = function requireAuth(req, res, next) {
  if (req.method === 'OPTIONS') return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ message: 'Inicia sesión para continuar.' });

  const exportKey = process.env.EXPORT_API_KEY;
  if (exportKey && req.method === 'GET' && sameSecret(token, exportKey)) return next();

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Tu sesión venció. Vuelve a entrar.' });
  }
};
