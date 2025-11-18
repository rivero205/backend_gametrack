// Services for games - implemented
// Services interact with models and implement business logic
import mongoose from 'mongoose';
import Game from '../models/Game.js';
import Review from '../models/Review.js';
import UserGame from '../models/UserGame.js';

/**
 * List games with optional filters:
 * filter: { search, genero, plataforma, completado, page, limit, sort }
 * returns array of games
 */
export const listGames = async (filter = {}, ownerId) => {
  const query = { ownerId };

  if (filter.search) {
    // text search on titulo
    query.$text = { $search: filter.search };
  }

  if (filter.genero) query.genero = filter.genero;
  if (filter.plataforma) query.plataforma = filter.plataforma;
  if (typeof filter.completado !== 'undefined') {
    // allow string 'true'/'false'
    query.completado = filter.completado === 'true' || filter.completado === true;
  }

  const page = Math.max(parseInt(filter.page) || 1, 1);
  const limit = Math.max(parseInt(filter.limit) || 50, 1);
  const skip = (page - 1) * limit;

  const mongoQuery = Game.find(query).sort(filter.sort || { createdAt: -1 }).skip(skip).limit(limit);
  const results = await mongoQuery.exec();
  return results;
};

export const createGame = async (gameData, ownerId) => {
  // Create and return the created game
  const payload = { ...gameData };
  // Only set ownerId when explicitly passed (user-created games)
  if (ownerId) payload.ownerId = ownerId;
  // Ensure horasTotalesJugadas is number or null (we no longer use RAWG playtime)
  if (payload.horasTotalesJugadas !== undefined) payload.horasTotalesJugadas = payload.horasTotalesJugadas === null ? null : Number(payload.horasTotalesJugadas);
  const game = await Game.create(payload);
  return game;
};

export const linkOrCreateByRawg = async (rawgId, gameData = {}) => {
  if (rawgId === undefined || rawgId === null) throw new Error('rawgId required');
  // Build payload: ensure we mark as imported and do not set ownerId
  const payload = {
    ...gameData,
    rawgId: Number(rawgId),
    esJuegoImportado: true,
  };

  // Try atomic upsert by rawgId
  try {
    const result = await Game.findOneAndUpdate(
      { rawgId: Number(rawgId) },
      { $setOnInsert: payload },
      { upsert: true, new: true }
    ).exec();
    return result;
  } catch (err) {
    // Duplicate key race: if another process created it just now, return the existing document
    if (err && err.code === 11000) {
      const existing = await Game.findOne({ rawgId: Number(rawgId) }).exec();
      if (existing) return existing;
    }
    throw err;
  }
};

export const getGameById = async (id, ownerId) => {
  if (!mongoose.isValidObjectId(id)) return null;
  // Do not restrict by ownerId here: games can be global (imported) or user-owned.
  const game = await Game.findOne({ _id: id }).exec();
  return game;
};

export const updateGame = async (id, update, ownerId) => {
  if (!mongoose.isValidObjectId(id)) return null;
  // Ensure horasTotalesJugadas is number or null
  if (update.horasTotalesJugadas !== undefined) update.horasTotalesJugadas = update.horasTotalesJugadas === null ? null : Number(update.horasTotalesJugadas);
  const updated = await Game.findOneAndUpdate({ _id: id, ownerId }, update, { new: true }).exec();
  return updated;
};

export const deleteGame = async (id, ownerId) => {
  if (!mongoose.isValidObjectId(id)) return null;

  // Delete the game
  const deleted = await Game.findOneAndDelete({ _id: id, ownerId }).exec();
  if (!deleted) return null;

  // Cascade delete: remove reviews associated with this game
  try {
    await Review.deleteMany({ juegoId: deleted._id }).exec();
    // Also remove any user-specific library entries referencing this game
    try {
      await UserGame.deleteMany({ gameId: deleted._id }).exec();
    } catch (e) {
      // non-fatal
    }
  } catch (e) {
    // non-fatal: log and continue
    // console.warn('Failed to delete related reviews', e);
  }

  return deleted;
};
