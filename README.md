# Cronograma Hospitalar

Sistema de gestão de plantões hospitalares com FastAPI + Next.js.

## Pré-requisitos

- Python 3.10+
- Node.js 18+

## Instalação e execução

### Opção rápida (Windows)
```
iniciar.bat
```

### Manual

**Backend (FastAPI):**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
python seed_data.py              # popula o banco
uvicorn main:app --reload --port 8000
```

**Frontend (Next.js):**
```bash
cd frontend
npm install
npm run dev
```

## Acessos

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

## Credenciais de demonstração

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | admin@hospital.com | admin123 |
| Profissional | ana.souza@hospital.com | 123456 |

## Funcionalidades

- Login com JWT (perfis: Administrador e Profissional)
- Calendário estilo Google Calendar (Janeiro 2026)
- CRUD completo de plantões (apenas Admin)
- Vinculação de profissionais a plantões
- Filtros por data, setor e profissional
- Atualizações em **tempo real** via WebSocket
- Cadastro de profissionais com especialidades
- 6 setores hospitalares com cores distintas
- 
