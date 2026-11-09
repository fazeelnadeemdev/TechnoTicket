import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./techno_tickets.db"
    JWT_SECRET_KEY: str = "techno_communications_llc_jwt_secret_key_2026_metro"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Cloudflare R2 / S3
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_PUBLIC_URL: str = ""

    # Local fallback storage
    UPLOAD_DIR: str = "./uploads"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_r2_configured(self) -> bool:
        return bool(self.R2_ACCESS_KEY_ID and self.R2_SECRET_ACCESS_KEY and self.R2_BUCKET_NAME)

settings = Settings()

