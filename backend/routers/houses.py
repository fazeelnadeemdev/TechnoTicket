from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/houses", tags=["Houses & Accommodations"])

@router.get("", response_model=List[schemas.HouseResponse])
def get_houses(
    status: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    status = status if isinstance(status, str) else None
    market = market if isinstance(market, str) else None
    search = search if isinstance(search, str) else None

    query = db.query(models.House)
    
    if status and status.lower() not in ("all", "all statuses"):
        query = query.filter(models.House.status.ilike(status))

    if market and market.lower() not in ("all", "all markets"):
        query = query.filter(models.House.market.ilike(market))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (models.House.house_code.ilike(term)) |
            (models.House.address.ilike(term)) |
            (models.House.lease_holders.ilike(term)) |
            (models.House.mm_dm.ilike(term)) |
            (models.House.market.ilike(term)) |
            (models.House.mode_of_payment.ilike(term))
        )

    return query.order_by(models.House.market, models.House.house_code).all()

@router.post("", response_model=schemas.HouseResponse, status_code=status.HTTP_201_CREATED)
def create_house(
    house_in: schemas.HouseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    house = models.House(**house_in.model_dump())
    db.add(house)
    db.commit()
    db.refresh(house)
    return house

@router.put("/{house_id}", response_model=schemas.HouseResponse)
def update_house(
    house_id: int,
    house_in: schemas.HouseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    house = db.query(models.House).filter(models.House.id == house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="House not found")

    update_dict = house_in.model_dump(exclude_unset=True)
    for key, val in update_dict.items():
        setattr(house, key, val)

    db.commit()
    db.refresh(house)
    return house

@router.delete("/{house_id}")
def delete_house(
    house_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    house = db.query(models.House).filter(models.House.id == house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="House not found")

    db.delete(house)
    db.commit()
    return {"message": f"House {house.house_code or house.address} deleted successfully"}
