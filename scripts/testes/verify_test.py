"""
Script de Teste: verify_test.py

Um roteiro mestre que pode validar e verificar a execução 
de outras etapas do fluxo de desenvolvimento ou banco de dados.
"""
import asyncio
import secrets
from app.auth import get_password_hash, verify_password

async def test_crypto():
    temp_pwd = secrets.token_urlsafe(8)
    print(f"Generated Password: '{temp_pwd}'")
    
    hashed = get_password_hash(temp_pwd)
    print(f"Hashed: {hashed}")
    
    is_valid = verify_password(temp_pwd, hashed)
    print(f"Is Valid (exact match): {is_valid}")
    
    is_valid_with_space = verify_password(temp_pwd + " ", hashed)
    print(f"Is Valid (trailing space): {is_valid_with_space}")

if __name__ == "__main__":
    asyncio.run(test_crypto())
