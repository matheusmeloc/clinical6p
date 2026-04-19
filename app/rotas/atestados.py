"""
Rotas de Atestados (Certificates)
- Listar, criar, atualizar, deletar atestados médicos
"""

from typing import Any
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSession, get_db
from app.models import Patient, Professional, Certificate
from app.schemas import CertificateCreate, CertificateUpdate, CertificateResponse

router = APIRouter(prefix="/api/certificates", tags=["Atestados"])


# ═════════════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ═════════════════════════════════════════════════════════════════════

def _certificate_to_dict(cert: Certificate) -> dict[str, Any]:
    """
    Constrói um dict serializado a partir dos campos explícitos do atestado.
    Inclui patient_name e professional_name vindos dos relacionamentos já carregados.
    """
    return {
        "id": cert.id,
        "patient_id": cert.patient_id,
        "professional_id": cert.professional_id,
        "type": cert.type,
        "duration_days": cert.duration_days,
        "description": cert.description,
        "date": cert.date,
        "created_at": cert.created_at,
        "patient_name": cert.patient.name if cert.patient else None,
        "professional_name": cert.professional.name if cert.professional else None,
    }


async def _reload_with_relations(db: AsyncSession, certificate_id: int) -> Certificate | None:
    """Recarrega um atestado com paciente e profissional em uma única query."""
    stmt = (
        select(Certificate)
        .options(selectinload(Certificate.patient), selectinload(Certificate.professional))
        .where(Certificate.id == certificate_id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


# ═════════════════════════════════════════════════════════════════════
# ENDPOINTS DE ATESTADOS
# ═════════════════════════════════════════════════════════════════════

@router.get("", response_model=list[CertificateResponse])
async def list_certificates(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    Lista atestados com nomes de paciente e profissional resolvidos
    em uma única query via selectinload — sem N+1.
    """
    stmt = (
        select(Certificate)
        .options(selectinload(Certificate.patient), selectinload(Certificate.professional))
        .order_by(Certificate.date.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [_certificate_to_dict(cert) for cert in result.scalars().all()]


@router.post("", response_model=CertificateResponse)
async def create_certificate(cert: CertificateCreate, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """
    Cria um atestado após verificar que o paciente e o profissional informados existem.
    A data é preenchida com a data de hoje quando não informada.
    """
    patient = await db.get(Patient, cert.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado.")

    professional = await db.get(Professional, cert.professional_id)
    if not professional:
        raise HTTPException(status_code=404, detail="Profissional não encontrado.")

    cert_data = cert.model_dump()
    if not cert_data.get("date"):
        cert_data["date"] = date.today()

    db_cert = Certificate(**cert_data)
    db.add(db_cert)
    await db.commit()
    await db.refresh(db_cert)

    reloaded = await _reload_with_relations(db, int(str(db_cert.id)))
    if not reloaded:
        raise HTTPException(status_code=500, detail="Erro ao recarregar atestado criado.")
    return _certificate_to_dict(reloaded)


@router.put("/{certificate_id}", response_model=CertificateResponse)
async def update_certificate(
    certificate_id: int,
    cert_update: CertificateUpdate,
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """
    Atualiza os campos enviados de um atestado existente.
    """
    db_cert = await _reload_with_relations(db, certificate_id)
    if not db_cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    for key, value in cert_update.model_dump(exclude_unset=True).items():
        setattr(db_cert, key, value)

    await db.commit()

    reloaded = await _reload_with_relations(db, certificate_id)
    if not reloaded:
        raise HTTPException(status_code=500, detail="Erro ao recarregar atestado atualizado.")
    return _certificate_to_dict(reloaded)


@router.delete("/{certificate_id}")
async def delete_certificate(certificate_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """
    Remove permanentemente um atestado pelo ID.
    """
    stmt = select(Certificate).where(Certificate.id == certificate_id)
    result = await db.execute(stmt)
    cert = result.scalars().first()

    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    await db.delete(cert)
    await db.commit()

    return {"message": "Certificate deleted successfully"}
