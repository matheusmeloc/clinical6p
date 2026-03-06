"""
Script de Depuração: poll_debug.py

Realiza testes de polling (consultas repetidas) para verificar o
comportamento do sistema sob chamadas contínuas.
"""
import requests
import time
import json

def poll_endpoint():
    print("Polling https://clinicapsi.onrender.com/api/debug/test-email for deployment...")
    while True:
        try:
            resp = requests.get("https://clinicapsi.onrender.com/api/debug/test-email", timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                print("\nDEPLOYMENT READY! Here is the SMTP Traceback:")
                print(json.dumps(data, indent=2))
                break
            else:
                print(f"Status: {resp.status_code}. Still deploying... waiting 10s.")
        except Exception as e:
            print(f"Error connecting: {e}. Waiting 10s.")
        time.sleep(10)

if __name__ == "__main__":
    poll_endpoint()
