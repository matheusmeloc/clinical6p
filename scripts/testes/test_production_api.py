"""
Script de Teste: test_production_api.py

Executa testes com configurações próximas do ambiente de produção.
Ajuda a flagrar erros que só ocorrem fora do ambiente de desenvolvimento.
"""
import requests

def test_api():
    print("Testing forgot_password...")
    try:
        r = requests.post("https://clinicapsi.onrender.com/api/forgot-password", json={"email": "matheumelo@gmail.com"})
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
