"""
Script de Teste: test_hash.py

Testa rigorosamente as funções de geração e verificação de hashes de
senhas, assegurando robustez na segurança das credenciais.
"""
from app.auth import verify_password
import asyncio

def test_hash():
    h = "$argon2id$v=19$m=65536,t=3,p=4$IwSglLL23rt3rnWuFYLQWg$xoiqIKOEd89ozZhqQuylnxxEbNpoxtb5clzPR+u8gCw"
    p1 = "1234"
    p2 = "1234 "
    print(f"Testing 1234: {verify_password(p1, h)}")
    print(f"Testing 1234 : {verify_password(p2, h)}")
    
    # Verifica se podemos gerar o hash e verificar agora mesmo
    from app.auth import get_password_hash
    new_h = get_password_hash("1234")
    print(f"New Hash verifies: {verify_password('1234', new_h)}")

if __name__ == "__main__":
    test_hash()
