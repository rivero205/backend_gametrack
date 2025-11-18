# 🚀 Back end — GameTrack Revolution

API REST para GameTrack Revolution (Node.js + Express + MongoDB). Este servicio expone los endpoints que usa el frontend para gestionar juegos, reseñas, usuarios y sincronizaciones con servicios externos (por ejemplo, RAWG).

---

## 🔧 Tecnologías

- Node.js (recomendado >= 18)
- Express
- MongoDB (Mongoose)
- Autenticación con JWT
- Middleware para validación, subida de archivos (`multer`) y CORS

Archivos clave:

- `server.js` — entrada principal del servidor.
- `src/config/mongo.js` — conexión a MongoDB.
- `src/routes/` — rutas de la API.
- `src/controllers/` — controladores con la lógica de negocio.
- `src/models/` — esquemas de Mongoose.
- `src/services/` — servicios auxiliares (RAWG sync, usuarios, etc.).

---

## ✨ ¿Qué hace esta API?

- Gestión CRUD de juegos (propios e importados).
- Gestión de reseñas y puntuaciones.
- Autenticación y autorización de usuarios.
- Sincronización/importación desde RAWG y herramientas de deduplicado/migración.
- Endpoints para estadísticas y reportes de importación.

Documentación relacionada:

- `RAWG_SYNC_API.md` — detalles sobre la sincronización con RAWG.
- `GUIA_DIFERENCIACION_JUEGOS.md` — criterios para diferenciar juegos importados vs. locales.

---

## 🛠️ Instalación rápida (desarrollo)

1. Clona el repositorio y entra en la carpeta `backend`.

2. Instala dependencias:

```powershell
npm install
```

3. Crea el archivo de variables de entorno (copia del ejemplo):

```powershell
copy .env.example .env
# (o `cp .env.example .env` en Linux/macOS)
```

4. Edita `.env` con las credenciales necesarias (ver sección siguiente).

5. Ejecuta en modo desarrollo (con nodemon):

```powershell
npm run dev
```

O para producción:

```powershell
npm start
```

---

## ⚙️ Scripts disponibles

- `npm run dev` — inicia `nodemon server.js` (desarrollo).
- `npm start` — ejecuta `node server.js` (producción).
- `npm run migrate:hours` — script de migración de horas jugadas.
- `npm run migrate:usergames` — migración de datos de usergames.
- `npm run cleanup:legacy` — limpieza de datos legados.
- `npm run dedupe:imported` — deduplicación de juegos importados.

Los scripts están definidos en `backend/package.json`.

---

## 🔐 Variables de entorno (recomendadas)

Configura estas variables en tu `.env` (ejemplo):

```
MONGO_URI=mongodb://user:pass@host:port/dbname
MONGO_DB=gametracker

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

RAWG_API_KEY=your_rawg_key

PORT=5001
CLIENT_ORIGIN=http://localhost:5173
```

- `MONGO_URI` — string de conexión a MongoDB.
- `JWT_SECRET` — clave para firmar tokens JWT (usa una fuerte en producción).
- `RAWG_API_KEY` — (opcional) clave para RAWG si la sincronización la requiere.
- `PORT` — puerto en el que corre la API.
- `CLIENT_ORIGIN` — URL del frontend para CORS.

---

## 📡 Rutas y endpoints principales (resumen)

URLs base: `http://localhost:<PORT>/api` (reemplaza `<PORT>` por el valor de tu `.env`).

- Juegos:
	- `GET  /api/games` — listar juegos
	- `POST /api/games` — crear juego
	- `GET  /api/games/:id` — ver juego
	- `PUT  /api/games/:id` — actualizar juego
	- `DELETE /api/games/:id` — eliminar juego

- Sincronización RAWG:
	- `POST /api/games/sincronizar-externos` — importar desde RAWG
	- `GET  /api/games/estadisticas-importacion` — estadísticas de importación
	- `GET  /api/games/test-rawg` — probar conexión a RAWG

- Reseñas:
	- `POST /api/games/:gameId/reviews` — crear reseña
	- `GET  /api/games/:gameId/reviews` — listar reseñas de un juego
	- `DELETE /api/reviews/:id` — borrar reseña

- Usuarios / Auth:
	- `POST /api/auth/register` — registrar usuario
	- `POST /api/auth/login` — obtener token

Consulta `src/routes/` para la lista completa de rutas y middlewares.

---

## 🧪 Ejemplos rápidos (curl)

Crear juego (reemplaza `<PORT>` y ajusta el body según tu esquema):

```bash
curl -X POST http://localhost:<PORT>/api/games \
	-H "Content-Type: application/json" \
	-d '{"titulo":"Hollow Knight","genero":"Metroidvania","plataforma":"PC","anioLanzamiento":2017}'
```

Crear reseña (reemplaza `<PORT>` y `GAME_ID`):

```bash
curl -X POST http://localhost:<PORT>/api/games/GAME_ID/reviews \
	-H "Content-Type: application/json" \
	-d '{"puntuacion":5,"textoResena":"Excelente","horasJugadas":30,"dificultad":"Normal","recomendaria":true}'
```

---

## 📁 Documentación y utilidades

- Postman collection: `docs/postman/Community.postman_collection.json` (ajusta base URL).
- Scripts de migración y limpieza en `backend/scripts/`.
- Documentos de soporte: `RAWG_SYNC_API.md`, `GUIA_DIFERENCIACION_JUEGOS.md`, `RESUMEN_IMPLEMENTACION.md`.

---

## 🤝 Contribuir

- Abre una issue describiendo tu propuesta o bug.
- Crea un PR con una descripción clara y pasos para probar los cambios.
- Añade tests/manual checks para cambios en lógica crítica (migraciones, sincronización).

---

¿Quieres que añada badges (build, node version), ejemplos de Postman o una sección con convenciones de commits/PRs? Puedo generar un `backend/.env.example` más detallado si lo deseas.
