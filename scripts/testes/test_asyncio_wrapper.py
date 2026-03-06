"""
Script de Teste: test_asyncio_wrapper.py

Testa implementações assíncronas do sistema e os wrappers de concorrência,
garantindo que não existam deadlocks ou travamentos de loop de eventos.
"""
import asyncio
from app.email_utils import send_forgot_password_email
from app.database import SessionLocal
from app.models import User
from sqlalchemy.future import select

async def test_email_async():
    print("Testing async email wrapper direct call...")
    try:
        # Precisamos testar exatamente a mesma função que a rota chama
        result = await send_forgot_password_email("matheumelo@gmail.com", False, "matheumelo@gmail.com", "testpwd123")
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error during async email test: {e}")

if __name__ == "__main__":
    asyncio.run(test_email_async())
