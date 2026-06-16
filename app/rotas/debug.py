"""
Rotas de Debug e Ferramentas Internas
- Teste de conexão SMTP (diagnóstico de infraestrutura de e-mails)
"""

import smtplib
import traceback
from typing import Any
from fastapi import APIRouter, Depends, HTTPException

from app.database import AsyncSession, get_db
from app.email_utils import get_smtp_settings
from app.config import settings

router = APIRouter(prefix="/api/debug", tags=["Debug"])


from fastapi.security import HTTPBearer
import jwt

security_optional = HTTPBearer(auto_error=False)


async def _require_debug_or_admin(auth: Any = Depends(security_optional)) -> None:
    """Libera o acesso se ENABLE_DEBUG estiver ativo ou se for admin autenticado."""
    if settings.ENABLE_DEBUG:
        return
    if not auth:
        raise HTTPException(status_code=401, detail="Token de autenticação ausente.")
    try:
        payload = jwt.decode(
            auth.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience="clinical6p-api",
            issuer="clinical6p",
        )
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Apenas administradores podem testar a conexão SMTP.")
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")


# ═════════════════════════════════════════════════════════════════════
# FERRAMENTAS
# ═════════════════════════════════════════════════════════════════════

@router.get("/test-email")
async def test_smtp_connection(db: AsyncSession = Depends(get_db), _: None = Depends(_require_debug_or_admin)) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A 'função' Bate-Papo com o Correio.
    Ela tenta ligar correndo lá pro servidor do GMail (ou Outlook) usando os dados que gravamos nas configurações.
    Se a ligação for atendida (Sucesso), ela se desconecta e avisa: "Tá tudo funcionando!".
    Se a ligação cair ou a senha estiver errada, ela "captura" o motivo da falha no bloco 'except Exception' e joga na tela, dizendo o porquê deu errado.
    """
    server, port, username, password, from_email = await get_smtp_settings(db)

    response = {
        "server": server,
        "port": port,
        "username": username,
        "from_email": from_email,
        "success": False,
        "error": None,
        "traceback": None
    }

    try:
        # Usa factory de gerenciamento de conexão local para forçar o timeout
        with smtplib.SMTP(server, port, timeout=10) as smtp:
            smtp.ehlo()
            if settings.SMTP_TLS:
                smtp.starttls()
            smtp.login(username, password)
            response["success"] = True

    except Exception as e:
        response["error"] = str(e)
        response["traceback"] = traceback.format_exc()

    return response
