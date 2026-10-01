@echo off
chcp 65001 > nul
title SS VAPE - Ngrok Tunnel (Online Internet)
cd /d "%~dp0"
cls

echo ========================================================
echo       SS VAPE - MENGONLINEKAN APLIKASI VIA NGROK
echo ========================================================
echo.
echo Menghubungkan port 5173 ke internet...
echo Link URL Public (https://...ngrok-free.app) akan muncul di bawah.
echo (Tekan Ctrl + C di jendela ini untuk mematikan tunnel)
echo ========================================================
echo.

ngrok http 5173

if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo [ERROR] Gagal menjalankan ngrok (Error code: %errorlevel%).
    echo Pastikan ngrok sudah terinstall dan auth token telah diisi:
    echo Contoh: ngrok config add-authtoken TOKEN_ANDA
    echo ========================================================
    pause
)
