@echo off
chcp 65001 > nul
title SS VAPE - Launcher Otomatis (App + Ngrok)
cd /d "%~dp0"
cls

echo ========================================================
echo       SS VAPE - LAUNCHER OTOMATIS (APP + NGROK)
echo ========================================================
echo.
echo 1. Membuka Server Aplikasi di jendela terpisah...
start "SS VAPE - Local Server" cmd /k "cd /d ""%~dp0"" && title SS VAPE - Server (Localhost:5173) && npm run dev"

echo Menunggu server Vite siap (3 detik)...
timeout /t 3 /nobreak > nul

echo.
echo 2. Membuka Ngrok Online Tunnel di jendela terpisah...
start "SS VAPE - Ngrok Online" cmd /k "cd /d ""%~dp0"" && title SS VAPE - Ngrok Tunnel && ngrok http 127.0.0.1:5173"

echo.
echo ========================================================
echo SUKSES: Server lokal dan Ngrok sudah berhasil dijalankan!
echo Anda dapat mengecek URL online di jendela Ngrok.
echo ========================================================
echo.
echo Jendela launcher ini akan otomatis tertutup dalam 5 detik...
timeout /t 5
