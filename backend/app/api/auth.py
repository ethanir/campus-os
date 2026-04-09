from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import hash_password, verify_password, create_token, get_current_user
from app.models.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    credits: int
    plan: str


class TokenResponse(BaseModel):
    token: str
    user: UserResponse


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email.lower().strip(),
        password_hash=hash_password(data.password),
        name=data.name.strip(),
        credits=3,
        plan="free",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        token=create_token(user.id),
        user=UserResponse(id=user.id, email=user.email, name=user.name, credits=user.credits, plan=user.plan),
    )


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return TokenResponse(
        token=create_token(user.id),
        user=UserResponse(id=user.id, email=user.email, name=user.name, credits=user.credits, plan=user.plan),
    )


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return UserResponse(id=user.id, email=user.email, name=user.name, credits=user.credits, plan=user.plan)


CREDIT_PACKS = {
    "pack_50": {"credits": 50, "price_cents": 499, "label": "$4.99 — 50 credits"},
    "pack_150": {"credits": 150, "price_cents": 999, "label": "$9.99 — 150 credits"},
    "pack_500": {"credits": 500, "price_cents": 2499, "label": "$24.99 — 500 credits"},
}


@router.get("/credit-packs")
def list_credit_packs():
    return CREDIT_PACKS


@router.post("/add-credits")
def add_credits(pack_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Temporary endpoint — will be replaced with Stripe webhook."""
    pack = CREDIT_PACKS.get(pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack")
    user.credits += pack["credits"]
    db.commit()
    return {"credits": user.credits, "added": pack["credits"]}
