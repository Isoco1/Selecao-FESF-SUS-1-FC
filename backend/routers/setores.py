from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas
from auth_utils import get_usuario_atual, exigir_admin

router = APIRouter()


@router.get("/", response_model=List[schemas.SetorOut])
def listar(db: Session = Depends(get_db), _: models.Usuario = Depends(get_usuario_atual)):
    return db.query(models.Setor).all()


@router.post("/", response_model=schemas.SetorOut, status_code=status.HTTP_201_CREATED)
def criar(payload: schemas.SetorCreate, db: Session = Depends(get_db), _=Depends(exigir_admin)):
    if db.query(models.Setor).filter(models.Setor.nome == payload.nome).first():
        raise HTTPException(status_code=400, detail="Setor já cadastrado")
    setor = models.Setor(**payload.model_dump())
    db.add(setor)
    db.commit()
    db.refresh(setor)
    return setor


@router.patch("/{setor_id}", response_model=schemas.SetorOut)
def atualizar(setor_id: int, payload: schemas.SetorCreate, db: Session = Depends(get_db), _=Depends(exigir_admin)):
    setor = db.query(models.Setor).filter(models.Setor.id == setor_id).first()
    if not setor:
        raise HTTPException(status_code=404, detail="Setor não encontrado")
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(setor, campo, valor)
    db.commit()
    db.refresh(setor)
    return setor


@router.delete("/{setor_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar(setor_id: int, db: Session = Depends(get_db), _=Depends(exigir_admin)):
    setor = db.query(models.Setor).filter(models.Setor.id == setor_id).first()
    if not setor:
        raise HTTPException(status_code=404, detail="Setor não encontrado")
    db.delete(setor)
    db.commit()
