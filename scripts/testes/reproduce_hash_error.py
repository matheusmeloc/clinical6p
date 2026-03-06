"""
Script de Teste/Apoio: reproduce_hash_error.py

Script focado em reproduzir especificamente um erro conhecido de hash
(por exemplo, no bcrypt ou autenticação) falhando intencionalmente para debug.
"""
from app.auth import get_password_hash

try:
    print("Attempting to hash password...")
    hash = get_password_hash("test")
    print(f"Success: {hash}")
except Exception as e:
    print(f"Error: {e}")
