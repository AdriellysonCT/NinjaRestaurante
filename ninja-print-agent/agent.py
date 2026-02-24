import os
import sys
import json
import webbrowser
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
import win32print
import win32ui
import win32con
from PIL import Image
import pystray
from pystray import MenuItem as item

app = Flask(__name__)
CORS(app)

# Configurações do Agente
PORT = 5001
DASHBOARD_URL = "https://ninja-restaurante.vercel.app"
# Caminho para o logo (ajustado para o ambiente local)
ICON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "logo-fome-ninja.png")

def get_default_printer():
    try:
        return win32print.GetDefaultPrinter()
    except:
        return "Nenhuma impressora encontrada"

def print_raw_text(printer_name, text):
    try:
        hPrinter = win32print.OpenPrinter(printer_name)
        try:
            hJob = win32print.StartDocPrinter(hPrinter, 1, ("Fome Ninja Print", None, "RAW"))
            try:
                win32print.StartPagePrinter(hPrinter)
                win32print.WritePrinter(hPrinter, text.encode('utf-8'))
                win32print.EndPagePrinter(hPrinter)
            finally:
                win32print.EndDocPrinter(hPrinter)
        finally:
            win32print.ClosePrinter(hPrinter)
        return True
    except Exception as e:
        print(f"Erro na impressão RAW: {e}")
        return False

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        "status": "online",
        "agent": "Fome Ninja Print Agent",
        "printer": get_default_printer()
    })

@app.route('/print', methods=['POST'])
def print_order():
    data = request.json
    content = data.get('content', '')
    printer_name = data.get('printer_name') or get_default_printer()
    
    print(f"Recebido pedido para imprimir na: {printer_name}")
    
    success = print_raw_text(printer_name, content)
    
    if success:
        return jsonify({"success": True, "message": "Impresso com sucesso!"})
    else:
        return jsonify({"success": False, "message": "Falha ao imprimir."}), 500

# Funções da Bandeja do Sistema
def on_open_dashboard(icon, item):
    webbrowser.open(DASHBOARD_URL)

def on_exit(icon, item):
    icon.stop()
    # Encerrar o processo do Flask de forma brusca (já que app.run bloqueia)
    os._exit(0)

def setup_tray():
    try:
        image = Image.open(ICON_PATH)
    except:
        # Fallback se não achar o ícone: cria um quadrado simples
        image = Image.new('RGB', (64, 64), color=(255, 69, 0))
    
    menu = (
        item('Abrir Painel Ninja', on_open_dashboard),
        item('Ver Status (Impressora)', lambda: webbrowser.open(f"http://localhost:{PORT}/status")),
        item('Sair', on_exit),
    )
    
    icon = pystray.Icon("Fome Ninja", image, "Fome Ninja - Agente de Impressão", menu)
    icon.run()

def run_flask():
    print(f"Iniciando Servidor Flask na porta {PORT}...")
    app.run(port=PORT, debug=False, use_reloader=False)

if __name__ == '__main__':
    print("="*50)
    print("      🥷 FOME NINJA - AGENTE DE IMPRESSÃO 🖨️")
    print("="*50)
    print(f"Porta do Agente: {PORT}")
    print(f"Impressora Padrão: {get_default_printer()}")
    print("="*50)
    
    # Thread para o Flask
    t = threading.Thread(target=run_flask)
    t.daemon = True
    t.start()
    
    # Abre o browser na primeira execução
    threading.Timer(2, lambda: webbrowser.open(DASHBOARD_URL)).start()
    
    # Inicia a bandeja (bloqueia aqui até fechar)
    setup_tray()
