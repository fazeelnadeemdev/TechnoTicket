from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/stores", tags=["Stores"])

@router.get("", response_model=List[schemas.StoreResponse])
def get_stores(
    market: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    market = market if isinstance(market, str) else None
    search = search if isinstance(search, str) else None
    query = db.query(models.Store)
    if market and market.lower() not in ("all", "all markets"):
        query = query.filter(models.Store.market.ilike(market))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (models.Store.tech_id.ilike(term)) |
            (models.Store.store_name.ilike(term)) |
            (models.Store.store_address.ilike(term)) |
            (models.Store.door_code.ilike(term)) |
            (models.Store.market.ilike(term)) |
            (models.Store.dm_name.ilike(term)) |
            (models.Store.district.ilike(term)) |
            (models.Store.state.ilike(term)) |
            (models.Store.tmobile_location_id.ilike(term)) |
            (models.Store.edge_id.ilike(term))
        )
    return query.order_by(models.Store.market, models.Store.tech_id).all()

@router.post("", response_model=schemas.StoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(
    store_in: schemas.StoreCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    store = models.Store(**store_in.model_dump())
    db.add(store)
    db.commit()
    db.refresh(store)
    return store

@router.put("/{store_id}", response_model=schemas.StoreResponse)
def update_store(
    store_id: int,
    store_in: schemas.StoreUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    update_dict = store_in.model_dump(exclude_unset=True)
    for key, val in update_dict.items():
        setattr(store, key, val)

    db.commit()
    db.refresh(store)
    return store

@router.delete("/{store_id}")
def delete_store(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    db.delete(store)
    db.commit()
    return {"message": f"Store {store.tech_id} deleted successfully"}
