"""
Inference module - wraps the ML pipeline from Model_and_Results.
Loads the model once at startup and provides prediction functions.
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from typing import Dict, List, Any, Optional

# Add Model_and_Results to path for imports
MODEL_DIR = Path(__file__).parent.parent / "Model_and_Results"
sys.path.insert(0, str(MODEL_DIR))

# Paths to model artifacts (update these if files are elsewhere)
PIPELINE_PATH = MODEL_DIR / "ossl_per_target_pipeline.pkl"
TEST_CSV_PATH = MODEL_DIR / "ossl_test_union.csv"

# Human-readable descriptions for soil properties
COLUMN_DESCRIPTIONS = {
    "oc_usda.c729_w.pct": "Soil organic carbon (%)",
    "c.tot_usda.a622_w.pct": "Total carbon (%)",
    "n.tot_usda.a623_w.pct": "Total nitrogen (%)",
    "ph.h2o_usda.a268_index": "Soil pH in water",
    "ph.cacl2_usda.a481_index": "Soil pH in CaCl₂",
    "cec_usda.a723_cmolc.kg": "Cation exchange capacity (cmolc/kg)",
    "ec_usda.a364_ds.m": "Electrical conductivity (dS/m)",
    "clay.tot_usda.a334_w.pct": "Clay content (%)",
    "sand.tot_usda.c60_w.pct": "Sand content (%)",
    "silt.tot_usda.c62_w.pct": "Silt content (%)",
    "bd_usda.a4_g.cm3": "Bulk density (g/cm³)",
    "wr.10kPa_usda.a414_w.pct": "Water content at 10 kPa (%)",
    "wr.33kPa_usda.a415_w.pct": "Water content at 33 kPa (%)",
    "wr.1500kPa_usda.a417_w.pct": "Water content at 1500 kPa (%)",
    "awc.33.1500kPa_usda.c80_w.frac": "Available water capacity (fraction)",
    "fe.ox_usda.a60_w.pct": "Oxalate-extractable Fe (%)",
    "al.ox_usda.a59_w.pct": "Oxalate-extractable Al (%)",
    "fe.dith_usda.a66_w.pct": "Dithionite-extractable Fe (%)",
    "al.dith_usda.a65_w.pct": "Dithionite-extractable Al (%)",
    "p.ext_usda.a1070_mg.kg": "Extractable P (mg/kg)",
    "k.ext_usda.a1065_mg.kg": "Extractable K (mg/kg)",
    "mg.ext_usda.a1066_mg.kg": "Extractable Mg (mg/kg)",
    "ca.ext_usda.a1059_mg.kg": "Extractable Ca (mg/kg)",
    "na.ext_usda.a1068_mg.kg": "Extractable Na (mg/kg)",
}

# Simplified names for frontend display
PROPERTY_SHORT_NAMES = {
    "oc_usda.c729_w.pct": "Organic Carbon",
    "c.tot_usda.a622_w.pct": "Total Carbon",
    "n.tot_usda.a623_w.pct": "Nitrogen",
    "ph.h2o_usda.a268_index": "pH (H₂O)",
    "ph.cacl2_usda.a481_index": "pH (CaCl₂)",
    "cec_usda.a723_cmolc.kg": "CEC",
    "ec_usda.a364_ds.m": "EC",
    "clay.tot_usda.a334_w.pct": "Clay",
    "sand.tot_usda.c60_w.pct": "Sand",
    "silt.tot_usda.c62_w.pct": "Silt",
    "bd_usda.a4_g.cm3": "Bulk Density",
    "wr.10kPa_usda.a414_w.pct": "WR 10kPa",
    "wr.33kPa_usda.a415_w.pct": "WR 33kPa",
    "wr.1500kPa_usda.a417_w.pct": "WR 1500kPa",
    "awc.33.1500kPa_usda.c80_w.frac": "AWC",
    "fe.ox_usda.a60_w.pct": "Fe (oxalate)",
    "al.ox_usda.a59_w.pct": "Al (oxalate)",
    "fe.dith_usda.a66_w.pct": "Fe (dithionite)",
    "al.dith_usda.a65_w.pct": "Al (dithionite)",
    "p.ext_usda.a1070_mg.kg": "Phosphorus",
    "k.ext_usda.a1065_mg.kg": "Potassium",
    "mg.ext_usda.a1066_mg.kg": "Magnesium",
    "ca.ext_usda.a1059_mg.kg": "Calcium",
    "na.ext_usda.a1068_mg.kg": "Sodium",
}


class SoilPredictor:
    """
    Singleton class to load and manage the ML pipeline.
    Loads model artifacts once and provides prediction methods.
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.pipeline = None
        self.test_df = None
        self.is_loaded = False
        self._initialized = True
    
    def load_pipeline(self, pipeline_path: Optional[Path] = None) -> bool:
        """Load the ML pipeline from disk."""
        path = pipeline_path or PIPELINE_PATH
        
        if not path.exists():
            print(f"Warning: Pipeline file not found at {path}")
            return False
        
        try:
            self.pipeline = joblib.load(path)
            self.is_loaded = True
            print(f"✓ Pipeline loaded from {path}")
            return True
        except Exception as e:
            print(f"Error loading pipeline: {e}")
            return False
    
    def load_test_data(self, csv_path: Optional[Path] = None) -> bool:
        """Load test CSV for sample predictions."""
        path = csv_path or TEST_CSV_PATH
        
        if not path.exists():
            print(f"Warning: Test CSV not found at {path}")
            return False
        
        try:
            self.test_df = pd.read_csv(path, low_memory=False)
            print(f"✓ Test data loaded: {len(self.test_df)} samples")
            return True
        except Exception as e:
            print(f"Error loading test data: {e}")
            return False
    
    def _snv_transform(self, X: np.ndarray) -> np.ndarray:
        """Row-wise Standard Normal Variate (SNV) transform."""
        mean = X.mean(axis=1, keepdims=True)
        std = X.std(axis=1, keepdims=True)
        std[std == 0] = 1.0
        return (X - mean) / std
    
    def predict(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Run predictions on a DataFrame with spectral columns.
        
        Returns list of dicts with predictions for each soil property.
        """
        if not self.is_loaded:
            raise RuntimeError("Pipeline not loaded. Call load_pipeline() first.")
        
        pipe = self.pipeline
        models = pipe["models"]
        pca = pipe["pca"]
        spec_imputer = pipe["spec_imputer"]
        num_imputer = pipe["num_imputer"]
        num_scaler = pipe["num_scaler"]
        spectral_cols = pipe["spectral_cols"]
        extra_cols = pipe["extra_cols"]
        log_transform_targets = set(pipe.get("log_transform_targets", []))
        
        # Build feature matrix
        X_spec_raw = df[spectral_cols].astype(float)
        X_spec_imp = spec_imputer.transform(X_spec_raw)
        X_spec_snv = self._snv_transform(X_spec_imp)
        X_spec_pcs = pca.transform(X_spec_snv)
        
        if extra_cols and num_imputer is not None and num_scaler is not None:
            X_num_raw = df[extra_cols].astype(float)
            X_num_imp = num_imputer.transform(X_num_raw)
            X_num_scaled = num_scaler.transform(X_num_imp)
            X = np.hstack([X_spec_pcs, X_num_scaled])
        else:
            X = X_spec_pcs
        
        # Predict all properties
        predictions = []
        for target_name, model in models.items():
            y_pred = model.predict(X)
            if target_name in log_transform_targets:
                y_pred = np.expm1(y_pred)
            
            predictions.append({
                "name": target_name,
                "short_name": PROPERTY_SHORT_NAMES.get(target_name, target_name),
                "description": COLUMN_DESCRIPTIONS.get(target_name, ""),
                "values": y_pred.tolist(),
                "mean": float(np.mean(y_pred)),
                "std": float(np.std(y_pred)),
                "min": float(np.min(y_pred)),
                "max": float(np.max(y_pred)),
            })
        
        return predictions
    
    def predict_sample(self, sample_idx: int) -> Dict[str, Any]:
        """Predict soil properties for a single sample from test data."""
        if self.test_df is None:
            raise RuntimeError("Test data not loaded. Call load_test_data() first.")
        
        if sample_idx < 0 or sample_idx >= len(self.test_df):
            raise ValueError(f"Sample index {sample_idx} out of range [0, {len(self.test_df)})")
        
        row = self.test_df.iloc[[sample_idx]]
        predictions = self.predict(row)
        
        # Get location info if available
        lat = row.get("latitude.wgs84_dd", [None]).values[0]
        lon = row.get("longitude.wgs84_dd", [None]).values[0]
        
        return {
            "sample_idx": sample_idx,
            "latitude": float(lat) if pd.notna(lat) else None,
            "longitude": float(lon) if pd.notna(lon) else None,
            "predictions": [
                {
                    "name": p["name"],
                    "short_name": p["short_name"],
                    "description": p["description"],
                    "value": p["values"][0],
                }
                for p in predictions
            ]
        }
    
    def get_samples_by_state(self, state_name: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get sample predictions filtered by US state (requires state column in data)."""
        # This is a placeholder - actual implementation depends on your data structure
        # You may need to do reverse geocoding from lat/lon or have state info in the CSV
        pass
    
    def get_test_data_summary(self) -> Dict[str, Any]:
        """Get summary statistics about the test dataset."""
        if self.test_df is None:
            return {"error": "Test data not loaded"}
        
        return {
            "total_samples": len(self.test_df),
            "columns": len(self.test_df.columns),
            "has_coordinates": all(
                col in self.test_df.columns 
                for col in ["latitude.wgs84_dd", "longitude.wgs84_dd"]
            ),
        }


# Global predictor instance
predictor = SoilPredictor()
