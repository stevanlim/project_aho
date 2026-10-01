@echo off
chcp 65001 > nul
title SS VAPE - Development Server (Localhost:5173)
cd /d "%~dp0"
cls

echo ========================================================
echo       SS VAPE - MENJALANKAN SERVER LOKAL (DEV)
echo ========================================================
echo.
echo Direktori : %~dp0
echo Akses Web : http://localhost:5173
echo.
echo Menjalankan 'npm run dev'...
echo (Tekan Ctrl + C di jendela ini untuk mematikan server)
echo ========================================================
echo.

npm run dev

if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo [ERROR] Server berhenti secara tidak normal (Error: %errorlevel%).
    echo Pastikan dependensi sudah terinstall dengan benar.
    echo ========================================================
    pause
)
