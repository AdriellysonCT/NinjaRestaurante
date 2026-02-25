import asyncio
import os
import shutil
from playwright.async_api import async_playwright

async def run_test():
    print("="*50)
    print("      🧪 TESTE WHATSAPP - MODO FORÇA BRUTA")
    print("="*50)
    
    # Vamos usar uma pasta fora do Downloads para evitar erros de permissão
    user_data_dir = "C:\\ninja_wp_data"
    
    print(f"📂 Usando pasta de dados: {user_data_dir}")

    # Se a pasta estiver corrompida, vamos tentar limpar (opcional)
    # if os.path.exists(user_data_dir):
    #     print("🧹 Limpando dados antigos para evitar erros de CacheStorage...")
    #     try: shutil.rmtree(user_data_dir)
    #     except: print("⚠️ Nao foi possivel apagar a pasta, talvez esteja em uso.")

    if not os.path.exists(user_data_dir):
        os.makedirs(user_data_dir)

    async with async_playwright() as p:
        print("🚀 Iniciando navegador com flags de compatibilidade...")
        
        # O segredo aqui é NÃO usar flags que desativam o GPU ou Cache
        # Queremos que pareça o MAIS REAL possível
        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            viewport={'width': 1280, 'height': 720},
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-infobars",
                "--enable-features=NetworkService,NetworkServiceInProcess",
                "--ignore-certificate-errors"
            ]
        )
        
        page = await context.new_page()
        
        # Define um User Agent humano
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        })

        print("🌐 Acessando WhatsApp Web...")
        try:
            # Aumentamos o tempo de espera para 60s
            await page.goto("https://web.whatsapp.com", wait_until="domcontentloaded", timeout=60000)
            
            print("\n✅ Se o erro de 'CacheStorage' sumiu, o QR Code vai aparecer em instantes.")
            print("📢 Se o QR Code aparecer, ESCANEIE AGORA.")
            
            # Espera 10 minutos para você conseguir logar com calma
            await asyncio.sleep(600)
            
        except Exception as e:
            print(f"❌ Erro ao carregar página: {e}")
            
        await context.close()

if __name__ == "__main__":
    try:
        asyncio.run(run_test())
    except KeyboardInterrupt:
        print("\nTeste encerrado pelo usuário.")
