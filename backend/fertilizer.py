from typing import Dict, Optional, Any


# =============================================================================
# COLUMN MAPPING: BigQuery prediction columns -> tool keys
# =============================================================================

PREDICTION_COLUMNS = {
    # Macronutrients
    "n_tot": "pred_n.tot_usda.a623_w.pct",        # Total nitrogen (%)
    "p": "pred_p.ext_usda.a1070_mg.kg",           # Extractable P (mg/kg)
    "k": "pred_k.ext_usda.a1065_mg.kg",           # Extractable K (mg/kg)
    
    # Secondary nutrients
    "ca": "pred_ca.ext_usda.a1059_mg.kg",         # Extractable Ca (mg/kg)
    "mg": "pred_mg.ext_usda.a1066_mg.kg",         # Extractable Mg (mg/kg)
    "na": "pred_na.ext_usda.a1068_mg.kg",         # Extractable Na (mg/kg)
    
    # Soil properties
    "ph": "pred_ph.h2o_usda.a268_index",          # pH in water
    "ec": "pred_ec_usda.a364_ds.m",               # EC (dS/m) - salinity
    "oc": "pred_oc_usda.c729_w.pct",              # Organic carbon (%)
    "cec": "pred_cec_usda.a723_cmolc.kg",         # CEC (cmolc/kg)
    
    # Texture
    "clay": "pred_clay.tot_usda.a334_w.pct",      # Clay (%)
    "sand": "pred_sand.tot_usda.c60_w.pct",       # Sand (%)
    "silt": "pred_silt.tot_usda.c62_w.pct",       # Silt (%)
    
    # Physical
    "bd": "pred_bd_usda.a4_g.cm3",                # Bulk density (g/cm³)
    
    # Iron & Aluminum (for P fixation assessment)
    "fe_ox": "pred_fe.ox_usda.a60_w.pct",         # Oxalate Fe (%)
    "al_ox": "pred_al.ox_usda.a59_w.pct",         # Oxalate Al (%)
}


# =============================================================================
# THRESHOLDS WITH CITATIONS
# =============================================================================

THRESHOLDS = {
    # Nitrogen (Total N %)
    # Citation: Landon (1991) Booker Tropical Soil Manual; Havlin et al. (2014)
    "n_tot": {
        "very_low": 0.05,
        "low": 0.10,
        "adequate": 0.20,
        "high": 0.40,
        "citation": "Landon (1991) Booker Tropical Soil Manual"
    },
    
    # Phosphorus (Extractable P mg/kg) - Mehlich-3 interpretation
    # Citation: Penn State Extension; Mallarino (1997)
    "p": {
        "very_low": 10,
        "low": 20,
        "adequate": 35,
        "high": 50,
        "excessive": 100,
        "citation": "Penn State Extension Soil Test Interpretation"
    },
    
    # Potassium (Extractable K mg/kg)
    # Citation: Tri-State Fertilizer Recommendations (OH, MI, IN)
    "k": {
        "very_low": 50,
        "low": 100,
        "adequate": 150,
        "high": 200,
        "citation": "Tri-State Fertilizer Recommendations Bulletin E-2567"
    },
    
    # Calcium (Extractable Ca mg/kg)
    # Citation: OSU Extension EC 1478
    "ca": {
        "very_low": 400,
        "low": 800,
        "adequate": 1500,
        "high": 3000,
        "citation": "OSU Extension EC 1478"
    },
    
    # Magnesium (Extractable Mg mg/kg)
    # Citation: UW Extension A2986
    "mg": {
        "very_low": 30,
        "low": 60,
        "adequate": 120,
        "high": 250,
        "citation": "UW Extension A2986"
    },
    
    # pH
    # Citation: USDA Soil Survey Manual (2017)
    "ph": {
        "very_acidic": 5.0,
        "acidic": 5.5,
        "slightly_acidic": 6.0,
        "optimal_low": 6.0,
        "optimal_high": 7.0,
        "alkaline": 8.0,
        "very_alkaline": 8.5,
        "citation": "USDA Soil Survey Manual (2017)"
    },
    
    # Organic Carbon (%)
    # Citation: Landon (1991); Loveland & Webb (2003)
    "oc": {
        "very_low": 0.6,
        "low": 1.0,
        "adequate": 2.0,
        "high": 4.0,
        "citation": "Landon (1991); Loveland & Webb (2003) Soil Till. Res."
    },
    
    # EC - Salinity (dS/m)
    # Citation: Richards (1954) USDA Handbook 60
    "ec": {
        "non_saline": 2.0,
        "slightly_saline": 4.0,
        "moderately_saline": 8.0,
        "strongly_saline": 16.0,
        "citation": "Richards (1954) USDA Handbook 60"
    },
    
    # CEC (cmolc/kg)
    # Citation: Hazelton & Murphy (2016)
    "cec": {
        "very_low": 6,
        "low": 12,
        "medium": 25,
        "high": 40,
        "citation": "Hazelton & Murphy (2016) Interpreting Soil Test Results"
    }
}


# =============================================================================
# FERTILIZER & AMENDMENT DATABASE
# =============================================================================

FERTILIZERS = {
    "nitrogen": {
        "organic": [
            {"name": "Composted manure", "analysis": "~1-3% N", "rate": "5-10 tons/ha", 
             "note": "Slow release; also adds organic matter"},
            {"name": "Blood meal", "analysis": "12-0-0", "rate": "100-200 kg/ha",
             "note": "Fast release organic N"},
            {"name": "Feather meal", "analysis": "13-0-0", "rate": "150-300 kg/ha",
             "note": "Slow release"}
        ],
        "synthetic": [
            {"name": "Urea", "analysis": "46-0-0", "rate": "50-150 kg/ha",
             "note": "Incorporate to reduce volatilization"},
            {"name": "Ammonium nitrate", "analysis": "34-0-0", "rate": "75-200 kg/ha",
             "note": "Immediately available"},
            {"name": "Ammonium sulfate", "analysis": "21-0-0-24S", "rate": "100-250 kg/ha",
             "note": "Also supplies sulfur; acidifying"}
        ]
    },
    
    "phosphorus": {
        "organic": [
            {"name": "Bone meal", "analysis": "3-15-0", "rate": "200-500 kg/ha",
             "note": "Slow release"},
            {"name": "Rock phosphate", "analysis": "0-3-0 available", "rate": "500-1000 kg/ha",
             "note": "Best in acidic soils (pH <5.5)"}
        ],
        "synthetic": [
            {"name": "Triple superphosphate (TSP)", "analysis": "0-46-0", "rate": "50-150 kg/ha",
             "note": "Water soluble; band near roots"},
            {"name": "DAP", "analysis": "18-46-0", "rate": "100-200 kg/ha",
             "note": "Also supplies N"},
            {"name": "MAP", "analysis": "11-52-0", "rate": "75-150 kg/ha",
             "note": "Good for high-pH soils"}
        ]
    },
    
    "potassium": {
        "organic": [
            {"name": "Wood ash", "analysis": "0-1-5 (variable)", "rate": "500-1000 kg/ha",
             "note": "Also raises pH"},
            {"name": "Kelp meal", "analysis": "1-0-2", "rate": "200-400 kg/ha",
             "note": "Also provides micronutrients"}
        ],
        "synthetic": [
            {"name": "Muriate of potash (MOP)", "analysis": "0-0-60", "rate": "50-150 kg/ha",
             "note": "Avoid for Cl-sensitive crops (tobacco, potato, grape)"},
            {"name": "Sulfate of potash (SOP)", "analysis": "0-0-50-18S", "rate": "75-175 kg/ha",
             "note": "Premium; for Cl-sensitive crops"}
        ]
    },
    
    "calcium": {
        "products": [
            {"name": "Gypsum (calcium sulfate)", "analysis": "23% Ca, 18% S", "rate": "1-2 tons/ha",
             "note": "Does NOT change pH; also adds sulfur"},
            {"name": "Calcitic lime", "analysis": "iteite ite iteCOite", "rate": "1-3 tons/ha",
             "note": "RAISES pH; use if pH is also low"}
        ]
    },
    
    "magnesium": {
        "products": [
            {"name": "Dolomitic lime", "analysis": "~12% Mg", "rate": "1-2 tons/ha",
             "note": "Also raises pH and adds Ca"},
            {"name": "Epsom salt (magnesium sulfate)", "analysis": "10% Mg", "rate": "50-100 kg/ha",
             "note": "Fast acting; foliar possible"}
        ]
    },
    
    "ph_low": {
        "products": [
            {"name": "Agricultural lime (calcium carbonate)", "rate": "1-4 tons/ha",
             "note": "Standard liming material; raises pH ~0.5-1 unit per ton"},
            {"name": "Dolomitic lime", "rate": "1-3 tons/ha",
             "note": "Use when Mg is also low"}
        ]
    },
    
    "ph_high": {
        "products": [
            {"name": "Elemental sulfur", "rate": "200-500 kg/ha",
             "note": "Slow acting (weeks to months); most effective"},
            {"name": "Ammonium sulfate fertilizer", "rate": "Use as N source",
             "note": "Acidifying effect over time"}
        ]
    },
    
    "organic_matter": {
        "products": [
            {"name": "Compost", "rate": "10-20 tons/ha", "note": "Best long-term solution"},
            {"name": "Cover crops / green manure", "rate": "Seasonal", 
             "note": "Plant legumes for N; grasses for biomass"},
            {"name": "Crop residue retention", "rate": "N/A", 
             "note": "Return straw/residues to field"}
        ]
    },
    
    "salinity": {
        "products": [
            {"name": "Gypsum", "rate": "2-5 tons/ha",
             "note": "Helps displace sodium; improve drainage"},
            {"name": "Leaching irrigation", "rate": "Apply excess water",
             "note": "Flush salts below root zone"}
        ]
    }
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def extract_soil_data(bigquery_row: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract predicted soil values from a BigQuery row.
    
    Args:
        bigquery_row: Single row from BigQuery with prediction columns
        
    Returns:
        Dictionary with simplified keys and float values
    """
    soil_data = {}
    for key, col_name in PREDICTION_COLUMNS.items():
        value = bigquery_row.get(col_name.replace('.', '_'))
        if value is not None:
            try:
                soil_data[key] = float(value)
            except (ValueError, TypeError):
                soil_data[key] = None
        else:
            soil_data[key] = None
    
    return soil_data


def classify_nutrient(value: float, thresholds: Dict) -> str:
    """Classify nutrient level based on thresholds."""
    if value is None:
        return "unknown"
    if value < thresholds.get("very_low", 0):
        return "very_low"
    elif value < thresholds.get("low", 0):
        return "low"
    elif value < thresholds.get("adequate", float('inf')):
        return "adequate"
    elif value < thresholds.get("high", float('inf')):
        return "high"
    else:
        return "excessive"


def get_p_fixation_risk(fe_ox: float, al_ox: float) -> str:
    """
    Estimate P fixation capacity from oxalate Fe and Al.
    Citation: Borggaard et al. (1990); Freese et al. (1992)
    """
    if fe_ox is None or al_ox is None:
        return "unknown"
    
    psi = fe_ox + al_ox
    if psi < 0.3:
        return "low"
    elif psi < 0.8:
        return "medium"
    elif psi < 1.5:
        return "high"
    else:
        return "very_high"


# =============================================================================
# MAIN FERTILIZER RECOMMENDATION FUNCTION
# =============================================================================

def get_fertilizer_recommendations(
    bigquery_row: Dict[str, Any],
    target_crop: Optional[str] = None,
    prefer_organic: bool = False
) -> Dict[str, Any]:
    """
    Generate fertilizer recommendations for a single farm.
    
    Designed to be called when farmer clicks on their farm in the frontend.
    Returns full context for LLM to use in chat.
    
    Args:
        bigquery_row: Single row from BigQuery containing prediction columns
        target_crop: Optional crop the farmer wants to grow
        prefer_organic: Whether to prioritize organic amendments
        
    Returns:
        Dictionary with soil analysis and recommendations for LLM context
    """
    
    # Extract soil data from BigQuery row
    soil = extract_soil_data(bigquery_row)
    #print("Extracted soil data:", soil)
    # Initialize results
    recommendations = []
    warnings = []
    soil_summary = {}
    
    # =========================================================================
    # NITROGEN ASSESSMENT
    # =========================================================================
    n = soil.get("n_tot")
    if n is not None:
        status = classify_nutrient(n, THRESHOLDS["n_tot"])
        soil_summary["nitrogen"] = {
            "value": round(n, 3),
            "unit": "%",
            "status": status
        }
        
        if status in ["very_low", "low"]:
            fert_type = "organic" if prefer_organic else "synthetic"
            recommendations.append({
                "nutrient": "Nitrogen (N)",
                "priority": 1 if status == "very_low" else 2,
                "status": status,
                "current_value": f"{n:.3f}%",
                "target": ">0.15%",
                "products": FERTILIZERS["nitrogen"][fert_type],
                "note": "Split N applications for better efficiency"
            })
        elif status == "excessive":
            warnings.append({
                "type": "excess_nitrogen",
                "message": f"Nitrogen is excessive ({n:.2f}%). Risk of leaching and water pollution.",
                "action": "Reduce or skip N fertilization"
            })
    
    # =========================================================================
    # PHOSPHORUS ASSESSMENT
    # =========================================================================
    p = soil.get("p")
    if p is not None:
        status = classify_nutrient(p, THRESHOLDS["p"])
        soil_summary["phosphorus"] = {
            "value": round(p, 1),
            "unit": "mg/kg",
            "status": status
        }
        
        # Check P fixation risk
        fe_ox = soil.get("fe_ox")
        al_ox = soil.get("al_ox")
        p_fixation = get_p_fixation_risk(fe_ox, al_ox)
        
        if status in ["very_low", "low"]:
            fert_type = "organic" if prefer_organic else "synthetic"
            rate_note = ""
            if p_fixation in ["high", "very_high"]:
                rate_note = f" (Increase rate by 50% due to {p_fixation} P fixation)"
            
            recommendations.append({
                "nutrient": "Phosphorus (P)",
                "priority": 1 if status == "very_low" else 2,
                "status": status,
                "current_value": f"{p:.1f} mg/kg",
                "target": ">25 mg/kg",
                "p_fixation_risk": p_fixation,
                "products": FERTILIZERS["phosphorus"][fert_type],
                "note": f"Band P near roots for best uptake{rate_note}"
            })
        elif status == "excessive":
            warnings.append({
                "type": "excess_phosphorus",
                "message": f"Phosphorus is excessive ({p:.0f} mg/kg). Environmental risk.",
                "action": "Avoid P fertilizers; risk of runoff pollution"
            })
    
    # =========================================================================
    # POTASSIUM ASSESSMENT
    # =========================================================================
    k = soil.get("k")
    if k is not None:
        status = classify_nutrient(k, THRESHOLDS["k"])
        soil_summary["potassium"] = {
            "value": round(k, 1),
            "unit": "mg/kg",
            "status": status
        }
        
        if status in ["very_low", "low"]:
            fert_type = "organic" if prefer_organic else "synthetic"
            recommendations.append({
                "nutrient": "Potassium (K)",
                "priority": 1 if status == "very_low" else 2,
                "status": status,
                "current_value": f"{k:.1f} mg/kg",
                "target": ">150 mg/kg",
                "products": FERTILIZERS["potassium"][fert_type],
                "note": "K especially important for fruits, root crops"
            })
    
    # =========================================================================
    # pH ASSESSMENT
    # =========================================================================
    ph = soil.get("ph")
    if ph is not None:
        soil_summary["ph"] = {
            "value": round(ph, 2),
            "unit": "pH"
        }
        
        if ph < THRESHOLDS["ph"]["acidic"]:  # < 5.5
            soil_summary["ph"]["status"] = "acidic"
            recommendations.append({
                "nutrient": "Soil pH",
                "priority": 1,
                "status": "too_acidic",
                "current_value": f"pH {ph:.1f}",
                "target": "pH 6.0-7.0",
                "products": FERTILIZERS["ph_low"]["products"],
                "note": "Low pH causes Al toxicity and reduces nutrient availability"
            })
            warnings.append({
                "type": "acidic_soil",
                "message": f"Soil is acidic (pH {ph:.1f}). Aluminum toxicity risk for sensitive crops.",
                "action": "Apply lime before planting"
            })
            
        elif ph > THRESHOLDS["ph"]["alkaline"]:  # > 8.0
            soil_summary["ph"]["status"] = "alkaline"
            recommendations.append({
                "nutrient": "Soil pH",
                "priority": 2,
                "status": "too_alkaline",
                "current_value": f"pH {ph:.1f}",
                "target": "pH 6.0-7.5",
                "products": FERTILIZERS["ph_high"]["products"],
                "note": "High pH causes micronutrient deficiencies (Fe, Zn, Mn)"
            })
            warnings.append({
                "type": "alkaline_soil",
                "message": f"Soil is alkaline (pH {ph:.1f}). Iron chlorosis risk.",
                "action": "Consider acidifying fertilizers or foliar micronutrients"
            })
        else:
            soil_summary["ph"]["status"] = "optimal" if 6.0 <= ph <= 7.5 else "acceptable"
    
    # =========================================================================
    # CALCIUM ASSESSMENT
    # =========================================================================
    ca = soil.get("ca")
    if ca is not None:
        status = classify_nutrient(ca, THRESHOLDS["ca"])
        soil_summary["calcium"] = {
            "value": round(ca, 0),
            "unit": "mg/kg",
            "status": status
        }
        
        if status in ["very_low", "low"]:
            recommendations.append({
                "nutrient": "Calcium (Ca)",
                "priority": 3,
                "status": status,
                "current_value": f"{ca:.0f} mg/kg",
                "target": ">1000 mg/kg",
                "products": FERTILIZERS["calcium"]["products"],
                "note": "Critical for peanuts, tomatoes, peppers"
            })
    
    # =========================================================================
    # MAGNESIUM ASSESSMENT
    # =========================================================================
    mg = soil.get("mg")
    if mg is not None:
        status = classify_nutrient(mg, THRESHOLDS["mg"])
        soil_summary["magnesium"] = {
            "value": round(mg, 0),
            "unit": "mg/kg",
            "status": status
        }
        
        if status in ["very_low", "low"]:
            recommendations.append({
                "nutrient": "Magnesium (Mg)",
                "priority": 3,
                "status": status,
                "current_value": f"{mg:.0f} mg/kg",
                "target": ">120 mg/kg",
                "products": FERTILIZERS["magnesium"]["products"],
                "note": "Use dolomitic lime if pH is also low"
            })
    
    # =========================================================================
    # ORGANIC CARBON ASSESSMENT
    # =========================================================================
    oc = soil.get("oc")
    if oc is not None:
        status = classify_nutrient(oc, THRESHOLDS["oc"])
        soil_summary["organic_carbon"] = {
            "value": round(oc, 2),
            "unit": "%",
            "status": status
        }
        
        if status in ["very_low", "low"]:
            recommendations.append({
                "nutrient": "Organic Matter",
                "priority": 2,
                "status": status,
                "current_value": f"{oc:.2f}%",
                "target": ">2.0%",
                "products": FERTILIZERS["organic_matter"]["products"],
                "note": "Building OM takes years but improves all soil properties"
            })
    
    # =========================================================================
    # SALINITY ASSESSMENT
    # =========================================================================
    ec = soil.get("ec")
    if ec is not None:
        soil_summary["salinity"] = {
            "value": round(ec, 2),
            "unit": "dS/m"
        }
        
        if ec < THRESHOLDS["ec"]["non_saline"]:
            soil_summary["salinity"]["status"] = "non_saline"
        elif ec < THRESHOLDS["ec"]["slightly_saline"]:
            soil_summary["salinity"]["status"] = "slightly_saline"
            warnings.append({
                "type": "salinity",
                "message": f"Slightly saline soil (EC {ec:.1f} dS/m). Some sensitive crops may be affected.",
                "action": "Choose salt-tolerant crops; improve drainage"
            })
        else:
            soil_summary["salinity"]["status"] = "saline"
            warnings.append({
                "type": "salinity",
                "message": f"Saline soil (EC {ec:.1f} dS/m). Significant yield impact likely.",
                "action": "Apply gypsum; leach salts; grow tolerant crops only"
            })
            recommendations.append({
                "nutrient": "Salinity Management",
                "priority": 1,
                "status": "saline",
                "current_value": f"{ec:.1f} dS/m",
                "target": "<2 dS/m",
                "products": FERTILIZERS["salinity"]["products"],
                "note": "Improving drainage is essential"
            })
    
    # =========================================================================
    # CEC ASSESSMENT (affects fertilizer strategy)
    # =========================================================================
    cec = soil.get("cec")
    if cec is not None:
        status = classify_nutrient(cec, THRESHOLDS["cec"])
        soil_summary["cec"] = {
            "value": round(cec, 1),
            "unit": "cmolc/kg",
            "status": status
        }
        
        if status in ["very_low", "low"]:
            warnings.append({
                "type": "low_cec",
                "message": f"Low CEC ({cec:.1f} cmolc/kg). Soil has poor nutrient holding capacity.",
                "action": "Apply fertilizers in smaller, more frequent doses to reduce leaching"
            })
    
    # =========================================================================
    # TEXTURE SUMMARY
    # =========================================================================
    clay = soil.get("clay")
    sand = soil.get("sand")
    silt = soil.get("silt")
    
    if clay is not None and sand is not None:
        soil_summary["texture"] = {
            "clay_pct": round(clay, 1),
            "sand_pct": round(sand, 1),
            "silt_pct": round(silt, 1) if silt else round(100 - clay - sand, 1)
        }
    
    # =========================================================================
    # SORT RECOMMENDATIONS BY PRIORITY
    # =========================================================================
    recommendations.sort(key=lambda x: x.get("priority", 99))
    
    # =========================================================================
    # BUILD FINAL OUTPUT FOR LLM CONTEXT
    # =========================================================================
    
    # Count issues
    critical_issues = [r for r in recommendations if r.get("priority") == 1]
    moderate_issues = [r for r in recommendations if r.get("priority") == 2]
    
    return {
        # Summary for quick LLM understanding
        "farm_soil_health": {
            "overall_status": "critical" if critical_issues else "needs_attention" if moderate_issues else "good",
            "critical_issues_count": len(critical_issues),
            "moderate_issues_count": len(moderate_issues),
            "warnings_count": len(warnings)
        },
        
        # Detailed soil analysis
        "soil_analysis": soil_summary,
        
        # Prioritized recommendations
        "recommendations": recommendations,
        
        # Warnings and alerts
        "warnings": warnings,
        
        # General guidance
        "general_advice": [
        ],
        
        # Target crop context (if provided)
        "target_crop": target_crop,
        "organic_preference": prefer_organic,
        
        # Citations for transparency
        "citations": {
            "nutrient_thresholds": "Landon (1991) Booker Tropical Soil Manual",
            "salinity": "Richards (1954) USDA Handbook 60",
            "ph": "USDA Soil Survey Manual (2017)",
            "p_thresholds": "Penn State Extension Soil Test Interpretation"
        }
    }


# =============================================================================
# CONVENIENCE FUNCTION FOR DIRECT VALUES (testing/simple use)
# =============================================================================

def get_recommendations_simple(
    ph: float = None,
    n_pct: float = None,
    p_mg_kg: float = None,
    k_mg_kg: float = None,
    oc_pct: float = None,
    ec_dsm: float = None,
    ca_mg_kg: float = None,
    mg_mg_kg: float = None,
    prefer_organic: bool = False
) -> Dict[str, Any]:
    """
    Simplified interface for direct values (not from BigQuery row).
    Useful for testing or simple integrations.
    """
    # Build a fake BigQuery row
    row = {}
    if ph is not None:
        row["pred_ph.h2o_usda.a268_index"] = ph
    if n_pct is not None:
        row["pred_n.tot_usda.a623_w.pct"] = n_pct
    if p_mg_kg is not None:
        row["pred_p.ext_usda.a1070_mg.kg"] = p_mg_kg
    if k_mg_kg is not None:
        row["pred_k.ext_usda.a1065_mg.kg"] = k_mg_kg
    if oc_pct is not None:
        row["pred_oc_usda.c729_w.pct"] = oc_pct
    if ec_dsm is not None:
        row["pred_ec_usda.a364_ds.m"] = ec_dsm
    if ca_mg_kg is not None:
        row["pred_ca.ext_usda.a1059_mg.kg"] = ca_mg_kg
    if mg_mg_kg is not None:
        row["pred_mg.ext_usda.a1066_mg.kg"] = mg_mg_kg
    
    return get_fertilizer_recommendations(row, prefer_organic=prefer_organic)


# =============================================================================
# EXAMPLE / TEST
# =============================================================================

