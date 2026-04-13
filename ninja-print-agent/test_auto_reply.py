"""
🧪 Teste da Funcionalidade de Auto-Resposta

Este script testa os endpoints de auto-resposta do Fome Ninja Agent.
Certifique-se de que o agent está rodando antes de executar este teste.
"""

import requests
import json

BASE_URL = "http://localhost:5001"

def test_auto_reply():
    print("="*60)
    print("🥷 TESTE - Auto-Resposta Fome Ninja")
    print("="*60)
    
    # 1. Verificar status do agent
    print("\n1️⃣ Verificando status do agent...")
    try:
        response = requests.get(f"{BASE_URL}/status")
        if response.status_code == 200:
            print(f"✅ Agent online: {response.json()}")
        else:
            print(f"❌ Erro ao verificar status: {response.status_code}")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Agent não está rodando! Execute agent.py primeiro.")
        return
    
    # 2. Listar contatos com auto-resposta (inicialmente vazio)
    print("\n2️⃣ Listando contatos com auto-resposta...")
    response = requests.get(f"{BASE_URL}/auto-reply/contacts")
    if response.status_code == 200:
        data = response.json()
        print(f"📊 Total: {data['total']} contatos")
        if data['contacts']:
            print(f"📱 Contatos: {data['contacts']}")
        else:
            print("✅ Nenhum contato ainda (cache vazio)")
    
    # 3. Simular adição de contato (via reset para testar)
    print("\n3️⃣ Testando reset de cache...")
    response = requests.post(f"{BASE_URL}/auto-reply/reset")
    if response.status_code == 200:
        print(f"✅ Reset realizado: {response.json()['message']}")
    
    # 4. Testar reset para contato específico
    print("\n4️⃣ Testando reset para contato específico...")
    test_phone = "83981691823"
    response = requests.post(
        f"{BASE_URL}/auto-reply/reset",
        json={"phone": test_phone}
    )
    if response.status_code == 200:
        print(f"✅ Contato {test_phone}: {response.json()['message']}")
    else:
        print(f"ℹ️ Contato não existia ainda (normal): {response.json().get('message', '')}")
    
    # 5. Verificar novamente
    print("\n5️⃣ Verificando contatos após operações...")
    response = requests.get(f"{BASE_URL}/auto-reply/contacts")
    if response.status_code == 200:
        data = response.json()
        print(f"📊 Total atualizado: {data['total']} contatos")
    
    print("\n" + "="*60)
    print("✅ Testes concluídos!")
    print("="*60)
    print("\n💡 Para testar na prática:")
    print("   1. Abra o WhatsApp Web")
    print("   2. Peça para alguém enviar uma mensagem")
    print("   3. O agent responderá automaticamente com o cardápio!")
    print(f"   4. Link do cardápio: {requests.get(f'{BASE_URL}/auto-reply/contacts').request.url}")

if __name__ == "__main__":
    test_auto_reply()
