from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth_utils import hash_senha, verificar_senha, criar_token, get_usuario_atual

router = APIRouter()


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == payload.email).first()
    if not usuario or not verificar_senha(payload.senha, usuario.senha_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha incorretos")
    if not usuario.ativo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário inativo")

    token = criar_token({"sub": str(usuario.id)})
    return schemas.TokenResponse(access_token=token, usuario=usuario)


@router.get("/me", response_model=schemas.UsuarioOut)
def perfil_atual(usuario: models.Usuario = Depends(get_usuario_atual)):
    return usuario
