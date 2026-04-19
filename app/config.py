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
    # Banco de dados — obrigatório via .env ou variável de ambiente
    DATABASE_URL: str

    # JWT — obrigatório via .env ou variável de ambiente
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # CORS — domínios permitidos separados por vírgula
    ALLOWED_ORIGINS: str = "http://localhost:8000"

    # Debug — habilita /api/debug/* (false em produção)
    ENABLE_DEBUG: bool = False

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
