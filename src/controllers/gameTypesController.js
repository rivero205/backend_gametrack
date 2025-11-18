import * as gameTypesService from '../services/gameTypesService.js';

/**
 * Obtener juegos por tipo (usuario, importado, todos)
 * GET /api/games/by-type/:tipo
 */
export const getGamesByType = async (req, res, next) => {
  try {
    const { tipo } = req.params;
    const userId = req.user._id;
    const searchParams = {
      search: req.query.search,
      genero: req.query.genero,
      plataforma: req.query.plataforma,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const juegos = await gameTypesService.searchGamesByType(tipo, userId, searchParams);
    
    return res.status(200).json({
      success: true,
      tipo,
      juegos,
      total: juegos.length,
      page: searchParams.page,
      limit: searchParams.limit
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener estadísticas de juegos por tipo
 * GET /api/games/stats-by-type
 */
export const getStatsByType = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const stats = await gameTypesService.getGameStatsByType(userId);
    
    return res.status(200).json({
      success: true,
      estadisticas: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener juegos mixtos (usuarios + importados)
 * GET /api/games/mixed
 */
export const getMixedGames = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const filters = {
      genero: req.query.genero,
      plataforma: req.query.plataforma
    };

    const result = await gameTypesService.getMixedGames(userId, filters);
    
    return res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Comparar biblioteca del usuario con juegos importados
 * GET /api/games/compare-library
 */
export const compareUserLibrary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Obtener juegos del usuario
    const userGames = await gameTypesService.getUserGames(userId);
    
    // Obtener juegos importados similares (mismo género o desarrollador)
    const userGenres = [...new Set(userGames.map(game => game.genero).filter(Boolean))];
    const userDevelopers = [...new Set(userGames.map(game => game.desarrollador).filter(Boolean))];
    
    const recommendedGames = await gameTypesService.getImportedGames({
      $or: [
        { genero: { $in: userGenres } },
        { desarrollador: { $in: userDevelopers } }
      ],
      rating: { $gte: 4.0 }, // Solo juegos bien calificados
      metacritic: { $gte: 75 } // Solo juegos con buena puntuación
    });

    // Excluir juegos que el usuario ya tiene (por título similar)
    const userTitles = userGames.map(game => game.titulo.toLowerCase());
    const filteredRecommendations = recommendedGames.filter(game => 
      !userTitles.some(userTitle => 
        userTitle.includes(game.titulo.toLowerCase()) || 
        game.titulo.toLowerCase().includes(userTitle)
      )
    ).slice(0, 10); // Solo top 10 recomendaciones

    return res.status(200).json({
      success: true,
      userLibrary: {
        total: userGames.length,
        genres: userGenres,
        developers: userDevelopers
      },
      recommendations: filteredRecommendations,
      totalRecommendations: filteredRecommendations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
};