"""
Autenticação — Hash e verificação de senhas
- Usa Argon2 (algoritmo moderno e seguro)
"""

from passlib.context import CryptContext

# Contexto de criptografia — Argon2 para hash de senhas
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que é uma 'função' (def)? É um bloco de código que executa uma ação específica. Pense nela como uma pequena máquina: você coloca os ingredientes e ela te devolve um resultado.
    
    Nesta nossa máquina chamada 'verify_password' (verificar senha):
    - Ela recebe dois ingredientes: a senha normal que a pessoa digitou ('plain_password') e a senha embaralhada ('hashed_password') que estava salva no banco de dados.
    - Ela devolve uma resposta do tipo 'bool' (booleano), que significa apenas Verdadeiro (True) ou Falso (False). Se retornar Verdadeiro, a senha está correta e a pessoa pode entrar no sistema!
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que faz esta 'função' (def)? 
    A máquina 'get_password_hash' (pegar o hash da senha) serve para a segurança do sistema.
    
    Sempre que um usuário cria uma conta com uma senha, nós NUNCA salvamos a senha igual ele digitou.
    Nós entregamos a senha para essa função, e ela devolve um texto muito longo e embaralhado (o Hash).
    É esse texto embaralhado que guardamos no banco. Assim, se alguém invadir o banco de dados, não saberá a senha verdadeira.
    """
    return pwd_context.hash(password)
