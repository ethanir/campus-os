import stripe
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
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
    has_purchased: bool
    ai_tier: str  # "standard" or "premium"


def _user_response(u: User) -> UserResponse:
    return UserResponse(
        id=u.id, email=u.email, name=u.name, credits=u.credits,
        plan=u.plan, has_purchased=u.has_purchased,
        ai_tier="premium" if u.has_purchased else "standard",
    )


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
        has_purchased=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(token=create_token(user.id), user=_user_response(user))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return TokenResponse(token=create_token(user.id), user=_user_response(user))


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return _user_response(user)


# ── Credit Packs ────────────────────────────────────────

CREDIT_PACKS = {
    "starter": {"credits": 10, "price_cents": 499, "label": "Starter Pack", "description": "10 premium AI generations"},
    "pro": {"credits": 25, "price_cents": 999, "label": "Pro Pack", "description": "25 premium AI generations"},
    "mega": {"credits": 75, "price_cents": 2499, "label": "Mega Pack", "description": "75 premium AI generations"},
}


@router.get("/credit-packs")
def list_credit_packs():
    return CREDIT_PACKS


@router.post("/create-checkout")
def create_checkout_session(pack_id: str, user: User = Depends(get_current_user)):
    """Create a Stripe Checkout session for buying credits."""
    from app.core.config import settings
    
    pack = CREDIT_PACKS.get(pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack")
    
    stripe.api_key = settings.stripe_secret_key
    
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": pack["label"],
                        "description": pack["description"],
                    },
                    "unit_amount": pack["price_cents"],
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=settings.frontend_url + "/account?payment=success",
            cancel_url=settings.frontend_url + "/account?payment=cancelled",
            metadata={
                "user_id": str(user.id),
                "pack_id": pack_id,
                "credits": str(pack["credits"]),
            },
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")


# ── Change Password ─────────────────────────────────────

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(data: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"ok": True}


@router.post("/admin/add-credits")
def admin_add_credits(email: str, credits: int = 10, secret: str = "", db: Session = Depends(get_db)):
    import os
    if secret != os.getenv("ADMIN_SECRET", "yourcourseai-admin-2026"):
        raise HTTPException(status_code=403, detail="Nope")
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.credits += credits
    user.has_purchased = True
    user.plan = "paid"
    db.commit()
    return {"email": user.email, "credits": user.credits, "has_purchased": True}
