import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';  // ← NUEVO: Importar cors
import connectDB from './src/config/mongo.js';
import gamesRouter from './src/routes/games.js';
import reviewsRouter from './src/routes/reviews.js';
import authRouter from './src/routes/auth.js';
import rawgSyncRouter from './src/routes/rawgSync.js'; // ← NUEVO: Importar rutas de sincronización RAWG
import userGamesRouter from './src/routes/userGames.js';
import uploadsRouter from './src/routes/uploads.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import errorHandler from './src/middleware/errorHandler.js';
import authMiddleware from './src/middleware/auth.js';
import { listImportedGames } from './src/controllers/rawgSyncController.js'; // Para endpoint público
import { listCommunityReviewsByGame, createCommunityReview, listCommunityAllReviews } from './src/controllers/reviewsController.js';

dotenv.config();

// En producción exigimos JWT_SECRET para evitar iniciar con una clave por defecto.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: NODE_ENV=production pero no se encontró JWT_SECRET en las variables de entorno.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
// Habilitar CORS con credenciales para soportar cookies httpOnly cuando sea necesario.
// Si quieres restringir el origen, define CLIENT_ORIGIN en el .env (por ejemplo: http://localhost:5173)
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || true,
  credentials: true,
};
app.use(cors(corsOptions));
// Increase body size limits to accommodate larger payloads (e.g. temporary base64 images).
// Prefer uploading files via `/api/uploads` (multipart/form-data) instead of embedding large base64 in JSON.
app.use(express.json({ limit: process.env.EXPRESS_JSON_LIMIT || '10mb' }));
app.use(express.urlencoded({ limit: process.env.EXPRESS_URLENCODED_LIMIT || '10mb', extended: true }));

// Serve uploaded cover images from backend/public/assets/portadas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'public', 'assets', 'portadas');
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  console.error('Failed to create uploads directory', uploadsDir, err);
}
app.use('/assets/portadas', express.static(uploadsDir));


// Ruta principal de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a GameTrack Revolution API',
    status: 'OK',
    docs: 'Consulta el README o /api para ver los endpoints disponibles.'
  });
});

// Endpoint público para juegos importados (sin autenticación)
app.get('/api/games/importados', listImportedGames);
// Endpoints de comunidad (listar reseñas es público)
app.get('/api/community/games/:gameId/reviews', listCommunityReviewsByGame);
app.get('/api/community/reviews', listCommunityAllReviews);

// Rutas protegidas con autenticación
app.use('/api/games', authMiddleware, rawgSyncRouter); // RAWG sync endpoints (must come first)
app.use('/api/games', authMiddleware, gamesRouter);
app.use('/api/reviews', authMiddleware, reviewsRouter);
// Biblioteca de usuario
app.use('/api/usergames', authMiddleware, userGamesRouter);
app.use('/api/auth', authRouter);
// Uploads (covers) - require auth
app.use('/api/uploads', authMiddleware, uploadsRouter);

app.post('/api/community/games/:gameId/reviews', authMiddleware, createCommunityReview);

app.use(errorHandler);

// Start server after DB connection
(async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle common server errors (e.g. port in use)
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please free the port or set PORT env var to a different value.`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})(); 
