// Services for reviews - implemented
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Game from '../models/Game.js';

export const createForGame = async (gameId, reviewData, ownerId) => {
  if (!mongoose.isValidObjectId(gameId)) {
    const err = new Error('Invalid gameId');
    err.status = 400;
    throw err;
  }

  // Ensure the game exists and belongs to the user
  const game = await Game.findOne({ _id: gameId, ownerId }).select('_id').lean().exec();
  if (!game) {
    const err = new Error('Game not found');
    err.status = 404;
    throw err;
  }

  const payload = { ...reviewData, juegoId: gameId, autorId: ownerId };
  const review = await Review.create(payload);
  return review;
};

export const listByGame = async (gameId, ownerId) => {
  if (!mongoose.isValidObjectId(gameId)) return [];
  // Verify ownership BEFORE listing
  const owned = await Game.exists({ _id: gameId, ownerId });
  if (!owned) return [];
  const reviews = await Review.find({ juegoId: gameId }).sort({ fechaCreacion: -1 }).exec();
  return reviews;
};

export const deleteReview = async (id, ownerId) => {
  if (!mongoose.isValidObjectId(id)) return null;
  // Allow deletion when the requester is either the author of the review
  // or the owner of the referenced game.
  const review = await Review.findById(id).exec();
  if (!review) return null;

  // If the authenticated user is the author, allow deletion
  if (String(review.autorId) === String(ownerId)) {
    const deleted = await Review.findByIdAndDelete(id).exec();
    return deleted;
  }

  // Otherwise, allow deletion only if the user owns the game the review references
  const owned = await Game.exists({ _id: review.juegoId, ownerId });
  if (!owned) return null;
  const deleted = await Review.findByIdAndDelete(id).exec();
  return deleted;
};

export const listAll = async (ownerId) => {
  // List reviews authored by the current user (Mis reseñas)
  if (!mongoose.isValidObjectId(ownerId)) return [];
  const all = await Review.find({ autorId: ownerId })
    .populate('juegoId', 'titulo imagenPortada rawgId esJuegoImportado ownerId')
    .populate('autorId', 'nombre')
    .sort({ fechaCreacion: -1 })
    .limit(1000)
    .exec();
  return all;
};

// ----- Comunidad (pública) -----
export const listCommunityByGame = async (gameId, sort = 'recientes') => {
  if (!mongoose.isValidObjectId(gameId)) return [];
  const sortMap = {
    recientes: { fechaCreacion: -1 },
    mejores: { puntuacion: -1, fechaCreacion: -1 },
    likes: { likesCount: -1, fechaCreacion: -1 }
  };
  const reviews = await Review.find({ juegoId: gameId })
    .populate('autorId', 'nombre nickname avatarUrl avatar')
    .sort(sortMap[sort] || sortMap.recientes)
    .limit(500)
    .exec();
  return reviews;
};

export const listCommunityAll = async ({ sort = 'recientes', page = 1, limit = 100 } = {}) => {
  const sortMap = {
    recientes: { fechaCreacion: -1 },
    mejores: { puntuacion: -1, fechaCreacion: -1 },
    likes: { likesCount: -1, fechaCreacion: -1 }
  };

  const skip = Math.max(0, (Number(page) - 1)) * Number(limit || 100);
  const q = Review.find({})
    .populate('autorId', 'nombre nickname avatarUrl avatar')
    .populate('juegoId', 'titulo imagenPortada genero plataforma rawgId esJuegoImportado ownerId')
    .sort(sortMap[sort] || sortMap.recientes)
    .skip(skip)
    .limit(Number(limit) || 100);

  const reviews = await q.exec();
  return reviews;
};

export const likeReview = async (reviewId, userId) => {
  if (!mongoose.isValidObjectId(reviewId)) {
    const err = new Error('Invalid reviewId');
    err.status = 400;
    throw err;
  }
  const review = await Review.findById(reviewId).exec();
  if (!review) {
    const err = new Error('Review not found');
    err.status = 404;
    throw err;
  }
  const already = review.likedBy?.some(u => String(u) === String(userId));
  if (already) {
    // If already liked, remove the user (toggle off)
    review.likedBy = (review.likedBy || []).filter(u => String(u) !== String(userId));
    review.likesCount = Math.max(0, (review.likesCount || 0) - 1);
  } else {
    // Add like
    review.likedBy = [...(review.likedBy || []), userId];
    review.likesCount = (review.likesCount || 0) + 1;
  }
  await review.save();
  return review;
};

export const updateReview = async (reviewId, data, userId) => {
  if (!mongoose.isValidObjectId(reviewId)) {
    const err = new Error('Invalid reviewId');
    err.status = 400;
    throw err;
  }
  const review = await Review.findById(reviewId).exec();
  if (!review) {
    const err = new Error('Review not found');
    err.status = 404;
    throw err;
  }
  // Only the author may update their review
  if (String(review.autorId) !== String(userId)) {
    const err = new Error('Not authorized to update this review');
    err.status = 403;
    throw err;
  }

  // Allowed fields to update
  const allowed = ['puntuacion', 'textoResena', 'dificultad', 'recomendaria'];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      review[key] = data[key];
    }
  }
  await review.save();
  // Return the updated review populated minimally for client convenience
  const populated = await Review.findById(reviewId)
    .populate('autorId', 'nombre nickname avatarUrl avatar')
    .populate('juegoId', 'titulo imagenPortada')
    .exec();
  return populated;
};

export const createCommunityReview = async (gameId, reviewData, userId) => {
  if (!mongoose.isValidObjectId(gameId)) {
    const err = new Error('Invalid gameId');
    err.status = 400;
    throw err;
  }
  // Asegurar que el juego existe (sin restricción de ownership)
  const exists = await Game.exists({ _id: gameId });
  if (!exists) {
    const err = new Error('Game not found');
    err.status = 404;
    throw err;
  }
  const payload = { ...reviewData, juegoId: gameId, autorId: userId };
  const review = await Review.create(payload);
  return review;
};
