import os
import sys

# 🛡️ BLINDAGEM MÁXIMA PARA WINDOWS (Executar antes de TUDO)
os.environ["PWNOTTY"] = "1"
os.environ["PW_NOTTY"] = "1" 
os.environ["UV_THREADPOOL_SIZE"] = "64"
os.environ["NODE_OPTIONS"] = "--no-warnings"

import json
import webbrowser
import threading
import time
import random
import urllib.parse
import io
import asyncio
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
    from dotenv import load_dotenv
    from google import genai
    from playwright.async_api import async_playwright
except ImportError as e:
    print(f"❌ Erro crítico: Dependência {e} não encontrada.")
    sys.exit(1)

# Carrega variáveis de ambiente
load_dotenv()

print(f"🐍 Python Executable: {sys.executable}", flush=True)
print(f"📂 WorkDir: {os.getcwd()}", flush=True)

app = Flask(__name__)
CORS(app)

# Força saída UTF-8 no Windows para evitar erro de emojis
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configurações do Agente
PORT = int(os.getenv("PORT", 5001))
DASHBOARD_URL = os.getenv("DASHBOARD_URL", "https://ninja-restaurante.vercel.app")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# Configura o Gemini (Novo SDK google.genai)
from google import genai
client = None
MODEL_NAME = 'gemini-2.0-flash'

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

ICON_PATH = resource_path("logo-fome-ninja.png")
if not os.path.exists(ICON_PATH):
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

# --- Lógica NinjaTalk AI ---

SYSTEM_INSTRUCTION = """
Você é o atendente virtual do restaurante 'Fome Ninja'. 
Sua missão é avisar o cliente sobre o status do pedido dele.
REGRAS CRÍTICAS:
1. NUNCA se repita. Use variações criativas para cada mensagem.
2. Seja extremamente humano e amigável, como um atendente real no WhatsApp.
3. Use no máximo 1 ou 2 emojis (opcional).
4. NUNCA invente informações. 
5. Seja curto e direto (máximo 2 frases).
6. Use o nome do cliente.
7. Use um tom de voz informal e prestativo: 'Tô passando pra avisar...', 'Olha só, seu pedido...', 'Boa notícia!'.
"""

def test_gemini_connection():
    global client, MODEL_NAME
    if not GEMINI_API_KEY:
        print("⚠️ Alerta: GEMINI_API_KEY nao encontrada no .env")
        return False
    
    print("🤖 Inicializando IA (Novo SDK google.genai)...", flush=True)
    try:
        temp_client = genai.Client(api_key=GEMINI_API_KEY)
        
        # Modelos para testar
        names_to_try = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite']
        
        for name in names_to_try:
            try:
                response = temp_client.models.generate_content(
                    model=name, 
                    contents="Responda OK",
                    config={'max_output_tokens': 5}
                )
                if response and response.text:
                    client = temp_client
                    MODEL_NAME = name
                    print(f"✅ IA Conectada ({MODEL_NAME})", flush=True)
                    return True
            except Exception as e:
                pass # Silencioso no loop
                
        print("💡 Nota: IA em modo de espera (Cota atingida). Usando mensagens padrão.", flush=True)
        return False
    except Exception as e:
        print(f"❌ Erro critico no Gemini: {e}")
        return False

def generate_human_message(status_key, customer_name):
    if not client or not GEMINI_API_KEY:
        return None
    
    status_contexts = {
        "aceito": "informar que o pedido foi aceito e começou o preparo.",
        "preparando": "avisar que o pedido já está na cozinha sendo preparado.",
        "saiu_entrega": "avisar que o pedido já saiu com o entregador e está a caminho.",
    }

    context = status_contexts.get(status_key, f"atualizar sobre: {status_key}")
    prompt = f"{SYSTEM_INSTRUCTION}\n\nStatus: {context}. Cliente: {customer_name}. Escreva a mensagem de WhatsApp."
    
    try:
        response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
        return response.text.strip() if response and response.text else None
    except Exception as e:
        print(f"❌ Erro na geracao IA: {e}")
        return None


# Configuração de Sessão Playwright (Mesmo caminho do teste de sucesso)
PLAYWRIGHT_DATA_DIR = "C:\\ninja_wp_data"
if not os.path.exists(PLAYWRIGHT_DATA_DIR):
    os.makedirs(PLAYWRIGHT_DATA_DIR)

# Filas e Loops para integração Async + Sync
msg_queue = asyncio.Queue()
pw_loop = None

async def playwright_manager():
    global pw_loop, msg_queue
    pw_loop = asyncio.get_running_loop()
    msg_queue = asyncio.Queue()
    
    print("🚀 Motor Playwright Ativo e Fila Re-inicializada!")
    
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            print(f"🌐 Iniciando Motor Ninja (Conectando ao WhatsApp)...", flush=True)
            async with async_playwright() as p:
                context = await p.chromium.launch_persistent_context(
                    PLAYWRIGHT_DATA_DIR,
                    headless=True, # MODO FANTASMA ATIVADO! 🥷
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    viewport={'width': 1280, 'height': 720},
                    ignore_https_errors=True,
                    args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
                )
                
                page = await context.new_page()
                await page.goto("https://web.whatsapp.com", wait_until="load", timeout=120000)
                print("✅ [MOTOR OK] WhatsApp Conectado!", flush=True)

                while True:
                    # Log de status periódico para o usuário não se sentir perdido
                    if msg_queue.empty():
                        print("💤 Agente em prontidão (Fila vazia)...", flush=True)
                        
                    task_data = await msg_queue.get()
                    phone, message, customer_name = task_data['phone'], task_data['message'], task_data['customer_name']

                    try:
                        print(f"🚀 Enviando para -> {customer_name}", flush=True)
                        clean_phone = "".join(filter(str.isdigit, phone))
                        if not clean_phone.startswith("55") and len(clean_phone) <= 11:
                            clean_phone = "55" + clean_phone
                        
                        await page.goto(f"https://web.whatsapp.com/send?phone={clean_phone}&text={urllib.parse.quote(message)}", wait_until="load", timeout=60000)
                        
                        # No modo invisivel/virtual, o Enter eh o comando mais seguro
                        print("⏳ Localizando campo de texto e enviando (Modo Automatico)...", flush=True)
                        
                        # Tenta achar o botao de enviar, mas se nao achar, manda um Enter na pagina
                        try:
                            # Espera estar no chat (o campo de mensagem deve existir)
                            await page.wait_for_selector("footer", timeout=40000)
                            await asyncio.sleep(2) # Pausa para simular humano
                            
                            # Tenta o seletor do botao mas tambem aperta Enter
                            send_button = await page.query_selector("span[data-icon='send'], [data-testid='compose-btn-send']")
                            if send_button:
                                await send_button.click()
                                print("✅ Botao de enviar clicado!", flush=True)
                            else:
                                # Fallback: Aperta Enter no teclado virtual
                                await page.keyboard.press("Enter")
                                print("⌨️ Tecla Enter pressionada no chat!", flush=True)
                                
                            print(f"🎯 SUCESSO! Mensagem entregue para {customer_name}.", flush=True)
                            await asyncio.sleep(5)
                        except Exception as e:
                            print(f"❌ Nao consegui finalizar o envio: {e}. Tentando forcar Enter...", flush=True)
                            await page.keyboard.press("Enter")
                            await asyncio.sleep(5)
                        
                    except Exception as e:
                        print(f"⚠️ Erro no envio ({customer_name}): {e}", flush=True)
                    finally:
                        msg_queue.task_done()
                        
        except Exception as e:
            retry_count += 1
            print(f"⚠️ Erro Motor: {e}")
            await asyncio.sleep(5)

def start_pw_thread():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(playwright_manager())

# Inicia a thread do motor Playwright
threading.Thread(target=start_pw_thread, daemon=True).start()

def send_whatsapp_message(phone, message, customer_name):
    # Envia a tarefa para a fila do Playwright
    if pw_loop and msg_queue:
        pw_loop.call_soon_threadsafe(
            msg_queue.put_nowait, 
            {'phone': phone, 'message': message, 'customer_name': customer_name}
        )
        print(f"📥 Tarefa adicionada a fila: {customer_name}")
        return True
    print("⚠️ Erro: Motor Playwright ainda nao inicializou a fila.")
    return False

@app.route('/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "online",
        "printer": get_default_printer(),
        "model": MODEL_NAME
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
    
    if not phone or phone == 'Telefone não cadastrado':
        return jsonify({"success": False, "message": "Telefone inválido"}), 400

    def process_task():
        print(f"🤖 Gerando mensagem para {customer_name}...", flush=True)
        msg = generate_human_message(status_key, customer_name)
        if not msg:
            print("⚠️ IA falhou ou retornou vazio, usando fallback...")
            # Fallback manual caso a IA falhe total
            fallbacks = {
                "aceito": f"Opa {customer_name}! Seu pedido foi aceito aqui e já vai pra cozinha. 🍕",
                "preparando": f"{customer_name}, seu pedido já tá sendo preparado! 🔥",
                "saiu_entrega": f"Boa notícia! Seu pedido saiu pra entrega agora. 🏍️"
            }
            msg = fallbacks.get(status_key, f"Olá {customer_name}, seu pedido foi atualizado!")

        print(f"📝 Mensagem final: \"{msg}\"", flush=True)
        send_whatsapp_message(phone, msg, customer_name)

    threading.Thread(target=process_task).start()
    return jsonify({"success": True})

# --- Funções da Bandeja e Main ---

def on_open_dashboard(icon, item):
    webbrowser.open(DASHBOARD_URL)

def on_exit(icon, item):
    icon.stop()
    os._exit(0)

def setup_tray():
    try:
        image = Image.open(ICON_PATH)
    except:
        image = Image.new('RGB', (64, 64), color=(255, 69, 0))
    
    menu = (
        item('Abrir Painel Ninja', on_open_dashboard),
        item('Ver Status Agente', lambda: webbrowser.open(f"http://localhost:{PORT}/status")),
        item('Sair', on_exit),
    )
    
    icon = pystray.Icon("Fome Ninja", image, "Fome Ninja Agent", menu)
    icon.run()

def run_flask():
    print(f"🚀 Servidor rodando na porta {PORT}...", flush=True)
    app.run(port=PORT, debug=False, use_reloader=False)

if __name__ == '__main__':
    print("="*50)
    print("      🥷 FOME NINJA - AGENTE PROFISSIONAL 🚀")
    print("="*50)
    
    # Testa a IA logo de cara
    test_gemini_connection()
    
    print(f"Impressora Padrao: {get_default_printer()}")
    print("="*50)
    
    t = threading.Thread(target=run_flask)
    t.daemon = True
    t.start()
    
    threading.Timer(2, lambda: webbrowser.open(DASHBOARD_URL)).start()
    setup_tray()
