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

async def send_patient_welcome_email(patient_email: str, patient_name: str, patient_cpf: str, patient_password: str):
    if not settings.SMTP_SERVER or not settings.SMTP_USERNAME or not patient_email:
        logger.warning(f"SMTP not configured or missing patient email. Skipping welcome email for {patient_name}")
        return False
        
    msg = EmailMessage()
    msg['Subject'] = f"Bem-vindo ao Sistema do Instituto de Psicologia"
    msg['From'] = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    msg['To'] = patient_email
    
    html_content = f"""
    <html>
        <body>
            <h2>Olá, {patient_name}!</h2>
            <p>Seu cadastro no sistema da clínica foi realizado com sucesso.</p>
            <p>Agora você pode acessar o portal para enviar mensagens sobre o seu dia a dia para o seu psicólogo.</p>
            <br>
            <p><strong>Seus dados de acesso:</strong></p>
            <ul>
                <li><strong>CPF (Login):</strong> {patient_cpf}</li>
                <li><strong>Senha Provisória:</strong> {patient_password}</li>
            </ul>
            <p>Recomendamos que guarde esta senha com segurança.</p>
            <br>
            <p>Atenciosamente,<br>Equipe do Instituto de Psicologia</p>
        </body>
    </html>
    """
    msg.set_content("Bem-vindo ao Sistema da Clínica", subtype="plain")
    msg.add_alternative(html_content, subtype="html")
    
    def _send_email():
        try:
            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
                server.ehlo()
                if settings.SMTP_TLS:
                    server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"Welcome email sent to {patient_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send welcome email to {patient_email}: {e}")
            return False

    # Run the blocking SMTP call in a thread pool
    result = await asyncio.to_thread(_send_email)
    return result
