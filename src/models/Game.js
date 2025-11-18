import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const gameSchema = new Schema(
  {
    titulo: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Opcional para juegos importados
    genero: { type: String, required: false, trim: true },
    plataforma: { type: String, required: false, trim: true },
    añoLanzamiento: { type: Number },
    desarrollador: { type: String, trim: true },
    imagenPortada: { type: String, trim: true },
  descripcion: { type: String },
  completado: { type: Boolean, default: false },
  fechaCreacion: { type: Date, default: () => new Date() },
  // Campos adicionales para la sincronización con RAWG
  rawgId: { type: Number, unique: true, sparse: true }, // ID único de RAWG
  rating: { type: Number, min: 0, max: 5 }, // Rating de RAWG
  metacritic: { type: Number, min: 0, max: 100 }, // Puntuación de Metacritic
  esJuegoImportado: { type: Boolean, default: false }, // Flag para diferenciar juegos importados
  // NUEVOS CAMPOS
  // Eliminamos el uso de `playtime` (no importamos ni guardamos el playtime de RAWG)
  horasTotalesJugadas: { type: Number, min: 0, max: 10000 } // Horas totales informadas por el usuario al completar
  },
  {
    timestamps: true
  }
);

// Basic index to speed up searches by title
gameSchema.index({ titulo: 'text' });
// Index for RAWG ID to prevent duplicates and speed up lookups
gameSchema.index({ rawgId: 1 });

const Game = model('Game', gameSchema);

export default Game;
