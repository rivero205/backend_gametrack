import * as rawgSyncService from '../services/rawgSyncService.js';

/**
 * Endpoint para sincronizar juegos desde RAWG API
 * POST /api/juegos/sincronizar-externos
 */
export const sincronizarJuegosExternos = async (req, res, next) => {
  try {
    console.log('Iniciando sincronización de juegos desde RAWG API');
    
    // Parámetros de consulta del body
    const queryParams = req.body || {};
    
    // Parámetros por defecto para obtener juegos recientes y relevantes
    const defaultParams = {
      page: 1,
      page_size: 40,
      ordering: '-released', // Ordenar por fecha de lanzamiento (más reciente primero)
      dates: '2020-01-01,2025-12-31', // Juegos desde 2020 hasta 2025
      exclude_additions: true, // Excluir DLCs
      exclude_parents: true, // Excluir juegos padre
      exclude_game_series: true, // Excluir series de juegos
      metacritic: '70,100' // Solo juegos con buena puntuación en Metacritic
    };

    // Combinar parámetros por defecto con los enviados en el body
    const finalParams = { ...defaultParams, ...queryParams };
    
    console.log('Parámetros de sincronización:', finalParams);

    // Determinar cuántas páginas procesar (máximo 50 para no exceder límites)
    const maxPages = Math.min(parseInt(req.query.max_pages) || 25, 50);
    
    // Ejecutar la sincronización
    const resultado = await rawgSyncService.syncGamesFromRawg(finalParams, maxPages);
    
    // Obtener estadísticas actualizadas
    const stats = await rawgSyncService.getImportStats();
    
    return res.status(200).json({
      success: true,
      resultado,
      estadisticas: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en sincronización de juegos externos:', error.message);
    
    // Crear un error personalizado con más contexto
    const customError = new Error(`Error al sincronizar juegos: ${error.message}`);
    customError.status = 500;
    customError.details = {
      originalError: error.message,
      timestamp: new Date().toISOString()
    };
    
    next(customError);
  }
};

/**
 * Endpoint para obtener estadísticas de juegos importados
 * GET /api/juegos/estadisticas-importacion
 */
export const obtenerEstadisticasImportacion = async (req, res, next) => {
  try {
    const stats = await rawgSyncService.getImportStats();
    
    return res.status(200).json({
      success: true,
      estadisticas: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de importación:', error.message);
    
    const customError = new Error(`Error al obtener estadísticas: ${error.message}`);
    customError.status = 500;
    
    next(customError);
  }
};

/**
 * Endpoint para probar la conexión con RAWG API
 * GET /api/juegos/test-rawg
 */
export const testRawgConnection = async (req, res, next) => {
  try {
    console.log('Probando conexión con RAWG API');
    
    // Hacer una consulta simple para probar la conexión
    const testParams = {
      page: 1,
      page_size: 5,
      search: 'witcher'
    };
    
    const games = await rawgSyncService.fetchGamesFromRawg(testParams);
    // Mapear a formato local para la respuesta de prueba (como antes)
    const mapped = games.map(rawgSyncService.mapRawgGameToOurFormat);

    return res.status(200).json({
      success: true,
      mensaje: 'Conexión con RAWG API exitosa',
      juegosEncontrados: mapped.length,
      ejemploJuegos: mapped.slice(0, 2), // Mostrar solo los primeros 2 juegos como ejemplo
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error probando conexión con RAWG:', error.message);
    
    const customError = new Error(`Error de conexión con RAWG: ${error.message}`);
    customError.status = 503; // Service Unavailable
    
    next(customError);
  }
};

/**
 * Endpoint para listar juegos importados (externos) desde la BD
 * GET /api/juegos/importados
 */
export const listImportedGames = async (req, res, next) => {
  try {
    const filter = {
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort
    };

    const results = await rawgSyncService.listImportedGames(filter);

    return res.status(200).json({
      success: true,
      count: results.length,
      juegos: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error listando juegos importados:', error.message);
    const customError = new Error(`Error al listar juegos importados: ${error.message}`);
    customError.status = 500;
    next(customError);
  }
};