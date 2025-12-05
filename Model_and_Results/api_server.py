from typing import Any, Dict, List
from pathlib import Path
import math

import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from run_model_setup import _snv_transform, COLUMN_DESCRIPTIONS

# ---------- CONFIG ----------

# If your files are elsewhere, keep these as ABSOLUTE paths:
TEST_CSV_PATH = Path(r"C:\Users\SAADB\Desktop\Python_Code\Google_Hackathon\Model_and_Results\ossl_test_union.csv")
PIPELINE_PATH = Path(r"C:\Users\SAADB\Desktop\Python_Code\Google_Hackathon\Model_and_Results\ossl_per_target_pipeline.pkl")

LAT_COL = "latitude.point_wgs84_dd"
LON_COL = "longitude.point_wgs84_dd"
COUNTRY_COL = "location.country_iso.3166_txt"
N_SAMPLES_DEFAULT = 5

# ---------- APP + CORS ----------

app = FastAPI(title="OSSL Soil Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- LOAD DATA & PIPELINE ----------

df_test: pd.DataFrame = pd.read_csv(TEST_CSV_PATH, low_memory=False)
pipe: Dict[str, Any] = joblib.load(PIPELINE_PATH)

models = pipe["models"]
pca = pipe["pca"]
spec_imputer = pipe["spec_imputer"]
num_imputer = pipe["num_imputer"]
num_scaler = pipe["num_scaler"]
spectral_cols = pipe["spectral_cols"]
extra_cols = pipe["extra_cols"]
log_transform_targets = set(pipe.get("log_transform_targets", []))

if {LAT_COL, LON_COL, COUNTRY_COL}.issubset(df_test.columns):
    usa_mask = (
        (df_test[COUNTRY_COL] == "USA")
        & df_test[LAT_COL].notna()
        & df_test[LON_COL].notna()
    )
    USA_INDICES = np.where(usa_mask)[0]
else:
    USA_INDICES = np.array([], dtype=int)

if len(USA_INDICES) == 0:
    print("WARNING: No USA rows with valid lat/lon in CSV.")


def _predict_for_indices(selected_indices: np.ndarray) -> Dict[int, Dict[str, Any]]:
    df_sel = df_test.iloc[selected_indices]

    # Spectral pipeline
    X_spec_raw = df_sel[spectral_cols].astype(float)
    X_spec_imp = spec_imputer.transform(X_spec_raw)
    X_spec_snv = _snv_transform(X_spec_imp)
    X_spec_pcs = pca.transform(X_spec_snv)

    # Extra numeric
    if extra_cols and num_imputer is not None and num_scaler is not None:
        X_num_raw = df_sel[extra_cols].astype(float)
        X_num_imp = num_imputer.transform(X_num_raw)
        X_num_scaled = num_scaler.transform(X_num_imp)
        X = np.hstack([X_spec_pcs, X_num_scaled])
    else:
        X = X_spec_pcs

    # Predictions
    per_target_preds: Dict[str, np.ndarray] = {}
    for target_name, model in models.items():
        y_pred = model.predict(X)
        if target_name in log_transform_targets:
            y_pred = np.expm1(y_pred)
        per_target_preds[target_name] = y_pred

    # Per-row properties
    results: Dict[int, Dict[str, Any]] = {}
    for i, row_idx in enumerate(selected_indices):
        row = df_sel.iloc[i]

        lat_val = row.get(LAT_COL)
        lon_val = row.get(LON_COL)
        lat = float(lat_val) if pd.notna(lat_val) else None
        lon = float(lon_val) if pd.notna(lon_val) else None

        country_val = row.get(COUNTRY_COL)
        if isinstance(country_val, str):
            country = country_val
        elif pd.isna(country_val):
            country = None
        else:
            country = str(country_val)

        props: Dict[str, Any] = {
            "id": str(int(row_idx)),
            "latitude": lat,
            "longitude": lon,
            "country": country,
        }

        descriptions: Dict[str, str] = {}
        for target_name, y_arr in per_target_preds.items():
            val = float(y_arr[i])
            if math.isnan(val):
                continue
            props[target_name] = val
            desc = COLUMN_DESCRIPTIONS.get(target_name)
            if desc:
                descriptions[target_name] = desc

        if descriptions:
            props["descriptions"] = descriptions

        results[int(row_idx)] = props

    return results


@app.get("/")
def root():
    return {"status": "ok", "message": "OSSL Soil Prediction API"}


@app.get("/api/samples")
def get_samples():
    if len(USA_INDICES) == 0:
        return JSONResponse(
            status_code=500,
            content={"error": "No USA rows with valid lat/lon available in test CSV."},
        )

    n = min(N_SAMPLES_DEFAULT, len(USA_INDICES))
    rng = np.random.default_rng()
    selected = np.sort(rng.choice(USA_INDICES, size=n, replace=False))

    pred_dict = _predict_for_indices(selected)

    features: List[Dict[str, Any]] = []
    for row_idx, props in pred_dict.items():
        lat = props.get("latitude")
        lon = props.get("longitude")
        
        # Check 1: Ensure valid coordinates to include the point
        if lat is None or lon is None or math.isnan(lat) or math.isnan(lon):
            continue

        # Check 2: CRITICAL FIX HERE! Clean up the props dictionary
        # The coordinates are already in 'geometry', so remove them from 'properties'
        # to avoid accidental NaN serialization.
        if math.isnan(props["latitude"]):
            props["latitude"] = None # Or del props["latitude"]
        if math.isnan(props["longitude"]):
            props["longitude"] = None # Or del props["longitude"]
            
        # If you want to completely remove lat/lon from properties (recommended):
        props_to_send = props.copy()
        del props_to_send["latitude"]
        del props_to_send["longitude"]
        del props_to_send["country"] # Country is likely redundant for USA-only data
        
        # --- Build Feature with CLEANED properties ---
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat], # The CLEAN coordinates are used here
                },
                "properties": props_to_send, # Use the cleaned dictionary
            }
        )

    feature_collection = {
        "type": "FeatureCollection",
        "features": features,
    }

    return JSONResponse(content=feature_collection) # Should now succeed!
