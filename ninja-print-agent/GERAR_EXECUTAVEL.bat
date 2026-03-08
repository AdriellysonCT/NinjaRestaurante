@echo off
title Gerador de Executavel - Fome Ninja
echo ======================================================
echo    GERANDO EXECUTAVEL DO AGENTE NINJA
echo ======================================================
echo.

:: Blindagem para o processo de build
set PWNOTTY=1
set PW_NOTTY=1

set VENV_PYTHON=..\.venv\Scripts\python.exe

if exist "%VENV_PYTHON%" (
    echo [OK] Ambiente virtual detectado. Usando %VENV_PYTHON%
    set PY_CMD="%VENV_PYTHON%"
) else (
    echo [!] Ambiente virtual nao encontrado. Usando Python Global...
    set PY_CMD=py
)

echo 1. Verificando/Instalando dependencias...
%PY_CMD% -m pip install pyinstaller flask flask-cors pywin32 pystray pyautogui playwright python-dotenv pillow --quiet

echo 2. Preparando Playwright...
%PY_CMD% -m playwright install chromium

echo 3. Iniciando compilacao (isso pode levar uns minutos)...
echo O arquivo final ficara na pasta 'dist'
echo.

%PY_CMD% -m PyInstaller --noconfirm --onefile --windowed ^
    --name "FomeNinjaAgent" ^
    --add-data "../public/logo-fome-ninja.png;." ^
    --add-data "mensagens_reserva.json;." ^
    --collect-all pystray ^
    --collect-all PIL ^
    --collect-all playwright ^
    --hidden-import flask ^
    --hidden-import flask_cors ^
    --hidden-import win32print ^
    --hidden-import win32ui ^
    --hidden-import win32con ^
    --hidden-import dotenv ^
    --hidden-import pyautogui ^
    agent.py

echo.
echo ======================================================
echo    PROCESSO CONCLUIDO!
echo    O executavel esta na pasta: ninja-print-agent/dist
echo ======================================================
pause
