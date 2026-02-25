import os
import sys
import asyncio

# BLINDAGEM NO TOPO
os.environ["PWNOTTY"] = "1"
os.environ["UV_THREADPOOL_SIZE"] = "64"

from playwright.async_api import async_playwright

async def test_pw():
    print("🚀 Iniciando Teste Playwright...")
    try:
        async with async_playwright() as p:
            print("🌐 Lançando navegador...")
            browser = await p.chromium.launch(headless=False)
            page = await browser.new_page()
            print("🔗 Acessando Google como teste...")
            await page.goto("https://www.google.com")
            print(f"✅ Sucesso! Título: {await page.title()}")
            await asyncio.sleep(5)
            await browser.close()
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    asyncio.run(test_pw())
