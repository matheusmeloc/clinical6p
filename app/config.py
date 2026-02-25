from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://banco_site_psi_user:NZQA0tG6bM3aXlDccRAjXo16DVETKJ1l@dpg-d6fh1hsr85hc73e0n6e0-a.oregon-postgres.render.com/banco_site_psi"
    SECRET_KEY: str = "your_secret_key_here_make_it_secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_TLS: bool = True
    
    model_config = ConfigDict(env_file=".env")

settings = Settings()
