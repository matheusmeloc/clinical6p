"""
Rotas de Atestados (Certificates)
- Listar, criar, atualizar, deletar atestados médicos
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from datetime import datetime

from app.database import AsyncSession, get_db
from app.models import Patient, Professional, Certificate
from app.schemas import CertificateCreate, CertificateUpdate, CertificateResponse

router = APIRouter(prefix="/api/certificates", tags=["Atestados"])


# ═════════════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ═════════════════════════════════════════════════════════════════════

async def _certificate_with_names(db: AsyncSession, cert: Certificate) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que é esta 'função'? O Carimbador de Nomes.
    O banco guarda atestados usando apenas o "Número Identificador (ID)" das pessoas pra economizar espaço.
    Mas o usuário final não quer ver "Paciente ID 5 gerou atestado". Ele quer ver o NOME: "João gerou".
    Esta função vai no banco rapidinho, puxa o nome verdadeiro do Paciente e do Médico, tira as impurezas que o banco coloca, junta num dicionário e entrega pronto pra tela.
    """
    patient = await db.scalar(select(Patient).where(Patient.id == cert.patient_id))
    professional = await db.scalar(select(Professional).where(Professional.id == cert.professional_id))
    
    cert_dict = cert.__dict__.copy()
    
    # Remove atributos internos do SQLAlchemy (como _sa_instance_state)
    cert_dict.pop("_sa_instance_state", None)
    
    cert_dict["patient_name"] = patient.name if patient else None
    cert_dict["professional_name"] = professional.name if professional else None
    
    return cert_dict


# ═════════════════════════════════════════════════════════════════════
# ENDPOINTS DE ATESTADOS
# ═════════════════════════════════════════════════════════════════════

@router.get("", response_model=list[CertificateResponse])
async def list_certificates(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A 'função' (async def) que abre a "Gaveta Geral de Atestados".
    Ela puxa todos os papéis (Select) de uma vez e, lá embaixo no 'return', ela repassa um a um pro Carimbador de Nomes traduzir antes de mandar a gaveta inteira lá pro navegador do usuário.
    """
    result = await db.execute(select(Certificate))
    certificates = result.scalars().all()
    
    # Resolve os nomes de forma assíncrona para cada atestado
    return [await _certificate_with_names(db, cert) for cert in certificates]


@router.post("", response_model=CertificateResponse)
async def create_certificate(cert: CertificateCreate, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A 'função' Máquina de Escrever (Para Atestados Novos).
    O médico preencheu o formulário e clicou em salvar. O legal aqui é a malandragem do código: Se o médico esqueceu de escolher a data do atestado, o bloco IF (se não tiver data) fala "Deixa comigo!" e insere a data de HOJE no atestado, e só então salva na gaveta oficial.
    """
    cert_data = cert.model_dump()
    db_cert = Certificate(**cert_data)
    
    if not db_cert.date:
        db_cert.date = datetime.now().date()
        
    db.add(db_cert)
    await db.commit()
    await db.refresh(db_cert)
    
    return await _certificate_with_names(db, db_cert)


@router.put("/{certificate_id}", response_model=CertificateResponse)
async def update_certificate(
    certificate_id: int, 
    cert_update: CertificateUpdate, 
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A 'função' Corretivo (Borracha).
    Se o médico colocou erroneamente "3 dias" de repouso mas a real era "5 dias", essa função acha o atestado antigo pelo número, aplica as mudanças por cima e confirma (commit) a alteração para a eternidade.
    """
    stmt = select(Certificate).where(Certificate.id == certificate_id)
    result = await db.execute(stmt)
    db_cert = result.scalars().first()
    
    if not db_cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
        
    for key, value in cert_update.model_dump(exclude_unset=True).items():
        setattr(db_cert, key, value)
        
    await db.commit()
    await db.refresh(db_cert)
    
    return await _certificate_with_names(db, db_cert)


@router.delete("/{certificate_id}")
async def delete_certificate(certificate_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A 'função' Triturador de Papel.
    Você passa exatamente o Número Único (ID) do atestado para ela através do URL, ela o rastreia no lado escuro do banco de dados e apaga (delete) da existência.
    """
    stmt = select(Certificate).where(Certificate.id == certificate_id)
    result = await db.execute(stmt)
    cert = result.scalars().first()
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
        
    await db.delete(cert)
    await db.commit()
    
    return {"message": "Certificate deleted successfully"}
