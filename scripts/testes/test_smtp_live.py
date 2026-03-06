"""
Script de Teste: test_smtp_live.py

Testa a comunicação SMTP usando conexões reais externas, ideal para
validar autenticação do provedor de e-mail (Gmail, SendGrid, etc).
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.config import settings
from app.models import SystemSettings
import smtplib
from email.message import EmailMessage

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        result = await session.execute(select(SystemSettings).order_by(SystemSettings.id))
        db_settings = result.scalars().first()
        
        server = db_settings.smtp_server if db_settings and db_settings.smtp_server else settings.SMTP_SERVER
        port = db_settings.smtp_port if db_settings and db_settings.smtp_port else settings.SMTP_PORT
        username = db_settings.smtp_username if db_settings and db_settings.smtp_username else settings.SMTP_USERNAME
        password = db_settings.smtp_password if db_settings and db_settings.smtp_password else settings.SMTP_PASSWORD
        from_email = db_settings.smtp_from_email if db_settings and db_settings.smtp_from_email else (settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME)
        
        print(f"Server: {server}")
        print(f"Port: {port}")
        print(f"Username: {username}")
        print(f"From Email: {from_email}")
        
        # Testa a conexão e o login
        try:
            print("Connecting...")
            smtp = smtplib.SMTP(server, port, timeout=10)
            smtp.set_debuglevel(1)
            smtp.ehlo()
            smtp.starttls()
            print("Logging in...")
            smtp.login(username, password)
            print("Login successful!")
            
            # Send test email
            to_email = "matheumelo@gmail.com"
            msg = EmailMessage()
            msg['Subject'] = "Teste de Diagnóstico do SMTP da Clínica"
            msg['From'] = from_email
            msg['To'] = to_email
            msg.set_content("Email enviado com sucesso diretamente via script de teste no servidor!")
            
            print(f"Sending test email to {to_email}...")
            smtp.send_message(msg)
            print("Email sent!")
            
            smtp.quit()

        except Exception as e:
            print(f"SMTP Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
