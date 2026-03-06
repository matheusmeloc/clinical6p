"""
Script de Teste: test_production_debug.py

Testes auxiliares de diagnóstico projetados especificamente para a 
coleta segura de métricas em um ambiente simulando produção.
"""
import requests
import json

def test_production():
    print("Testing Admin Login...")
    try:
        r = requests.post("https://clinicapsi.onrender.com/api/login", json={
            "email": "admin@admin.com",
            "password": "admin"
        })
        print(f"Admin Login Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Admin Login Error: {e}")

    print("\nTesting Professional Login w/ Temporary Password...")
    try:
        r = requests.post("https://clinicapsi.onrender.com/api/login", json={
            "email": "matheumelo@gmail.com",
            "password": "INSERT_PASSWORD_HERE"  # Não sei a senha temporária exata
        })
        print(f"Prof Login Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        pass

    print("\nTesting Forgot Password (trigger email)...")
    try:
        r = requests.post("https://clinicapsi.onrender.com/api/forgot-password", json={
            "email": "matheumelo@gmail.com"
        })
        print(f"Forgot Pwd Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Forgot Pwd Error: {e}")

if __name__ == "__main__":
    test_production()
