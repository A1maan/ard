"""
FastAPI backend for Soil Property Prediction Dashboard.
Provides REST API endpoints for the Next.js frontend.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
import numpy as np

from inference import predictor, COLUMN_DESCRIPTIONS, PROPERTY_SHORT_NAMES


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager - runs on startup and shutdown."""
    # Startup
    print("🚀 Starting Soil Prediction API...")
    
    # Try to load pipeline
    if predictor.load_pipeline():
        print("✓ ML pipeline ready")
    else:
        print("⚠ ML pipeline not loaded - some endpoints will return mock data")
    
    # Try to load test data
    if predictor.load_test_data():
        print("✓ Test data ready")
    else:
        print("⚠ Test data not loaded - sample endpoints will be limited")
    
    yield  # App runs here
    
    # Shutdown (if needed)
    print("👋 Shutting down API...")


# Initialize FastAPI app
app = FastAPI(
    title="Soil Property Prediction API",
    description="API for predicting soil properties from spectral data using XGBoost models",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Next.js dev server
        "http://127.0.0.1:3000",
        "https://*.vercel.app",       # Vercel deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Soil Property Prediction API",
        "pipeline_loaded": predictor.is_loaded,
        "test_data_loaded": predictor.test_df is not None,
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "pipeline_loaded": predictor.is_loaded,
        "test_data_loaded": predictor.test_df is not None,
        "test_data_summary": predictor.get_test_data_summary() if predictor.test_df is not None else None,
    }


@app.get("/api/properties")
async def get_properties():
    """Get list of all predictable soil properties."""
    properties = []
    for name, description in COLUMN_DESCRIPTIONS.items():
        properties.append({
            "name": name,
            "short_name": PROPERTY_SHORT_NAMES.get(name, name),
            "description": description,
        })
    return {"properties": properties}


@app.get("/api/samples")
async def get_samples(
    limit: int = Query(default=10, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    random: bool = Query(default=False),
):
    """
    Get sample predictions from test data.
    
    - **limit**: Number of samples to return (1-1000)
    - **offset**: Starting index
    - **random**: If true, select random samples instead of sequential
    """
    if predictor.test_df is None:
        raise HTTPException(status_code=503, detail="Test data not loaded")
    
    total = len(predictor.test_df)
    
    if random:
        rng = np.random.default_rng()
        indices = rng.choice(total, size=min(limit, total), replace=False)
    else:
        indices = range(offset, min(offset + limit, total))
    
    samples = []
    for idx in indices:
        try:
            sample = predictor.predict_sample(int(idx))
            samples.append(sample)
        except Exception as e:
            print(f"Error predicting sample {idx}: {e}")
            continue
    
    return {
        "total": total,
        "returned": len(samples),
        "offset": offset if not random else None,
        "samples": samples,
    }


@app.get("/api/samples/{sample_idx}")
async def get_sample(sample_idx: int):
    """Get prediction for a specific sample by index."""
    if predictor.test_df is None:
        raise HTTPException(status_code=503, detail="Test data not loaded")
    
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="ML pipeline not loaded")
    
    try:
        return predictor.predict_sample(sample_idx)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")


@app.get("/api/states")
async def get_states_data():
    """
    Get aggregated soil property data by US state.
    Returns mock data for dashboard visualization.
    
    In production, this would aggregate actual predictions by state.
    """
    # US state data with mock soil property values for dashboard
    # Values are representative ranges for demonstration
    states_data = {
        "AL": {"name": "Alabama", "organic_carbon": 1.2, "ph": 5.8, "clay": 22, "sand": 45, "risk_level": "low"},
        "AK": {"name": "Alaska", "organic_carbon": 8.5, "ph": 5.2, "clay": 18, "sand": 35, "risk_level": "low"},
        "AZ": {"name": "Arizona", "organic_carbon": 0.6, "ph": 7.8, "clay": 25, "sand": 55, "risk_level": "medium"},
        "AR": {"name": "Arkansas", "organic_carbon": 1.5, "ph": 5.5, "clay": 30, "sand": 35, "risk_level": "low"},
        "CA": {"name": "California", "organic_carbon": 1.8, "ph": 6.5, "clay": 28, "sand": 40, "risk_level": "medium"},
        "CO": {"name": "Colorado", "organic_carbon": 1.4, "ph": 7.2, "clay": 22, "sand": 48, "risk_level": "low"},
        "CT": {"name": "Connecticut", "organic_carbon": 3.2, "ph": 5.5, "clay": 15, "sand": 50, "risk_level": "low"},
        "DE": {"name": "Delaware", "organic_carbon": 2.1, "ph": 5.8, "clay": 18, "sand": 55, "risk_level": "low"},
        "FL": {"name": "Florida", "organic_carbon": 1.8, "ph": 6.2, "clay": 8, "sand": 85, "risk_level": "medium"},
        "GA": {"name": "Georgia", "organic_carbon": 1.3, "ph": 5.5, "clay": 25, "sand": 50, "risk_level": "low"},
        "HI": {"name": "Hawaii", "organic_carbon": 4.5, "ph": 5.8, "clay": 45, "sand": 25, "risk_level": "low"},
        "ID": {"name": "Idaho", "organic_carbon": 2.0, "ph": 6.8, "clay": 20, "sand": 42, "risk_level": "low"},
        "IL": {"name": "Illinois", "organic_carbon": 3.5, "ph": 6.2, "clay": 28, "sand": 30, "risk_level": "low"},
        "IN": {"name": "Indiana", "organic_carbon": 3.2, "ph": 6.0, "clay": 26, "sand": 32, "risk_level": "low"},
        "IA": {"name": "Iowa", "organic_carbon": 4.2, "ph": 6.5, "clay": 30, "sand": 28, "risk_level": "low"},
        "KS": {"name": "Kansas", "organic_carbon": 2.0, "ph": 6.8, "clay": 25, "sand": 38, "risk_level": "low"},
        "KY": {"name": "Kentucky", "organic_carbon": 2.2, "ph": 5.8, "clay": 28, "sand": 35, "risk_level": "low"},
        "LA": {"name": "Louisiana", "organic_carbon": 1.8, "ph": 5.5, "clay": 32, "sand": 38, "risk_level": "medium"},
        "ME": {"name": "Maine", "organic_carbon": 4.5, "ph": 5.2, "clay": 12, "sand": 55, "risk_level": "low"},
        "MD": {"name": "Maryland", "organic_carbon": 2.5, "ph": 5.8, "clay": 22, "sand": 45, "risk_level": "low"},
        "MA": {"name": "Massachusetts", "organic_carbon": 3.8, "ph": 5.5, "clay": 14, "sand": 52, "risk_level": "low"},
        "MI": {"name": "Michigan", "organic_carbon": 3.0, "ph": 6.0, "clay": 20, "sand": 45, "risk_level": "low"},
        "MN": {"name": "Minnesota", "organic_carbon": 4.0, "ph": 6.2, "clay": 25, "sand": 35, "risk_level": "low"},
        "MS": {"name": "Mississippi", "organic_carbon": 1.2, "ph": 5.5, "clay": 28, "sand": 42, "risk_level": "medium"},
        "MO": {"name": "Missouri", "organic_carbon": 2.5, "ph": 6.0, "clay": 26, "sand": 35, "risk_level": "low"},
        "MT": {"name": "Montana", "organic_carbon": 2.2, "ph": 7.0, "clay": 22, "sand": 40, "risk_level": "low"},
        "NE": {"name": "Nebraska", "organic_carbon": 2.8, "ph": 6.8, "clay": 24, "sand": 38, "risk_level": "low"},
        "NV": {"name": "Nevada", "organic_carbon": 0.5, "ph": 8.0, "clay": 18, "sand": 60, "risk_level": "high"},
        "NH": {"name": "New Hampshire", "organic_carbon": 4.2, "ph": 5.2, "clay": 12, "sand": 55, "risk_level": "low"},
        "NJ": {"name": "New Jersey", "organic_carbon": 2.8, "ph": 5.5, "clay": 18, "sand": 52, "risk_level": "low"},
        "NM": {"name": "New Mexico", "organic_carbon": 0.8, "ph": 7.5, "clay": 20, "sand": 55, "risk_level": "medium"},
        "NY": {"name": "New York", "organic_carbon": 3.5, "ph": 5.8, "clay": 18, "sand": 45, "risk_level": "low"},
        "NC": {"name": "North Carolina", "organic_carbon": 1.8, "ph": 5.5, "clay": 25, "sand": 48, "risk_level": "low"},
        "ND": {"name": "North Dakota", "organic_carbon": 3.5, "ph": 7.0, "clay": 28, "sand": 32, "risk_level": "low"},
        "OH": {"name": "Ohio", "organic_carbon": 3.0, "ph": 6.2, "clay": 28, "sand": 32, "risk_level": "low"},
        "OK": {"name": "Oklahoma", "organic_carbon": 1.5, "ph": 6.5, "clay": 25, "sand": 42, "risk_level": "medium"},
        "OR": {"name": "Oregon", "organic_carbon": 3.2, "ph": 5.8, "clay": 25, "sand": 38, "risk_level": "low"},
        "PA": {"name": "Pennsylvania", "organic_carbon": 2.8, "ph": 5.8, "clay": 22, "sand": 42, "risk_level": "low"},
        "RI": {"name": "Rhode Island", "organic_carbon": 3.0, "ph": 5.5, "clay": 14, "sand": 55, "risk_level": "low"},
        "SC": {"name": "South Carolina", "organic_carbon": 1.2, "ph": 5.5, "clay": 22, "sand": 55, "risk_level": "low"},
        "SD": {"name": "South Dakota", "organic_carbon": 2.8, "ph": 7.0, "clay": 26, "sand": 35, "risk_level": "low"},
        "TN": {"name": "Tennessee", "organic_carbon": 2.0, "ph": 5.8, "clay": 25, "sand": 38, "risk_level": "low"},
        "TX": {"name": "Texas", "organic_carbon": 1.2, "ph": 7.2, "clay": 28, "sand": 45, "risk_level": "medium"},
        "UT": {"name": "Utah", "organic_carbon": 1.0, "ph": 7.8, "clay": 20, "sand": 52, "risk_level": "medium"},
        "VT": {"name": "Vermont", "organic_carbon": 4.5, "ph": 5.5, "clay": 15, "sand": 48, "risk_level": "low"},
        "VA": {"name": "Virginia", "organic_carbon": 2.2, "ph": 5.5, "clay": 25, "sand": 42, "risk_level": "low"},
        "WA": {"name": "Washington", "organic_carbon": 3.0, "ph": 6.0, "clay": 22, "sand": 40, "risk_level": "low"},
        "WV": {"name": "West Virginia", "organic_carbon": 2.5, "ph": 5.5, "clay": 28, "sand": 35, "risk_level": "low"},
        "WI": {"name": "Wisconsin", "organic_carbon": 3.5, "ph": 6.2, "clay": 22, "sand": 40, "risk_level": "low"},
        "WY": {"name": "Wyoming", "organic_carbon": 1.8, "ph": 7.2, "clay": 18, "sand": 48, "risk_level": "low"},
    }
    
    return {
        "states": states_data,
        "metadata": {
            "properties": ["organic_carbon", "ph", "clay", "sand"],
            "risk_levels": ["low", "medium", "high"],
            "units": {
                "organic_carbon": "%",
                "ph": "index",
                "clay": "%",
                "sand": "%",
            }
        }
    }


@app.get("/api/states/{state_code}")
async def get_state_detail(state_code: str):
    """
    Get detailed soil data for a specific US state.
    
    - **state_code**: Two-letter state code (e.g., 'CA', 'TX')
    """
    states_response = await get_states_data()
    state_code_upper = state_code.upper()
    
    if state_code_upper not in states_response["states"]:
        raise HTTPException(status_code=404, detail=f"State '{state_code}' not found")
    
    state_data = states_response["states"][state_code_upper]
    
    # Add more detailed mock data for the state detail view
    return {
        "state_code": state_code_upper,
        **state_data,
        "sample_count": np.random.randint(100, 5000),
        "properties": {
            "organic_carbon": {
                "value": state_data["organic_carbon"],
                "unit": "%",
                "description": "Soil organic carbon content",
                "trend": np.random.choice(["increasing", "stable", "decreasing"]),
            },
            "ph": {
                "value": state_data["ph"],
                "unit": "index",
                "description": "Soil pH in water",
                "classification": "acidic" if state_data["ph"] < 6.5 else "neutral" if state_data["ph"] < 7.5 else "alkaline",
            },
            "clay": {
                "value": state_data["clay"],
                "unit": "%",
                "description": "Clay content",
            },
            "sand": {
                "value": state_data["sand"],
                "unit": "%",
                "description": "Sand content",
            },
            "silt": {
                "value": 100 - state_data["clay"] - state_data["sand"],
                "unit": "%",
                "description": "Silt content",
            },
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
