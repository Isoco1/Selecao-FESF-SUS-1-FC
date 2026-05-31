#!/bin/sh
set -e

echo "=== Cronograma Hospitalar — Backend ==="

# Cria e popula o banco na primeira execução
if [ ! -f "hospital.db" ]; then
    echo "[INFO] Banco de dados não encontrado. Executando seed..."
    python seed_data.py
    echo "[INFO] Banco inicializado com sucesso."
else
    echo "[INFO] Banco de dados existente detectado."
fi

echo "[INFO] Iniciando servidor FastAPI..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
