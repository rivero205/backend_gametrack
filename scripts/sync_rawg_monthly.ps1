# 🚀 Script de Sincronización Automática con RAWG API (PowerShell)
# Este script automatiza la importación mensual de juegos desde RAWG para Windows

# ============================================
# CONFIGURACIÓN
# ============================================

# URL del servidor (ajustar según el entorno)
$ServerUrl = "http://localhost:5001"

# Credenciales (en producción, usar variables de entorno)
$Email = "admin@gametracker.com"
$Password = "password123"

# Parámetros de sincronización
$MaxPages = 25  # Número de páginas a importar (25 páginas = ~1000 juegos)

# ============================================
# FUNCIONES
# ============================================

# Función para logging
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message"
}

# Función para obtener token JWT
function Get-JwtToken {
    Write-Log "Obteniendo token de autenticación..."
    
    $body = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$ServerUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.token) {
            return $response.token
        } else {
            throw "No se encontró token en la respuesta"
        }
    } catch {
        Write-Log "ERROR: No se pudo obtener el token de autenticación"
        Write-Log "Error: $($_.Exception.Message)"
        exit 1
    }
}

# Función para probar conexión con RAWG
function Test-RawgConnection {
    param([string]$Token)
    
    Write-Log "Probando conexión con RAWG API..."
    
    $headers = @{
        "Authorization" = "Bearer $Token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$ServerUrl/api/juegos/test-rawg" -Method GET -Headers $headers
        
        if ($response.success) {
            Write-Log "✅ Conexión con RAWG API exitosa"
        } else {
            throw "La respuesta indica fallo en la conexión"
        }
    } catch {
        Write-Log "ERROR: Falló la conexión con RAWG API"
        Write-Log "Error: $($_.Exception.Message)"
        exit 1
    }
}

# Función principal de sincronización
function Sync-Games {
    param([string]$Token)
    
    Write-Log "Iniciando sincronización de juegos..."
    
    # Configuración para importar juegos de alta calidad
    $syncPayload = @{
        page_size = 40
        dates = "2020-01-01,2025-12-31"
        metacritic = "75,100"
        ordering = "-released"
        exclude_additions = $true
        exclude_parents = $true
        exclude_game_series = $true
    }
    
    $body = $syncPayload | ConvertTo-Json
    
    Write-Log "Parámetros de sincronización: $body"
    Write-Log "Páginas a procesar: $MaxPages"
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$ServerUrl/api/juegos/sincronizar-externos?max_pages=$MaxPages" -Method POST -Headers $headers -Body $body
        
        if ($response.success) {
            Write-Log "✅ Sincronización completada exitosamente"
            Write-Log "📊 Resultados:"
            Write-Log "   - Juegos importados: $($response.resultado.importados)"
            Write-Log "   - Juegos actualizados: $($response.resultado.actualizados)"
            Write-Log "   - Juegos omitidos: $($response.resultado.omitidos)"
            Write-Log "   - Total procesados: $($response.resultado.totalProcesados)"
        } else {
            throw "La sincronización falló según la respuesta del servidor"
        }
    } catch {
        Write-Log "ERROR: Falló la sincronización"
        Write-Log "Error: $($_.Exception.Message)"
        exit 1
    }
}

# Función para obtener estadísticas finales
function Get-FinalStats {
    param([string]$Token)
    
    Write-Log "Obteniendo estadísticas finales..."
    
    $headers = @{
        "Authorization" = "Bearer $Token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$ServerUrl/api/juegos/estadisticas-importacion" -Method GET -Headers $headers
        
        Write-Log "📈 Estadísticas totales de la base de datos:"
        Write-Log "   - Total juegos importados de RAWG: $($response.estadisticas.totalJuegosImportados)"
        Write-Log "   - Total juegos de usuarios: $($response.estadisticas.totalJuegosUsuarios)"
        
        if ($response.estadisticas.ultimaImportacion) {
            $ultimaImportacion = [DateTime]::Parse($response.estadisticas.ultimaImportacion).ToString("dd/MM/yyyy HH:mm:ss")
            Write-Log "   - Última importación: $ultimaImportacion"
        }
    } catch {
        Write-Log "Warning: No se pudieron obtener las estadísticas finales"
        Write-Log "Error: $($_.Exception.Message)"
    }
}

# ============================================
# SCRIPT PRINCIPAL
# ============================================

function Main {
    Write-Log "🚀 Iniciando sincronización automática con RAWG API"
    Write-Log "🎯 Objetivo: Importar hasta $MaxPages páginas de juegos"
    
    # Verificar que el servidor esté disponible
    try {
        $testResponse = Invoke-WebRequest -Uri "$ServerUrl/api/auth/login" -Method GET -TimeoutSec 10 -UseBasicParsing
    } catch {
        Write-Log "ERROR: No se puede conectar al servidor en $ServerUrl"
        Write-Log "Asegúrate de que el servidor esté ejecutándose"
        exit 1
    }
    
    # Obtener token de autenticación
    $jwtToken = Get-JwtToken
    
    # Probar conexión con RAWG
    Test-RawgConnection -Token $jwtToken
    
    # Ejecutar sincronización
    Sync-Games -Token $jwtToken
    
    # Obtener estadísticas finales
    Get-FinalStats -Token $jwtToken
    
    Write-Log "🎉 Proceso de sincronización completado exitosamente"
}

# ============================================
# EJECUCIÓN
# ============================================

# Verificar si el script se está ejecutando directamente
if ($MyInvocation.InvocationName -ne '.') {
    Main
}