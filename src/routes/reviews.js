import express from 'express';
import * as reviewsController from '../controllers/reviewsController.js';
import handleValidationErrors from '../middleware/validation.js';
import { validateReviewId, validateCreateReview } from '../validators/gameValidators.js';

const router = express.Router();

router.delete('/:id', validateReviewId, handleValidationErrors, reviewsController.deleteReview);
router.get('/', reviewsController.listAllReviews);
// Like una reseña (requiere auth, aplicado en server)
router.post('/:id/like', validateReviewId, handleValidationErrors, reviewsController.likeReview);
// Update a review (author only)
router.patch('/:id', validateReviewId, ...validateCreateReview, handleValidationErrors, reviewsController.updateReview);

export default router;
