// Funciones auxiliares para diferenciar tipos de juegos
import Game from '../models/Game.js';

/**
 * Obtiene solo juegos creados por usuarios
 * @param {string} userId - ID del usuario (opcional)
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} Juegos de usuarios
 */
export const getUserGames = async (userId = null, filters = {}) => {
  const query = {
    esJuegoImportado: false,
    ...filters
  };

  if (userId) {
    query.ownerId = userId;
  } else {
    query.ownerId = { $exists: true };
  }

  return await Game.find(query).sort({ createdAt: -1 });
};

/**
 * Obtiene solo juegos importados desde RAWG
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} Juegos importados
 */
export const getImportedGames = async (filters = {}) => {
  const query = {
    esJuegoImportado: true,
    rawgId: { $exists: true },
    ...filters
  };

  return await Game.find(query).sort({ rating: -1, metacritic: -1 });
};

/**
 * Obtiene juegos mixtos (usuarios + importados) para recomendaciones
 * @param {string} userId - ID del usuario
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Object>} Objeto con juegos separados por tipo
 */
export const getMixedGames = async (userId, filters = {}) => {
  const userGames = await getUserGames(userId, filters);
  const importedGames = await getImportedGames(filters);

  return {
    userGames,
    importedGames,
    totalUserGames: userGames.length,
    totalImportedGames: importedGames.length
  };
};

/**
 * Buscar juegos por tipo específico
 * @param {string} tipo - 'usuario', 'importado', 'todos'
 * @param {string} userId - ID del usuario
 * @param {Object} searchParams - Parámetros de búsqueda
 * @returns {Promise<Array>} Juegos encontrados
 */
export const searchGamesByType = async (tipo, userId, searchParams = {}) => {
  const { search, genero, plataforma, page = 1, limit = 20 } = searchParams;
  
  let baseQuery = {};
  
  // Construir filtros base
  if (search) {
    baseQuery.$text = { $search: search };
  }
  if (genero) baseQuery.genero = genero;
  if (plataforma) baseQuery.plataforma = plataforma;

  // Aplicar filtro por tipo
  switch (tipo.toLowerCase()) {
    case 'usuario':
      baseQuery.ownerId = userId;
      baseQuery.esJuegoImportado = false;
      break;
    case 'importado':
      baseQuery.esJuegoImportado = true;
      break;
    case 'todos':
      baseQuery.$or = [
        { ownerId: userId },
        { esJuegoImportado: true }
      ];
      break;
    default:
      throw new Error('Tipo no válido. Use: usuario, importado, todos');
  }

  const skip = (page - 1) * limit;
  
  return await Game.find(baseQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Estadísticas de juegos por tipo
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas detalladas
 */
export const getGameStatsByType = async (userId) => {
  const [userStats, importedStats] = await Promise.all([
    // Estadísticas de juegos del usuario
    Game.aggregate([
      { $match: { ownerId: userId, esJuegoImportado: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completados: { $sum: { $cond: ['$completado', 1, 0] } },
          generos: { $addToSet: '$genero' },
          plataformas: { $addToSet: '$plataforma' }
        }
      }
    ]),
    
    // Estadísticas de juegos importados
    Game.aggregate([
      { $match: { esJuegoImportado: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          ratingPromedio: { $avg: '$rating' },
          metacriticPromedio: { $avg: '$metacritic' },
          generos: { $addToSet: '$genero' },
          plataformas: { $addToSet: '$plataforma' }
        }
      }
    ])
  ]);

  return {
    usuario: userStats[0] || { total: 0, completados: 0, generos: [], plataformas: [] },
    importados: importedStats[0] || { total: 0, ratingPromedio: 0, metacriticPromedio: 0, generos: [], plataformas: [] }
  };
};