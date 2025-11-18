import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const userGameSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    gameId: { type: Types.ObjectId, ref: 'Game', required: true },
    estado: {
      type: String,
      enum: ['jugando', 'pendiente', 'completado'],
      default: 'pendiente',
    },
    horasTotalesJugadas: { type: Number, min: 0 },
    fechaCompletado: { type: Date },
    reseña: { type: String },
    ratingUsuario: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

// Evitar duplicados por par usuario-juego
userGameSchema.index({ userId: 1, gameId: 1 }, { unique: true });

const UserGame = model('UserGame', userGameSchema);

export default UserGame;
