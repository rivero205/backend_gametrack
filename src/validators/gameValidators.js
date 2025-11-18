import { body, param } from 'express-validator';

// Validaciones para juegos
const validateCreateGame = [
  body('titulo')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('El título es requerido y debe tener máximo 200 caracteres'),
  
  body('genero')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('El género debe tener máximo 100 caracteres'),
  
  body('plataforma')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La plataforma debe tener máximo 100 caracteres'),
  
  body('añoLanzamiento')
    .optional({ nullable: true })
    .isInt({ min: 1950, max: new Date().getFullYear() + 5 })
    .withMessage(`El año de lanzamiento debe estar entre 1950 y ${new Date().getFullYear() + 5}`),
  
  body('desarrollador')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('El desarrollador debe tener máximo 200 caracteres'),
  
  // Eliminado: no se acepta ni se valida `playtime` (no lo importamos ni guardamos)
  body('horasTotalesJugadas')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Las horas totales jugadas deben ser un número entre 0 y 10000'),

  body('imagenPortada')
    .optional({ nullable: true })
    .custom((value) => {
      if (!value) return true;
      // Validar si es una URL válida o un data URL (base64)
      if (value.startsWith('data:image/')) {
        return true; // Es un data URL válido
      }
      // Validar URL
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('La imagen debe ser una URL válida');
      }
    }),
  
  body('descripcion')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción debe tener máximo 1000 caracteres'),
  
  body('completado')
    .optional()
    .isBoolean()
    .withMessage('Completado debe ser un valor booleano')
];

const validateUpdateGame = [
  param('id')
    .isMongoId()
    .withMessage('ID de juego inválido'),
  
  ...validateCreateGame
];

const validateGameId = [
  param('id')
    .isMongoId()
    .withMessage('ID de juego inválido')
];

// Validaciones para reseñas
const validateCreateReview = [
  body('puntuacion')
    .isInt({ min: 1, max: 5 })
    .withMessage('La puntuación debe ser un número entre 1 y 5'),
  
  body('textoResena')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La reseña debe tener máximo 2000 caracteres'),
  
  // Eliminado: las reseñas ya no contienen horas jugadas; esas se registran al completar el juego
  
  body('dificultad')
    .optional({ nullable: true })
    // Keep values aligned with the Review model: 'Fácil', 'Normal', 'Difícil'
    .isIn(['Fácil', 'Normal', 'Difícil'])
    .withMessage('La dificultad debe ser: Fácil, Normal o Difícil'),
  
  body('recomendaria')
    .optional()
    .isBoolean()
    .withMessage('Recomendaría debe ser un valor booleano')
];

const validateCreateGameReview = [
  param('gameId')
    .isMongoId()
    .withMessage('ID de juego inválido'),
  
  ...validateCreateReview
];

const validateReviewId = [
  param('id')
    .isMongoId()
    .withMessage('ID de reseña inválido')
];

// Validaciones para consultas
const validateGameQuery = [
  body('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La búsqueda debe tener máximo 200 caracteres'),
  
  body('genero')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El filtro de género debe tener máximo 100 caracteres'),
  
  body('plataforma')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El filtro de plataforma debe tener máximo 100 caracteres'),
  
  body('completado')
    .optional()
    .isIn(['true', 'false', ''])
    .withMessage('El filtro de completado debe ser "true", "false" o vacío')
];

export {
  validateCreateGame,
  validateUpdateGame,
  validateGameId,
  validateCreateReview,
  validateCreateGameReview,
  validateReviewId,
  validateGameQuery
};