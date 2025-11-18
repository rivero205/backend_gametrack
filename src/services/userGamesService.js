import mongoose from 'mongoose';
import UserGame from '../models/UserGame.js';
import Game from '../models/Game.js';

export const listUserGames = async (userId, filters = {}) => {
  const query = { userId };
  if (filters.estado) query.estado = filters.estado;
  const page = Math.max(parseInt(filters.page) || 1, 1);
  const limit = Math.max(parseInt(filters.limit) || 50, 1);
  const skip = (page - 1) * limit;

  return await UserGame.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('gameId');
};

export const getUserGameById = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return await UserGame.findOne({ _id: id, userId }).populate('gameId').exec();
};

export const upsertUserGame = async (userId, gameId, payload) => {
  // Ensure numeric conversion
  if (payload.horasTotalesJugadas !== undefined && payload.horasTotalesJugadas !== null) {
    payload.horasTotalesJugadas = Number(payload.horasTotalesJugadas);
  }

  // If marking completed but no fechaCompletado provided, set now
  if (payload.estado === 'completado' && !payload.fechaCompletado) {
    payload.fechaCompletado = new Date();
  }

  const result = await UserGame.findOneAndUpdate(
    { userId, gameId },
    { $set: payload },
    { upsert: true, new: true }
  ).populate('gameId').exec();

  return result;
};

export const updateUserGame = async (id, userId, update) => {
  if (!mongoose.isValidObjectId(id)) return null;
  if (update.horasTotalesJugadas !== undefined && update.horasTotalesJugadas !== null) update.horasTotalesJugadas = Number(update.horasTotalesJugadas);
  if (update.estado === 'completado' && !update.fechaCompletado) update.fechaCompletado = new Date();

  const updated = await UserGame.findOneAndUpdate({ _id: id, userId }, update, { new: true }).populate('gameId').exec();
  return updated;
};

export const deleteUserGame = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) return null;
  const deleted = await UserGame.findOneAndDelete({ _id: id, userId }).exec();
  return deleted;
};

export const getUserGameByUserAndGame = async (userId, gameId) => {
  if (!mongoose.isValidObjectId(gameId)) return null;
  return await UserGame.findOne({ userId, gameId }).populate('gameId').exec();
};
