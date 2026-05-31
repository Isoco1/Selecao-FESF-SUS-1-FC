from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
import models
import schemas
from auth_utils import hash_senha, get_usuario_atual, exigir_admin

router = APIRouter()


@router.get("/", response_model=List[schemas.UsuarioOut])
def listar_usuarios(
    tipo: Optional[models.TipoUsuario] = None,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_usuario_atual),
):
    q = db.query(models.Usuario)
    if tipo:
        q = q.filter(models.Usuario.tipo == tipo)
    return q.filter(models.Usuario.ativo == True).all()


@router.post("/", response_model=schemas.UsuarioOut, status_code=status.HTTP_201_CREATED)
def criar_usuario(
    payload: schemas.UsuarioCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(exigir_admin),
):
    if db.query(models.Usuario).filter(models.Usuario.email == payload.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    usuario = models.Usuario(
        nome=payload.nome,
        email=payload.email,
        senha_hash=hash_senha(payload.senha),
        tipo=payload.tipo,
        especialidade_id=payload.especialidade_id,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.get("/{usuario_id}", response_model=schemas.UsuarioOut)
def obter_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_usuario_atual),
):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario


@router.patch("/{usuario_id}", response_model=schemas.UsuarioOut)
def atualizar_usuario(
    usuario_id: int,
    payload: schemas.UsuarioUpdate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(exigir_admin),
):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(usuario, campo, valor)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def desativar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(exigir_admin),
):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    usuario.ativo = False
    db.commit()
