"""
BigQuery service for farm data.
Fetches farm data from OSSL_with_predictions table.
"""

from google.cloud import bigquery
from typing import List, Dict, Any, Optional
from fertilizer import get_fertilizer_recommendations
from crops import get_crop_recommendations
from tools.construction import get_construction_recommendations

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
    Returns rows with row_id, coordinates, and placeholder names.
    """
    query = f"""
        SELECT 
            row_id,
            longitude_point_wgs84_dd as longitude,
            latitude_point_wgs84_dd as latitude
        FROM `{FULL_TABLE}`
        WHERE longitude_point_wgs84_dd IS NOT NULL 
          AND latitude_point_wgs84_dd IS NOT NULL
        ORDER BY row_id
        LIMIT {limit}
    """
    
    df = client.query(query).to_dataframe()
    
    farms = []
    for idx, row in df.iterrows():
        farms.append({
            "id": str(int(row["row_id"])),
            "name": f"Farm {int(row['row_id'])}",
            "location": f"({row['latitude']:.4f}, {row['longitude']:.4f})",
            "coordinates": [float(row["latitude"]), float(row["longitude"])],
            "size": "N/A",
            "soilType": "Unknown",
            "health": "good",  # Will be determined by actual metrics
            "healthScore": 75,  # Placeholder
        })
    
    return farms


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
    construction_result = get_construction_recommendations

    
    # Determine health status from fertilizer analysis
    farm_health = fertilizer_result.get("farm_soil_health", {})
    overall_status = farm_health.get("overall_status", "good")
    
    health_map = {
        "optimal": ("good", 90),
        "good": ("good", 85),
        "moderate": ("warning", 70),
        "critical": ("critical", 50),
    }
    health, health_score = health_map.get(overall_status, ("warning", 70))
    
    # Get coordinates
    lat = bigquery_row.get("latitude_point_wgs84_dd")
    lon = bigquery_row.get("longitude_point_wgs84_dd")
    
    return {
        "id": str(row_id),
        "name": f"Farm {row_id}",
        "location": f"({lat:.4f}, {lon:.4f})" if lat and lon else "Unknown",
        "coordinates": [float(lat) if lat else 0, float(lon) if lon else 0],
        "size": "N/A",
        "soilType": _get_texture_class(bigquery_row),
        "health": health,
        "healthScore": health_score,
        "farm_fertilizer_analysis": fertilizer_result,
        "farm_crop_analysis": crops_result,
        "construction_predictions": construction_result,
        "raw_predictions": _extract_key_predictions(bigquery_row),
    }


def _get_texture_class(row: Dict[str, Any]) -> str:
    """Determine soil texture class from clay/sand/silt percentages."""
    clay = row.get("pred_clay.tot_usda.a334_w.pct", 0) or 0
    sand = row.get("pred_sand.tot_usda.c60_w.pct", 0) or 0
    
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


def _extract_key_predictions(row: Dict[str, Any]) -> Dict[str, Any]:
    """Extract key prediction values for display."""
    key_columns = {
        "ph": "pred_ph.h2o_usda.a268_index",
        "organic_carbon": "pred_oc_usda.c729_w.pct",
        "nitrogen": "pred_n.tot_usda.a623_w.pct",
        "phosphorus": "pred_p.ext_usda.a1070_mg.kg",
        "potassium": "pred_k.ext_usda.a1065_mg.kg",
        "calcium": "pred_ca.ext_usda.a1059_mg.kg",
        "magnesium": "pred_mg.ext_usda.a1066_mg.kg",
        "cec": "pred_cec_usda.a723_cmolc.kg",
        "ec": "pred_ec_usda.a364_ds.m",
        "clay": "pred_clay.tot_usda.a334_w.pct",
        "sand": "pred_sand.tot_usda.c60_w.pct",
        "silt": "pred_silt.tot_usda.c62_w.pct",
    }
    
    result = {}
    for key, col in key_columns.items():
        val = row.get(col)
        if val is not None:
            result[key] = round(float(val), 3)
    
    return result
