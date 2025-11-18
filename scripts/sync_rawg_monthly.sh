#!/bin/bash

# 🚀 Script de Sincronización Automática con RAWG API
# Este script automatiza la importación mensual de juegos desde RAWG

# ============================================
# CONFIGURACIÓN
# ============================================

# URL del servidor (ajustar según el entorno)
SERVER_URL="http://localhost:5001"

# Credenciales (en producción, usar variables de entorno)
EMAIL="admin@gametracker.com"
PASSWORD="password123"

# Parámetros de sincronización
MAX_PAGES=25  # Número de páginas a importar (25 páginas = ~1000 juegos)

# ============================================
# FUNCIONES
# ============================================

# Función para logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Función para obtener token JWT
get_jwt_token() {
    log "Obteniendo token de autenticación..."
    
    local response=$(curl -s -X POST "${SERVER_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${EMAIL}\",
            \"password\": \"${PASSWORD}\"
        }")
    
    local token=$(echo $response | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$token" ]; then
        log "ERROR: No se pudo obtener el token de autenticación"
        log "Respuesta del servidor: $response"
        exit 1
    fi
    
    echo $token
}

# Función para probar conexión con RAWG
test_rawg_connection() {
    local token=$1
    
    log "Probando conexión con RAWG API..."
    
    local response=$(curl -s -X GET "${SERVER_URL}/api/juegos/test-rawg" \
        -H "Authorization: Bearer ${token}")
    
    local success=$(echo $response | grep -o '"success":true')
    
    if [ -z "$success" ]; then
        log "ERROR: Falló la conexión con RAWG API"
        log "Respuesta: $response"
        exit 1
    fi
    
    log "✅ Conexión con RAWG API exitosa"
}

# Función principal de sincronización
sync_games() {
    local token=$1
    
    log "Iniciando sincronización de juegos..."
    
    # Configuración para importar juegos de alta calidad
    local sync_payload='{
        "page_size": 40,
        "dates": "2020-01-01,2025-12-31",
        "metacritic": "75,100",
        "ordering": "-released",
        "exclude_additions": true,
        "exclude_parents": true,
        "exclude_game_series": true
    }'
    
    log "Parámetros de sincronización: $sync_payload"
    log "Páginas a procesar: $MAX_PAGES"
    
    local response=$(curl -s -X POST "${SERVER_URL}/api/juegos/sincronizar-externos?max_pages=${MAX_PAGES}" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json" \
        -d "$sync_payload")
    
    # Verificar si la sincronización fue exitosa
    local success=$(echo $response | grep -o '"success":true')
    
    if [ -z "$success" ]; then
        log "ERROR: Falló la sincronización"
        log "Respuesta: $response"
        exit 1
    fi
    
    # Extraer estadísticas del resultado
    local importados=$(echo $response | grep -o '"importados":[0-9]*' | cut -d':' -f2)
    local actualizados=$(echo $response | grep -o '"actualizados":[0-9]*' | cut -d':' -f2)
    local omitidos=$(echo $response | grep -o '"omitidos":[0-9]*' | cut -d':' -f2)
    local total_procesados=$(echo $response | grep -o '"totalProcesados":[0-9]*' | cut -d':' -f2)
    
    log "✅ Sincronización completada exitosamente"
    log "📊 Resultados:"
    log "   - Juegos importados: ${importados:-0}"
    log "   - Juegos actualizados: ${actualizados:-0}"
    log "   - Juegos omitidos: ${omitidos:-0}"
    log "   - Total procesados: ${total_procesados:-0}"
}

# Función para obtener estadísticas finales
get_final_stats() {
    local token=$1
    
    log "Obteniendo estadísticas finales..."
    
    local response=$(curl -s -X GET "${SERVER_URL}/api/juegos/estadisticas-importacion" \
        -H "Authorization: Bearer ${token}")
    
    local total_importados=$(echo $response | grep -o '"totalJuegosImportados":[0-9]*' | cut -d':' -f2)
    local total_usuarios=$(echo $response | grep -o '"totalJuegosUsuarios":[0-9]*' | cut -d':' -f2)
    
    log "📈 Estadísticas totales de la base de datos:"
    log "   - Total juegos importados de RAWG: ${total_importados:-0}"
    log "   - Total juegos de usuarios: ${total_usuarios:-0}"
}

# ============================================
# SCRIPT PRINCIPAL
# ============================================

main() {
    log "🚀 Iniciando sincronización automática con RAWG API"
    log "🎯 Objetivo: Importar hasta $MAX_PAGES páginas de juegos"
    
    # Verificar que el servidor esté disponible
    if ! curl -s --connect-timeout 10 "${SERVER_URL}/api/auth/login" > /dev/null; then
        log "ERROR: No se puede conectar al servidor en $SERVER_URL"
        exit 1
    fi
    
    # Obtener token de autenticación
    local jwt_token=$(get_jwt_token)
    
    # Probar conexión con RAWG
    test_rawg_connection "$jwt_token"
    
    # Ejecutar sincronización
    sync_games "$jwt_token"
    
    # Obtener estadísticas finales
    get_final_stats "$jwt_token"
    
    log "🎉 Proceso de sincronización completado exitosamente"
}

# ============================================
# EJECUCIÓN
# ============================================

# Verificar si el script se está ejecutando directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi