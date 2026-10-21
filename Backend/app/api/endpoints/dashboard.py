
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import engine

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def get_dashboard_summary():
    query = text("""
        SELECT
            (SELECT COUNT(*)
             FROM dbo.FoodItems
             WHERE Quantity > 0) AS total_food_items,

            (SELECT COUNT(*)
             FROM dbo.FoodItems
             WHERE Quantity > 0
               AND ExpiryDate IS NOT NULL
               AND ExpiryDate >= CAST(GETDATE() AS DATE)
               AND ExpiryDate <= DATEADD(DAY, 3, CAST(GETDATE() AS DATE))
            ) AS expiring_soon,

            (SELECT COUNT(*)
             FROM dbo.FoodItems
             WHERE Quantity > 0
               AND WasteRiskScore >= 70
            ) AS high_waste_risk,

            (SELECT COALESCE(SUM(ConsumedQuantity), 0)
             FROM dbo.FoodConsumption
             WHERE ConsumptionDate >= DATEFROMPARTS(
                 YEAR(GETDATE()), MONTH(GETDATE()), 1
             )
            ) AS consumed_this_month
    """)

    try:
        with engine.connect() as connection:
            row = connection.execute(query).mappings().one()

        return {
            "total_food_items": row["total_food_items"],
            "expiring_soon": row["expiring_soon"],
            "high_waste_risk": row["high_waste_risk"],
            "consumed_this_month": float(row["consumed_this_month"]),
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve dashboard summary.",
        )
