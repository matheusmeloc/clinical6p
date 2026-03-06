"""
Script de Teste: test_email.py

Realiza o teste padrão de envio de e-mails comum (ex: boas-vindas)
utilizando a infraestrutura de correio configurada.
"""
import asyncio
import smtplib
from email.message import EmailMessage
from app.config import settings
from app.database import SessionLocal
from sqlalchemy.future import select
from app.models import SystemSettings

async def test_email_direct():
    print("Fetching SMTP settings from DB...")
    async with SessionLocal() as db:
        result = await db.execute(select(SystemSettings).order_by(SystemSettings.id))
        db_settings = result.scalars().first()
        
        server = db_settings.smtp_server if db_settings and db_settings.smtp_server else settings.SMTP_SERVER
        port = db_settings.smtp_port if db_settings and db_settings.smtp_port else settings.SMTP_PORT
        username = db_settings.smtp_username if db_settings and db_settings.smtp_username else settings.SMTP_USERNAME
        password = db_settings.smtp_password if db_settings and db_settings.smtp_password else settings.SMTP_PASSWORD
        from_email = db_settings.smtp_from_email if db_settings and db_settings.smtp_from_email else (settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME)

        print(f"Server: {server}")
        print(f"Port: {port}")
        print(f"Username: {username}")
        # Não exibindo a senha por segurança, apenas mostrando o tamanho para verificar se ela existe
        print(f"Password provided: {'Yes' if password else 'No'} (len: {len(password) if password else 0})")
        print(f"From Email: {from_email}")

        if not server or not username:
             print("ERROR: Incomplete SMTP config in database.")
             return

        print("\nAttempting to connect to SMTP server...")
        try:
            with smtplib.SMTP(server, port) as smtp:
                smtp.set_debuglevel(1) # Print all SMTP protocol messages
                smtp.ehlo()
                print("Starting TLS...")
                smtp.starttls()
                smtp.ehlo()
                print("Logging in...")
                smtp.login(username, password)
                
                print("Sending test email...")
                msg = EmailMessage()
                msg['Subject'] = "Apenas um teste do Sistema Clínico"
                msg['From'] = from_email
                msg['To'] = "matheusimporer@gmail.com" # Usando o e-mail do usuário como destino para o teste
                msg.set_content("Teste de envio de e-mail pelo console de diagnóstico.")
                
                smtp.send_message(msg)
                print("SUCCESS: Email sent without exceptions!")
        except Exception as e:
            print(f"EXCEPTION DUMP: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_email_direct())
