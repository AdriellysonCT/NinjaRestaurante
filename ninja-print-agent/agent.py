# Configuração Fixa do Painel Oficial
DASHBOARD_URL = "https://ninja-restaurante.vercel.app"
PORT = 5001

import os
import sys
import time

# 🛡️ BLINDAGEM MÁXIMA PARA WINDOWS
# Removidas flags que causam conflito com o motor Chromium no Windows
os.environ["UV_THREADPOOL_SIZE"] = "64"

import json
import webbrowser
import threading
import random
import urllib.parse
import io
import asyncio
import subprocess
from concurrent.futures import ThreadPoolExecutor

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    import win32print
    import win32ui
    import win32con
    from PIL import Image
    import pystray
    from pystray import MenuItem as item
    import pyautogui
    from playwright.async_api import async_playwright
    from dotenv import load_dotenv
except ImportError as e:
    print(f"❌ Erro crítico: Dependência não encontrada: {e}")
    print("💡 Dica: Verifique se todas as bibliotecas foram instaladas com 'pip install -r requirements.txt' ou manualmente.")
    sys.exit(1)

app = Flask(__name__)
CORS(app)

# --- CONFIGURAÇÃO NINJA ---
load_dotenv()
print("✨ Agente Ninja (Modo Local JSON) configurado!", flush=True)

# 🛡️ Cache de Notificacoes Enviadas (Evita Duplicidade)
sent_notifications = set() # Store (order_id, status)

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

ICON_PATH = resource_path("logo-fome-ninja.png")

def ensure_playwright_installed():
    """Garante que os drivers do browser estao instalados"""
    try:
        print("🔍 Verificando motores ninja...", flush=True)
        # Se for executável, usamos o python do sistema ou verificamos apenas se existe
        python_exe = sys.executable if not getattr(sys, 'frozen', False) else "python"
        
        subprocess.run([python_exe, "-m", "playwright", "install", "chromium"], 
                       capture_output=True, check=True)
        print("✅ Motores ninja prontos!", flush=True)
    except Exception as e:
        print(f"⚙️ Tentando instalar componentes (Aguarde)...", flush=True)
        try:
            python_exe = "python" # Fallback para o python do windows
            subprocess.run([python_exe, "-m", "playwright", "install", "chromium"], check=True)
            print("✅ Instalacao concluida com sucesso!", flush=True)
        except Exception as err:
            print(f"❌ Erro ao instalar componentes: {err}. Certifique-se que o Python está no PATH.")

if not getattr(sys, 'frozen', False):
    ensure_playwright_installed()

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

# --- Lógica de Mensagens Ninja (100% Local) ---

def generate_matrix_message(status_key, customer_name, codigo_entrega=None):
    """Gera uma mensagem humana usando a matriz de mensagens embutida no EXE"""
    try:
        path = resource_path('mensagens_reserva.json')
        if not os.path.exists(path):
            base_msg = f"Olá {customer_name}, seu pedido foi atualizado!"
            if codigo_entrega:
                base_msg += f" Seu código de confirmação: *{codigo_entrega}*"
            return base_msg
            
        with open(path, 'r', encoding='utf-8') as f:
            matriz = json.load(f)
        
        saudacoes = matriz.get('saudacoes', ["Olá, {customer_name}!"])
        corpos = matriz.get('corpos', {}).get(status_key, ["Seu pedido foi atualizado."])
        fechamentos = matriz.get('fechamentos', ["😉"])
        
        saudacao = random.choice(saudacoes)
        corpo = random.choice(corpos)
        fechamento = random.choice(fechamentos)
        
        mensagem = f"{saudacao} {corpo} {fechamento}"
        mensagem = mensagem.replace("{customer_name}", customer_name)
        if codigo_entrega:
            mensagem = mensagem.replace("{codigo_entrega}", str(codigo_entrega))
        return mensagem
    except Exception as e:
        print(f"⚠️ Erro ao gerar mensagem: {e}")
        return f"Olá {customer_name}, seu pedido foi atualizado!"


# Configuração de Sessão Playwright (Mesmo caminho do teste de sucesso)
PLAYWRIGHT_DATA_DIR = "C:\\ninja_wp_data"
if not os.path.exists(PLAYWRIGHT_DATA_DIR):
    os.makedirs(PLAYWRIGHT_DATA_DIR)

# Filas e Loops para integração Async + Sync
pw_loop = None
msg_queue = None # Será inicializado dentro do loop asyncio

async def playwright_manager():
    global pw_loop, msg_queue
    pw_loop = asyncio.get_running_loop()
    msg_queue = asyncio.Queue()
    
    print("\n" + "🚀"*10)
    print("🚀 MOTOR PLAYWRIGHT ATIVO")
    print("🚀 FILA NINJA INICIALIZADA")
    print("🚀"*10 + "\n")
    
    max_retries = 10
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            print(f"🌐 Conectando ao WhatsApp Web...", flush=True)
            async with async_playwright() as p:
                # No Windows, headless=False é essencial para interação de teclado confiável
                is_headless = False
                
                context = await p.chromium.launch_persistent_context(
                    PLAYWRIGHT_DATA_DIR,
                    headless=is_headless,
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    viewport={'width': 1280, 'height': 720},
                    ignore_https_errors=True,
                    args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
                )
                
                page = await context.new_page()
                print("⏳ Carregando WhatsApp Web...", flush=True)
                await page.goto("https://web.whatsapp.com", wait_until="networkidle", timeout=180000)
                
                # Verificação de Login
                try:
                    await page.wait_for_selector("canvas", timeout=10000)
                    print("\n" + "⚠️ "*10)
                    print("⚠️  ATENÇÃO: WHATSAPP DESCONECTADO!")
                    print("⚠️  POR FAVOR, ESCANEIE O QR CODE NA JANELA QUE ABRIU.")
                    print("⚠️  "*10 + "\n")
                except:
                    print("✅ Sessão do WhatsApp detectada!")

                print("✅ [MOTOR OK] Agente Ninja pronto para receber missões!", flush=True)

                while True:
                    task_data = await msg_queue.get()
                    phone, message, customer_name = task_data['phone'], task_data['message'], task_data['customer_name']

                    try:
                        print(f"\n⚡ INICIANDO DISPARO: {customer_name} ({phone})", flush=True)
                        
                        # Verificação se ainda precisa de login antes de enviar
                        if await page.query_selector("canvas"):
                            print("❌ ABORTADO: Robô está deslogado. Escaneie o QR Code primeiro!")
                            msg_queue.task_done()
                            continue

                        clean_phone = "".join(filter(str.isdigit, phone))
                        if not clean_phone.startswith("55") and len(clean_phone) <= 11:
                            clean_phone = "55" + clean_phone
                        
                        wp_url = f"https://web.whatsapp.com/send/?phone={clean_phone}&text={urllib.parse.quote(message)}&type=phone_number&app_absent=0"
                        print(f"🔗 Abrindo chat de {customer_name}...", flush=True)
                        
                        # Tenta carregar o chat
                        try:
                            await page.goto(wp_url, wait_until="load", timeout=60000)
                            
                            print("⏳ Aguardando processamento do WhatsApp...", flush=True)
                            # Esperar o campo de texto carregar OU mensagem de erro de número inválido
                            await page.wait_for_selector("div[contenteditable='true'], [data-testid='popup-controls-ok']", timeout=45000)
                            
                            # Verifica se o número é inválido
                            invalid_popup = await page.query_selector("[data-testid='popup-controls-ok']")
                            if invalid_popup:
                                print(f"❌ ERRO: O número {phone} parece ser inválido para o WhatsApp.")
                                await invalid_popup.click()
                                await asyncio.sleep(2)
                                continue

                            print("🖱️ Focando no campo de mensagem...", flush=True)
                            await page.click("div[contenteditable='true']")
                            await asyncio.sleep(2)

                            # Verificar se o texto está lá (às vezes a URL falha em preencher)
                            text_exists = await page.evaluate("() => document.querySelector('div[contenteditable=\"true\"]').innerText.length > 0")
                            if not text_exists:
                                print("✍️ Texto não detectado! Digitando manualmente...", flush=True)
                                await page.type("div[contenteditable='true']", message)
                                await asyncio.sleep(2)
                            
                            print("🚀 Pressionando ENVIAR...", flush=True)
                            # Tenta todos os seletores conhecidos de botão
                            btn_selectors = [
                                "span[data-icon='send']",
                                "[data-testid='compose-btn-send']",
                                "button[aria-label='Enviar']",
                                "footer button"
                            ]
                            
                            sent = False
                            for sel in btn_selectors:
                                btn = await page.query_selector(sel)
                                if btn:
                                    await btn.click()
                                    print(f"✅ Botão '{sel}' clicado!", flush=True)
                                    sent = True
                                    break
                            
                            if not sent:
                                await page.keyboard.press("Enter")
                                print("⌨️ Tecla Enter disparada como fallback!", flush=True)
                                
                            print(f"🎯 CONCLUÍDO! Mensagem processada para {customer_name}.", flush=True)
                            await asyncio.sleep(8) 
                        except Exception as inner_e:
                            print(f"❌ Falha técnica no chat: {inner_e}", flush=True)
                            await page.keyboard.press("Enter")
                            await asyncio.sleep(5)
                        
                    except Exception as e:
                        print(f"⚠️ Erro no ciclo de envio: {e}", flush=True)
                    finally:
                        msg_queue.task_done()
                        
        except Exception as e:
            retry_count += 1
            print(f"⚠️ Erro no Motor Playwright (Tentativa {retry_count}): {e}")
            await asyncio.sleep(10)

def start_pw_thread():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(playwright_manager())

# Inicia a thread do motor Playwright
threading.Thread(target=start_pw_thread, daemon=True).start()

def send_whatsapp_message(phone, message, customer_name):
    # Envia a tarefa para a fila do Playwright de forma segura entre threads
    if pw_loop and msg_queue:
        pw_loop.call_soon_threadsafe(
            msg_queue.put_nowait, 
            {'phone': phone, 'message': message, 'customer_name': customer_name}
        )
        print(f"📥 [FILA NINJA] Tarefa agendada para: {customer_name}")
        return True
    print("⚠️ AVISO: O Motor de WhatsApp ainda está aquecendo. Tente em 30 segundos.")
    return False

@app.route('/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "online",
        "printer": get_default_printer(),
        "engine": "Ninja Matrix 1.0 (Local)"
    })

@app.route('/printers', methods=['GET'])
def list_printers():
    printers = [p[2] for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
    return jsonify({"printers": printers})

@app.route('/print', methods=['POST'])
def print_content():
    data = request.json
    content = data.get('content')
    printer_name = data.get('printer_name') or get_default_printer()
    
    if not content:
        return jsonify({"success": False, "message": "Sem conteúdo"}), 400
        
    success = print_raw_text(printer_name, content)
    return jsonify({"success": success})

@app.route('/notify', methods=['POST'])
def notify():
    data = request.json
    status_key = data.get('status')
    customer_name = data.get('customer_name', 'Cliente')
    phone = data.get('phone')
    order_id = data.get('numero_pedido') or data.get('order_id')
    codigo_entrega = data.get('codigo_entrega') # 🛡️ Segredo Bilateral
    
    if not phone or phone == 'Telefone não cadastrado':
        return jsonify({"success": False, "message": "Telefone inválido"}), 400

    # 🛡️ Garantir envio único por status de pedido
    notif_id = (order_id, status_key)
    if order_id and notif_id in sent_notifications:
        print(f"🚫 Notificacao já enviada para {customer_name} (Status: {status_key})", flush=True)
        return jsonify({"success": True, "message": "Já enviado"}), 200

    def process_task():
        print(f"🤖 Preparando mensagem p/ {customer_name} (Status: {status_key})...", flush=True)
        
        # Gera mensagem usando a Matriz Ninja (JSON Local)
        msg = generate_matrix_message(status_key, customer_name, codigo_entrega)
        
        # Registrar como enviada para evitar duplicidade
        if order_id:
            sent_notifications.add(notif_id)

        # Envio Real
        send_whatsapp_message(phone, msg, customer_name)

    threading.Thread(target=process_task).start()
    return jsonify({"success": True})

# --- Funções da Bandeja e Main ---

def on_open_dashboard(icon, item):
    webbrowser.open(DASHBOARD_URL)

def on_exit(icon, item):
    icon.stop()
    os._exit(0)

def on_connect_whatsapp(icon, item):
    global login_mode
    print("📢 Modo de Conexao WhatsApp ativado! Reiniciando motor ninja...", flush=True)
    login_mode = True
    # Aqui poderíamos forçar o restart do thread do playwright se necessário,
    # mas por simplicidade, avisamos o usuario
    webbrowser.open("https://web.whatsapp.com")
    print("⚠️ Por favor, escaneie o QR Code no seu navegador padrao ou aguarde o motor reiniciar.")

def setup_tray():
    try:
        image = Image.open(ICON_PATH)
    except:
        image = Image.new('RGB', (64, 64), color=(255, 69, 0))
    
    menu = (
        item('Abrir Painel Ninja', on_open_dashboard),
        item('Conectar WhatsApp (QR Code)', on_connect_whatsapp),
        item('Ver Status Agente', lambda: webbrowser.open(f"http://localhost:{PORT}/status")),
        item('Sair', on_exit),
    )
    
    icon = pystray.Icon("Fome Ninja", image, "Fome Ninja Agent", menu)
    icon.run()

def run_flask():
    print(f"🚀 Servidor rodando na porta {PORT}...", flush=True)
    app.run(port=PORT, debug=False, use_reloader=False)

if __name__ == '__main__':
    try:
        print("="*50)
        print("      🥷 FOME NINJA - AGENTE 100% LOCAL 🚀")
        print("="*50)
        
        print(f"Impressora Padrao: {get_default_printer()}")
        print("="*50)
        
        t = threading.Thread(target=run_flask)
        t.daemon = True
        t.start()
        
        threading.Timer(2, lambda: webbrowser.open(DASHBOARD_URL)).start()
        setup_tray()
    except Exception as e:
        import traceback
        error_msg = f"❌ ERRO FATAL AO INICIAR AGENTE: {e}\n{traceback.format_exc()}"
        print(error_msg, flush=True)
        with open("fatal_error_v2.txt", "w", encoding="utf-8") as f:
            f.write(error_msg)
        os._exit(1)
