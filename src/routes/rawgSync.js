import express from 'express';
import * as rawgSyncController from '../controllers/rawgSyncController.js';
import { validateSyncParams } from '../validators/rawgValidators.js';
import handleValidationErrors from '../middleware/validation.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Endpoint principal para sincronizar juegos desde RAWG
router.post(
  '/sincronizar-externos',
  auth, // Requiere autenticación
  validateSyncParams,
  handleValidationErrors,
  rawgSyncController.sincronizarJuegosExternos
);

// Endpoint para obtener estadísticas de importación
router.get(
  '/estadisticas-importacion',
  auth,
  rawgSyncController.obtenerEstadisticasImportacion
);

// Endpoint para probar la conexión con RAWG (útil para debugging)
router.get(
  '/test-rawg',
  auth,
  rawgSyncController.testRawgConnection
);

// Endpoint para listar juegos importados (externos) desde la BD
// Soporta query params: search, page, limit, sort
router.get(
  '/importados',
  auth,
  rawgSyncController.listImportedGames
);

export default router;