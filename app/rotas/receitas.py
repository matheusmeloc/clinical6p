"""
Rotas de Receitas (Prescriptions)
- Listar, criar, atualizar, deletar receitas médicas preenchidas
"""

import logging
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import date

from app.database import AsyncSession, get_db
from app.models import Patient, Professional, Prescription
from app.schemas import PrescriptionCreate, PrescriptionUpdate

router = APIRouter(prefix="/api/prescriptions", tags=["Receitas"])
logger = logging.getLogger(__name__)


# ═════════════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ═════════════════════════════════════════════════════════════════════

def _prescription_to_dict(
    p: Prescription, 
    patient_name: str | None = None, 
    professional_name: str | None = None
) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Este é o famoso "Tradutor do Receituário" que já conhecemos.
    A grande diferença, o seu Segredo, é que às vezes o nosso programa já sabe quem é o paciente que o médico tá olhando, então não precisamos gastar recurso do computador procurando o nome dele de novo.
    Por isso a função permite que a gente "injete" os nomes diretamente nos parenteses por parâmetro (patient_name, professional_name) para poupar processador! 
    """
    return {
        "id": p.id, 
        "patient_id": p.patient_id, 
        "professional_id": p.professional_id,
        "medication_name": p.medication_name, 
        "dosage": p.dosage,
        "certificate_type": p.certificate_type,
        "date": str(p.date) if p.date else None, 
        "status": p.status,
        "patient_name": patient_name, 
        "professional_name": professional_name,
        "created_at": str(p.created_at) if p.created_at else None,
    }


# ═════════════════════════════════════════════════════════════════════
# ENDPOINTS DE RECEITAS
# ═════════════════════════════════════════════════════════════════════

@router.get("")
async def list_prescriptions(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que é esta 'função'? É o Arquivo de Documentos.
    O sistema varre todo o banco de dados de receitas, mas veja que ele usa o '.order_by(Prescription.date.desc())'.
    Isso significa que as receitas mais novas do hospital aparecem sempre no topo da página, "de trás pra frente" (descendente), assim o Doutor sempre olha as mais recentes sem rolar a página para baixo.
    """
    try:
        stmt = (
            select(Prescription)
            .options(
                selectinload(Prescription.patient), 
                selectinload(Prescription.professional)
            )
            .order_by(Prescription.date.desc())
        )
        result = await db.execute(stmt)
        
        prescriptions_list = []
        for p in result.scalars().all():
            pat_name = getattr(p.patient, "name", None) if getattr(p, "patient", None) else None
            prof_name = getattr(p.professional, "name", None) if getattr(p, "professional", None) else None
            
            prescriptions_list.append(_prescription_to_dict(p, pat_name, prof_name))
            
        return prescriptions_list
        
    except Exception as e:
        logger.error(f"Erro ao listar receitas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_prescription(prescription: PrescriptionCreate, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' é o "Carimbo e Assinatura do Médico". É a hora de lançar uma receita nova.
    A Magia oculta aqui: Se por acaso o médico esqueceu de digitar a Data na tela, a primeira coisa que o computador faz é acionar aquele bloco de verificação com IF: 'ih, não tem data?'. E ele responde: 'Deixa comigo, preencho com a data de HOJE (date.today()) escondido!'.
    Só então ele insere e oficializa (commit) a nova receita. 
    """
    try:
        presc_data = prescription.model_dump()
        
        if not presc_data.get("date"):
            presc_data["date"] = date.today()

        patient = await db.get(Patient, presc_data["patient_id"])
        professional = await db.get(Professional, presc_data["professional_id"])
        
        if not patient or not professional:
            raise HTTPException(status_code=404, detail="Patient or Professional not found")

        db_prescription = Prescription(**presc_data)
        db.add(db_prescription)
        
        await db.commit()
        await db.refresh(db_prescription)
        
        return _prescription_to_dict(db_prescription, patient.name, professional.name)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar receita: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{prescription_id}")
async def update_prescription(
    prescription_id: int, 
    prescription: PrescriptionUpdate, 
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A 'função' que edita (Atualiza) o receituário e salva a mudança (ex: o médico errou uma gramagem do remédio ou a quantidade das pílulas). 
    Usa um bloco FOR (laço de repetição) e um 'exclude_unset' (para não quebrar campos em branco) do Pydantic para preencher as mudanças nas suas colunas exatas.
    """
    stmt = select(Prescription).where(Prescription.id == prescription_id)
    result = await db.execute(stmt)
    db_prescription = result.scalars().first()
    
    if not db_prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    for key, value in prescription.model_dump(exclude_unset=True).items():
        setattr(db_prescription, key, value)

    try:
        await db.commit()
        await db.refresh(db_prescription)
        
        patient = await db.get(Patient, db_prescription.patient_id)
        professional = await db.get(Professional, db_prescription.professional_id)
        
        pat_name = patient.name if patient else None
        prof_name = professional.name if professional else None
        
        return _prescription_to_dict(db_prescription, pat_name, prof_name)
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{prescription_id}")
async def delete_prescription(prescription_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A velha 'função' de deleção. Apanha do usuário, chora, e manda apagar o registro com base no número exato que a gente passou na URL (o prescription_id). E manda de volta o recadinho em inglês "Prescription deleted successfully".
    """
    stmt = select(Prescription).where(Prescription.id == prescription_id)
    result = await db.execute(stmt)
    prescription = result.scalars().first()
    
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    await db.delete(prescription)
    await db.commit()
    
    return {"message": "Prescription deleted successfully"}
