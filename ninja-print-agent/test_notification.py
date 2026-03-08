import requests
import json
import sys

def test_ninja_notification():
    url = "http://localhost:5001/notify"
    
    # --- CONFIGURAÇÃO DO TESTE ---
    # Coloque o SEU número com DDD (ex: 83988880000)
    # O agente vai formatar automaticamente o 55
    phone_test = "83981691823" 
    customer_name = "Ninja de Teste"
    # Status possíveis: "aceito", "preparando", "saiu_entrega", "coletado"
    status_to_test = "coletado" 
    codigo_entrega = "1234" 
    
    import random
    order_id_rand = str(random.randint(1000, 9999))
    
    payload = {
        "status": status_to_test,
        "customer_name": customer_name,
        "phone": phone_test,
        "codigo_entrega": codigo_entrega,
        "order_id": order_id_rand # ID Aleatório para evitar o cache de duplicidade
    }
    
    print(f"🚀 Enviando disparo de teste para {customer_name} ({phone_test})...")
    print(f"📦 Status: {status_to_test}")
    print(f"🛡️ Código: {codigo_entrega}")
    print(f"🆔 Order ID: {order_id_rand}")
    
    try:
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            print("\n✅ SOLICITAÇÃO RECEBIDA PELO AGENTE!")
            print("👉 O Agente Ninja está processando o envio em segundo plano.")
            print("👉 Você pode continuar usando seu computador normalmente! 🥷")
        else:
            print(f"\n❌ Erro no Agente (Status {response.status_code})")
            print(f"Resposta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERRO: O 'agent.py' não parece estar rodando!")
        print("Certifique-se de que você rodou 'py agent.py' em outro terminal.")

if __name__ == "__main__":
    test_ninja_notification()
