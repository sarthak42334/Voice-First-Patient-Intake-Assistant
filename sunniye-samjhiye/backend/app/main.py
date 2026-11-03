import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database import init_db
from .routes import health, intakes, transcribe, extract, summarize, tts, presets, export

# Initialize database schema
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sunniye, Samjhiye: Voice-First Patient Intake Assistant. Non-diagnostic intake and documentation only.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Enable CORS for frontend Vite development server and local network
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(intakes.router, prefix=settings.API_PREFIX)
app.include_router(transcribe.router, prefix=settings.API_PREFIX)
app.include_router(extract.router, prefix=settings.API_PREFIX)
app.include_router(summarize.router, prefix=settings.API_PREFIX)
app.include_router(tts.router, prefix=settings.API_PREFIX)
app.include_router(presets.router, prefix=settings.API_PREFIX)
app.include_router(export.router, prefix=settings.API_PREFIX)

# Serve built frontend if available
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "project": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "docs": "/api/docs",
            "disclaimer": settings.PERSISTENT_DISCLAIMER
        }
