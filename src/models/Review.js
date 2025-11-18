import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const reviewSchema = new Schema(
  {
    juegoId: { type: Types.ObjectId, ref: "Game", required: true },
    // Autor de la reseña (usuario autenticado)
    autorId: { type: Types.ObjectId, ref: "User", required: true },
    puntuacion: { type: Number, required: true, min: 1, max: 5 },
    textoResena: { type: String },
    dificultad: {
      type: String,
      enum: ["Fácil", "Normal", "Difícil"],
      default: "Normal",
    },
    recomendaria: { type: Boolean, default: false },
    // Likes para comunidad
    likesCount: { type: Number, default: 0, min: 0 },
    likedBy: [{ type: Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: { createdAt: "fechaCreacion", updatedAt: "fechaActualizacion" },
  }
);

// Compound index on juegoId and puntuacion can be helpful for queries
reviewSchema.index({ juegoId: 1, puntuacion: -1 });

const Review = model("Review", reviewSchema);

export default Review;
