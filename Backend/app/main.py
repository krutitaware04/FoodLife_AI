
from fastapi import FastAPI
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.dashboard import router as dashboard_router
from app.api.endpoints.food_items import router as food_items_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints.food_scan import router as food_scan_router

app = FastAPI(
    title="FoodLife AI API",
    description=(
        "Food shelf-life estimation, waste-risk prediction, "
        "and consumption planning."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)
app.include_router(auth_router)
app.include_router(food_items_router)
app.include_router(food_scan_router)

@app.get("/")
def home():
    return {
        "message": "FoodLife AI API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
