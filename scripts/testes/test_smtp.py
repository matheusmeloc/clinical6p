"""
Script de Teste: test_smtp.py

Verifica as configurações e a liberação de portas SMTP locais
ou do serviço de mensageria subjacente.
"""
import asyncio
import smtplib
from email.message import EmailMessage

def test_smtp_direct():
    print("Testing direct SMTP connection...")
    try:
        # We know from check_prod_db.py that settings are:
        # SMTP=smtp.gmail.com:587 User=matheusimporer@gmail.com
        server_addr = "smtp.gmail.com"
        port = 587
        
        print(f"Connecting to {server_addr}:{port}...")
        smtp = smtplib.SMTP(server_addr, port, timeout=10)
        smtp.set_debuglevel(1)
        print("Connected! Sending EHLO...")
        smtp.ehlo()
        print("Starting TLS...")
        smtp.starttls()
        print("Quitting...")
        smtp.quit()
        print("SUCCESS: SMTP server is reachable.")
    except Exception as e:
        print(f"FAILURE: SMTP connection error: {e}")

if __name__ == "__main__":
    test_smtp_direct()
