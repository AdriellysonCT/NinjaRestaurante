@echo off
title Fome Ninja - Agente de Producao
echo 🥷 Verificando ambiente Ninja...

:: Blindagem para estabilidade no Windows
set UV_THREADPOOL_SIZE=64
set PWNOTTY=1
set PW_NOTTY=1
set NODE_OPTIONS=--no-warnings
set VENV_PYTHON=..\.venv\Scripts\python.exe

if exist "%VENV_PYTHON%" (
    echo [OK] Ambiente virtual detectado.
    set PYTHON_EXEC="%VENV_PYTHON%"
) else (
    echo [!] Ambiente virtual nao encontrado. Usando Python Global...
    set PYTHON_EXEC=py
)

echo.
echo 1. Verificando componentes do motor...
%PYTHON_EXEC% -m playwright install chromium --quiet

echo.
echo ======================================================
echo    AGENTE NINJA ATIVADO (MODO LOCAL JSON)
echo ======================================================
echo.
echo O Agente esta iniciando o motor de mensagens e impressao.
echo Voce pode fechar esta janela ou minimiza-la.
echo.

start "" %PYTHON_EXEC% agent.py
echo ✅ Sistema Ninja operando no fundo!
timeout /t 5 >nul
exit
