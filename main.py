from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from app.routes import chat
from app.routes import users
from app.database import engine
from app.models import user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Crear tablas
user.Base.metadata.create_all(bind=engine)

# Rutas API
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
# Carpeta frontend
FRONTEND_DIR = Path("/MAXIQUEEN_OS/ACTIVE_SYSTEM/1_Frontend_Interfaz")
# Static
app.mount("/static", StaticFiles(directory="static"), name="static")

# Index
@app.get("/")
def read_index():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/api")
def root():
    return {"msg": "Servidor FastAPI funcionando correctamente para MAXIQUEEN OS"}