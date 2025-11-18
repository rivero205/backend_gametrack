import dotenv from 'dotenv';
import connectDB from '../src/config/mongo.js';
import Game from '../src/models/Game.js';
import Review from '../src/models/Review.js';

dotenv.config();

async function migrate() {
  try {
    await connectDB();

    console.log('Buscando juegos con campos legacy (playtime/horasJugadas)...');
    const legacyGames = await Game.find({ $or: [ { playtime: { $exists: true } }, { horasJugadas: { $exists: true } } ] }).lean().exec();
    console.log(`Juegos legacy encontrados: ${legacyGames.length}`);

    let updatedGames = 0;
    for (const g of legacyGames) {
      const update = {};
      // If there's horasJugadas and no horasTotalesJugadas, migrate it
      if (g.horasJugadas !== undefined && g.horasJugadas !== null && (g.horasTotalesJugadas === undefined || g.horasTotalesJugadas === null)) {
        update.horasTotalesJugadas = Number(g.horasJugadas);
      }
      // Always remove playtime and horasJugadas if present
      if (g.playtime !== undefined) update.playtime = undefined;
      if (g.horasJugadas !== undefined) update.horasJugadas = undefined;

      // Skip if no changes
      if (Object.keys(update).length === 0) continue;

      // Build final update object for mongoose (unset fields must be in $unset)
      const setFields = {};
      const unsetFields = {};
      if (update.horasTotalesJugadas !== undefined) setFields.horasTotalesJugadas = update.horasTotalesJugadas;
      if (update.playtime === undefined) unsetFields.playtime = "";
      if (update.horasJugadas === undefined) unsetFields.horasJugadas = "";

      const updateObj = {};
      if (Object.keys(setFields).length) updateObj.$set = setFields;
      if (Object.keys(unsetFields).length) updateObj.$unset = unsetFields;

      await Game.updateOne({ _id: g._id }, updateObj).exec();
      updatedGames++;
    }

    console.log(`Juegos actualizados: ${updatedGames}`);

    // Reviews: eliminar campo horasJugadas si existe
    console.log('Eliminando campo horasJugadas de reseñas (si existe)...');
    const res = await Review.updateMany({ horasJugadas: { $exists: true } }, { $unset: { horasJugadas: "" } }).exec();
    console.log(`Reseñas afectadas: ${res.modifiedCount || res.nModified || 0}`);

    console.log('Migración finalizada.');
    process.exit(0);
  } catch (err) {
    console.error('Error durante la migración:', err);
    process.exit(2);
  }
}

migrate();
