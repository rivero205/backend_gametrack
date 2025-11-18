# 🚀 API de Sincronización con RAWG

Este documento describe el endpoint para sincronizar juegos desde la API pública de RAWG.

## 📋 Configuración Previa

### 1. Obtener API Key de RAWG
1. Visita [RAWG API Docs](https://rawg.io/apidocs)
2. Crea una cuenta gratuita
3. Obtén tu API key
4. Agrega la clave en tu archivo `.env`:
   ```
   RAWG_API_KEY=tu_api_key_aqui
   ```

### 2. Límites del Plan Gratuito
- **20,000 requests por mes**
- Renovación: **día 9 de cada mes**
- Cada request puede obtener hasta **40 juegos** (`page_size=40`)

## 🛠️ Endpoints Disponibles

### 1. Sincronizar Juegos Externos
**`POST /api/games/sincronizar-externos`**

Importa juegos desde RAWG API y los guarda en la base de datos local.

#### Headers Requeridos
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Body (JSON) - Todos los campos son opcionales
```json
{
  "page": 1,
  "page_size": 40,
  "search": "",
  "search_precise": false,
  "search_exact": false,
  "parent_platforms": "1,2,3",
  "platforms": "4,5",
  "stores": "5,6",
  "developers": "valve-software",
  "publishers": "electronic-arts",
  "genres": "action,rpg",
  "tags": "singleplayer,multiplayer",
  "creators": "",
  "dates": "2020-01-01,2025-12-31",
  "updated": "",
  "platforms_count": 1,
  "metacritic": "70,100",
  "exclude_collection": null,
  "exclude_additions": true,
  "exclude_parents": true,
  "exclude_game_series": true,
  "exclude_stores": "",
  "ordering": "-released"
}
```

#### Query Parameters
- `max_pages` (opcional): Número máximo de páginas a procesar (1-50, default: 25)

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "resultado": {
    "importados": 980,
    "actualizados": 20,
    "omitidos": 15,
    "errores": 2,
    "totalProcesados": 1015,
    "mensaje": "Sincronización completada: 980 nuevos, 20 actualizados, 15 omitidos"
  },
  "estadisticas": {
    "totalJuegosImportados": 2500,
    "totalJuegosUsuarios": 150,
    "ultimaImportacion": "2024-11-09T10:30:00.000Z"
  },
  "timestamp": "2024-11-09T10:35:00.000Z"
}
```

### 2. Estadísticas de Importación
**`GET /api/games/estadisticas-importacion`**

Obtiene estadísticas sobre los juegos importados.

#### Headers Requeridos
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "estadisticas": {
    "totalJuegosImportados": 2500,
    "totalJuegosUsuarios": 150,
    "ultimaImportacion": "2024-11-09T10:30:00.000Z"
  },
  "timestamp": "2024-11-09T10:35:00.000Z"
}
```

### 3. Probar Conexión RAWG
**`GET /api/games/test-rawg`**

Prueba la conexión con RAWG API (útil para debugging).

#### Headers Requeridos
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "mensaje": "Conexión con RAWG API exitosa",
  "juegosEncontrados": 5,
  "ejemploJuegos": [
    {
      "titulo": "The Witcher 3: Wild Hunt",
      "genero": "RPG",
      "plataforma": "PC",
      "añoLanzamiento": 2015,
      "desarrollador": "CD PROJEKT RED",
      "rating": 4.66,
      "metacritic": 93
    }
  ],
  "timestamp": "2024-11-09T10:35:00.000Z"
}
```

## 🔧 Parámetros de Consulta RAWG

### Filtros Principales
- **`search`**: Búsqueda por nombre
- **`genres`**: Filtrar por género (ej: "action,rpg,adventure")
- **`platforms`**: Filtrar por plataforma (ej: "4,5,6")
- **`developers`**: Filtrar por desarrollador
- **`publishers`**: Filtrar por publisher
- **`dates`**: Rango de fechas (formato: "YYYY-MM-DD,YYYY-MM-DD")
- **`metacritic`**: Rango de puntuación Metacritic (ej: "70,100")

### Ordenamiento
- **`ordering`**: Campo de ordenamiento
  - `name` / `-name`: Por nombre (A-Z / Z-A)
  - `released` / `-released`: Por fecha de lanzamiento
  - `rating` / `-rating`: Por rating
  - `metacritic` / `-metacritic`: Por puntuación Metacritic

### Exclusiones
- **`exclude_additions`**: Excluir DLCs (recomendado: `true`)
- **`exclude_parents`**: Excluir juegos padre (recomendado: `true`)
- **`exclude_game_series`**: Excluir series (recomendado: `true`)

## 💡 Casos de Uso Recomendados

### 1. Importación Inicial - Juegos Populares Recientes
```json
{
  "page_size": 40,
  "dates": "2020-01-01,2024-12-31",
  "metacritic": "80,100",
  "ordering": "-metacritic",
  "exclude_additions": true,
  "exclude_parents": true
}
```
**Query param**: `?max_pages=25` (1000 juegos aprox.)

### 2. Juegos de Género Específico
```json
{
  "page_size": 40,
  "genres": "action,adventure",
  "dates": "2018-01-01,2024-12-31",
  "metacritic": "70,100",
  "ordering": "-released"
}
```

### 3. Juegos Indie Populares
```json
{
  "page_size": 40,
  "tags": "indie",
  "metacritic": "75,100",
  "dates": "2019-01-01,2024-12-31",
  "ordering": "-rating"
}
```

## ⚠️ Manejo de Errores

### Error 400 - Bad Request
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "page_size",
      "message": "page_size debe ser un número entre 1 y 40"
    }
  ]
}
```

### Error 401 - Unauthorized
```json
{
  "success": false,
  "error": "Token requerido"
}
```

### Error 500 - Server Error
```json
{
  "success": false,
  "error": "Error al sincronizar juegos: RAWG_API_KEY no está configurada",
  "details": {
    "originalError": "RAWG_API_KEY no está configurada en las variables de entorno",
    "timestamp": "2024-11-09T10:35:00.000Z"
  }
}
```

### Error 503 - Service Unavailable
```json
{
  "success": false,
  "error": "Error de conexión con RAWG: Request timeout"
}
```

## 📊 Estrategia de Uso Mensual

Con **20,000 requests mensuales**:

### Opción Conservadora (2-3% del límite)
- **25-50 páginas por sincronización** = 400-800 requests
- **1,000-2,000 juegos importados**
- Resto disponible para búsquedas y recomendaciones

### Opción Moderada (5-10% del límite)
- **100-200 páginas por sincronización** = 1,600-3,200 requests
- **4,000-8,000 juegos importados**
- Suficiente para una base de datos robusta

### Recomendación
Ejecutar **una vez al mes** el día **9** cuando se renuevan los requests, usando la opción conservadora para mantener un buen balance entre contenido y requests disponibles.

## 🔄 Automatización (Futuro)

Para automatizar la sincronización, se puede implementar un cron job:
```bash
# Ejecutar el 9 de cada mes a las 2:00 AM
0 2 9 * * /usr/bin/curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"dates":"2020-01-01,2025-12-31","metacritic":"70,100"}' \
  http://localhost:5001/api/juegos/sincronizar-externos?max_pages=25
```