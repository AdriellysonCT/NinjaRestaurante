import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
print(f"Chave: {key[:5]}...{key[-5:]}")

genai.configure(api_key=key)

print("\nListando modelos:")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Erro ao listar: {e}")

print("\nTestando geração com gemini-1.5-flash:")
try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Oi")
    print(f"Resposta: {response.text}")
except Exception as e:
    print(f"Erro no flash: {e}")

print("\nTestando com prefixo models/:")
try:
    model = genai.GenerativeModel('models/gemini-1.5-flash')
    response = model.generate_content("Oi")
    print(f"Resposta: {response.text}")
except Exception as e:
    print(f"Erro no models/flash: {e}")
