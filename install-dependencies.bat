@echo off
chcp 65001 >nul
title Auloava - Instalar dependencias

echo ==========================================
echo   Auloava - Instalando dependencias...
echo ==========================================
echo.

cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js/npm no encontrado.
    echo Instala Node.js desde https://nodejs.org y vuelve a intentar.
    pause
    exit /b 1
)

call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] No se pudieron instalar las dependencias.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   Dependencias instaladas correctamente.
echo   Ejecuta start-app.bat para iniciar.
echo ==========================================
pause
