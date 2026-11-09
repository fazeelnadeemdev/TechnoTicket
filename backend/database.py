import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

database_url = settings.DATABASE_URL

# PostgreSQL compatibility tweak for Supabase / Heroku style postgres://
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    # Resolve relative sqlite paths consistently to backend directory
    if ":///" in database_url and not os.path.isabs(database_url.split(":///", 1)[1]):
        rel_path = database_url.split(":///", 1)[1].lstrip("./")
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        abs_db_path = os.path.join(backend_dir, rel_path).replace("\\", "/")
        database_url = f"sqlite:///{abs_db_path}"

engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
