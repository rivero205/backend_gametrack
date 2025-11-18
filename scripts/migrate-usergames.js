import dotenv from 'dotenv';
import connectDB from '../src/config/mongo.js';
import Game from '../src/models/Game.js';
import Review from '../src/models/Review.js';
import User from '../src/models/User.js';
import UserGame from '../src/models/UserGame.js';

dotenv.config();

const apply = process.argv.includes('--apply');

async function migrate() {
  try {
    await connectDB();

    console.log(`Modo: ${apply ? 'APLICAR cambios' : 'DRY-RUN (no se guardarán cambios)'}\n`);

    // 1) Migrar juegos que tienen ownerId (propios de un usuario)
    console.log('Buscando juegos con ownerId (potenciales items de biblioteca de usuario)...');
    const ownedGames = await Game.find({ ownerId: { $exists: true, $ne: null } }).lean().exec();
    console.log(`Juegos con ownerId encontrados: ${ownedGames.length}`);

    let createdOrUpdated = 0;
    const migratedGameIds = [];

    for (const g of ownedGames) {
      const userId = g.ownerId;
      const gameId = g._id;

      // Decide estado: si el juego global estaba marcado completado, lo pasamos a 'completado',
      // en caso contrario dejamos 'jugando' como suposición razonable.
      const estado = g.completado ? 'completado' : 'jugando';

      const campos = {};
      campos.estado = estado;
      if (g.horasTotalesJugadas !== undefined && g.horasTotalesJugadas !== null) {
        campos.horasTotalesJugadas = Number(g.horasTotalesJugadas);
      }
      if (g.completado) {
        // Si el juego estaba marcado completado en el documento global, añadimos fechaCompletado si existe createdAt
        campos.fechaCompletado = g.updatedAt || g.fechaCreacion || new Date();
      }

      if (apply) {
        await UserGame.updateOne(
          { userId, gameId },
          { $set: campos },
          { upsert: true }
        ).exec();
      }

      createdOrUpdated++;
      migratedGameIds.push(gameId);
    }

    console.log(`UserGame creados/actualizados a partir de ownerId: ${createdOrUpdated}`);

    // 2) Migrar datos desde reseñas (reviews) -> reseña y ratingUsuario en userGames
    console.log('\nMigrando reseñas (Review) a userGames...');
    const reviews = await Review.find({}).lean().exec();
    console.log(`Reseñas encontradas: ${reviews.length}`);

    let reviewsApplied = 0;
    for (const r of reviews) {
      const userId = r.autorId;
      const gameId = r.juegoId;

      const update = {};
      if (r.textoResena) update.reseña = r.textoResena;
      if (r.puntuacion !== undefined && r.puntuacion !== null) update.ratingUsuario = Number(r.puntuacion);

      if (Object.keys(update).length === 0) continue;

      if (apply) {
        await UserGame.updateOne(
          { userId, gameId },
          { $set: update },
          { upsert: true }
        ).exec();
      }

      reviewsApplied++;
    }
    console.log(`Reseñas migradas a userGames: ${reviewsApplied}`);

    // 3) Limpiar campos legacy en games, pero solo para aquellos con ownerId (migrados)
    if (apply && migratedGameIds.length) {
      console.log('\nLimpiando campos legacy en documents de Game para los juegos migrados (ownerId)...');
      const res = await Game.updateMany(
        { _id: { $in: migratedGameIds } },
        { $unset: { completado: '', horasTotalesJugadas: '' } }
      ).exec();
      console.log(`Games actualizados (campos unset): ${res.modifiedCount || res.nModified || 0}`);
    } else if (!apply) {
      console.log('\nDRY-RUN: se omite limpieza de campos en la colección games. Ejecuta con --apply para aplicar cambios.');
    }

    // 4) Reportar juegos globales completados sin ownerId (casos ambiguos)
    const ambiguous = await Game.find({ ownerId: { $exists: false }, completado: true }).lean().limit(50).exec();
    if (ambiguous.length) {
      console.log('\nATENCIÓN: Juegos con `completado: true` pero sin `ownerId` (no se pueden atribuir a un usuario automáticamente).');
      console.log(`Muestras (${ambiguous.length}):`);
      ambiguous.slice(0, 10).forEach(g => console.log(` - ${g._id} | ${g.titulo} | horas:${g.horasTotalesJugadas || 'n/a'}`));
      console.log('Revisa estos casos manualmente si necesitas atribuirlos a usuarios.');
    } else {
      console.log('\nNo se encontraron juegos ambiguos (completado sin ownerId).');
    }

    console.log('\nMigración de userGames finalizada.\nResumen:');
    console.log(` - UserGame creados/actualizados desde ownerId: ${createdOrUpdated}`);
    console.log(` - Reseñas aplicadas a userGames: ${reviewsApplied}`);
    console.log(` - Cambios aplicados: ${apply}`);

    process.exit(0);
  } catch (err) {
    console.error('Error durante migrate-usergames:', err);
    process.exit(2);
  }
}

migrate();
