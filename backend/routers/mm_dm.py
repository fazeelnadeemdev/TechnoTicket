from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/mm-dm", tags=["MM & DM Leadership Directory"])

@router.get("", response_model=List[schemas.MMDMResponse])
def get_mm_dm_list(
    market: Optional[str] = Query(None),
    title: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    market = market if isinstance(market, str) else None
    title = title if isinstance(title, str) else None
    search = search if isinstance(search, str) else None

    query = db.query(models.MMDMInfo)
    if market and market.lower() not in ("all", "all markets"):
        query = query.filter(models.MMDMInfo.market.ilike(market))

    if title and title.lower() not in ("all", "all titles"):
        query = query.filter(models.MMDMInfo.title.ilike(title))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (models.MMDMInfo.market.ilike(term)) |
            (models.MMDMInfo.name.ilike(term)) |
            (models.MMDMInfo.title.ilike(term)) |
            (models.MMDMInfo.email.ilike(term)) |
            (models.MMDMInfo.phone.ilike(term)) |
            (models.MMDMInfo.ntid.ilike(term)) |
            (models.MMDMInfo.bdi_login.ilike(term))
        )
    return query.order_by(models.MMDMInfo.market, models.MMDMInfo.name).all()

@router.post("", response_model=schemas.MMDMResponse, status_code=status.HTTP_201_CREATED)
def create_mm_dm(
    info_in: schemas.MMDMCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rec = models.MMDMInfo(**info_in.model_dump())
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

@router.put("/{rec_id}", response_model=schemas.MMDMResponse)
def update_mm_dm(
    rec_id: int,
    info_in: schemas.MMDMUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rec = db.query(models.MMDMInfo).filter(models.MMDMInfo.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="MM/DM record not found")

    update_dict = info_in.model_dump(exclude_unset=True)
    for key, val in update_dict.items():
        setattr(rec, key, val)

    db.commit()
    db.refresh(rec)
    return rec

@router.delete("/{rec_id}")
def delete_mm_dm(
    rec_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rec = db.query(models.MMDMInfo).filter(models.MMDMInfo.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="MM/DM record not found")

    db.delete(rec)
    db.commit()
    return {"message": "Record deleted successfully"}
