import express from 'express';
import * as gamesController from '../controllers/gamesController.js';
import * as reviewsController from '../controllers/reviewsController.js';
import * as gameTypesController from '../controllers/gameTypesController.js'; // Nueva importación
import handleValidationErrors from '../middleware/validation.js';
import {
  validateCreateGame,
  validateUpdateGame,
  validateGameId,
  validateCreateGameReview
} from '../validators/gameValidators.js';

const router = express.Router();

// Nuevas rutas para diferenciación de tipos de juegos
router.get('/by-type/:tipo', gameTypesController.getGamesByType);
router.get('/stats-by-type', gameTypesController.getStatsByType);
router.get('/mixed', gameTypesController.getMixedGames);
router.get('/compare-library', gameTypesController.compareUserLibrary);

// Games CRUD (rutas existentes)
router.get('/', gamesController.listGames);
// Link-or-create route for external/imported games (atomic operation to avoid duplicates)
router.post('/link-or-create', handleValidationErrors, gamesController.linkOrCreateGame);

router.post('/', validateCreateGame, handleValidationErrors, gamesController.createGame);
router.get('/:id', validateGameId, handleValidationErrors, gamesController.getGame);
router.put('/:id', validateUpdateGame, handleValidationErrors, gamesController.updateGame);
router.delete('/:id', validateGameId, handleValidationErrors, gamesController.deleteGame);

// Reviews for a game
router.post('/:gameId/reviews', validateCreateGameReview, handleValidationErrors, reviewsController.createReviewForGame);
router.get('/:gameId/reviews', validateGameId, handleValidationErrors, reviewsController.listReviewsForGame);

export default router;
