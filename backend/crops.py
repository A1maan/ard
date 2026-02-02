"""
Crop Recommendation Tool - MVP Version
Reads ML predictions from CSV and provides crop recommendations.

All thresholds cited with scientific sources.
"""

import csv
from typing import Dict, List, Any, Optional


# =============================================================================
# COLUMN MAPPING: CSV prediction columns -> tool keys
# =============================================================================

PREDICTION_COLUMNS = {
    # Key used in tool: CSV column name
    "oc": "pred_oc_usda.c729_w.pct",           # Organic carbon (%)
    "c_tot": "pred_c.tot_usda.a622_w.pct",     # Total carbon (%)
    "n_tot": "pred_n.tot_usda.a623_w.pct",     # Total nitrogen (%)
    "ph": "pred_ph.h2o_usda.a268_index",       # pH in water
    "ph_cacl2": "pred_ph.cacl2_usda.a481_index", # pH in CaCl2
    "cec": "pred_cec_usda.a723_cmolc.kg",      # CEC (cmolc/kg)
    "ec": "pred_ec_usda.a364_ds.m",            # EC (dS/m)
    "clay": "pred_clay.tot_usda.a334_w.pct",   # Clay (%)
    "sand": "pred_sand.tot_usda.c60_w.pct",    # Sand (%)
    "silt": "pred_silt.tot_usda.c62_w.pct",    # Silt (%)
    "bd": "pred_bd_usda.a4_g.cm3",             # Bulk density (g/cm³)
    "wr_10": "pred_wr.10kPa_usda.a414_w.pct",  # Water retention 10kPa (%)
    "wr_33": "pred_wr.33kPa_usda.a415_w.pct",  # Water retention 33kPa (%)
    "wr_1500": "pred_wr.1500kPa_usda.a417_w.pct", # Water retention 1500kPa (%)
    "awc": "pred_awc.33.1500kPa_usda.c80_w.frac", # Available water capacity
    "fe_ox": "pred_fe.ox_usda.a60_w.pct",      # Oxalate Fe (%)
    "al_ox": "pred_al.ox_usda.a59_w.pct",      # Oxalate Al (%)
    "fe_dith": "pred_fe.dith_usda.a66_w.pct",  # Dithionite Fe (%)
    "al_dith": "pred_al.dith_usda.a65_w.pct",  # Dithionite Al (%)
    "p": "pred_p.ext_usda.a1070_mg.kg",        # Extractable P (mg/kg)
    "k": "pred_k.ext_usda.a1065_mg.kg",        # Extractable K (mg/kg)
    "mg": "pred_mg.ext_usda.a1066_mg.kg",      # Extractable Mg (mg/kg)
    "ca": "pred_ca.ext_usda.a1059_mg.kg",      # Extractable Ca (mg/kg)
    "na": "pred_na.ext_usda.a1068_mg.kg",      # Extractable Na (mg/kg)
}

# Also grab location info
LOCATION_COLUMNS = {
    "lon": "longitude.point_wgs84_dd",
    "lat": "latitude.point_wgs84_dd",
    "country": "location.country_iso.3166_txt",
    "depth_upper": "layer.upper.depth_usda_cm",
    "depth_lower": "layer.lower.depth_usda_cm",
}


# =============================================================================
# CROP DATABASE - Clean and Cited
# =============================================================================

CROPS = {
    # CEREALS
    "wheat": {
        "name": "Wheat",
        "category": "cereal",
        "ph": {"min": 6.0, "max": 7.5},  # FAO Crop Guidelines
        "ec_max": 6.0,  # Maas & Hoffman (1977) - moderately tolerant
        "texture": {"preferred": ["loam", "clay_loam", "silt_loam"], "avoid": ["sand"]},
        "drainage": "good",
        "notes": "Moderately salt tolerant; sensitive to waterlogging"
    },
    "rice": {
        "name": "Rice (Paddy)",
        "category": "cereal",
        "ph": {"min": 5.0, "max": 7.0},  # Dobermann & Fairhurst (2000)
        "ec_max": 3.0,  # Maas & Hoffman (1977) - sensitive
        "texture": {"preferred": ["clay", "silty_clay", "clay_loam"], "avoid": ["sand", "loamy_sand"]},
        "drainage": "poor",
        "notes": "Requires flooded conditions; needs clay to hold water"
    },
    "maize": {
        "name": "Maize/Corn",
        "category": "cereal",
        "ph": {"min": 5.5, "max": 7.5},  # Iowa State Extension
        "ec_max": 1.7,  # Maas & Hoffman (1977) - moderately sensitive
        "texture": {"preferred": ["loam", "silt_loam", "sandy_loam"], "avoid": ["clay", "sand"]},
        "drainage": "good",
        "notes": "Heavy feeder (N, P, K); sensitive to waterlogging"
    },
    "barley": {
        "name": "Barley",
        "category": "cereal",
        "ph": {"min": 6.0, "max": 8.5},  # FAO Guidelines
        "ec_max": 8.0,  # Maas & Hoffman (1977) - MOST TOLERANT CEREAL
        "texture": {"preferred": ["loam", "clay_loam", "sandy_loam"], "avoid": ["sand"]},
        "drainage": "good",
        "notes": "Most salt-tolerant cereal; good for marginal lands"
    },
    "sorghum": {
        "name": "Sorghum",
        "category": "cereal",
        "ph": {"min": 5.5, "max": 8.5},  # ICRISAT
        "ec_max": 6.8,  # Maas & Hoffman (1977)
        "texture": {"preferred": ["loam", "clay_loam", "sandy_loam"], "avoid": []},
        "drainage": "moderate",
        "notes": "Drought tolerant; wide soil adaptability"
    },
    
    # LEGUMES
    "soybean": {
        "name": "Soybean",
        "category": "legume",
        "ph": {"min": 6.0, "max": 7.0},  # Pedersen (2007)
        "ec_max": 5.0,  # Maas & Hoffman (1977)
        "texture": {"preferred": ["loam", "silt_loam", "clay_loam"], "avoid": ["sand", "clay"]},
        "drainage": "good",
        "notes": "Fixes nitrogen; needs good P for nodulation"
    },
    "groundnut": {
        "name": "Groundnut/Peanut",
        "category": "legume",
        "ph": {"min": 5.5, "max": 7.0},  # ICRISAT
        "ec_max": 3.2,  # Maas & Hoffman (1977) - sensitive
        "texture": {"preferred": ["sandy", "sandy_loam", "loamy_sand"], "avoid": ["clay", "clay_loam"]},
        "drainage": "excellent",
        "notes": "MUST have sandy soil for harvest; needs Ca (apply gypsum)"
    },
    "chickpea": {
        "name": "Chickpea",
        "category": "legume",
        "ph": {"min": 6.0, "max": 9.0},  # Yadav et al. (2007)
        "ec_max": 2.5,  # Sensitive
        "texture": {"preferred": ["loam", "sandy_loam"], "avoid": ["clay"]},
        "drainage": "excellent",
        "notes": "Very sensitive to waterlogging; drought tolerant"
    },
    "lentil": {
        "name": "Lentil",
        "category": "legume",
        "ph": {"min": 6.0, "max": 8.0},  # FAO
        "ec_max": 1.7,  # Maas & Hoffman (1977) - sensitive
        "texture": {"preferred": ["loam", "silt_loam", "sandy_loam"], "avoid": ["clay"]},
        "drainage": "excellent",
        "notes": "Poor salt tolerance; needs well-drained soil"
    },
    
    # VEGETABLES
    "potato": {
        "name": "Potato",
        "category": "vegetable",
        "ph": {"min": 4.8, "max": 6.5},  # PREFERS ACIDIC - Lang et al. (1999)
        "ec_max": 1.7,  # Maas & Hoffman (1977)
        "texture": {"preferred": ["sandy_loam", "loam", "silt_loam"], "avoid": ["clay"]},
        "drainage": "excellent",
        "notes": "Prefers acidic soil; scab disease worse above pH 5.5"
    },
    "tomato": {
        "name": "Tomato",
        "category": "vegetable",
        "ph": {"min": 6.0, "max": 7.0},  # UC Davis
        "ec_max": 2.5,  # Maas & Hoffman (1977)
        "texture": {"preferred": ["loam", "sandy_loam", "clay_loam"], "avoid": ["sand", "clay"]},
        "drainage": "good",
        "notes": "Needs Ca to prevent blossom end rot; consistent moisture"
    },
    "onion": {
        "name": "Onion",
        "category": "vegetable",
        "ph": {"min": 6.0, "max": 7.0},  # Brewster (2008)
        "ec_max": 1.2,  # Maas & Hoffman (1977) - sensitive
        "texture": {"preferred": ["silt_loam", "loam", "sandy_loam"], "avoid": ["clay", "sand"]},
        "drainage": "good",
        "notes": "Shallow roots; needs frequent irrigation"
    },
    "carrot": {
        "name": "Carrot",
        "category": "vegetable",
        "ph": {"min": 6.0, "max": 6.8},  # Rubatzky (1999)
        "ec_max": 1.0,  # Maas & Hoffman (1977) - sensitive
        "texture": {"preferred": ["sandy", "sandy_loam", "loamy_sand"], "avoid": ["clay", "clay_loam"]},
        "drainage": "excellent",
        "notes": "Needs loose, deep soil; heavy soil causes forking"
    },
    "cabbage": {
        "name": "Cabbage",
        "category": "vegetable",
        "ph": {"min": 6.0, "max": 7.5},  # USDA
        "ec_max": 1.8,  # Maas & Hoffman (1977)
        "texture": {"preferred": ["loam", "clay_loam", "silt_loam"], "avoid": ["sand"]},
        "drainage": "good",
        "notes": "Clubroot disease risk below pH 7.0; needs boron"
    },
    
    # CASH CROPS
    "cotton": {
        "name": "Cotton",
        "category": "fiber",
        "ph": {"min": 5.5, "max": 8.5},  # Wide tolerance
        "ec_max": 7.7,  # Maas & Hoffman (1977) - TOLERANT
        "texture": {"preferred": ["loam", "clay_loam", "sandy_loam"], "avoid": ["sand"]},
        "drainage": "good",
        "notes": "Salt tolerant; K critical for fiber quality"
    },
    "sugarcane": {
        "name": "Sugarcane",
        "category": "sugar",
        "ph": {"min": 5.0, "max": 8.5},  # FAO
        "ec_max": 1.7,  # Maas & Hoffman (1977)
        "texture": {"preferred": ["loam", "clay_loam", "silt_loam"], "avoid": ["sand"]},
        "drainage": "moderate",
        "notes": "Very high nutrient demand; 12-18 month cycle"
    },
    "sunflower": {
        "name": "Sunflower",
        "category": "oilseed",
        "ph": {"min": 6.0, "max": 7.5},  # NDSU
        "ec_max": 4.8,  # Francois (1996)
        "texture": {"preferred": ["loam", "clay_loam", "silt_loam"], "avoid": ["sand"]},
        "drainage": "good",
        "notes": "Drought tolerant (deep taproot); sensitive to boron deficiency"
    },
    
    # FRUITS
    "banana": {
        "name": "Banana",
        "category": "fruit",
        "ph": {"min": 5.5, "max": 7.0},  # Robinson & Sauco (2010)
        "ec_max": 1.0,  # VERY SENSITIVE
        "texture": {"preferred": ["loam", "clay_loam", "silt_loam"], "avoid": ["sand", "clay"]},
        "drainage": "excellent",
        "notes": "Extremely high K demand; very salt sensitive"
    },
    "citrus": {
        "name": "Citrus",
        "category": "fruit",
        "ph": {"min": 6.0, "max": 7.5},  # UF/IFAS
        "ec_max": 1.7,  # Maas (1993)
        "texture": {"preferred": ["sandy_loam", "loam", "sandy"], "avoid": ["clay"]},
        "drainage": "excellent",
        "notes": "Excellent drainage critical (Phytophthora risk)"
    },
    "grape": {
        "name": "Grape",
        "category": "fruit",
        "ph": {"min": 5.5, "max": 8.0},  # Keller (2015)
        "ec_max": 1.5,  # Maas & Hoffman (1977)
        "texture": {"preferred": ["sandy_loam", "loam"], "avoid": ["clay"]},
        "drainage": "excellent",
        "notes": "Excess fertility reduces wine quality; needs excellent drainage"
    }
}


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_texture_class(sand: float, clay: float) -> str:
    """
    Simplified USDA texture classification.
    Citation: USDA Soil Survey Manual (2017)
    """
    silt = 100 - sand - clay
    
    if sand >= 85:
        return "sandy"
    elif sand >= 70 and clay < 15:
        return "loamy_sand"
    elif clay >= 40:
        return "clay"
    elif clay >= 35:
        return "clay_loam"
    elif clay >= 27:
        return "clay_loam" if sand < 45 else "sandy_clay_loam"
    elif sand >= 52:
        return "sandy_loam"
    elif silt >= 50 and clay < 27:
        return "silt_loam"
    else:
        return "loam"


def classify_drainage(clay: float, bd: float) -> str:
    """
    Estimate drainage from clay and bulk density.
    Citation: USDA-NRCS Soil Quality Indicators
    """
    if clay > 40 or bd > 1.6:
        return "poor"
    elif clay > 30 or bd > 1.5:
        return "moderate"
    elif clay < 15 and bd < 1.4:
        return "excellent"
    else:
        return "good"


def classify_nutrient(value: float, thresholds: Dict[str, float]) -> str:
    """Classify nutrient status based on thresholds."""
    if value < thresholds["low"]:
        return "low"
    elif value < thresholds["medium"]:
        return "medium"
    else:
        return "high"


def read_soil_from_csv(filepath: str, row_index: int = 0) -> Dict[str, Any]:
    """
    Read a specific row from the CSV and extract prediction columns.
    
    Args:
        filepath: Path to CSV file
        row_index: Which data row to read (0 = first data row after header)
    
    Returns:
        Dictionary with soil properties
    """
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
        if row_index >= len(rows):
            raise ValueError(f"Row index {row_index} out of range. CSV has {len(rows)} data rows.")
        
        row = rows[row_index]
        
        # Extract predictions
        soil_data = {}
        for key, col_name in PREDICTION_COLUMNS.items():
            col_name = col_name.replace('.', '_')  # Adjust for CSV header format
            if col_name in row and row[col_name]:
                try:
                    soil_data[key] = float(row[col_name])
                except ValueError:
                    soil_data[key] = None
            else:
                soil_data[key] = None
        
        # Extract location
        location = {}
        for key, col_name in LOCATION_COLUMNS.items():
            col_name = col_name.replace('.', '_')  # Adjust for CSV header format
            if col_name in row and row[col_name]:
                try:
                    location[key] = float(row[col_name])
                except ValueError:
                    location[key] = row[col_name]
            else:
                location[key] = None
        
        soil_data["location"] = location
        soil_data["row_id"] = row.get("row_id", row_index + 1)
        
        return soil_data


def read_all_rows_from_csv(filepath: str) -> List[Dict[str, Any]]:
    """Read all rows from CSV and return list of soil data dictionaries."""
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        results = []
        
        for i, row in enumerate(reader):
            soil_data = {}
            for key, col_name in PREDICTION_COLUMNS.items():
                if col_name in row and row[col_name]:
                    try:
                        soil_data[key] = float(row[col_name])
                    except ValueError:
                        soil_data[key] = None
                else:
                    soil_data[key] = None
            
            location = {}
            for key, col_name in LOCATION_COLUMNS.items():
                if col_name in row and row[col_name]:
                    try:
                        location[key] = float(row[col_name])
                    except ValueError:
                        location[key] = row[col_name]
                else:
                    location[key] = None
            
            soil_data["location"] = location
            soil_data["row_id"] = row.get("row_id", i + 1)
            results.append(soil_data)
        
        return results


# =============================================================================
# MAIN CROP RECOMMENDATION FUNCTION
# =============================================================================

def get_crop_recommendations(soil_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get crop recommendations based on soil properties.
    
    Args:
        soil_data: Dict with soil properties (from read_soil_from_csv or direct):
            - ph: Soil pH
            - ec: Electrical conductivity (dS/m)
            - clay: Clay (%)
            - sand: Sand (%)
            - oc: Organic carbon (%)
            - n_tot: Total nitrogen (%)
            - p: Extractable P (mg/kg)
            - k: Extractable K (mg/kg)
            - cec: CEC (cmolc/kg)
            - bd: Bulk density (g/cm³)
            - ca, mg, na: Extractable cations (mg/kg)
    
    Returns:
        Dict with recommendations and soil assessment
    """
    
    # Extract values with defaults
    ph = soil_data.get("ph") or 7.0
    ec = soil_data.get("ec") or 0.5
    clay = soil_data.get("clay") or 20
    sand = soil_data.get("sand") or 40
    silt = soil_data.get("silt") or (100 - clay - sand)
    oc = soil_data.get("oc") or 1.5
    cec = soil_data.get("cec") or 15
    bd = soil_data.get("bd") or 1.35
    n_tot = soil_data.get("n_tot") or 0.15
    p = soil_data.get("p") or 25
    k = soil_data.get("k") or 150
    ca = soil_data.get("ca") or 1000
    mg = soil_data.get("mg") or 150
    na = soil_data.get("na") or 50
    
    # Classify soil
    texture = get_texture_class(sand, clay)
    drainage = classify_drainage(clay, bd)
    
    # Nutrient status (Citation: Landon 1991 - Booker Tropical Soil Manual)
    n_status = classify_nutrient(n_tot, {"low": 0.1, "medium": 0.2})
    p_status = classify_nutrient(p, {"low": 15, "medium": 30})
    k_status = classify_nutrient(k, {"low": 100, "medium": 175})
    oc_status = classify_nutrient(oc, {"low": 1.0, "medium": 2.0})
    
    # Ca:Mg ratio check (Citation: Schulte & Kelling 1999)
    ca_mg_ratio = (ca / 200) / (mg / 121) if mg > 0 else 0  # Convert to cmolc
    
    # Evaluate each crop
    results = []
    
    for crop_id, crop in CROPS.items():
        score = 100
        issues = []
        positives = []
        
        # pH check
        if crop["ph"]["min"] <= ph <= crop["ph"]["max"]:
            positives.append(f"pH {ph:.1f} suitable")
        elif ph < crop["ph"]["min"]:
            penalty = min(30, (crop["ph"]["min"] - ph) * 15)
            score -= penalty
            issues.append(f"pH {ph:.1f} too low (need >{crop['ph']['min']})")
        else:
            penalty = min(30, (ph - crop["ph"]["max"]) * 15)
            score -= penalty
            issues.append(f"pH {ph:.1f} too high (need <{crop['ph']['max']})")
        
        # Salinity check (Citation: Maas & Hoffman 1977)
        if ec <= crop["ec_max"]:
            if ec < 2:
                positives.append("No salinity stress")
        else:
            penalty = min(40, (ec - crop["ec_max"]) * 10)
            score -= penalty
            issues.append(f"EC {ec:.1f} exceeds tolerance ({crop['ec_max']} dS/m)")
        
        # Texture check
        if texture in crop["texture"]["preferred"]:
            positives.append(f"{texture} texture ideal")
        elif texture in crop["texture"]["avoid"]:
            score -= 20
            issues.append(f"{texture} texture not suitable")
        else:
            score -= 5
        
        # Drainage check
        crop_drainage = crop["drainage"]
        if crop_drainage == "excellent" and drainage in ["poor", "moderate"]:
            score -= 20
            issues.append(f"Needs better drainage (current: {drainage})")
        elif crop_drainage == "good" and drainage == "poor":
            score -= 15
            issues.append("Drainage too poor")
        elif crop_drainage == "poor" and drainage == "excellent":
            score -= 15
            issues.append("Needs water-holding soil")
        
        # Clamp score
        score = max(0, min(100, score))
        
        # Determine rating
        if score >= 75:
            rating = "Highly Suitable"
        elif score >= 55:
            rating = "Suitable"
        elif score >= 35:
            rating = "Marginal"
        else:
            rating = "Not Recommended"
        
        results.append({
            "crop": crop["name"],
            "category": crop["category"],
            "score": score,
            "rating": rating,
            "positives": positives,
            "issues": issues,
            "notes": crop["notes"]
        })
    
    # Sort by score
    results.sort(key=lambda x: x["score"], reverse=True)
    
    # Identify key constraints
    constraints = []
    if ec >= 4:
        constraints.append({
            "issue": "High salinity",
            "detail": f"EC {ec:.1f} dS/m limits options",
            "recommendation": "Consider: barley, cotton, sorghum"
        })
    if ph < 5.5:
        constraints.append({
            "issue": "Acidic soil",
            "detail": f"pH {ph:.1f} - Al toxicity risk",
            "recommendation": "Apply lime; or grow: rice, potato"
        })
    if ph > 8.0:
        constraints.append({
            "issue": "Alkaline soil",
            "detail": f"pH {ph:.1f} - micronutrient deficiency risk",
            "recommendation": "Apply sulfur; or grow: barley, chickpea"
        })
    if clay > 40:
        constraints.append({
            "issue": "Heavy clay",
            "detail": f"{clay:.0f}% clay - drainage/workability issues",
            "recommendation": "Consider: rice, wheat, sugarcane"
        })
    if sand > 80:
        constraints.append({
            "issue": "Sandy soil",
            "detail": f"{sand:.0f}% sand - low water/nutrient retention",
            "recommendation": "Consider: groundnut, carrot, citrus"
        })
    if oc < 1.0:
        constraints.append({
            "issue": "Low organic matter",
            "detail": f"OC {oc:.1f}% - poor soil health",
            "recommendation": "Add compost, cover crops, reduce tillage"
        })
    
    return {
        "row_id": soil_data.get("row_id"),
        "location": soil_data.get("location"),
        
        "soil_summary": {
            "ph": round(ph, 2),
            "ec_dsm": round(ec, 2),
            "texture": {
                "class": texture,
                "clay_pct": round(clay, 1),
                "sand_pct": round(sand, 1),
                "silt_pct": round(silt, 1)
            },
            "drainage": drainage,
            "organic_carbon_pct": round(oc, 2),
            "cec_cmolc_kg": round(cec, 1),
            "bulk_density_gcm3": round(bd, 2),
            "nutrients": {
                "nitrogen": {"value": round(n_tot, 3), "status": n_status},
                "phosphorus": {"value": round(p, 1), "status": p_status},
                "potassium": {"value": round(k, 1), "status": k_status},
                "calcium": round(ca, 0),
                "magnesium": round(mg, 0),
                "sodium": round(na, 0)
            },
            "organic_carbon_status": oc_status
        },
        
        "constraints": constraints,
        "top_5_crops": results[:5],
        "all_suitable": [r for r in results if r["rating"] in ["Highly Suitable", "Suitable"]],
        "not_recommended": [r["crop"] for r in results if r["rating"] == "Not Recommended"],
        
        "citations": {
            "salinity_tolerance": "Maas & Hoffman (1977) J. Irrig. Drain. Div. ASCE 103:115-134",
            "texture_classification": "USDA Soil Survey Manual (2017) Handbook 18",
            "nutrient_thresholds": "Landon (1991) Booker Tropical Soil Manual"
        }
    }


# =============================================================================
# EXAMPLE USAGE
# =============================================================================

