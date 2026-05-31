from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timezone
import calendar

from database import get_db
import models
import schemas
from auth_utils import get_usuario_atual, exigir_admin
from websocket_manager import manager

router = APIRouter()


@router.get("/", response_model=List[schemas.PlantaoOut])
def listar_plantoes(
    data: Optional[date] = Query(None),
    profissional_id: Optional[int] = Query(None),
    setor_id: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    ano: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_usuario_atual),
):
    q = db.query(models.Plantao)
    if data:
        q = q.filter(models.Plantao.data == data)
    if profissional_id:
        q = q.filter(models.Plantao.profissional_id == profissional_id)
    if setor_id:
        q = q.filter(models.Plantao.setor_id == setor_id)
    if mes:
        ano_ref = ano or 2026
        ultimo_dia = calendar.monthrange(ano_ref, mes)[1]
        q = q.filter(models.Plantao.data.between(
            date(ano_ref, mes, 1),
            date(ano_ref, mes, ultimo_dia),
        ))
    return q.order_by(models.Plantao.data, models.Plantao.hora_inicio).all()


@router.post("/", response_model=schemas.PlantaoOut, status_code=status.HTTP_201_CREATED)
async def criar_plantao(
    payload: schemas.PlantaoCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(exigir_admin),
):
    plantao = models.Plantao(**payload.model_dump())
    if payload.profissional_id:
        plantao.status = models.StatusPlantao.alocado
    db.add(plantao)
    db.commit()
    db.refresh(plantao)

    await manager.broadcast({"evento": "plantao_criado", "plantao_id": plantao.id})
    return plantao


@router.get("/{plantao_id}", response_model=schemas.PlantaoOut)
def obter_plantao(plantao_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    plantao = db.query(models.Plantao).filter(models.Plantao.id == plantao_id).first()
    if not plantao:
        raise HTTPException(status_code=404, detail="Plantão não encontrado")
    return plantao


@router.patch("/{plantao_id}", response_model=schemas.PlantaoOut)
async def atualizar_plantao(
    plantao_id: int,
    payload: schemas.PlantaoUpdate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(exigir_admin),
):
    plantao = db.query(models.Plantao).filter(models.Plantao.id == plantao_id).first()
    if not plantao:
        raise HTTPException(status_code=404, detail="Plantão não encontrado")

    dados = payload.model_dump(exclude_unset=True)
    for campo, valor in dados.items():
        setattr(plantao, campo, valor)

    if "profissional_id" in dados:
        plantao.status = (
            models.StatusPlantao.alocado
            if dados["profissional_id"]
            else models.StatusPlantao.disponivel
        )

    # Fix 3: garantir invariante após qualquer combinação de campos enviados
    # status=alocado sem profissional_id é inválido → corrigir automaticamente
    if plantao.status == models.StatusPlantao.alocado and not plantao.profissional_id:
        plantao.status = models.StatusPlantao.disponivel

    # Fix 7: import movido para o nível do módulo; Fix 5: utcnow depreciado
    plantao.atualizado_em = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(plantao)

    await manager.broadcast({"evento": "plantao_atualizado", "plantao_id": plantao.id})
    return plantao


@router.delete("/{plantao_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_plantao(
    plantao_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(exigir_admin),
):
    plantao = db.query(models.Plantao).filter(models.Plantao.id == plantao_id).first()
    if not plantao:
        raise HTTPException(status_code=404, detail="Plantão não encontrado")
    db.delete(plantao)
    db.commit()

    await manager.broadcast({"evento": "plantao_deletado", "plantao_id": plantao_id})
