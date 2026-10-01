@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo Mengompilasi JALANKAN_SEMUA (APP + NGROK).exe dengan icon logo...
"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /target:exe /win32icon:"app.ico" /out:"JALANKAN_SEMUA (APP + NGROK).exe" "Launcher.cs"
if %ERRORLEVEL% EQU 0 (
    echo Selesai! File JALANKAN_SEMUA (APP + NGROK).exe berhasil dibuat.
) else (
    echo Terjadi kesalahan saat mengompilasi.
)
pause
