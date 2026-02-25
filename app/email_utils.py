import smtplib
from email.message import EmailMessage
import logging
from app.config import settings
import asyncio

logger = logging.getLogger(__name__)

async def send_appointment_alarm(professional_email: str, professional_name: str, patient_name: str, date_str: str, time_str: str):
    if not settings.SMTP_SERVER or not settings.SMTP_USERNAME or not professional_email:
        logger.warning(f"SMTP not configured or missing professional email. Skipping alarm for {professional_name}")
        return False
        
    msg = EmailMessage()
    msg['Subject'] = f"Lembrete de Consulta: {patient_name} às {time_str}"
    msg['From'] = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    msg['To'] = professional_email
    
    html_content = f"""
    <html>
        <body>
            <h2>Olá, {professional_name}!</h2>
            <p>Este é um lembrete automático de que você possui uma consulta em breve.</p>
            <ul>
                <li><strong>Paciente:</strong> {patient_name}</li>
                <li><strong>Data:</strong> {date_str}</li>
                <li><strong>Horário:</strong> {time_str}</li>
            </ul>
            <p>Atenciosamente,<br>Equipe do Instituto de Psicologia</p>
        </body>
    </html>
    """
    msg.set_content("Lembrete de Consulta", subtype="plain")
    msg.add_alternative(html_content, subtype="html")
    
    def _send_email():
        try:
            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
                server.ehlo()
                if settings.SMTP_TLS:
                    server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"Alarm email sent to {professional_email} for patient {patient_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {professional_email}: {e}")
            return False

    # Run the blocking SMTP call in a thread pool
    result = await asyncio.to_thread(_send_email)
    return result

async def send_patient_message_notification(professional_email: str, professional_name: str, patient_name: str):
    if not settings.SMTP_SERVER or not settings.SMTP_USERNAME or not professional_email:
        logger.warning(f"SMTP not configured or missing professional email. Skipping message notification for {professional_name}")
        return False
        
    msg = EmailMessage()
    msg['Subject'] = f"Nova Mensagem de Paciente: {patient_name}"
    msg['From'] = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    msg['To'] = professional_email
    
    html_content = f"""
    <html>
        <body>
            <h2>Olá, {professional_name}!</h2>
            <p>Você recebeu uma nova mensagem do paciente <strong>{patient_name}</strong>.</p>
            <p>Acesse o painel do sistema para ler o que seu paciente escreveu sobre o dia dele.</p>
            <br>
            <p>Atenciosamente,<br>Equipe do Instituto de Psicologia</p>
        </body>
    </html>
    """
    msg.set_content("Nova Mensagem de Paciente", subtype="plain")
    msg.add_alternative(html_content, subtype="html")
    
    def _send_email():
        try:
            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
                server.ehlo()
                if settings.SMTP_TLS:
                    server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"Message notification email sent to {professional_email} for patient {patient_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {professional_email}: {e}")
            return False

    # Run the blocking SMTP call in a thread pool
    result = await asyncio.to_thread(_send_email)
    return result
