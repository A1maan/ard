"""
FastAPI server for farm data endpoints.
Provides REST API for farms list and farm details with soil metrics.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from bq_service import list_farms, get_farm_by_id


# ---------- APP + CORS ----------

app = FastAPI(
    title="Farms API",
    description="API for farm data from BigQuery OSSL predictions",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- RESPONSE MODELS ----------

class FarmListItem(BaseModel):
    id: str
    name: str
    location: str
    coordinates: List[float]
    size: str
    soilType: str
    health: str
    healthScore: int


class FarmsListResponse(BaseModel):
    farms: List[FarmListItem]
    total: int


class FarmDetailResponse(BaseModel):
    id: str
    name: str
    location: str
    coordinates: List[float]
    size: str
    soilType: str
    health: str
    healthScore: int
    farm_fertilizer_analysis: Optional[Dict[str, Any]] = None
    farm_crop_analysis: Optional[Dict[str, Any]] = None
    raw_predictions: Optional[Dict[str, Any]] = None


# ---------- ENDPOINTS ----------

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Farms API"}


@app.get("/api/farms", response_model=FarmsListResponse)
async def get_farms(limit: int = 50):
    """
    Get list of farms from BigQuery.
    Returns basic farm info with placeholder names.
    """
    try:
        farms = list_farms(limit=limit)
        return FarmsListResponse(farms=farms, total=len(farms))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/farms/{farm_id}", response_model=FarmDetailResponse)
async def get_farm(farm_id: str):
    """
    Get detailed farm data including soil metrics and recommendations.
    """
    try:
        row_id = int(farm_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid farm ID format")
    
    try:
        farm = get_farm_by_id(row_id)
        if farm is None:
            raise HTTPException(status_code=404, detail="Farm not found")
        return FarmDetailResponse(**farm)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- RUN SERVER ----------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
