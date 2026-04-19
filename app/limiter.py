"""
Rate Limiting — instância global do slowapi
Importado por main.py (middleware) e pelos endpoints que precisam de limite.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
