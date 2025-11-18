import dotenv from 'dotenv';
import connectDB from '../src/config/mongo.js';
import Game from '../src/models/Game.js';
import Review from '../src/models/Review.js';

dotenv.config();
const apply = process.argv.includes('--apply');

async function run() {
  try {
    await connectDB();
    console.log(`Modo: ${apply ? 'APLICAR cambios' : 'DRY-RUN'}`);

    // Buscar games que todavía tengan completado u horas
    const gamesWithLegacy = await Game.find({ $or: [{ completado: { $exists: true } }, { horasTotalesJugadas: { $exists: true } }] }).lean().exec();
    console.log(`Games con campos legacy encontrados: ${gamesWithLegacy.length}`);

    if (gamesWithLegacy.length > 0) {
      if (!apply) {
        console.log('Listado muestra (10):');
        gamesWithLegacy.slice(0, 10).forEach(g => console.log(` - ${g._id} | ${g.titulo} | completado:${g.completado} | horas:${g.horasTotalesJugadas}`));
        console.log('Ejecuta con --apply para borrarlos (solo si estás seguro).');
      } else {
        const res = await Game.updateMany({ _id: { $in: gamesWithLegacy.map(g => g._id) } }, { $unset: { completado: '', horasTotalesJugadas: '' } }).exec();
        console.log(`Games actualizados (unset): ${res.modifiedCount || res.nModified || 0}`);
      }
    } else {
      console.log('No se encontraron campos legacy en games.');
    }

    // Reviews: eliminar campo horasJugadas si existe
    const reviewsWithHours = await Review.find({ horasJugadas: { $exists: true } }).lean().exec();
    console.log(`Reviews con horasJugadas: ${reviewsWithHours.length}`);
    if (reviewsWithHours.length > 0) {
      if (!apply) {
        console.log('Listado muestra reviews (10):');
        reviewsWithHours.slice(0, 10).forEach(r => console.log(` - ${r._id} | juego:${r.juegoId} | autor:${r.autorId} | horas:${r.horasJugadas}`));
        console.log('Ejecuta con --apply para borrarlos.');
      } else {
        const res = await Review.updateMany({ horasJugadas: { $exists: true } }, { $unset: { horasJugadas: '' } }).exec();
        console.log(`Reviews actualizadas (unset): ${res.modifiedCount || res.nModified || 0}`);
      }
    } else {
      console.log('No se encontraron campos horasJugadas en reviews.');
    }

    console.log('Cleanup terminado.');
    process.exit(0);
  } catch (err) {
    console.error('Error en cleanup-legacy:', err);
    process.exit(2);
  }
}

run();
