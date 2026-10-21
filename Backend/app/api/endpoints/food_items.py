
from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import engine


router = APIRouter(
    prefix="/api/food-items",
    tags=["Food Inventory"]
)


class FoodItemCreate(BaseModel):
    user_id: int = Field(gt=0)
    food_name: str = Field(min_length=1, max_length=150)
    category: Optional[str] = Field(default=None, max_length=80)
    purchase_type: str
    purchase_date: date
    expiry_date: Optional[date] = None
    estimated_shelf_life_days: Optional[int] = Field(
        default=None, ge=0
    )
    storage_location: Optional[str] = Field(
        default=None, max_length=50
    )
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=30)
    food_status: str = Field(
        default="Fresh", max_length=30
    )


@router.get("/")
def get_food_items():
    query = text("""
        SELECT
            FoodItemId AS food_item_id,
            UserId AS user_id,
            FoodName AS food_name,
            Category AS category,
            PurchaseType AS purchase_type,
            PurchaseDate AS purchase_date,
            ExpiryDate AS expiry_date,
            EstimatedShelfLifeDays AS estimated_shelf_life_days,
            StorageLocation AS storage_location,
            Quantity AS quantity,
            Unit AS unit,
            FoodStatus AS food_status,
            WasteRiskScore AS waste_risk_score
        FROM dbo.FoodItems
        WHERE Quantity > 0
        ORDER BY food_item_id DESC
    """)

    try:
        with engine.connect() as connection:
            rows = connection.execute(query).mappings().all()
            return {
                "total": len(rows),
                "items": [dict(row) for row in rows]
            }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve food inventory."
        )


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_food_item(request: FoodItemCreate):
    if request.purchase_type not in ("Online", "Offline"):
        raise HTTPException(
            status_code=422,
            detail="Purchase type must be Online or Offline."
        )

    if request.expiry_date and request.expiry_date < request.purchase_date:
        raise HTTPException(
            status_code=422,
            detail="Expiry date cannot be before purchase date."
        )

    query = text("""
        INSERT INTO dbo.FoodItems (
            UserId,
            FoodName,
            Category,
            PurchaseType,
            PurchaseDate,
            ExpiryDate,
            EstimatedShelfLifeDays,
            StorageLocation,
            Quantity,
            Unit,
            FoodStatus
        )
        OUTPUT INSERTED.FoodItemId
        VALUES (
            :user_id,
            :food_name,
            :category,
            :purchase_type,
            :purchase_date,
            :expiry_date,
            :shelf_life,
            :storage_location,
            :quantity,
            :unit,
            :food_status
        )
    """)

    try:
        with engine.begin() as connection:
            result = connection.execute(query, {
                "user_id": request.user_id,
                "food_name": request.food_name.strip(),
                "category": request.category,
                "purchase_type": request.purchase_type,
                "purchase_date": request.purchase_date,
                "expiry_date": request.expiry_date,
                "shelf_life": request.estimated_shelf_life_days,
                "storage_location": request.storage_location,
                "quantity": request.quantity,
                "unit": request.unit,
                "food_status": request.food_status
            })

            food_item_id = result.scalar_one()

        return {
            "message": "Food item added successfully.",
            "food_item_id": food_item_id
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to add food item. Check the database schema and UserId."
        )
