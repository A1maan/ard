import numpy as np
import pandas as pd
import joblib
import warnings
from pprint import pprint
from typing import Dict, List, Any, Optional

test_csv_path = "ossl_test_union.csv"
pipeline_path = "ossl_per_target_pipeline.pkl"

# Short human-readable descriptions for the target columns
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
    "awc.33.1500kPa_usda.c80_w.frac": "Available water capacity (33–1500 kPa, fraction)",
    "fe.ox_usda.a60_w.pct": "Oxalate-extractable Fe (%)",
    "al.ox_usda.a59_w.pct": "Oxalate-extractable Al (%)",
    "fe.dith_usda.a66_w.pct": "Dithionite-extractable Fe (%)",
    "al.dith_usda.a65_w.pct": "Dithionite-extractable Al (%)",
    "p.ext_usda.a1070_mg.kg": "Extractable P (mg/kg)",
    "k.ext_usda.a1065_mg.kg": "Extractable K (mg/kg)",
    "mg.ext_usda.a1066_mg.kg": "Extractable Mg (mg/kg)",
    "ca.ext_usda.a1059_mg.kg": "Extractable Ca (mg/kg)",
    "na.ext_usda.a1068_mg.kg": "Extractable Na (mg/kg)",
    # You can add more descriptions here if you extend the target set.
}

warnings.filterwarnings(
    "ignore",
    message=".*Changing updater from `grow_gpu_hist` to `grow_quantile_histmaker`.*",
)
warnings.filterwarnings(
    "ignore",
    message=".*No visible GPU is found, setting device to CPU.*",
)


def _snv_transform(X: np.ndarray) -> np.ndarray:
    """Row-wise Standard Normal Variate (SNV) transform for spectra."""
    mean = X.mean(axis=1, keepdims=True)
    std = X.std(axis=1, keepdims=True)
    std[std == 0] = 1.0
    return (X - mean) / std


def predict_samples_from_test_csv(
    test_csv_path: str,
    pipeline_path: str,
    n_samples: int = 5,
    random_state: Optional[int] = None,
) -> Dict[int, List[Dict[str, Any]]]:
    """
    Load a saved OSSL per-target pipeline and a test CSV, predict all soil
    properties for n samples, and return a dictionary mapping each sample's
    row index (in the CSV) to a list of predictions.

    Parameters
    ----------
    test_csv_path : str
        Path to the test CSV containing spectral and extra numeric columns.
    pipeline_path : str
        Path to the saved pipeline pickle (e.g., 'ossl_per_target_pipeline.pkl').
    n_samples : int, optional
        Number of rows from the test CSV to predict (default is 5).
        If greater than the number of rows in the CSV, it is clipped.
    random_state : int or None, optional
        If provided, selects a random subset of rows; if None, uses the
        first n_samples rows.

    Returns
    -------
    Dict[int, List[Dict[str, Any]]]
        A dictionary keyed by integer row index (in the test CSV). Each value
        is a list of dictionaries, one per predicted property, with keys:
            - 'name'        : column name of the property
            - 'description' : short human-readable description of the property
            - 'value'       : predicted value on the original scale
    """
    # Load pipeline components
    pipe = joblib.load(pipeline_path)
    models = pipe["models"]
    pca = pipe["pca"]
    spec_imputer = pipe["spec_imputer"]
    num_imputer = pipe["num_imputer"]
    num_scaler = pipe["num_scaler"]
    spectral_cols = pipe["spectral_cols"]
    extra_cols = pipe["extra_cols"]
    log_transform_targets = set(pipe.get("log_transform_targets", []))

    # Load test CSV
    df = pd.read_csv(test_csv_path, low_memory=False)

    if len(df) == 0:
        raise ValueError("Test CSV is empty.")

    # Determine which row indices to use
    n_samples = min(n_samples, len(df))
    if random_state is None:
        selected_indices = np.arange(n_samples)
    else:
        rng = np.random.default_rng(random_state)
        selected_indices = np.sort(rng.choice(len(df), size=n_samples, replace=False))

    df_sel = df.iloc[selected_indices]

    true_values = {}
    for target_name in models.keys():
        if target_name in df_sel.columns:
            true_values[target_name] = df_sel[target_name].to_numpy(dtype=float)
        else:
            # If the column isn't there (or you use this on data without labels),
            # we'll just fill with NaNs.
            true_values[target_name] = np.full(len(df_sel), np.nan)

    # Build feature matrix using stored preprocessing
    # 1. Spectral part: impute -> SNV -> PCA
    X_spec_raw = df_sel[spectral_cols].astype(float)
    X_spec_imp = spec_imputer.transform(X_spec_raw)
    X_spec_snv = _snv_transform(X_spec_imp)
    X_spec_pcs = pca.transform(X_spec_snv)

    # 2. Extra numeric columns (if any)
    if extra_cols and num_imputer is not None and num_scaler is not None:
        X_num_raw = df_sel[extra_cols].astype(float)  
        X_num_imp = num_imputer.transform(X_num_raw)
        X_num_scaled = num_scaler.transform(X_num_imp)
        X = np.hstack([X_spec_pcs, X_num_scaled])
    else:
        X = X_spec_pcs

    # Predict for each target model
    per_target_preds: Dict[str, np.ndarray] = {}
    for target_name, model in models.items():
        y_pred = model.predict(X)
        if target_name in log_transform_targets:
            y_pred = np.expm1(y_pred)
        per_target_preds[target_name] = y_pred

    # Assemble output: per sample index -> list of {name, description, value}
    output: Dict[int, List[Dict[str, Any]]] = {}
    for i, row_idx in enumerate(selected_indices):
        sample_preds: List[Dict[str, Any]] = []
        for target_name, y_pred in per_target_preds.items():
            desc = COLUMN_DESCRIPTIONS.get(target_name, "")

            true_arr = true_values[target_name]
            true_val = true_arr[i]

            if np.isnan(true_val):
                percent_error = None  # no ground truth available
                true_val_out = None
            else:
                true_val_out = float(true_val)
                if true_val == 0:
                    percent_error = None  # avoid divide-by-zero, or define your own rule
                else:
                    percent_error = round(float(
                        100.0 * abs(y_pred[i] - true_val) / abs(true_val)
                    ), 2)

            sample_preds.append(
                {
                    "name": target_name,
                    "description": desc,
                    "value": float(y_pred[i]),       # predicted value
                    "true_value": true_val_out,      # ground truth from CSV (if present)
                    "percent_error": percent_error,  # absolute % error, or None
                }
            )
        output[int(row_idx)] = sample_preds

    return output