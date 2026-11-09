from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users & Agents"])

@router.get("", response_model=List[schemas.UserResponse])
def get_users(
    role: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    team_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role.ilike(role))
    if department:
        query = query.filter(models.User.department.ilike(department))
    if team_type:
        query = query.filter(models.User.team_type.ilike(team_type))
    return query.order_by(models.User.name).all()

@router.get("/solvers")
def get_solvers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Returns users who can resolve/solve tickets (Solvers, Admins, Field Techs)
    along with their current active assigned ticket count.
    """
    solvers = db.query(models.User).filter(
        (models.User.role.in_(["Solver", "Admin", "MM", "DM"])) |
        (models.User.team_type.in_(["Internal", "External"]))
    ).all()

    result = []
    for s in solvers:
        active_count = db.query(models.Ticket).filter(
            models.Ticket.assigned_to_id == s.id,
            models.Ticket.status.notin_(["Close", "Completed"])
        ).count()

        result.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "phone": s.phone,
            "role": s.role,
            "department": s.department,
            "team_type": s.team_type,
            "active_tickets_count": active_count,
        })
    return result

