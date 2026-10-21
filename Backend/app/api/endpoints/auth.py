
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import engine
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# -----------------------------
# Request and Response Schemas
# -----------------------------

class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterResponse(BaseModel):
    message: str
    user_id: int
    full_name: str
    email: EmailStr
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    full_name: str
    email: EmailStr
    role: str


# -----------------------------
# User Registration API
# -----------------------------

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(request: RegisterRequest):
    full_name = request.full_name.strip()
    email = str(request.email).strip().lower()

    if len(full_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name must contain at least 2 characters."
        )

    # Hash the password before saving it.
    password_hash = hash_password(request.password)

    try:
        with engine.begin() as connection:

            # Check whether the email is already registered.
            existing_user = connection.execute(
                text("""
                    SELECT UserId
                    FROM dbo.Users
                    WHERE Email = :email
                """),
                {"email": email}
            ).first()

            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists."
                )

            # All new public registrations receive the User role.
            result = connection.execute(
                text("""
                    INSERT INTO dbo.Users
                        (FullName, Email, PasswordHash, Role, IsActive)
                    OUTPUT
                        INSERTED.UserId,
                        INSERTED.FullName,
                        INSERTED.Email,
                        INSERTED.Role
                    VALUES
                        (:full_name, :email, :password_hash, 'User', 1)
                """),
                {
                    "full_name": full_name,
                    "email": email,
                    "password_hash": password_hash
                }
            )

            user = result.mappings().one()

        return RegisterResponse(
            message="Registration successful.",
            user_id=user["UserId"],
            full_name=user["FullName"],
            email=user["Email"],
            role=user["Role"]
        )

    except HTTPException:
        raise

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to register user. Please try again."
        )


# -----------------------------
# User Login API
# -----------------------------

@router.post(
    "/login",
    response_model=LoginResponse
)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    # OAuth2PasswordRequestForm uses "username" for the email.
    email = form_data.username.strip().lower()

    try:
        with engine.connect() as connection:
            user = connection.execute(
                text("""
                    SELECT
                        UserId,
                        FullName,
                        Email,
                        PasswordHash,
                        Role,
                        IsActive
                    FROM dbo.Users
                    WHERE Email = :email
                """),
                {"email": email}
            ).mappings().first()

        # Use the same error for an unknown email and wrong password.
        if not user or not verify_password(
            form_data.password,
            user["PasswordHash"] if user else ""
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"}
            )

        if not user["IsActive"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account is inactive."
            )

        # Create a JWT for the authenticated user.
        token = create_access_token(
            user_id=user["UserId"],
            role=user["Role"]
        )

        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user_id=user["UserId"],
            full_name=user["FullName"],
            email=user["Email"],
            role=user["Role"]
        )

    except HTTPException:
        raise

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to log in. Please try again."
        )
