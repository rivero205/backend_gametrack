# 🎮 Guía de Diferenciación: Juegos de Usuarios vs Juegos Importados

Esta guía explica cómo diferenciar y trabajar con los dos tipos de juegos en GameTracker.

## 🔍 **Tipos de Juegos**

### 1. **Juegos de Usuarios** 
- Creados manualmente por los usuarios
- Tienen `ownerId` (pertenecen a un usuario específico)
- `esJuegoImportado: false`
- No tienen `rawgId`

### 2. **Juegos Importados (RAWG)**
- Importados automáticamente desde RAWG API
- `esJuegoImportado: true`
- Tienen `rawgId` único
- No tienen `ownerId` (son públicos)
- Incluyen `rating` y `metacritic`

## 📊 **Nuevos Endpoints Disponibles**

### 1. Obtener Juegos por Tipo
```
GET /api/games/by-type/:tipo
```

**Tipos disponibles:**
- `usuario` - Solo juegos creados por el usuario
- `importado` - Solo juegos importados de RAWG
- `todos` - Juegos del usuario + importados

**Ejemplo:**
```bash
# Solo juegos del usuario
curl -X GET "http://localhost:5001/api/games/by-type/usuario" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Solo juegos importados
curl -X GET "http://localhost:5001/api/games/by-type/importado?genero=action&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Todos los juegos (usuario + importados)
curl -X GET "http://localhost:5001/api/games/by-type/todos?search=witcher" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Estadísticas por Tipo
```
GET /api/games/stats-by-type
```

```bash
curl -X GET "http://localhost:5001/api/games/stats-by-type" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta:**
```json
{
  "success": true,
  "estadisticas": {
    "usuario": {
      "total": 25,
      "completados": 18,
      "generos": ["Action", "RPG", "Adventure"],
      "plataformas": ["PC", "PlayStation", "Xbox"]
    },
    "importados": {
      "total": 1250,
      "ratingPromedio": 4.2,
      "metacriticPromedio": 82,
      "generos": ["Action", "RPG", "Adventure", "Strategy"],
      "plataformas": ["PC", "PlayStation", "Xbox", "Nintendo Switch"]
    }
  }
}
```

### 3. Vista Mixta (Usuarios + Importados)
```
GET /api/games/mixed
```

```bash
curl -X GET "http://localhost:5001/api/games/mixed?genero=RPG" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Comparar Biblioteca y Recomendaciones
```
GET /api/games/compare-library
```

```bash
curl -X GET "http://localhost:5001/api/games/compare-library" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta:**
```json
{
  "success": true,
  "userLibrary": {
    "total": 25,
    "genres": ["RPG", "Action"],
    "developers": ["CD Projekt RED", "FromSoftware"]
  },
  "recommendations": [
    {
      "titulo": "Cyberpunk 2077",
      "genero": "RPG",
      "desarrollador": "CD Projekt RED",
      "rating": 4.1,
      "metacritic": 86,
      "esJuegoImportado": true
    }
  ],
  "totalRecommendations": 10
}
```

## 🛠️ **Consultas Directas en MongoDB**

### Obtener solo juegos de usuarios:
```javascript
// Todos los juegos de usuarios
db.games.find({ esJuegoImportado: false, ownerId: { $exists: true } })

// Juegos de un usuario específico
db.games.find({ 
  ownerId: ObjectId("user_id_here"), 
  esJuegoImportado: false 
})
```

### Obtener solo juegos importados:
```javascript
// Todos los juegos importados
db.games.find({ esJuegoImportado: true })

// Juegos importados con alta calificación
db.games.find({ 
  esJuegoImportado: true, 
  rating: { $gte: 4.0 },
  metacritic: { $gte: 80 }
})
```

### Contar por tipo:
```javascript
// Contar juegos por tipo
db.games.aggregate([
  {
    $group: {
      _id: "$esJuegoImportado",
      count: { $sum: 1 }
    }
  }
])
```

## 🎯 **Casos de Uso Comunes**

### 1. **Dashboard del Usuario**
```bash
# Obtener estadísticas completas
curl -X GET "http://localhost:5001/api/games/stats-by-type" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Obtener juegos del usuario
curl -X GET "http://localhost:5001/api/games/by-type/usuario?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. **Sistema de Recomendaciones**
```bash
# Comparar biblioteca y obtener recomendaciones
curl -X GET "http://localhost:5001/api/games/compare-library" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. **Búsqueda Global**
```bash
# Buscar en todos los juegos (usuario + importados)
curl -X GET "http://localhost:5001/api/games/by-type/todos?search=dark+souls" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. **Explorar Catálogo Importado**
```bash
# Explorar juegos importados por género
curl -X GET "http://localhost:5001/api/games/by-type/importado?genero=RPG&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📋 **Parámetros de Consulta**

Todos los endpoints de tipo soportan estos parámetros:

- **`search`** - Búsqueda por texto en título
- **`genero`** - Filtrar por género
- **`plataforma`** - Filtrar por plataforma  
- **`page`** - Número de página (default: 1)
- **`limit`** - Elementos por página (default: 20)

## 🔄 **Migración de Datos Existentes**

Si tienes juegos existentes que necesitas marcar como juegos de usuario:

```javascript
// Marcar todos los juegos existentes sin rawgId como juegos de usuario
db.games.updateMany(
  { rawgId: { $exists: false } },
  { $set: { esJuegoImportado: false } }
)

// Marcar todos los juegos con rawgId como importados
db.games.updateMany(
  { rawgId: { $exists: true } },
  { $set: { esJuegoImportado: true } }
)
```

## 💡 **Consejos de Implementación**

1. **En el Frontend**: Usa diferentes estilos visuales para diferenciar los tipos
2. **Filtros**: Permite a los usuarios filtrar por tipo en la interfaz
3. **Recomendaciones**: Usa los juegos importados para sugerir nuevos títulos
4. **Estadísticas**: Muestra métricas separadas para cada tipo
5. **Búsquedas**: Implementa búsqueda unificada que incluya ambos tipos

## 🚀 **Ejemplo de Implementación en Frontend**

```javascript
// Obtener juegos del usuario
const userGames = await fetch('/api/games/by-type/usuario', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Obtener recomendaciones basadas en la biblioteca
const recommendations = await fetch('/api/games/compare-library', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Mostrar estadísticas
const stats = await fetch('/api/games/stats-by-type', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

Con esta implementación, puedes crear una experiencia rica donde los usuarios pueden:
- ✅ Ver sus juegos personales separados de los importados
- ✅ Recibir recomendaciones basadas en su biblioteca
- ✅ Explorar el catálogo completo de juegos importados
- ✅ Obtener estadísticas detalladas por tipo de juego