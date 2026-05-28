"""
Autenticação — Hash/verificação de senhas + geração/validação de JWT
- Usa Argon2 para hash de senhas
- Usa PyJWT (HS256) para tokens de acesso
"""

import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings

# Contexto de criptografia — Argon2 para hash de senhas
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Esquema de autenticação: extrai o Bearer token do header Authorization
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Gera um JWT assinado com os dados fornecidos e prazo de expiração."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Dependência FastAPI: valida o Bearer token e retorna o payload do JWT."""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado. Faça login novamente.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido.")


def require_role(allowed_roles: list[str]):
    """
    Factory de dependência RBAC.
    Uso: Depends(require_role(["admin", "user"]))
    Lança 403 se o role do JWT não estiver na lista permitida.
    """
    def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Permissão insuficiente para acessar este recurso.",
            )
        return current_user
    return dependency
