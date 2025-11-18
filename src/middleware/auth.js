import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');
    const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
    let finalToken = token;

    // Si no viene Authorization header, intentar leer cookie 'token' del header cookie
    if (!finalToken) {
      const cookieHeader = req.headers.cookie || '';
      if (cookieHeader) {
        // parse simple cookies 'k=v; k2=v2'
        const cookies = cookieHeader.split(';').map(s => s.trim());
        for (const c of cookies) {
          const [k, ...rest] = c.split('=');
          if (k === 'token') {
            finalToken = rest.join('=');
            break;
          }
        }
      }
    }

    if (!finalToken) {
      const err = new Error('No autenticado');
      err.status = 401;
      throw err;
    }

  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';

  const payload = jwt.verify(finalToken, secret);
    // Adjuntar usuario al request
    req.user = { _id: payload.sub, email: payload.email, nombre: payload.nombre };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      err.status = 401;
      err.message = 'Token inválido o expirado';
    }
    next(err);
  }
}
