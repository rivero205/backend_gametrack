// Controllers for games - using express-validator for validation
import mongoose from 'mongoose';
import * as gamesService from '../services/gamesService.js';

export const listGames = async (req, res, next) => {
  try {
    const filter = {
      search: req.query.search,
      genero: req.query.genero,
      plataforma: req.query.plataforma,
      completado: req.query.completado,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort
    };

    const results = await gamesService.listGames(filter, req.user._id);
    return res.status(200).json(results);
  } catch (err) {
    next(err);
  }
};

export const createGame = async (req, res, next) => {
  try {
    // Las validaciones ya se ejecutaron en el middleware
    const created = await gamesService.createGame(req.body, req.user._id);
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const linkOrCreateGame = async (req, res, next) => {
  try {
    const { rawgId } = req.body;
    // Accept numeric or string rawgId; only error if absent (null/undefined)
    if (rawgId === undefined || rawgId === null) {
      const e = new Error('rawgId is required');
      e.status = 400;
      throw e;
    }

    // gameData: include common fields like titulo, imagenPortada, descripcion, etc.
    const gameData = {
      titulo: req.body.titulo,
      genero: req.body.genero,
      plataforma: req.body.plataforma,
      añoLanzamiento: req.body.añoLanzamiento,
      desarrollador: req.body.desarrollador,
      imagenPortada: req.body.imagenPortada,
      descripcion: req.body.descripcion,
      metacritic: req.body.metacritic,
    };

    const game = await gamesService.linkOrCreateByRawg(rawgId, gameData);
    return res.status(200).json(game);
  } catch (err) {
    next(err);
  }
};

export const getGame = async (req, res, next) => {
  try {
    // La validación del ID ya se ejecutó en el middleware
    const { id } = req.params;
    const game = await gamesService.getGameById(id, req.user._id);
    if (!game) {
      const e = new Error('Game not found');
      e.status = 404;
      throw e;
    }

    return res.status(200).json(game);
  } catch (err) {
    next(err);
  }
};

export const updateGame = async (req, res, next) => {
  try {
    // Las validaciones ya se ejecutaron en el middleware
    const { id } = req.params;
    const updated = await gamesService.updateGame(id, req.body, req.user._id);
    
    if (!updated) {
      const e = new Error('Game not found');
      e.status = 404;
      throw e;
    }

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteGame = async (req, res, next) => {
  try {
    // La validación del ID ya se ejecutó en el middleware
    const { id } = req.params;
    const deleted = await gamesService.deleteGame(id, req.user._id);
    
    if (!deleted) {
      const e = new Error('Game not found');
      e.status = 404;
      throw e;
    }

    // 204 No Content
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};
