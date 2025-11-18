# 📁 Ejemplos de Uso - Sincronización RAWG

Este archivo contiene ejemplos prácticos para probar el endpoint de sincronización con RAWG.

## 🔐 Paso 1: Obtener Token de Autenticación

Primero necesitas autenticarte para obtener un JWT token:

```bash
# Registrar usuario (si no existe)
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@gametracker.com",
    "password": "password123"
  }'

# O iniciar sesión
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gametracker.com",
    "password": "password123"
  }'
```

**Respuesta esperada:**
```json
{
  "user": {
    "_id": "69104233cf40bc47d44299aa",
    "nombre": "maicol", 
    "email": "maicolviv695@gmail.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Guarda el token** de la respuesta para usarlo en los siguientes ejemplos.

## 🧪 Paso 2: Probar Conexión con RAWG

```bash
# Probar conexión (reemplaza YOUR_JWT_TOKEN)
curl -X GET http://localhost:5001/api/games/test-rawg \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "mensaje": "Conexión con RAWG API exitosa",
  "juegosEncontrados": 5,
  "ejemploJuegos": [...]
}
```

## 🎮 Paso 3: Sincronizar Juegos

### Ejemplo 1: Importación Básica (Juegos Populares Recientes)

```bash
curl -X POST http://localhost:5001/api/games/sincronizar-externos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page_size": 40,
    "dates": "2022-01-01,2024-12-31",
    "metacritic": "80,100",
    "ordering": "-metacritic",
    "exclude_additions": true,
    "exclude_parents": true,
    "exclude_game_series": true
  }' \
  "?max_pages=10"
```

### Ejemplo 2: Juegos de Acción y Aventura

```bash
curl -X POST http://localhost:5001/api/juegos/sincronizar-externos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page_size": 40,
    "genres": "action,adventure",
    "dates": "2020-01-01,2024-12-31",
    "metacritic": "75,100",
    "ordering": "-released",
    "exclude_additions": true
  }' \
  "?max_pages=5"
```

### Ejemplo 3: Juegos de RPG Populares

```bash
curl -X POST http://localhost:5001/api/juegos/sincronizar-externos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page_size": 40,
    "genres": "role-playing-games-rpg",
    "dates": "2018-01-01,2024-12-31",
    "metacritic": "80,100",
    "ordering": "-rating",
    "exclude_additions": true,
    "exclude_parents": true
  }' \
  "?max_pages=8"
```

### Ejemplo 4: Búsqueda Específica

```bash
curl -X POST http://localhost:5001/api/juegos/sincronizar-externos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page_size": 20,
    "search": "witcher",
    "ordering": "-rating"
  }' \
  "?max_pages=2"
```

### Ejemplo 5: Solo Para Probar (1 página)

```bash
curl -X POST http://localhost:5001/api/juegos/sincronizar-externos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page_size": 10,
    "genres": "indie",
    "metacritic": "85,100",
    "ordering": "-metacritic"
  }' \
  "?max_pages=1"
```

## 📊 Paso 4: Ver Estadísticas

```bash
curl -X GET http://localhost:5001/api/juegos/estadisticas-importacion \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "estadisticas": {
    "totalJuegosImportados": 450,
    "totalJuegosUsuarios": 12,
    "ultimaImportacion": "2024-11-09T10:30:00.000Z"
  },
  "timestamp": "2024-11-09T10:35:00.000Z"
}
```

## 🔍 Paso 5: Verificar Juegos Importados

Puedes verificar que los juegos se importaron correctamente consultando tu base de datos o usando el endpoint de games:

```bash
curl -X GET "http://localhost:5001/api/games?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛠️ PowerShell (Windows)

Si usas PowerShell en Windows, usa estos comandos adaptados:

### Test de conexión
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:5001/api/juegos/test-rawg" -Method GET -Headers $headers
```

### Sincronización básica
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    page_size = 20
    genres = "action"
    metacritic = "80,100"
    ordering = "-rating"
    exclude_additions = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/juegos/sincronizar-externos?max_pages=2" -Method POST -Headers $headers -Body $body
```

## 📋 Respuestas de Ejemplo

### Sincronización Exitosa
```json
{
  "success": true,
  "resultado": {
    "importados": 156,
    "actualizados": 4,
    "omitidos": 2,
    "errores": 0,
    "totalProcesados": 162,
    "mensaje": "Sincronización completada: 156 nuevos, 4 actualizados, 2 omitidos"
  },
  "estadisticas": {
    "totalJuegosImportados": 450,
    "totalJuegosUsuarios": 12,
    "ultimaImportacion": "2024-11-09T10:30:00.000Z"
  },
  "timestamp": "2024-11-09T10:35:00.000Z"
}
```

### Error de API Key
```json
{
  "success": false,
  "error": "Error al sincronizar juegos: RAWG_API_KEY no está configurada en las variables de entorno",
  "details": {
    "originalError": "RAWG_API_KEY no está configurada en las variables de entorno",
    "timestamp": "2024-11-09T10:35:00.000Z"
  }
}
```

## 💡 Consejos

1. **Empieza pequeño**: Usa `max_pages=1` o `max_pages=2` para las primeras pruebas
2. **Verifica la API Key**: Ejecuta el test de conexión antes de sincronizar
3. **Monitorea el límite**: Con 20,000 requests mensuales, 25 páginas = ~1000 juegos
4. **Calidad sobre cantidad**: Usa filtros como `metacritic="80,100"` para obtener solo juegos de alta calidad
5. **Evita duplicados**: El sistema maneja automáticamente los duplicados por `rawgId`

## 🎯 Estrategia Recomendada

Para la primera importación:
1. Ejecuta el test de conexión
2. Importa 5-10 páginas de juegos populares (ejemplo 1)
3. Verifica las estadísticas
4. Importa más juegos por géneros específicos según tus necesidades