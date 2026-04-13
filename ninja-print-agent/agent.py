# Configuração Fixa do Painel Oficial
DASHBOARD_URL = "https://ninja-restaurante.vercel.app"
PORT = 5001

import os
import sys
import time

# 🛡️ BLINDAGEM MÁXIMA PARA WINDOWS
# Essas flags evitam o erro "Assertion failed: process_title" no Windows
os.environ["UV_THREADPOOL_SIZE"] = "64"
os.environ["PWNOTTY"] = "1"
os.environ["PW_NOTTY"] = "1"

# 🌐 SOLUÇÃO PARA PLAYWRIGHT NO EXE
# Força o Playwright a buscar os navegadores na pasta padrão do sistema (AppData/Local)
# em vez de procurar dentro da pasta temporária do PyInstaller (_MEI).
if getattr(sys, 'frozen', False):
    local_app_data = os.environ.get('LOCALAPPDATA')
    if local_app_data:
        os.environ['PLAYWRIGHT_BROWSERS_PATH'] = os.path.join(local_app_data, 'ms-playwright')

import json
import webbrowser
import threading
import random
import urllib.parse
import io
import asyncio
import subprocess
import re
from concurrent.futures import ThreadPoolExecutor
import http.client as http_client

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    import win32print
    import win32ui
    import win32con
    import win32event
    import winerror
    import win32api
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

# --- TRAVA DE INSTÂNCIA ÚNICA (SINGLETON) ---
def show_windows_notification(title, message):
    """Dispara uma notificacao real do Windows (Toast) via PowerShell"""
    try:
        # Comando PowerShell para mostrar um balao de notificacao no sistema
        powershell_cmd = f'[reflection.assembly]::loadwithpartialname("System.Windows.Forms"); [reflection.assembly]::loadwithpartialname("System.Drawing"); $notification = new-object system.windows.forms.notifyicon; $notification.icon = [system.drawing.systemicons]::Information; $notification.visible = $true; $notification.showballoontip(5000, "{title}", "{message}", [system.windows.forms.tooltipicon]::Info)'
        subprocess.Popen(["powershell", "-Command", powershell_cmd], 
                         creationflags=subprocess.CREATE_NO_WINDOW,
                         stdout=subprocess.DEVNULL, 
                         stderr=subprocess.DEVNULL)
    except:
        pass

def check_single_instance():
    """Garante que apenas UMA instancia do agente rode por vez"""
    mutex_name = "Global\\FomeNinjaAgent_Mutex_1337"
    mutex = win32event.CreateMutex(None, False, mutex_name)
    last_error = win32api.GetLastError()
    
    if last_error == winerror.ERROR_ALREADY_EXISTS:
        # Dispara a notificacao no canto da tela
        show_windows_notification("NinjaTalk Ativo", "O Agente Ninja já está rodando em segundo plano! Procure o ícone da laranja perto do relógio.")
        
        # Fallback MessageBox caso o usuario nao veja a notificacao
        try:
            win32api.MessageBox(0, "O Agente Ninja já está aberto e pronto para as missões!", "Aviso Ninja", win32con.MB_ICONINFORMATION)
        except:
            pass
        return False
    return mutex

# Guardar referencia global para o mutex nao ser coletado pelo GC
app_mutex = check_single_instance()
if not app_mutex:
    os._exit(0)

app = Flask(__name__)
CORS(app)

# --- CONFIGURAÇÃO NINJA ---
load_dotenv()
print("✨ Agente Ninja (Modo Local JSON) configurado!", flush=True)

# 🛡️ Cache de Notificacoes Enviadas (Evita Duplicidade)
sent_notifications = set() # Store (order_id, status)

# 🤝 Cache de Auto-Resposta (Evita spam de boas-vindas)
# Estrutura: {phone: {restaurante_id: timestamp, ...}, ...}
auto_responded_contacts = {} # Store {phone: {restaurante_slug: timestamp}}

# 🔗 Link do Cardápio para Auto-Resposta (pode ser sobrescrito por restaurante)
CARDAPIO_LINK = os.getenv("CARDAPIO_LINK", "")  # Link padrão vazio - será enviado pelo painel

# 📱 Modo de Login (para reconexão manual)
login_mode = False

# 🏪 Cache de Links de Restaurantes (ID -> Link do Cardápio)
restaurantes_cache = {} # {restaurante_id: {nome: "Fenix", link: "https://..."}}

# 🔗 Configurações do Supabase para consulta de pedidos
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# 🤖 Palavras-chave para detecção de intenção
PALAVRAS_CHAVE_STATUS = [
    "pedido", "status", "acompanhar", "andamento", "situacao",
    "como está", "como esta", "previsao", "previsão", "entrega",
    "saiu", "chegou", "pronto", "saiu para entrega", "qual status",
    "meu pedido", "pedido numero", "pedido número"
]

PALAVRAS_CHAVE_CARDAPIO = [
    "cardápio", "cardapio", "menu", "pratos", "pedir",
    "fazer pedido", "ver cardápio", "ver cardapio"
]

PALAVRAS_CHAVE_HORARIO = [
    "horário", "horario", "funcionamento", "aberto", "fechado",
    "que horas", "quando abre", "quando fecha", "expediente"
]

if sys.platform == "win32":
    # 🛡️ Proteção contra erro NoneType em modo --windowed (sem console)
    if sys.stdout is not None:
        try:
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        except AttributeError:
            # Já pode estar embrulhado ou em um estado que não permite buffer
            pass
    else:
        # Se stdout for None, redirecionamos para o limbo ou um arquivo para evitar crashes no print()
        sys.stdout = open(os.path.join(os.path.dirname(sys.executable) if getattr(sys, 'frozen', False) else ".", "agent_log.txt"), "a", encoding="utf-8")
        sys.stderr = sys.stdout

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

# Sempre verificar os motores, mesmo no EXE, para garantir que o Chromium está lá
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


def consultar_pedido_supabase(phone, restaurante_id=None):
    """Consulta pedidos do cliente no Supabase pelo telefone"""
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("⚠️ Supabase não configurado (SUPABASE_URL/SUPABASE_KEY no .env)", flush=True)
            return None
        
        # Limpa o telefone
        clean_phone = "".join(filter(str.isdigit, phone))
        if not clean_phone.startswith("55") and len(clean_phone) <= 11:
            clean_phone = "55" + clean_phone
        
        # Monta URL do Supabase
        url = SUPABASE_URL.rstrip('/') + f"/rest/v1/pedidos?telefone=eq.{clean_phone}"
        if restaurante_id:
            url += f"&id_restaurante=eq.{restaurante_id}"
        url += "&order=criado_em.desc&limit=1"
        
        # Faz requisição
        conn = http_client.HTTPSURLConnection(SUPABASE_URL.replace("https://", ""))
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }
        
        conn.request("GET", url, headers=headers)
        response = conn.getresponse()
        
        if response.status == 200:
            data = response.read().decode('utf-8')
            pedidos = json.loads(data)
            
            if pedidos and len(pedidos) > 0:
                return pedidos[0]  # Retorna pedido mais recente
        
        return None
        
    except Exception as e:
        print(f"⚠️ Erro ao consultar pedido no Supabase: {e}", flush=True)
        return None


def gerar_resposta_status_pedido(pedido, customer_name):
    """Gera mensagem com status do pedido"""
    try:
        if not pedido:
            return None
        
        # Extrai dados do pedido
        status = pedido.get('status', 'desconhecido')
        numero_pedido = pedido.get('id') or pedido.get('numero_pedido', 'N/A')
        criado_em = pedido.get('criado_em', '')
        
        # Mapeamento de status para mensagens
        status_mensagens = {
            'pendente': f"📋 Seu pedido *#{numero_pedido}* está *pendente* e será confirmado em breve!",
            'aceito': f"🔥 Seu pedido *#{numero_pedido}* foi *aceito* e já está sendo preparado!",
            'preparando': f"👨‍🍳 Seu pedido *#{numero_pedido}* está sendo *preparado* com todo carinho!",
            'pronto': f"✅ Seu pedido *#{numero_pedido}* está *PRONTO* e aguardando retirada/entrega!",
            'saiu_entrega': f"🛵 Seu pedido *#{numero_pedido}* *SAIU PARA ENTREGA*! Fique atento!",
            'entregue': f"🎉 Seu pedido *#{numero_pedido}* foi *ENTREGUE*! Bom apetite!",
            'cancelado': f"❌ Seu pedido *#{numero_pedido}* foi *cancelado*. Entre em contato para mais informações."
        }
        
        mensagem = status_mensagens.get(status, f"📦 Status do seu pedido *#{numero_pedido}*: {status}")
        
        # Adiciona tempo estimado se disponível
        tempo_preparo = pedido.get('tempo_preparo')
        if tempo_preparo and status in ['aceito', 'preparando']:
            mensagem += f"\n\n⏱️ Tempo estimado: *{tempo_preparo} minutos*"
        
        # Adiciona saudação
        mensagem_final = f"Olá {customer_name}! 😊\n\n{mensagem}\n\nQualquer dúvida estamos aqui! 🥷"
        
        return mensagem_final
        
    except Exception as e:
        print(f"⚠️ Erro ao gerar resposta de status: {e}", flush=True)
        return None


def detectar_intencao_mensagem(mensagem):
    """Detecta a intenção da mensagem do cliente baseada em palavras-chave"""
    if not mensagem:
        return None
    
    mensagem_lower = mensagem.lower()
    
    # Verifica cada grupo de palavras-chave
    for palavra in PALAVRAS_CHAVE_STATUS:
        if palavra.lower() in mensagem_lower:
            return 'status_pedido'
    
    for palavra in PALAVRAS_CHAVE_CARDAPIO:
        if palavra.lower() in mensagem_lower:
            return 'cardapio'
    
    for palavra in PALAVRAS_CHAVE_HORARIO:
        if palavra.lower() in mensagem_lower:
            return 'horario'
    
    return None


def gerar_resposta_intencao(intencao, customer_name=None, restaurante_id=None, mensagem_cliente=None, phone=None):
    """Gera resposta baseada na intenção detectada"""
    
    if intencao == 'status_pedido':
        # Consulta pedido do cliente
        if not phone:
            return f"Olá {customer_name}! 😊\n\nPara consultar seu pedido, me informe seu telefone: (XX) XXXXX-XXXX"
        
        pedido = consultar_pedido_supabase(phone, restaurante_id)
        
        if pedido:
            return gerar_resposta_status_pedido(pedido, customer_name)
        else:
            return f"Olá {customer_name}! 😊\n\nNão encontrei pedidos recentes para seu telefone. Verifique o número ou faça um novo pedido pelo nosso cardápio: {CARDAPIO_LINK}\n\nQualquer dúvida estamos aqui! 🥷"
    
    elif intencao == 'cardapio':
        return generate_auto_reply_message(customer_name, restaurante_id)
    
    elif intencao == 'horario':
        return f"Olá {customer_name}! 😊\n\n🕐 Nosso horário de funcionamento:\n• Segunda a Sexta: 18h às 23h\n• Sábados e Domingos: 17h às 00h\n\nFaça seu pedido agora: {CARDAPIO_LINK}\n\nQualquer dúvida estamos aqui! 🥷"
    
    return None


async def check_and_reply_new_messages(page, auto_responded_contacts, restaurante_id=None):
    """Verifica novas mensagens no WhatsApp Web e responde automaticamente"""
    try:
        print("🔍 Verificando novas conversas...", flush=True)
        
        # Clica no painel lateral para garantir que estamos na view de conversas
        try:
            await page.click("div[data-testid='chat-list']", timeout=3000)
            await asyncio.sleep(1)
        except:
            pass
        
        # Procura por conversas com mensagens não lidas
        # WhatsApp Web marca com classe 'unread' ou mostra badge verde
        chat_items = await page.query_selector_all("div[data-testid='cell-frame-container']")
        
        if not chat_items:
            print("  Nenhuma conversa encontrada na lista", flush=True)
            return
        
        print(f"  Encontradas {len(chat_items)} conversas na lista", flush=True)
        
        for item in chat_items[:5]:  # Checa apenas as 5 primeiras
            try:
                # Verifica se tem badge de não lida
                unread_badge = await item.query_selector("span[data-testid='unread-count']")
                
                # Tenta extrair nome e telefone
                title_el = await item.query_selector("span[title]")
                if not title_el:
                    continue
                    
                title = await title_el.get_attribute("title")
                if not title:
                    continue
                
                print(f"  📱 Conversa: {title}", flush=True)
                
                # Se tem mensagem não lida, responde
                if unread_badge or True:  # Responde a todas as novas conversas
                    # Clica na conversa para abrir
                    await item.click()
                    await asyncio.sleep(2)
                    
                    # Verifica se já respondeu antes PARA ESTE RESTAURANTE
                    phone_clean = "".join(filter(str.isdigit, title))
                    if not phone_clean.startswith("55") and len(phone_clean) <= 11:
                        phone_clean = "55" + phone_clean
                    
                    # Inicializa estrutura do telefone se não existe
                    if phone_clean not in auto_responded_contacts:
                        auto_responded_contacts[phone_clean] = {}
                    
                    # Verifica se já respondeu para este contato neste restaurante
                    if restaurante_id and restaurante_id in auto_responded_contacts[phone_clean]:
                        print(f"    ⏭️ Já respondeu para {title} neste restaurante, pulando...", flush=True)
                        continue
                    
                    # Verifica se é uma conversa nova (sem mensagens enviadas ainda)
                    # Procura pela última mensagem enviada (que seria nossa, à direita)
                    sent_msgs = await page.query_selector_all("div[data-testid='chat-body-content'] > div:nth-child(2)")
                    
                    # Se tem poucas ou nenhuma mensagem enviada, é conversa nova
                    if len(sent_msgs) < 2:
                        print(f"    ✨ Nova conversa detectada! Respondendo {title}...", flush=True)
                        
                        # Gera mensagem de boas-vindas com link do restaurante específico
                        reply_msg = generate_auto_reply_message(title, restaurante_id)
                        
                        # Envia a mensagem
                        await send_message_direct(page, reply_msg)
                        
                        # Marca como respondido PARA ESTE RESTAURANTE
                        if restaurante_id:
                            auto_responded_contacts[phone_clean][restaurante_id] = time.time()
                        else:
                            auto_responded_contacts[phone_clean]["default"] = time.time()
                        
                        print(f"    ✅ Auto-resposta enviada para {title}!", flush=True)
                    else:
                        print(f"    ⏭️ Conversa já existente com {title}", flush=True)
                        
            except Exception as e:
                print(f"    ⚠️ Erro ao processar conversa: {e}", flush=True)
                continue
        
        # Volta para o painel inicial
        await page.goto("https://web.whatsapp.com", wait_until="networkidle", timeout=30000)
        
    except Exception as e:
        print(f"❌ Erro ao verificar mensagens: {e}", flush=True)


async def check_and_reply_incoming_messages(page, restaurante_id=None):
    """Verifica mensagens RECEBIDAS em conversas existentes e responde por intenção"""
    try:
        print("🔍 Verificando mensagens recebidas...", flush=True)
        
        # Clica na lista de conversas
        try:
            await page.click("div[data-testid='chat-list']", timeout=3000)
            await asyncio.sleep(1)
        except:
            pass
        
        # Procura por conversas com mensagens não lidas
        chat_items = await page.query_selector_all("div[data-testid='cell-frame-container']")
        
        if not chat_items:
            return
        
        for item in chat_items[:5]:  # Checa até 5 conversas
            try:
                # Verifica badge de não lida
                unread_badge = await item.query_selector("span[data-testid='unread-count']")
                if not unread_badge:
                    continue  # Só processa se tiver mensagens não lidas
                
                # Extrai nome/telefone
                title_el = await item.query_selector("span[title]")
                if not title_el:
                    continue
                
                title = await title_el.get_attribute("title")
                phone_clean = "".join(filter(str.isdigit, title))
                if not phone_clean.startswith("55") and len(phone_clean) <= 11:
                    phone_clean = "55" + phone_clean
                
                print(f"  📨 Mensagem não lida de: {title}", flush=True)
                
                # Clica para abrir conversa
                await item.click()
                await asyncio.sleep(2)
                
                # Extrai última mensagem recebida (do cliente)
                # Mensagens recebidas têm classe específica no WhatsApp Web
                last_incoming_msg = await page.query_selector_all("div[data-testid='chat-body-content'] span[dir='ltr']")
                
                if not last_incoming_msg:
                    print("    ⚠️ Não foi possível extrair mensagem", flush=True)
                    continue
                
                # Pega a última mensagem
                last_msg_el = last_incoming_msg[-1]
                message_text = await last_msg_el.inner_text()
                
                if not message_text or len(message_text.strip()) < 3:
                    print("    ⚠️ Mensagem muito curta ou vazia", flush=True)
                    continue
                
                print(f"    💬 Mensagem recebida: '{message_text[:50]}...'")
                
                # Detecta intenção
                intencao = detectar_intencao_mensagem(message_text)
                
                if not intencao:
                    print("    ⏭️ Sem intenção detectada, pulando...", flush=True)
                    continue
                
                print(f"    🎯 Intenção detectada: {intencao}")
                
                # Gera resposta baseada na intenção
                reply_msg = gerar_resposta_intencao(
                    intencao=intencao,
                    customer_name=title,
                    restaurante_id=restaurante_id,
                    mensagem_cliente=message_text,
                    phone=phone_clean
                )
                
                if not reply_msg:
                    print("    ⚠️ Não foi possível gerar resposta", flush=True)
                    continue
                
                # Envia resposta
                print(f"    📨 Enviando resposta...", flush=True)
                await send_message_direct(page, reply_msg)
                print(f"    ✅ Resposta enviada para {title}!", flush=True)
                
                # Aguarda antes de processar próxima conversa
                await asyncio.sleep(3)
                
            except Exception as e:
                print(f"    ⚠️ Erro ao processar conversa: {e}", flush=True)
                continue
        
        # Volta para painel inicial
        await page.goto("https://web.whatsapp.com", wait_until="networkidle", timeout=30000)
        
    except Exception as e:
        print(f"❌ Erro ao verificar mensagens recebidas: {e}", flush=True)


async def send_message_direct(page, message):
    """Envia mensagem diretamente na conversa atual"""
    try:
        # Foca no campo de texto
        await page.click("div[contenteditable='true']", timeout=10000)
        await asyncio.sleep(1)
        
        # Digita a mensagem
        await page.type("div[contenteditable='true']", message, delay=50)
        await asyncio.sleep(2)
        
        # Clica no botão de enviar
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
                print(f"    ✅ Enviado via selector: {sel}", flush=True)
                sent = True
                break
        
        if not sent:
            await page.keyboard.press("Enter")
            print("    ✅ Enviado via Enter", flush=True)
        
        await asyncio.sleep(3)
        return True
        
    except Exception as e:
        print(f"    ❌ Erro ao enviar mensagem: {e}", flush=True)
        return False


def generate_auto_reply_message(customer_name=None, restaurante_id=None):
    """Gera mensagem automática de boas-vindas para novos contatos"""
    try:
        path = resource_path('mensagens_reserva.json')
        
        # Obtém link do cardápio do restaurante específico ou usa o padrão
        cardapio_link = CARDAPIO_LINK
        restaurante_nome = ""
        
        if restaurante_id and restaurante_id in restaurantes_cache:
            cardapio_link = restaurantes_cache[restaurante_id].get('link', CARDAPIO_LINK)
            restaurante_nome = restaurantes_cache[restaurante_id].get('nome', '')
        
        if not cardapio_link:
            return f"Olá! 👋 Bem-vindo! 🥷\n\nFaça seu pedido conosco!"

        if not os.path.exists(path):
            return f"Olá! 👋 Bem-vindo ao *{restaurante_nome or 'nosso restaurante'}*! 🥷\n\nNosso cardápio: {cardapio_link}"

        with open(path, 'r', encoding='utf-8') as f:
            matriz = json.load(f)

        auto_resposta = matriz.get('auto_resposta', {})
        saudacoes = auto_resposta.get('saudacoes', ["Olá! Bem-vindo ao nosso restaurante! 🥷"])
        corpo = auto_resposta.get('corpo', "Confira nosso cardápio: {cardapio_link}")
        fechamentos = auto_resposta.get('fechamentos', ["Qualquer dúvida estamos aqui! 👍"])

        saudacao = random.choice(saudacoes)
        corpo_msg = corpo.replace("{cardapio_link}", cardapio_link)
        fechamento = random.choice(fechamentos)

        mensagem = f"{saudacao}\n\n{corpo_msg}\n\n{fechamento}"
        return mensagem
    except Exception as e:
        print(f"⚠️ Erro ao gerar auto-resposta: {e}")
        return f"Olá! 👋 Bem-vindo! 🥷\n\nNosso cardápio: {CARDAPIO_LINK}"


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

                # 🤝 Monitor de novas conversas (Auto-resposta)
                last_checked_time = time.time()
                print("👂 Monitor de conversas ativado! Respondendo automaticamente...", flush=True)

                while True:
                    # 🤝 VERIFICAR MENSAGENS RECEBIDAS (Prioridade baixa, roda entre envios)
                    try:
                        current_time = time.time()
                        # Checa a cada 30 segundos
                        if current_time - last_checked_time >= 30:
                            last_checked_time = current_time
                            
                            # 1️⃣ Verifica NOVAS conversas (auto-resposta de boas-vindas)
                            try:
                                unread_badges = await page.query_selector("span[data-testid='unread-count']")
                                if unread_badges:
                                    print("📬 Detectada(s) mensagem(ns não lida(s), verificando...", flush=True)
                                    await check_and_reply_new_messages(page, auto_responded_contacts, restaurante_id=None)
                            except Exception as e:
                                print(f"⚠️ Erro ao verificar novas conversas: {e}", flush=True)
                            
                            # 2️⃣ Verifica MENSAGENS RECEBIDAS em conversas existentes (respostas por intenção)
                            try:
                                await check_and_reply_incoming_messages(page, restaurante_id=None)
                            except Exception as e:
                                print(f"⚠️ Erro ao verificar mensagens recebidas: {e}", flush=True)
                                
                    except Exception as e:
                        pass  # Silenciar erros de monitoramento para não atrapalhar envios

                    task_data = await msg_queue.get()
                    phone, message, customer_name = task_data['phone'], task_data['message'], task_data['customer_name']
                    restaurante_id = task_data.get('restaurante_id')  # 🏪 Extrai ID do restaurante

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

    # ✅ IMPRESSÃO DIRETA: Usa RAW mode (sem dialog do Windows)
    print(f"🖨️ Impressão direta para: {printer_name}", flush=True)
    success = print_raw_text(printer_name, content)
    
    if success:
        print(f"✅ Comanda impressa com sucesso!", flush=True)
    else:
        print(f"❌ Falha na impressão", flush=True)
    
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


@app.route('/auto-reply/contacts', methods=['GET'])
def get_auto_reply_contacts():
    """Lista contatos que já receberam auto-resposta"""
    return jsonify({
        "total": len(auto_responded_contacts),
        "contacts": list(auto_responded_contacts)
    })


@app.route('/auto-reply/reset', methods=['POST'])
def reset_auto_reply():
    """Reseta cache de auto-resposta (opcional: para contato específico ou todos)"""
    data = request.json or {}
    phone = data.get('phone')
    
    if phone:
        clean_phone = "".join(filter(str.isdigit, phone))
        if not clean_phone.startswith("55") and len(clean_phone) <= 11:
            clean_phone = "55" + clean_phone
        
        if clean_phone in auto_responded_contacts:
            del auto_responded_contacts[clean_phone]
            return jsonify({"success": True, "message": f"Contato {phone} liberado para auto-resposta"})
        return jsonify({"success": False, "message": "Contato não encontrado"}), 404
    else:
        count = len(auto_responded_contacts)
        auto_responded_contacts.clear()
        return jsonify({"success": True, "message": f"Cache de auto-resposta resetado ({count} contatos)"})


@app.route('/register-restaurant', methods=['POST'])
def register_restaurant():
    """Registra um restaurante no cache do agent (chamado pelo painel web)"""
    data = request.json
    
    restaurante_id = data.get('restaurante_id')
    restaurante_nome = data.get('nome', 'Restaurante')
    cardapio_link = data.get('cardapio_link', '')
    
    if not restaurante_id or not cardapio_link:
        return jsonify({"success": False, "message": "restaurante_id e cardapio_link são obrigatórios"}), 400
    
    restaurantes_cache[restaurante_id] = {
        'nome': restaurante_nome,
        'link': cardapio_link
    }
    
    print(f"🏪 Restaurante registrado: {restaurante_nome} (ID: {restaurante_id})", flush=True)
    print(f"   📱 Link do cardápio: {cardapio_link}", flush=True)
    
    return jsonify({
        "success": True, 
        "message": f"Restaurante {restaurante_nome} registrado com sucesso"
    })


@app.route('/auto-reply/send', methods=['POST'])
def trigger_auto_reply():
    """Dispara auto-resposta para um contato específico (chamado pelo painel web)"""
    data = request.json
    
    phone = data.get('phone')
    customer_name = data.get('customer_name', 'Cliente')
    restaurante_id = data.get('restaurante_id')
    
    if not phone:
        return jsonify({"success": False, "message": "Telefone é obrigatório"}), 400
    
    # Verifica se já respondeu para este contato neste restaurante
    clean_phone = "".join(filter(str.isdigit, phone))
    if not clean_phone.startswith("55") and len(clean_phone) <= 11:
        clean_phone = "55" + clean_phone
    
    if clean_phone not in auto_responded_contacts:
        auto_responded_contacts[clean_phone] = {}
    
    if restaurante_id and restaurante_id in auto_responded_contacts[clean_phone]:
        return jsonify({"success": True, "message": "Já respondeu para este contato neste restaurante"}), 200
    
    # Gera mensagem com link do restaurante específico
    reply_msg = generate_auto_reply_message(customer_name, restaurante_id)
    
    # Envia via fila do Playwright
    if pw_loop and msg_queue:
        pw_loop.call_soon_threadsafe(
            msg_queue.put_nowait,
            {
                'phone': phone, 
                'message': reply_msg, 
                'customer_name': customer_name,
                'is_auto_reply': True,
                'restaurante_id': restaurante_id
            }
        )
        
        # Marca como respondido
        if restaurante_id:
            auto_responded_contacts[clean_phone][restaurante_id] = time.time()
        else:
            auto_responded_contacts[clean_phone]["default"] = time.time()
        
        print(f"📨 Auto-resposta agendada para {customer_name} ({phone})", flush=True)
        return jsonify({"success": True, "message": "Auto-resposta agendada"})
    
    return jsonify({"success": False, "message": "Agent não está pronto"}), 503

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

def on_reset_auto_reply(icon, item):
    """Reseta cache de auto-resposta pelo menu do tray"""
    print("🔄 Resetando cache de auto-resposta...", flush=True)
    auto_responded_contacts.clear()
    print("✅ Cache resetado! Novas conversas serão respondidas automaticamente.", flush=True)

def on_view_restaurantes(icon, item):
    """Mostra restaurantes cadastrados no tray"""
    print("\n🏪 Restaurantes cadastrados:", flush=True)
    if not restaurantes_cache:
        print("  Nenhum restaurante registrado ainda", flush=True)
    else:
        for rid, info in restaurantes_cache.items():
            print(f"  📱 {info['nome']} (ID: {rid})", flush=True)
            print(f"     Link: {info['link']}", flush=True)
    print()

def setup_tray():
    try:
        image = Image.open(ICON_PATH)
    except:
        image = Image.new('RGB', (64, 64), color=(255, 69, 0))

    menu = (
        item('Abrir Painel Ninja', on_open_dashboard),
        item('Conectar WhatsApp (QR Code)', on_connect_whatsapp),
        item('Ver Status Agente', lambda: webbrowser.open(f"http://localhost:{PORT}/status")),
        item('Ver Restaurantes', on_view_restaurantes),
        item('Resetar Auto-Resposta', on_reset_auto_reply),
        item('Ver Contatos Auto-Resposta', lambda: webbrowser.open(f"http://localhost:{PORT}/auto-reply/contacts")),
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
