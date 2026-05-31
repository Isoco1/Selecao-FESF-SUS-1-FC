from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import auth, usuarios, especialidades, plantoes, setores
from websocket_manager import manager

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Cronograma Hospitalar",
    description="API para gestão de plantões e escalas hospitalares",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuários"])
app.include_router(especialidades.router, prefix="/especialidades", tags=["Especialidades"])
app.include_router(plantoes.router, prefix="/plantoes", tags=["Plantões"])
app.include_router(setores.router, prefix="/setores", tags=["Setores"])


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/", tags=["Status"])
def raiz():
    return {"status": "ok", "sistema": "Cronograma Hospitalar"}
