from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from models import TipoUsuario, StatusPlantao


# ── Especialidade ──────────────────────────────────────────────────────────────

class EspecialidadeBase(BaseModel):
    nome: str
    descricao: Optional[str] = None


class EspecialidadeCreate(EspecialidadeBase):
    pass


class EspecialidadeOut(EspecialidadeBase):
    id: int

    class Config:
        from_attributes = True


# ── Setor ──────────────────────────────────────────────────────────────────────

class SetorBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    cor: Optional[str] = "#3B82F6"


class SetorCreate(SetorBase):
    pass


class SetorOut(SetorBase):
    id: int

    class Config:
        from_attributes = True


# ── Usuário ────────────────────────────────────────────────────────────────────

class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr
    tipo: TipoUsuario = TipoUsuario.profissional
    especialidade_id: Optional[int] = None


class UsuarioCreate(UsuarioBase):
    senha: str


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    tipo: Optional[TipoUsuario] = None
    especialidade_id: Optional[int] = None
    ativo: Optional[bool] = None


class UsuarioOut(UsuarioBase):
    id: int
    ativo: bool
    criado_em: datetime
    especialidade: Optional[EspecialidadeOut] = None

    class Config:
        from_attributes = True


# ── Auth ───────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut


# ── Plantão ────────────────────────────────────────────────────────────────────

class PlantaoBase(BaseModel):
    data: date
    hora_inicio: str
    hora_fim: str
    setor_id: int
    profissional_id: Optional[int] = None
    observacoes: Optional[str] = None


class PlantaoCreate(PlantaoBase):
    pass


class PlantaoUpdate(BaseModel):
    data: Optional[date] = None
    hora_inicio: Optional[str] = None
    hora_fim: Optional[str] = None
    setor_id: Optional[int] = None
    profissional_id: Optional[int] = None
    status: Optional[StatusPlantao] = None
    observacoes: Optional[str] = None


class PlantaoOut(PlantaoBase):
    id: int
    status: StatusPlantao
    criado_em: datetime
    atualizado_em: datetime
    setor: Optional[SetorOut] = None
    profissional: Optional[UsuarioOut] = None

    class Config:
        from_attributes = True
