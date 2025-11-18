import { body } from 'express-validator';

export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El nombre debe tener máximo 100 caracteres'),
  body('nickname')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El apodo debe tener máximo 50 caracteres'),
  body('fechaNacimiento')
    .optional()
    .isISO8601()
    .toDate(),
  body('plataformaFavorita')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('La plataforma favorita debe tener máximo 50 caracteres'),
  body('avatarUrl')
    .optional()
    .custom((value) => {
      if (!value) return true;
      // Permitir URLs absolutas válidas, incluyendo localhost y 127.0.0.1
      const urlPattern = /^(https?:\/\/(localhost|127\.0\.0\.1|[\w.-]+)(:[0-9]+)?(\/.*)?$)/i;
      // Permitir rutas relativas que empiezan con /assets/portadas/
      const relativePattern = /^\/assets\/portadas\//;
      if (urlPattern.test(value) || relativePattern.test(value)) return true;
      throw new Error('Avatar debe ser una URL válida (http(s), localhost o ruta relativa)');
    }),
  body('pais')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('El país debe tener máximo 60 caracteres'),
  body('preferenciasJuego')
    .optional()
    .isArray()
    .withMessage('Preferencias de juego debe ser un arreglo de strings'),
  body('nivelExperiencia')
    .optional()
    .isIn(['Beginner','Casual','Intermediate','Hardcore','Pro'])
    .withMessage('Nivel de experiencia inválido')
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

export const validateProfileUpdate = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El nombre debe tener máximo 100 caracteres'),
  body('nickname')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El apodo debe tener máximo 50 caracteres'),
  body('fechaNacimiento')
    .optional()
    .isISO8601()
    .toDate(),
  body('plataformaFavorita')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('La plataforma favorita debe tener máximo 50 caracteres'),
  body('avatarUrl')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const urlPattern = /^(https?:\/\/(localhost|127\.0\.0\.1|[\w.-]+)(:[0-9]+)?(\/.*)?$)/i;
      const relativePattern = /^\/assets\/portadas\//;
      if (urlPattern.test(value) || relativePattern.test(value)) return true;
      throw new Error('Avatar debe ser una URL válida (http(s), localhost o ruta relativa)');
    }),
  body('pais')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('El país debe tener máximo 60 caracteres'),
  body('preferenciasJuego')
    .optional()
    .isArray()
    .withMessage('Preferencias de juego debe ser un arreglo de strings'),
  body('nivelExperiencia')
    .optional()
    .isIn(['Beginner','Casual','Intermediate','Hardcore','Pro'])
    .withMessage('Nivel de experiencia inválido')
];
