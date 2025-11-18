import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    nombre: { type: String, trim: true },
    nickname: { type: String, trim: true },
    fechaNacimiento: { type: Date },
    plataformaFavorita: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    pais: { type: String, trim: true },
    preferenciasJuego: [{ type: String, trim: true }],
    nivelExperiencia: { type: String, enum: ['Beginner','Casual','Intermediate','Hardcore','Pro'], default: 'Casual' },
    email: {
      type: String, 
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

const User = model("User", userSchema);

export default User;
