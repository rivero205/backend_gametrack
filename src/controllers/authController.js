import * as usersService from "../services/usersService.js";
import jwt from "jsonwebtoken";

// Helper para convertir cadenas tipo '7d', '1h', '30m' a milisegundos para cookie maxAge
function parseExpiresToMs(str) {
  if (!str) return 7 * 24 * 60 * 60 * 1000; // 7d por defecto
  const m = /^\s*(\d+)\s*([smhd])?\s*$/.exec(str);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const v = Number(m[1]);
  const unit = m[2] || 'd';
  switch (unit) {
    case 's': return v * 1000;
    case 'm': return v * 60 * 1000;
    case 'h': return v * 60 * 60 * 1000;
    case 'd': default: return v * 24 * 60 * 60 * 1000;
  }
}

function signToken(user) {
  const secret = process.env.JWT_SECRET || "dev_secret_change_me";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  const payload = { sub: user._id, email: user.email, nombre: user.nombre };
  return jwt.sign(payload, secret, { expiresIn });
}

export const register = async (req, res, next) => {
  try {
    const { nombre, email, password, nickname, fechaNacimiento, plataformaFavorita, avatarUrl, pais, preferenciasJuego, nivelExperiencia } = req.body;
    const user = await usersService.registerUser({ nombre, email, password, nickname, fechaNacimiento, plataformaFavorita, avatarUrl, pais, preferenciasJuego, nivelExperiencia });
    const token = signToken(user);
    
    // Setear cookie httpOnly para el token (para navegadores)
    try {
      const maxAge = parseExpiresToMs(process.env.JWT_EXPIRES_IN || '7d');
      // sameSite configurable via COOKIE_SAME_SITE env var. Fallback: strict in prod, lax in dev.
      const sameSite = process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'strict' : 'lax');
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite,
        maxAge,
      });
    } catch (cookieErr) {
      // No fatal: seguimos devolviendo el token en el body
      console.warn('No se pudo setear cookie de auth:', cookieErr);
    }
    
    // Devolver el token en el body también (para desarrollo y APIs)
    return res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await usersService.authenticateUser({ email, password });
    if (!user) {
      const e = new Error("Credenciales inválidas");
      e.status = 401;
      throw e;
    }
    const token = signToken(user);
    
    // Setear cookie httpOnly para el token (para navegadores)
    try {
      const maxAge = parseExpiresToMs(process.env.JWT_EXPIRES_IN || '7d');
      const sameSite = process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'strict' : 'lax');
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite,
        maxAge,
      });
    } catch (cookieErr) {
      console.warn('No se pudo setear cookie de auth:', cookieErr);
    }
    
    // Devolver el token en el body también (para desarrollo y APIs)
    return res.status(200).json({ user, token });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    // Borrar la cookie 'token' en el cliente. Usar mismas opciones que al setearla.
    const sameSite = process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'strict' : 'lax');
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite,
    });
    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    // Intentar tomar usuario del middleware (si auth middleware fue usado)
    if (req.user) return res.status(200).json({ user: req.user });

  // Si no hay req.user, intentar leer token desde cookie o header
    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');
    let token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
    if (!token) {
      const cookieHeader = req.headers.cookie || '';
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(s => s.trim());
        for (const c of cookies) {
          const [k, ...rest] = c.split('=');
          if (k === 'token') { token = rest.join('='); break; }
        }
      }
    }

    if (!token) {
      const err = new Error('No autenticado');
      err.status = 401;
      throw err;
    }

  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  const payload = jwt.verify(token, secret);
    const user = { _id: payload.sub, email: payload.email, nombre: payload.nombre };
    return res.status(200).json({ user });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      err.status = 401;
      err.message = 'Token inválido o expirado';
    }
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    // req.user viene del middleware auth
    const userId = req.user && req.user._id;
    if (!userId) {
      const e = new Error('No autenticado');
      e.status = 401;
      throw e;
    }

    // Sólo tomamos los campos permitidos desde el body
    const { nombre, email, password, nickname, fechaNacimiento, plataformaFavorita, avatarUrl, pais, preferenciasJuego, nivelExperiencia } = req.body;
    const updated = await usersService.updateUser(userId, { nombre, email, password, nickname, fechaNacimiento, plataformaFavorita, avatarUrl, pais, preferenciasJuego, nivelExperiencia });
    if (!updated) {
      const e = new Error('Usuario no encontrado');
      e.status = 404;
      throw e;
    }

    // Re-sign token so cookie (and returned token) contain latest nombre/email
    const token = signToken(updated);
    try {
      const maxAge = parseExpiresToMs(process.env.JWT_EXPIRES_IN || '7d');
      const sameSite = process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'strict' : 'lax');
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite,
        maxAge,
      });
    } catch (cookieErr) {
      console.warn('No se pudo setear cookie de auth al actualizar perfil:', cookieErr);
    }

    return res.status(200).json({ user: updated, token });
  } catch (err) {
    next(err);
  }
};
