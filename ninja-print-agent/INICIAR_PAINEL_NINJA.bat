@echo off
title Fome Ninja - Agente Profissional
echo 🥷 Verificando ambiente Ninja...

:: Blindagem para erros do motor Playwright no Windows
set PWNOTTY=1
set PW_NOTTY=1
set UV_THREADPOOL_SIZE=64
set NODE_OPTIONS=--no-warnings

set VENV_PATH=..\.venv\Scripts\python.exe

if exist "%VENV_PATH%" (
    echo [OK] Ambiente virtual detectado.
    set PYTHON_EXEC="%VENV_PATH%"
) else (
    echo [!] Ambiente virtual nao encontrado. Usando Python Global...
    set PYTHON_EXEC=py
)

echo.
echo ======================================================
echo    AGENTE NINJA ATIVADO (MODO PROFISSIONAL)
echo ======================================================
echo.
echo O Agente esta iniciando o motor de mensagens invisivel.
echo Voce pode fechar esta janela ou minimiza-la.
echo.

start "" %PYTHON_EXEC% agent.py
echo ✅ Sistema Ninja operando no fundo!
timeout /t 5 >nul
exit
