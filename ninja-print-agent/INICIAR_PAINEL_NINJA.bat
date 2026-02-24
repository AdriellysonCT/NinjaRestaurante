@echo off
title Fome Ninja - Agente de Impressão
echo Verificando dependencias profissionais...
py -m pip install Flask flask-cors pywin32 pystray Pillow --quiet

echo.
echo ======================================================
echo    AGENTE NINJA ATIVADO (MODO SILENCIOSO)
echo ======================================================
echo.
echo O Agente esta iniciando e ficara oculto na bandeja.
echo Esta janela fechara automaticamente em 3 segundos...
echo.

start "" pyw agent.py
timeout /t 3 >nul
exit
