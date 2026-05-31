from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas
from auth_utils import get_usuario_atual, exigir_admin

router = APIRouter()


@router.get("/", response_model=List[schemas.EspecialidadeOut])
def listar(db: Session = Depends(get_db), _: models.Usuario = Depends(get_usuario_atual)):
    return db.query(models.Especialidade).all()


@router.post("/", response_model=schemas.EspecialidadeOut, status_code=status.HTTP_201_CREATED)
def criar(payload: schemas.EspecialidadeCreate, db: Session = Depends(get_db), _=Depends(exigir_admin)):
    if db.query(models.Especialidade).filter(models.Especialidade.nome == payload.nome).first():
        raise HTTPException(status_code=400, detail="Especialidade já cadastrada")
    esp = models.Especialidade(**payload.model_dump())
    db.add(esp)
    db.commit()
    db.refresh(esp)
    return esp


@router.delete("/{esp_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar(esp_id: int, db: Session = Depends(get_db), _=Depends(exigir_admin)):
    esp = db.query(models.Especialidade).filter(models.Especialidade.id == esp_id).first()
    if not esp:
        raise HTTPException(status_code=404, detail="Especialidade não encontrada")
    db.delete(esp)
    db.commit()
