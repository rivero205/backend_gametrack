// Controllers for reviews - using express-validator for validation
import mongoose from 'mongoose';
import * as reviewsService from '../services/reviewsService.js';

export const createReviewForGame = async (req, res, next) => {
  try {
    // Las validaciones ya se ejecutaron en el middleware
    const { gameId } = req.params;
    const created = await reviewsService.createForGame(gameId, req.body, req.user._id);
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const listReviewsForGame = async (req, res, next) => {
  try {
    // La validación del gameId ya se ejecutó en el middleware
    const { gameId } = req.params;
    const reviews = await reviewsService.listByGame(gameId, req.user._id);
    return res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    // La validación del ID ya se ejecutó en el middleware
    const { id } = req.params;
    const deleted = await reviewsService.deleteReview(id, req.user._id);
    
    if (!deleted) {
      const e = new Error('Review not found');
      e.status = 404;
      throw e;
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const listAllReviews = async (req, res, next) => {
  try {
    const all = await reviewsService.listAll(req.user._id);
    return res.status(200).json(all);
  } catch (err) {
    next(err);
  }
};

// ----- Comunidad (pública) -----
export const listCommunityReviewsByGame = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { sort } = req.query; // 'recientes' | 'mejores' | 'likes'
    const reviews = await reviewsService.listCommunityByGame(gameId, sort);
    return res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
};

export const likeReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await reviewsService.likeReview(id, req.user._id);
    const liked = Boolean((updated.likedBy || []).some(u => String(u) === String(req.user._id)));
    return res.status(200).json({ likesCount: updated.likesCount, liked });
  } catch (err) {
    next(err);
  }
};

export const createCommunityReview = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const created = await reviewsService.createCommunityReview(gameId, req.body, req.user._id);
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const updated = await reviewsService.updateReview(id, payload, req.user._id);
    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const listCommunityAllReviews = async (req, res, next) => {
  try {
    const { sort, page, limit } = req.query;
    const reviews = await reviewsService.listCommunityAll({ sort, page, limit });
    return res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
};
