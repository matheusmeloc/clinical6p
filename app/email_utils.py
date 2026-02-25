import smtplib
from email.message import EmailMessage
import logging
from app.config import settings
from app.database import SessionLocal
from app.models import SystemSettings
from sqlalchemy import select
import asyncio

logger = logging.getLogger(__name__)

async def get_smtp_settings():
    async with SessionLocal() as db:
        result = await db.execute(select(SystemSettings).order_by(SystemSettings.id))
        db_settings = result.scalars().first()
        
        server = db_settings.smtp_server if db_settings and db_settings.smtp_server else settings.SMTP_SERVER
        port = db_settings.smtp_port if db_settings and db_settings.smtp_port else settings.SMTP_PORT
        username = db_settings.smtp_username if db_settings and db_settings.smtp_username else settings.SMTP_USERNAME
        password = db_settings.smtp_password if db_settings and db_settings.smtp_password else settings.SMTP_PASSWORD
        from_email = db_settings.smtp_from_email if db_settings and db_settings.smtp_from_email else (settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME)
        
        return server, port, username, password, from_email

async def send_appointment_alarm(professional_email: str, professional_name: str, patient_name: str, date_str: str, time_str: str):
    server, port, username, password, from_email = await get_smtp_settings()
    
    if not server or not username or not professional_email:
        logger.warning(f"SMTP not configured or missing professional email. Skipping alarm for {professional_name}")
        return False
        
    msg = EmailMessage()
    msg['Subject'] = f"Lembrete de Consulta: {patient_name} às {time_str}"
    msg['From'] = from_email
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
    server, port, username, password, from_email = await get_smtp_settings()
    
    if not server or not username or not professional_email:
        logger.warning(f"SMTP not configured or missing professional email. Skipping message notification for {professional_name}")
        return False
        
    msg = EmailMessage()
    msg['Subject'] = f"Nova Mensagem de Paciente: {patient_name}"
    msg['From'] = from_email
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
            with smtplib.SMTP(server, port) as smtp:
                smtp.ehlo()
                if settings.SMTP_TLS:
                    smtp.starttls()
                smtp.login(username, password)
                smtp.send_message(msg)
            logger.info(f"Message notification email sent to {professional_email} for patient {patient_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {professional_email}: {e}")
            return False

    # Run the blocking SMTP call in a thread pool
    result = await asyncio.to_thread(_send_email)
    return result

async def send_patient_welcome_email(patient_email: str, patient_name: str, patient_cpf: str, patient_password: str):
    server, port, username, password, from_email = await get_smtp_settings()
    
    if not server or not username or not patient_email:
        logger.warning(f"SMTP not configured or missing patient email. Skipping welcome email for {patient_name}")
        return False
        
    msg = EmailMessage()
    msg['Subject'] = f"Bem-vindo ao Sistema do Instituto de Psicologia"
    msg['From'] = from_email
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
            with smtplib.SMTP(server, port) as smtp:
                smtp.ehlo()
                if settings.SMTP_TLS:
                    smtp.starttls()
                smtp.login(username, password)
                smtp.send_message(msg)
            logger.info(f"Welcome email sent to {patient_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send welcome email to {patient_email}: {e}")
            return False

    # Run the blocking SMTP call in a thread pool
    result = await asyncio.to_thread(_send_email)
    return result

async def send_professional_welcome_email(email: str, name: str, password: str):
    server, port, username, smtp_password, from_email = await get_smtp_settings()
    
    if not server or not username or not email:
        logger.warning(f"SMTP not configured or missing email. Skipping welcome email for {name}")
        return False
        
    msg = EmailMessage()
    msg['Subject'] = f"Bem-vindo ao Sistema do Instituto de Psicologia"
    msg['From'] = from_email
    msg['To'] = email
    
    html_content = f"""
    <html>
        <body>
            <h2>Olá, {name}!</h2>
            <p>Seu cadastro como profissional no sistema da clínica foi realizado com sucesso.</p>
            <p>Agora você pode acessar o portal para gerenciar seus pacientes, consultas e painel.</p>
            <br>
            <p><strong>Seus dados de acesso:</strong></p>
            <ul>
                <li><strong>E-mail (Login):</strong> {email}</li>
                <li><strong>Senha Provisória:</strong> {password}</li>
            </ul>
            <p>Recomendamos que troque esta senha ou guarde-a com segurança.</p>
            <br>
            <p>Atenciosamente,<br>Equipe do Instituto de Psicologia</p>
        </body>
    </html>
    """
    msg.set_content("Bem-vindo ao Sistema da Clínica", subtype="plain")
    msg.add_alternative(html_content, subtype="html")
    
    def _send_email():
        try:
            with smtplib.SMTP(server, port) as smtp:
                smtp.ehlo()
                if settings.SMTP_TLS:
                    smtp.starttls()
                smtp.login(username, smtp_password)
                smtp.send_message(msg)
            logger.info(f"Welcome email sent to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send welcome email to {email}: {e}")
            return False

    result = await asyncio.to_thread(_send_email)
    return result

async def send_forgot_password_email(email: str, is_patient: bool, login_id: str, temp_password: str):
    server, port, username, smtp_password, from_email = await get_smtp_settings()
    
    if not server or not username or not email:
        logger.warning(f"SMTP not configured or missing email. Skipping forgot password email for {email}")
        return False
        
    msg = EmailMessage()
    msg['Subject'] = f"Recuperação de Senha - Instituto de Psicologia"
    msg['From'] = from_email
    msg['To'] = email
    
    login_type = "CPF" if is_patient else "E-mail"
    html_content = f"""
    <html>
        <body>
            <h2>Olá!</h2>
            <p>Recebemos uma solicitação de recuperação de senha para a sua conta.</p>
            <p>Por questões de segurança, geramos uma nova senha provisória para você acessar o sistema.</p>
            <br>
            <p><strong>Seus dados de acesso:</strong></p>
            <ul>
                <li><strong>{login_type} (Login):</strong> {login_id}</li>
                <li><strong>Nova Senha Provisória:</strong> {temp_password}</li>
            </ul>
            <p>Recomendamos que altere esta senha no painel de configurações do sistema.</p>
            <br>
            <p>Atenciosamente,<br>Equipe do Instituto de Psicologia</p>
        </body>
    </html>
    """
    msg.set_content("Recuperação de Senha", subtype="plain")
    msg.add_alternative(html_content, subtype="html")
    
    def _send_email():
        try:
            with smtplib.SMTP(server, port) as smtp:
                smtp.ehlo()
                if settings.SMTP_TLS:
                    smtp.starttls()
                smtp.login(username, smtp_password)
                smtp.send_message(msg)
            logger.info(f"Forgot password email sent to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send forgot password email to {email}: {e}")
            return False

    result = await asyncio.to_thread(_send_email)
    return result
