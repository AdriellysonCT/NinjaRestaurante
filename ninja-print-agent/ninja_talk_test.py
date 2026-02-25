import os
import sys
import time
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_whatsapp_connection():
    print("="*50)
    print("      🧪 TESTE DE CONEXÃO WHATSAPP STEALTH")
    print("="*50)
    
    # 1. Definir um caminho limpo para o perfil
    # Vamos usar uma pasta 'test_session' para não sujar a oficial
    session_path = os.path.abspath(os.path.join(os.getcwd(), "test_whatsapp_session"))
    
    if os.path.exists(session_path):
        print(f"🧹 Limpando sessão de teste anterior em: {session_path}")
        # Tenta remover se possível, ou apenas avisa
        try:
            import shutil
            # shutil.rmtree(session_path) # Comentado por segurança, mas o ideal seria limpar
        except:
            pass

    print("🚀 Iniciando navegador...")
    
    options = uc.ChromeOptions()
    
    # Argumentos para tentar resolver o "Erro de Banco de Dados"
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    # Flags que ajudam com o erro de IndexedDB/Banco de dados
    options.add_argument("--disable-gpu")
    options.add_argument("--memory-pressure-off")
    options.add_argument("--disable-features=IsolateOrigins,site-per-process")
    
    try:
        # Tenta iniciar o driver
        driver = uc.Chrome(
            options=options,
            user_data_dir=session_path,
            headless=False
        )
        
        print("✅ Navegador aberto! Acessando WhatsApp Web...")
        driver.get("https://web.whatsapp.com")
        
        print("\n📢 INSTRUÇÕES:")
        print("1. Verifique se a mensagem de 'Erro no banco de dados' apareceu.")
        print("2. Se o QR Code carregar, escaneie com seu celular.")
        print("3. Se carregar suas conversas, o teste foi um SUCESSO.")
        print("\nO script ficará aberto por 2 minutos para você testar...")
        
        # Espera para ver se o QR code ou a lista de conversas aparece
        # O seletor 'canvas' costuma ser o QR code
        try:
            wait = WebDriverWait(driver, 60)
            wait.until(EC.presence_of_element_located((By.TAG_NAME, "canvas")))
            print("✨ QR Code detectado na tela!")
        except:
            print("⏳ QR Code não apareceu em 60s, mas continue observando a tela...")

        time.sleep(120) 
        driver.quit()
        
    except Exception as e:
        print(f"❌ Erro fatal no teste: {e}")
        if "already in use" in str(e):
            print("👉 Pare de rodar o agent.py antes de rodar este teste!")

if __name__ == "__main__":
    test_whatsapp_connection()
