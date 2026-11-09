from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

DEPARTMENTS = [
    "Admin",
    "Maintenance",
    "Ordering",
    "Accounting",
    "IT",
    "HR",
    "RMA",
    "Escalation",
    "Management",
    "Compliance"
]

@router.get("/departments")
def get_departments():
    return DEPARTMENTS

@router.post("/login", response_model=schemas.TokenResponse)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Use selected department context if provided, otherwise user's default department
    dept = login_data.department_context if login_data.department_context else user.department

    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "department": dept,
        "team_type": user.team_type,
    }
    token = create_access_token(token_data)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

