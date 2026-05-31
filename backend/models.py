from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

# Fix 5: helper UTC-aware sem info de fuso (SQLite armazena sem tz)
def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

from database import Base


class TipoUsuario(str, enum.Enum):
    administrador = "administrador"
    profissional = "profissional"


class StatusPlantao(str, enum.Enum):
    disponivel = "disponivel"
    alocado = "alocado"
    cancelado = "cancelado"


class Especialidade(Base):
    __tablename__ = "especialidades"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), unique=True, nullable=False)
    descricao = Column(String(255), nullable=True)

    usuarios = relationship("Usuario", back_populates="especialidade")


class Setor(Base):
    __tablename__ = "setores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), unique=True, nullable=False)
    descricao = Column(String(255), nullable=True)
    cor = Column(String(20), default="#3B82F6")

    plantoes = relationship("Plantao", back_populates="setor")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    tipo = Column(SAEnum(TipoUsuario), default=TipoUsuario.profissional)
    especialidade_id = Column(Integer, ForeignKey("especialidades.id"), nullable=True)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=_utcnow)

    especialidade = relationship("Especialidade", back_populates="usuarios")
    plantoes = relationship("Plantao", back_populates="profissional")


class Plantao(Base):
    __tablename__ = "plantoes"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(Date, nullable=False)
    hora_inicio = Column(String(5), nullable=False)
    hora_fim = Column(String(5), nullable=False)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=False)
    profissional_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    status = Column(SAEnum(StatusPlantao), default=StatusPlantao.disponivel)
    observacoes = Column(String(500), nullable=True)
    criado_em = Column(DateTime, default=_utcnow)
    atualizado_em = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    setor = relationship("Setor", back_populates="plantoes")
    profissional = relationship("Usuario", back_populates="plantoes")
