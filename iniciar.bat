@echo off
echo === Sistema de Cronograma Hospitalar ===
echo.

REM Iniciar Backend
echo [1/2] Iniciando backend FastAPI...
cd /d "%~dp0backend"

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Python nao encontrado. Instale Python 3.10+
    pause
    exit /b 1
)

if not exist ".venv" (
    echo Criando ambiente virtual...
    python -m venv .venv
    call .venv\Scripts\activate
    echo Instalando dependencias...
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate
)

if not exist "hospital.db" (
    echo Populando banco de dados...
    python seed_data.py
)

start "Backend FastAPI" cmd /k "call .venv\Scripts\activate && uvicorn main:app --reload --port 8000"

REM Iniciar Frontend
echo [2/2] Iniciando frontend Next.js...
cd /d "%~dp0frontend"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado. Instale Node.js 18+
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Instalando pacotes npm...
    npm install
)

start "Frontend Next.js" cmd /k "npm run dev"

echo.
echo === Sistema iniciado! ===
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo Docs API: http://localhost:8000/docs
echo.
echo Credenciais:
echo   Admin:        admin@hospital.com / admin123
echo   Profissional: ana.souza@hospital.com / 123456
echo.
timeout /t 3 >nul
start http://localhost:3000
