"""
BigQuery service for farm data.
Fetches farm data from OSSL_with_predictions table.
"""

from google.cloud import bigquery
from typing import List, Dict, Any, Optional
from fertilizer import get_fertilizer_recommendations
from crops import get_crop_recommendations

# BigQuery configuration
PROJECT_ID = "qwiklabs-gcp-01-dd00ff0e4c0d"
DATASET = "OSSL"
TABLE = "OSSL_with_predictions"
FULL_TABLE = f"{PROJECT_ID}.{DATASET}.{TABLE}"

# Initialize client
client = bigquery.Client(project=PROJECT_ID)


def list_farms(limit: int = 50) -> List[Dict[str, Any]]:
    """
    List farms from BigQuery table.
    Returns rows with row_id, coordinates, soil metrics, and calculated health.
    """
    query = f"""
        SELECT 
            row_id,
            longitude_point_wgs84_dd as longitude,
            latitude_point_wgs84_dd as latitude,
            pred_clay_tot_usda_a334_w_pct as clay,
            pred_sand_tot_usda_c60_w_pct as sand,
            pred_ph_h2o_usda_a268_index as ph,
            pred_oc_usda_c729_w_pct as organic_carbon,
            pred_n_tot_usda_a623_w_pct as nitrogen,
            pred_cec_usda_a723_cmolc_kg as cec
        FROM `{FULL_TABLE}`
        WHERE longitude_point_wgs84_dd IS NOT NULL 
          AND latitude_point_wgs84_dd IS NOT NULL
        ORDER BY row_id
        LIMIT {limit}
    """
    
    df = client.query(query).to_dataframe()
    
    farms = []
    for idx, row in df.iterrows():
        # Calculate soil type from clay/sand
        soil_type = _get_texture_class_from_values(
            row.get("clay", 0) or 0,
            row.get("sand", 0) or 0
        )
        
        # Calculate health score from soil metrics
        health_score = _calculate_health_score(row)
        
        # Determine health status
        if health_score >= 75:
            health = "good"
        elif health_score >= 50:
            health = "warning"
        else:
            health = "critical"
        
        # Calculate area estimate (placeholder based on row_id for demo)
        # In production, this would come from actual farm boundary data
        size = _estimate_farm_size(int(row["row_id"]))
        
        farms.append({
            "id": str(int(row["row_id"])),
            "name": f"Farm {int(row['row_id'])}",
            "location": f"({row['latitude']:.4f}, {row['longitude']:.4f})",
            "coordinates": [float(row["latitude"]), float(row["longitude"])],
            "size": size,
            "soilType": soil_type,
            "health": health,
            "healthScore": health_score,
        })
    
    return farms


def _get_texture_class_from_values(clay: float, sand: float) -> str:
    """Determine soil texture class from clay/sand percentages."""
    if clay >= 40:
        return "Clay"
    elif sand >= 70:
        return "Sandy"
    elif clay >= 25:
        return "Clay Loam"
    elif sand >= 50:
        return "Sandy Loam"
    else:
        return "Loam"


def _calculate_health_score(row: Dict[str, Any]) -> int:
    """
    Calculate soil health score (0-100) from key soil metrics.
    Uses a weighted scoring based on optimal ranges for each property.
    """
    score = 0
    weights = 0
    
    # pH score (optimal range: 6.0-7.5)
    ph = row.get("ph")
    if ph is not None and ph > 0:
        ph = float(ph)
        if 6.0 <= ph <= 7.5:
            ph_score = 100
        elif 5.5 <= ph < 6.0 or 7.5 < ph <= 8.0:
            ph_score = 80
        elif 5.0 <= ph < 5.5 or 8.0 < ph <= 8.5:
            ph_score = 60
        else:
            ph_score = 40
        score += ph_score * 25
        weights += 25
    
    # Organic carbon score (optimal: > 2%)
    oc = row.get("organic_carbon")
    if oc is not None and oc >= 0:
        oc = float(oc)
        if oc >= 2.0:
            oc_score = 100
        elif oc >= 1.5:
            oc_score = 85
        elif oc >= 1.0:
            oc_score = 70
        elif oc >= 0.5:
            oc_score = 55
        else:
            oc_score = 40
        score += oc_score * 25
        weights += 25
    
    # Nitrogen score (optimal: > 0.2%)
    n = row.get("nitrogen")
    if n is not None and n >= 0:
        n = float(n)
        if n >= 0.2:
            n_score = 100
        elif n >= 0.15:
            n_score = 85
        elif n >= 0.1:
            n_score = 70
        elif n >= 0.05:
            n_score = 55
        else:
            n_score = 40
        score += n_score * 25
        weights += 25
    
    # CEC score (optimal: 15-40 cmol/kg)
    cec = row.get("cec")
    if cec is not None and cec > 0:
        cec = float(cec)
        if 15 <= cec <= 40:
            cec_score = 100
        elif 10 <= cec < 15 or 40 < cec <= 50:
            cec_score = 80
        elif 5 <= cec < 10:
            cec_score = 60
        else:
            cec_score = 45
        score += cec_score * 25
        weights += 25
    
    # Return weighted average, default to 70 if no data
    if weights == 0:
        return 70
    return round(score / weights)


def _estimate_farm_size(row_id: int) -> str:
    """
    Estimate farm size. In production, this would come from actual boundary data.
    For now, uses a deterministic formula based on row_id for consistent display.
    """
    # Use row_id to generate a pseudo-random but consistent size
    base_size = ((row_id * 17) % 50) + 10  # 10-60 hectares
    return f"{base_size} ha"


def get_farm_by_id(row_id: int) -> Optional[Dict[str, Any]]:
    """
    Get a single farm's full data including soil metrics and recommendations.
    """
    query = f"""
        SELECT *
        FROM `{FULL_TABLE}`
        WHERE row_id = {row_id}
    """
    
    df = client.query(query).to_dataframe()
    
    if df.empty:
        return None
    
    # Convert row to dict
    bigquery_row = df.iloc[0].to_dict()
    
    # Get recommendations
    fertilizer_result = get_fertilizer_recommendations(bigquery_row, target_crop="maize")
    crops_result = get_crop_recommendations(bigquery_row)
    
    # Calculate health score from actual soil metrics
    soil_metrics = {
        "ph": bigquery_row.get("pred_ph_h2o_usda_a268_index"),
        "organic_carbon": bigquery_row.get("pred_oc_usda_c729_w_pct"),
        "nitrogen": bigquery_row.get("pred_n_tot_usda_a623_w_pct"),
        "cec": bigquery_row.get("pred_cec_usda_a723_cmolc_kg"),
    }
    health_score = _calculate_health_score(soil_metrics)
    
    # Determine health status
    if health_score >= 75:
        health = "good"
    elif health_score >= 50:
        health = "warning"
    else:
        health = "critical"
    
    # Get coordinates
    lat = bigquery_row.get("latitude_point_wgs84_dd")
    lon = bigquery_row.get("longitude_point_wgs84_dd")
    
    return {
        "id": str(row_id),
        "name": f"Farm {row_id}",
        "location": f"({lat:.4f}, {lon:.4f})" if lat and lon else "Unknown",
        "coordinates": [float(lat) if lat else 0, float(lon) if lon else 0],
        "size": _estimate_farm_size(row_id),
        "soilType": _get_texture_class(bigquery_row),
        "health": health,
        "healthScore": health_score,
        "farm_fertilizer_analysis": fertilizer_result,
        "farm_crop_analysis": crops_result,
        "raw_predictions": _extract_key_predictions(bigquery_row),
    }


def _get_texture_class(row: Dict[str, Any]) -> str:
    """Determine soil texture class from clay/sand/silt percentages."""
    clay = row.get("pred_clay_tot_usda_a334_w_pct", 0) or 0
    sand = row.get("pred_sand_tot_usda_c60_w_pct", 0) or 0
    return _get_texture_class_from_values(clay, sand)


def _extract_key_predictions(row: Dict[str, Any]) -> Dict[str, Any]:
    """Extract key prediction values for display."""
    key_columns = {
        "ph": "pred_ph_h2o_usda_a268_index",
        "organic_carbon": "pred_oc_usda_c729_w_pct",
        "nitrogen": "pred_n_tot_usda_a623_w_pct",
        "phosphorus": "pred_p_ext_usda_a1070_mg_kg",
        "potassium": "pred_k_ext_usda_a1065_mg_kg",
        "calcium": "pred_ca_ext_usda_a1059_mg_kg",
        "magnesium": "pred_mg_ext_usda_a1066_mg_kg",
        "cec": "pred_cec_usda_a723_cmolc_kg",
        "ec": "pred_ec_usda_a364_ds_m",
        "clay": "pred_clay_tot_usda_a334_w_pct",
        "sand": "pred_sand_tot_usda_c60_w_pct",
        "silt": "pred_silt_tot_usda_c62_w_pct",
    }
    
    result = {}
    for key, col in key_columns.items():
        val = row.get(col)
        if val is not None:
            result[key] = round(float(val), 3)
    
    return result
