import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

logger = logging.getLogger("technoticket.database")

def get_sqlite_url() -> str:
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    abs_db_path = os.path.join(backend_dir, "techno_tickets.db").replace("\\", "/")
    return f"sqlite:///{abs_db_path}"

database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = None

if database_url.startswith("postgresql"):
    try:
        print(f"[Database] Attempting connection to Supabase PostgreSQL...")
        test_engine = create_engine(
            database_url,
            connect_args={"connect_timeout": 5},
            pool_pre_ping=True
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = test_engine
        print("[Database] Successfully connected to live Supabase PostgreSQL database!")
    except Exception as e:
        print(f"[Database] Supabase connection failed/blocked: {e}")
        print("[Database] Gracefully falling back to local SQLite database (IPv4-resilient fallback).")
        database_url = get_sqlite_url()
        engine = create_engine(database_url, connect_args={"check_same_thread": False})
else:
    if database_url.startswith("sqlite"):
        if ":///" in database_url and not os.path.isabs(database_url.split(":///", 1)[1]):
            database_url = get_sqlite_url()
        engine = create_engine(database_url, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(database_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        for q in [
            "ALTER TABLE users ADD COLUMN panel_type VARCHAR(50) DEFAULT 'Processor'",
            "ALTER TABLE users ADD COLUMN departments JSON DEFAULT '[]'",
            "ALTER TABLE tickets ADD COLUMN reopen_reason TEXT",
        ]:
            try:
                conn.execute(text(q))
                conn.commit()
            except Exception:
                pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
