import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const registerUser = async ({ nombre, email, password, nickname, fechaNacimiento, plataformaFavorita, avatarUrl, pais, preferenciasJuego, nivelExperiencia }) => {
  const existing = await User.findOne({ email }).lean().exec();
  if (existing) {
    const err = new Error('Email ya registrado');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const created = await User.create({
      nombre: nombre || null,
      nickname: nickname || null,
      fechaNacimiento: fechaNacimiento || null,
      plataformaFavorita: plataformaFavorita || null,
      avatarUrl: avatarUrl || null,
      pais: pais || null,
      preferenciasJuego: Array.isArray(preferenciasJuego) ? preferenciasJuego : [],
      nivelExperiencia: nivelExperiencia || 'Casual',
      email,
      passwordHash
    });
    return {
      _id: created._id,
      nombre: created.nombre,
      email: created.email,
      nickname: created.nickname,
      fechaNacimiento: created.fechaNacimiento,
      plataformaFavorita: created.plataformaFavorita,
      avatarUrl: created.avatarUrl,
      pais: created.pais,
      preferenciasJuego: created.preferenciasJuego,
      nivelExperiencia: created.nivelExperiencia
    };
  } catch (err) {
    // Manejar condición de carrera: si otro proceso creó el mismo email, Mongo lanzará un error 11000
    // normalizamos a un error con status 409 y mensaje claro.
    if (err && (err.code === 11000 || err.name === 'MongoServerError')) {
      const e = new Error('Email ya registrado');
      e.status = 409;
      throw e;
    }
    throw err;
  }
};

export const authenticateUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).exec();
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return {
    _id: user._id,
    nombre: user.nombre,
    email: user.email,
    nickname: user.nickname,
    fechaNacimiento: user.fechaNacimiento,
    plataformaFavorita: user.plataformaFavorita,
    avatarUrl: user.avatarUrl,
    pais: user.pais,
    preferenciasJuego: user.preferenciasJuego,
    nivelExperiencia: user.nivelExperiencia
  };
};

export const updateUser = async (userId, update) => {
  const allowed = {};
  if (typeof update.nombre !== 'undefined') allowed.nombre = update.nombre || null;
  if (typeof update.nickname !== 'undefined') allowed.nickname = update.nickname || null;
  if (typeof update.fechaNacimiento !== 'undefined') allowed.fechaNacimiento = update.fechaNacimiento || null;
  if (typeof update.plataformaFavorita !== 'undefined') allowed.plataformaFavorita = update.plataformaFavorita || null;
  if (typeof update.avatarUrl !== 'undefined') allowed.avatarUrl = update.avatarUrl || null;
  if (typeof update.pais !== 'undefined') allowed.pais = update.pais || null;
  if (typeof update.preferenciasJuego !== 'undefined') allowed.preferenciasJuego = Array.isArray(update.preferenciasJuego) ? update.preferenciasJuego : [];
  if (typeof update.nivelExperiencia !== 'undefined') allowed.nivelExperiencia = update.nivelExperiencia || 'Casual';
  if (typeof update.email !== 'undefined') allowed.email = update.email;

  // Handle password separately (hash before saving)
  if (typeof update.password !== 'undefined' && update.password) {
    const hash = await bcrypt.hash(update.password, 10);
    allowed.passwordHash = hash;
  }

  const updated = await User.findByIdAndUpdate(userId, { $set: allowed }, { new: true }).lean().exec();
  if (!updated) return null;
  return {
    _id: updated._id,
    nombre: updated.nombre,
    email: updated.email,
    nickname: updated.nickname,
    fechaNacimiento: updated.fechaNacimiento,
    plataformaFavorita: updated.plataformaFavorita,
    avatarUrl: updated.avatarUrl,
    pais: updated.pais,
    preferenciasJuego: updated.preferenciasJuego,
    nivelExperiencia: updated.nivelExperiencia
  };
};

