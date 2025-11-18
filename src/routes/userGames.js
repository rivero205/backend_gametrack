import express from 'express';
import * as userGamesController from '../controllers/userGamesController.js';

const router = express.Router();

// List user's library
router.get('/', userGamesController.listUserLibrary);

// Add a game to library (or upsert)
router.post('/', userGamesController.addToLibrary);

// Single userGame
router.get('/:id', userGamesController.getUserGame);
router.patch('/:id', userGamesController.updateUserGame);
router.delete('/:id', userGamesController.removeFromLibrary);

export default router;
