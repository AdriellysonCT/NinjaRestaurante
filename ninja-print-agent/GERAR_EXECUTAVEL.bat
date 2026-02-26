@echo off
title Gerador de Executavel - Fome Ninja
echo ======================================================
echo    GERANDO EXECUTAVEL DO AGENTE NINJA
echo ======================================================
echo.
echo 1. Instalando PyInstaller...
py -m pip install pyinstaller --quiet

echo 2. Iniciando compitacao (isso pode levar uns minutos)...
echo O arquivo final ficara na pasta 'dist'
echo.

py -m PyInstaller --noconfirm --onefile --windowed ^
    --name "FomeNinjaAgent" ^
    --add-data "../public/logo-fome-ninja.png;." ^
    --add-data "mensagens_reserva.json;." ^
    --collect-all pystray ^
    --collect-all PIL ^
    agent.py

echo.
echo ======================================================
echo    PROCESSO CONCLUIDO!
echo    O executavel esta na pasta: ninja-print-agent/dist
echo ======================================================
pause
