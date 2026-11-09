from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user, hash_password

router = APIRouter(prefix="/api/users", tags=["Users & Access Control"])

@router.get("", response_model=List[schemas.UserResponse])
def get_users(
    role: Optional[str] = Query(None),
    panel_type: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    team_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role.ilike(role))
    if panel_type:
        query = query.filter(models.User.panel_type.ilike(panel_type))
    if department and department != "All":
        query = query.filter(
            (models.User.department.ilike(department)) |
            (models.User.departments.contains([department])) |
            (models.User.departments.contains(["All"]))
        )
    if team_type:
        query = query.filter(models.User.team_type.ilike(team_type))
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (models.User.name.ilike(s)) |
            (models.User.email.ilike(s)) |
            (models.User.phone.ilike(s))
        )
    return query.order_by(models.User.id.desc()).all()


@router.post("", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Verify SuperAdmin or Admin
    if current_user.role not in ["SuperAdmin", "Admin"] and current_user.panel_type != "SuperAdmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can create user credentials.",
        )

    # Check if email exists
    existing = db.query(models.User).filter(models.User.email.ilike(payload.email.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{payload.email}' already exists.",
        )

    # Ensure departments contains at least the primary department
    dept_list = payload.departments if payload.departments else [payload.department]
    if payload.department not in dept_list and "All" not in dept_list:
        dept_list.append(payload.department)

    new_user = models.User(
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone.strip() if payload.phone else None,
        password_hash=hash_password(payload.password),
        role=payload.role,
        panel_type=payload.panel_type or "Processor",
        department=payload.department,
        departments=dept_list,
        team_type=payload.team_type,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["SuperAdmin", "Admin"] and current_user.panel_type != "SuperAdmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can modify user credentials or permissions.",
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name is not None:
        user.name = payload.name.strip()
    if payload.email is not None:
        # Check duplicate
        other = db.query(models.User).filter(
            models.User.email.ilike(payload.email.strip()),
            models.User.id != user_id
        ).first()
        if other:
            raise HTTPException(status_code=400, detail="Email is already used by another account")
        user.email = payload.email.strip().lower()
    if payload.phone is not None:
        user.phone = payload.phone.strip() or None
    if payload.role is not None:
        user.role = payload.role
    if payload.panel_type is not None:
        user.panel_type = payload.panel_type
    if payload.department is not None:
        user.department = payload.department
    if payload.departments is not None:
        user.departments = payload.departments
    if payload.team_type is not None:
        user.team_type = payload.team_type
    if payload.password and payload.password.strip():
        user.password_hash = hash_password(payload.password.strip())

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["SuperAdmin", "Admin"] and current_user.panel_type != "SuperAdmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can delete users.",
        )

    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account while logged in.",
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": f"User '{user.name}' ({user.email}) deleted successfully."}


@router.get("/solvers/list")
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
        (models.User.role.in_(["Solver", "Admin", "SuperAdmin", "Manager", "Processor", "MM", "DM"])) |
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
            "panel_type": s.panel_type,
            "department": s.department,
            "departments": s.departments,
            "team_type": s.team_type,
            "active_tickets_count": active_count,
        })
    return result
