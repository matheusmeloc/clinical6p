"""
Script de Teste: test_route.py

Framework simples contido num único script para bater em rotas da  
aplicação web, avaliando status codes retornados (200, 404, etc).
"""
import requests

try:
    print("Testing local endpoint...")
    r = requests.get("http://127.0.0.1:8000/api/debug/test-email")
    print(r.status_code)
    print(r.text)
except Exception as e:
    print(e)
