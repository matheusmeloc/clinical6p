"""
Configurações gerais da aplicação
- Variáveis de ambiente (via .env ou valores padrão)
- Conexão com banco de dados
- Credenciais SMTP para envio de e-mail

[EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
Neste arquivo não criamos funções ('def'), nós criamos um modelo de informações ('class').
Pense na 'Classe' como um molde de gesso. O molde 'Settings' diz que o nosso projeto SEMPRE terá as configurações listadas abaixo (como se fosse uma lista de regras essenciais da casa: qual a chave mestra, qual o endereço do banco, etc).
"""

from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    # Banco de dados (PostgreSQL async em produção)
    DATABASE_URL: str = "postgresql+asyncpg://banco_site_psi_user:NZQA0tG6bM3aXlDccRAjXo16DVETKJ1l@dpg-d6fh1hsr85hc73e0n6e0-a.oregon-postgres.render.com/banco_site_psi"

    # JWT (autenticação por token)
    SECRET_KEY: str = "your_secret_key_here_make_it_secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # SMTP (configuração padrão, pode ser sobrescrita pelo banco)
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_TLS: bool = True

    # Carrega variáveis do arquivo .env automaticamente
    model_config = ConfigDict(env_file=".env")


# Instância global de configurações (importar: from app.config import settings)
settings = Settings()
