import { body, query } from 'express-validator';

/**
 * Validaciones para el endpoint de sincronización con RAWG
 */
export const validateSyncParams = [
  // Validaciones para el body (parámetros de consulta RAWG)
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page debe ser un número entero mayor a 0'),
    
  body('page_size')
    .optional()
    .isInt({ min: 1, max: 40 })
    .withMessage('page_size debe ser un número entre 1 y 40'),
    
  body('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('search debe ser una cadena de máximo 100 caracteres'),
    
  body('search_precise')
    .optional()
    .isBoolean()
    .withMessage('search_precise debe ser un booleano'),
    
  body('search_exact')
    .optional()
    .isBoolean()
    .withMessage('search_exact debe ser un booleano'),
    
  body('parent_platforms')
    .optional()
    .isString()
    .trim()
    .withMessage('parent_platforms debe ser una cadena'),
    
  body('platforms')
    .optional()
    .isString()
    .trim()
    .withMessage('platforms debe ser una cadena'),
    
  body('stores')
    .optional()
    .isString()
    .trim()
    .withMessage('stores debe ser una cadena'),
    
  body('developers')
    .optional()
    .isString()
    .trim()
    .withMessage('developers debe ser una cadena'),
    
  body('publishers')
    .optional()
    .isString()
    .trim()
    .withMessage('publishers debe ser una cadena'),
    
  body('genres')
    .optional()
    .isString()
    .trim()
    .withMessage('genres debe ser una cadena'),
    
  body('tags')
    .optional()
    .isString()
    .trim()
    .withMessage('tags debe ser una cadena'),
    
  body('creators')
    .optional()
    .isString()
    .trim()
    .withMessage('creators debe ser una cadena'),
    
  body('dates')
    .optional()
    .isString()
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$/)
    .withMessage('dates debe tener el formato YYYY-MM-DD,YYYY-MM-DD'),
    
  body('updated')
    .optional()
    .isString()
    .trim()
    .withMessage('updated debe ser una cadena'),
    
  body('platforms_count')
    .optional()
    .isInt({ min: 1 })
    .withMessage('platforms_count debe ser un número entero mayor a 0'),
    
  body('metacritic')
    .optional()
    .isString()
    .trim()
    .matches(/^\d{1,3}(,\d{1,3})?$/)
    .withMessage('metacritic debe tener el formato "min,max" o "value"'),
    
  body('exclude_collection')
    .optional()
    .isString()
    .trim()
    .withMessage('exclude_collection debe ser una cadena'),
    
  body('exclude_additions')
    .optional()
    .isBoolean()
    .withMessage('exclude_additions debe ser un booleano'),
    
  body('exclude_parents')
    .optional()
    .isBoolean()
    .withMessage('exclude_parents debe ser un booleano'),
    
  body('exclude_game_series')
    .optional()
    .isBoolean()
    .withMessage('exclude_game_series debe ser un booleano'),
    
  body('exclude_stores')
    .optional()
    .isString()
    .trim()
    .withMessage('exclude_stores debe ser una cadena'),
    
  body('ordering')
    .optional()
    .isString()
    .trim()
    .isIn([
      'name', '-name',
      'released', '-released',
      'added', '-added',
      'created', '-created',
      'updated', '-updated',
      'rating', '-rating',
      'metacritic', '-metacritic'
    ])
    .withMessage('ordering debe ser un campo válido de ordenamiento'),

  // Validaciones para query params
  query('max_pages')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('max_pages debe ser un número entre 1 y 50')
];