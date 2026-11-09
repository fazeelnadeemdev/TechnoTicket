from fastapi import APIRouter, Depends, UploadFile, File
from storage import save_uploaded_file
from auth import get_current_user
import models

router = APIRouter(prefix="/api/upload", tags=["Uploads"])

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    url, filename, size = await save_uploaded_file(file)
    return {
        "url": url,
        "filename": filename,
        "size": size,
    }

