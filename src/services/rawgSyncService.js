import axios from 'axios';
import dotenv from 'dotenv';
import Game from '../models/Game.js';

// Asegurar que las variables de entorno estén cargadas
dotenv.config();

const RAWG_API_BASE_URL = 'https://api.rawg.io/api';

/**
 * Obtiene la API key de RAWG desde las variables de entorno
 * @returns {string} API key de RAWG
 */
const getRawgApiKey = () => {
  return process.env.RAWG_API_KEY;
};

/**
 * Construye la URL para consultar la API de RAWG
 * @param {Object} params - Parámetros de consulta
 * @returns {string} URL construida
 */
const buildRawgUrl = (params) => {
  const queryParams = new URLSearchParams();
  
  // Agregar la API key
  const apiKey = getRawgApiKey();
  queryParams.append('key', apiKey);
  
  // Agregar parámetros dinámicamente
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  return `${RAWG_API_BASE_URL}/games?${queryParams.toString()}`;
};

/**
 * Mapea un juego de RAWG al formato de nuestra base de datos
 * @param {Object} rawgGame - Juego obtenido de RAWG
 * @returns {Object} Objeto mapeado para nuestra BD
 */
export const mapRawgGameToOurFormat = (rawgGame) => {
  return {
    titulo: rawgGame.name,
    genero: rawgGame.genres?.[0]?.name || null,
    plataforma: rawgGame.platforms?.[0]?.platform?.name || null,
    añoLanzamiento: rawgGame.released ? parseInt(rawgGame.released.split('-')[0]) : null,
    desarrollador: rawgGame.developers?.[0]?.name || '',
    imagenPortada: rawgGame.background_image || '',
    descripcion: rawgGame.description_raw || '',
    rating: rawgGame.rating || null,
    metacritic: rawgGame.metacritic || null,
    rawgId: rawgGame.id,
    esJuegoImportado: true,
    fechaCreacion: new Date(),
    // No importamos ni guardamos playtime de RAWG: el valor oficial de horas
    // proviene únicamente del usuario cuando marca el juego como completado.
    horasTotalesJugadas: null // El usuario la rellenará desde la UI al completar
  };
};

/**
 * Obtiene juegos desde la API de RAWG con paginación
 * @param {Object} queryParams - Parámetros de consulta RAWG
 * @returns {Promise<Array>} Array de juegos obtenidos
 */
export const fetchGamesFromRawg = async (queryParams) => {
  const RAWG_API_KEY = getRawgApiKey();
  
  if (!RAWG_API_KEY) {
    console.error('ERROR: RAWG_API_KEY no encontrada. Valor actual:', RAWG_API_KEY);
    console.error('Variables de entorno disponibles:', Object.keys(process.env).filter(key => key.includes('RAWG')));
    console.error('Valor directo de process.env.RAWG_API_KEY:', process.env.RAWG_API_KEY);
    throw new Error('RAWG_API_KEY no está configurada en las variables de entorno');
  }

  console.log('RAWG_API_KEY encontrada:', RAWG_API_KEY ? 'SÍ (longitud: ' + RAWG_API_KEY.length + ')' : 'NO');

  try {
    const url = buildRawgUrl(queryParams);
    console.log(`Consultando RAWG API: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 30000, // 30 segundos de timeout
      headers: {
        'User-Agent': 'GameTracker-Revolution/1.0'
      }
    });

    if (response.data && response.data.results) {
      // Devolver los objetos tal cual vienen de RAWG (mapeo posterior con detalle)
      return response.data.results;
    }
    
    return [];
  } catch (error) {
    console.error('Error al consultar RAWG API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw new Error(`Error al consultar RAWG API: ${error.message}`);
  }
};

/**
 * Sincroniza múltiples páginas de juegos desde RAWG
 * @param {Object} queryParams - Parámetros base de consulta
 * @param {number} maxPages - Número máximo de páginas a consultar
 * @returns {Promise<Object>} Resultado de la sincronización
 */
export const syncGamesFromRawg = async (queryParams, maxPages = 25) => {
  let importados = 0;
  let actualizados = 0;
  let omitidos = 0;
  let errores = 0;

  try {
    const startPage = parseInt(queryParams.page) || 1;
    const pageSize = parseInt(queryParams.page_size) || 40;
    
    console.log(`Iniciando sincronización: ${maxPages} páginas desde página ${startPage}`);

    for (let currentPage = startPage; currentPage < startPage + maxPages; currentPage++) {
      try {
        console.log(`Procesando página ${currentPage}/${startPage + maxPages - 1}`);
        
  const pageParams = { ...queryParams, page: currentPage, page_size: pageSize };
  const games = await fetchGamesFromRawg(pageParams); // array de objetos RAWG (sin mapear)
        
        if (games.length === 0) {
          console.log(`No se encontraron más juegos en la página ${currentPage}. Terminando sincronización.`);
          break;
        }

        // Antes de procesar, obtener detalle por juego (description_raw, developers, etc.)
        const maxDetailConcurrency = parseInt(process.env.RAWG_DETAIL_CONCURRENCY) || 5;

        // Helper para obtener detalle de un juego por id con retries exponenciales
        const fetchGameDetail = async (rawgId) => {
          const maxRetries = parseInt(process.env.RAWG_DETAIL_MAX_RETRIES) || 3;
          const baseDelay = parseInt(process.env.RAWG_DETAIL_BASE_DELAY_MS) || 500; // ms

          const sleep = (ms) => new Promise(r => setTimeout(r, ms));

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const detailUrl = `${RAWG_API_BASE_URL}/games/${rawgId}?key=${getRawgApiKey()}`;
              const resp = await axios.get(detailUrl, {
                timeout: 30000,
                headers: { 'User-Agent': 'GameTracker-Revolution/1.0' }
              });
              return resp.data || {};
            } catch (err) {
              const status = err.response?.status;
              const isRetryable = !status || status >= 500 || status === 429;
              const jitter = Math.floor(Math.random() * 200);
              const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;

              console.warn(`Intento ${attempt} fallido para detalle RAWG id=${rawgId} (status=${status || 'N/A'}): ${err.message}`);

              if (attempt === maxRetries || !isRetryable) {
                console.warn(`No se pudo obtener detalle para RAWG id=${rawgId} tras ${attempt} intentos.`);
                return null;
              }

              // Esperar antes del siguiente intento
              await sleep(delay);
            }
          }
          return null;
        };

        // Procesar en lotes para limitar concurrencia
        const detailedGames = [];
        for (let i = 0; i < games.length; i += maxDetailConcurrency) {
          const chunk = games.slice(i, i + maxDetailConcurrency);
          const detailPromises = chunk.map(async (g) => {
            const detail = await fetchGameDetail(g.id || g.rawgId || g.id);
            // Merge: preferir campos de detail si existen
            return { ...g, ...(detail || {}) };
          });
          const resolved = await Promise.all(detailPromises);
          detailedGames.push(...resolved);
          // Pequeña pausa entre lotes para reducir posibilidad de rate-limit
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Procesar cada juego ya con detalle (o con los campos base si fallo el detalle)
        for (const rawgObj of detailedGames) {
          try {
            const gameData = mapRawgGameToOurFormat(rawgObj);
            // Buscar si ya existe por rawgId
            const existingGame = await Game.findOne({ rawgId: gameData.rawgId });
            
            if (existingGame) {
              // Actualizar juego existente (preservando campos de usuario)
              await Game.findOneAndUpdate(
                { rawgId: gameData.rawgId },
                {
                  ...gameData,
                  ...(existingGame.ownerId && { ownerId: existingGame.ownerId }),
                  ...(existingGame.completado !== undefined && { completado: existingGame.completado })
                },
                { new: true }
              );
              actualizados++;
            } else {
              // Crear nuevo juego
              await Game.create(gameData);
              importados++;
            }
          } catch (gameError) {
            console.error(`Error procesando juego ${rawgObj.name || rawgObj.titulo || rawgObj.id}:`, gameError.message);
            omitidos++;
          }
        }

        // Pequeña pausa entre páginas para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (pageError) {
        console.error(`Error procesando página ${currentPage}:`, pageError.message);
        errores++;
        
        // Si hay muchos errores consecutivos, detener la sincronización
        if (errores > 3) {
          console.error('Demasiados errores consecutivos. Deteniendo sincronización.');
          break;
        }
      }
    }

    const resultado = {
      importados,
      actualizados,
      omitidos,
      errores,
      totalProcesados: importados + actualizados + omitidos,
      mensaje: `Sincronización completada: ${importados} nuevos, ${actualizados} actualizados, ${omitidos} omitidos`
    };

    console.log('Resultado de sincronización:', resultado);
    return resultado;

  } catch (error) {
    console.error('Error en sincronización:', error.message);
    throw error;
  }
};

/**
 * Obtiene estadísticas de juegos importados
 * @returns {Promise<Object>} Estadísticas
 */
export const getImportStats = async () => {
  try {
    const totalImportados = await Game.countDocuments({ esJuegoImportado: true });
    const totalUsuarios = await Game.countDocuments({ esJuegoImportado: false });
    const ultimaImportacion = await Game.findOne(
      { esJuegoImportado: true },
      {},
      { sort: { fechaCreacion: -1 } }
    );

    return {
      totalJuegosImportados: totalImportados,
      totalJuegosUsuarios: totalUsuarios,
      ultimaImportacion: ultimaImportacion?.fechaCreacion || null
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error.message);
    throw error;
  }
};

/**
 * Lista juegos importados (externos) desde la BD
 * filter: { search, page, limit, sort }
 */
export const listImportedGames = async (filter = {}) => {
  try {
    const query = { esJuegoImportado: true };

    if (filter.search) {
      query.$text = { $search: filter.search };
    }

    const page = Math.max(parseInt(filter.page) || 1, 1);
    const limit = Math.max(parseInt(filter.limit) || 50, 1);
    const skip = (page - 1) * limit;

    const mongoQuery = Game.find(query).sort(filter.sort || { createdAt: -1 }).skip(skip).limit(limit);
    const results = await mongoQuery.exec();
    return results;
  } catch (error) {
    console.error('Error listando juegos importados:', error.message);
    throw error;
  }
};