import * as userGamesService from '../services/userGamesService.js';
import mongoose from 'mongoose';

export const listUserLibrary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const filters = {
      estado: req.query.estado,
      page: req.query.page,
      limit: req.query.limit
    };
    const results = await userGamesService.listUserGames(userId, filters);
    return res.status(200).json(results);
  } catch (err) {
    next(err);
  }
};

export const getUserGame = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const ug = await userGamesService.getUserGameById(id, userId);
    if (!ug) {
      const e = new Error('UserGame not found');
      e.status = 404;
      throw e;
    }
    return res.status(200).json(ug);
  } catch (err) {
    next(err);
  }
};

export const addToLibrary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { gameId, estado, horasTotalesJugadas, fechaCompletado, reseña, ratingUsuario } = req.body;
    if (!mongoose.isValidObjectId(gameId)) {
      const e = new Error('Invalid gameId');
      e.status = 400;
      throw e;
    }

    const payload = { estado, horasTotalesJugadas, fechaCompletado, reseña, ratingUsuario };
    const created = await userGamesService.upsertUserGame(userId, gameId, payload);
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const updateUserGame = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updated = await userGamesService.updateUserGame(id, userId, req.body);
    if (!updated) {
      const e = new Error('UserGame not found');
      e.status = 404;
      throw e;
    }
    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const removeFromLibrary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const deleted = await userGamesService.deleteUserGame(id, userId);
    if (!deleted) {
      const e = new Error('UserGame not found');
      e.status = 404;
      throw e;
    }
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};
