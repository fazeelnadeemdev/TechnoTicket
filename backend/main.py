import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from database import engine, Base, init_db
from storage import ensure_upload_dir
from seed import seed_database

from routers import auth, tickets, stores, houses, mm_dm, users, dashboard, uploads

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure uploads directory exists and auto-seed database
    try:
        ensure_upload_dir()
    except Exception as e:
        print(f"[Startup] Upload dir notice: {e}")

    try:
        init_db()
    except Exception as e:
        print(f"[Startup] Database init notice: {e}")

    try:
        seed_database()
    except Exception as e:
        print(f"[Startup] Seeder warning: {e}")
    yield
    # Shutdown logic if any

app = FastAPI(
    title="Techno Communications LLC - Ticketing Management API",
    description="Internal Enterprise Ticketing Platform for Metro by T-Mobile US Franchises",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://techno-ticket-portal.vercel.app",
        "https://techno-ticket.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads (local fallback mode)
try:
    ensure_upload_dir()
    if os.path.exists(settings.UPLOAD_DIR):
        app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
except Exception as e:
    print(f"[Startup] Static uploads mount notice: {e}")

# Include Routers
app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(stores.router)
app.include_router(houses.router)
app.include_router(mm_dm.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(uploads.router)

@app.get("/")
def root():
    return {
        "organization": "Techno Communications LLC",
        "system": "Metro by T-Mobile Franchise Ticket Management Platform",
        "status": "online",
        "docs_url": "/docs",
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

