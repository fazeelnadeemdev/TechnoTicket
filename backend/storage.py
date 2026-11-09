import os
import uuid
import shutil
from typing import Tuple
from fastapi import UploadFile, HTTPException
from config import settings

ALLOWED_EXTENSIONS = {
    # Images
    "png", "jpg", "jpeg", "webp", "gif",
    # Documents & Spreadsheets
    "pdf", "doc", "docx", "xls", "xlsx", "csv", "txt",
    # Videos
    "mp4", "mov", "avi", "mkv"
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def ensure_upload_dir():
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

def get_r2_client():
    if not settings.is_r2_configured:
        return None
    try:
        import boto3
        from botocore.config import Config

        endpoint_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        s3 = boto3.client(
            service_name="s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )
        return s3
    except Exception as e:
        print(f"[Storage] R2 client init failed, falling back to local: {e}")
        return None

async def save_uploaded_file(file: UploadFile) -> Tuple[str, str, int]:
    """
    Saves an uploaded file to Cloudflare R2 or local directory.
    Returns (url, original_filename, file_size).
    """
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension .{ext} not supported. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Read content to check file size
    contents = await file.read()
    file_size = len(contents)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed limit of 5MB (Received {file_size / (1024*1024):.1f}MB)."
        )

    unique_filename = f"{uuid.uuid4().hex[:12]}_{file.filename}"

    r2_client = get_r2_client()
    if r2_client:
        try:
            content_type = file.content_type or "application/octet-stream"
            r2_client.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=unique_filename,
                Body=contents,
                ContentType=content_type,
            )
            base_url = settings.R2_PUBLIC_URL.rstrip("/") if settings.R2_PUBLIC_URL else f"https://{settings.R2_BUCKET_NAME}.r2.dev"
            public_url = f"{base_url}/{unique_filename}"
            return public_url, file.filename, file_size
        except Exception as e:
            print(f"[Storage] Cloudflare R2 upload error: {e}. Falling back to local storage.")

    # Local storage fallback
    ensure_upload_dir()
    local_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    with open(local_path, "wb") as f:
        f.write(contents)

    local_url = f"/uploads/{unique_filename}"
    return local_url, file.filename, file_size

