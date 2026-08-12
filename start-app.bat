@echo off
chcp 65001 >nul
title Auloava - Iniciar aplicacion

cd /d "%~dp0"

if not exist "node_modules" (
    echo [AVISO] No se encontraron dependencias.
    echo Ejecuta primero install-dependencies.bat
    echo.
    pause
    exit /b 1
)

echo ==========================================
echo   Auloava - Iniciando en http://localhost:5173
echo   (Presiona Ctrl + C para detener)
echo ==========================================
echo.

call npm run dev

echo.
echo La aplicacion se detuvo.
pause
