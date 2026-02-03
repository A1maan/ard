"""
Construction & Geotechnical Recommendation Tool - MVP Version
Assesses soil suitability for construction based on ML-predicted soil properties.

DISCLAIMER: This tool provides preliminary assessments only.
Always consult a licensed geotechnical engineer for actual construction projects.

All thresholds cited with engineering/scientific sources.
"""

from typing import Dict, List, Optional, Any


# =============================================================================
# COLUMN MAPPING: BigQuery prediction columns -> tool keys
# =============================================================================

PREDICTION_COLUMNS = {
    # Texture (CRITICAL for construction)
    "clay": "pred_clay.tot_usda.a334_w.pct",      # Clay (%)
    "sand": "pred_sand.tot_usda.c60_w.pct",       # Sand (%)
    "silt": "pred_silt.tot_usda.c62_w.pct",       # Silt (%)
    
    # Physical properties (CRITICAL)
    "bd": "pred_bd_usda.a4_g.cm3",                # Bulk density (g/cm³)
    
    # Water retention (drainage/excavation)
    "wr_10": "pred_wr.10kPa_usda.a414_w.pct",    # Water retention 10kPa (%)
    "wr_33": "pred_wr.33kPa_usda.a415_w.pct",    # Water retention 33kPa (%) - Field capacity
    "wr_1500": "pred_wr.1500kPa_usda.a417_w.pct", # Water retention 1500kPa (%)
    "awc": "pred_awc.33.1500kPa_usda.c80_w.frac", # Available water capacity
    
    # Chemical properties (corrosion/stability)
    "ph": "pred_ph.h2o_usda.a268_index",          # pH - corrosion indicator
    "ec": "pred_ec_usda.a364_ds.m",               # EC (dS/m) - salinity/corrosion
    "cec": "pred_cec_usda.a723_cmolc.kg",         # CEC - clay activity indicator
    
    # Organic matter (CRITICAL - compressibility)
    "oc": "pred_oc_usda.c729_w.pct",              # Organic carbon (%)
    
    # Cations (sodicity/dispersivity)
    "na": "pred_na.ext_usda.a1068_mg.kg",         # Sodium - dispersive soil indicator
    "ca": "pred_ca.ext_usda.a1059_mg.kg",         # Calcium
    "mg": "pred_mg.ext_usda.a1066_mg.kg",         # Magnesium
    
    # Iron & Aluminum oxides (laterite/hardpan)
    "fe_ox": "pred_fe.ox_usda.a60_w.pct",         # Oxalate Fe (%)
    "al_ox": "pred_al.ox_usda.a59_w.pct",         # Oxalate Al (%)
    "fe_dith": "pred_fe.dith_usda.a66_w.pct",     # Dithionite Fe (%)
    "al_dith": "pred_al.dith_usda.a65_w.pct",     # Dithionite Al (%)
}


# =============================================================================
# GEOTECHNICAL THRESHOLDS WITH CITATIONS
# =============================================================================

THRESHOLDS = {
    # -------------------------------------------------------------------------
    # CLAY CONTENT - Most critical for construction
    # Citation: Holtz & Kovacs (1981) Introduction to Geotechnical Engineering
    #           Das (2010) Principles of Geotechnical Engineering
    # -------------------------------------------------------------------------
    "clay": {
        "low": 15,           # Good for construction
        "moderate": 25,      # Acceptable with precautions
        "high": 35,          # Problematic - shrink/swell risk
        "very_high": 50,     # Severe restrictions
        "citation": "Holtz & Kovacs (1981); Das (2010) Principles of Geotechntic Engineering"
    },
    
    # -------------------------------------------------------------------------
    # SAND CONTENT
    # Citation: Das (2010); USACE EM 1110-1-1904
    # -------------------------------------------------------------------------
    "sand": {
        "low": 20,           # Poor drainage
        "moderate": 40,
        "high": 65,          # Good bearing, good drainage
        "very_high": 85,     # Excellent drainage but may need stabilization
        "citation": "Das (2010); USACE EM 1110-1-1904"
    },
    
    # -------------------------------------------------------------------------
    # SILT CONTENT - Problematic material
    # Citation: Holtz & Kovacs (1981); Terzaghi et al. (1996)
    # -------------------------------------------------------------------------
    "silt": {
        "low": 20,
        "moderate": 40,
        "high": 60,          # Frost heave risk, unstable when wet
        "citation": "Holtz & Kovacs (1981); Terzaghi et al. (1996)"
    },
    
    # -------------------------------------------------------------------------
    # BULK DENSITY - Compaction/bearing capacity indicator
    # Citation: USDA-NRCS Soil Quality Indicators; Das (2010)
    # -------------------------------------------------------------------------
    "bd": {
        "very_loose": 1.1,   # Poorly compacted, low bearing
        "loose": 1.3,
        "medium": 1.5,
        "dense": 1.7,        # Good bearing capacity
        "very_dense": 1.9,   # Excellent bearing, hard to excavate
        "citation": "USDA-NRCS Soil Quality Indicators; Das (2010)"
    },
    
    # -------------------------------------------------------------------------
    # ORGANIC CARBON - CRITICAL: High OC = unsuitable for construction
    # Citation: Holtz & Kovacs (1981); Coduto et al. (2011)
    # -------------------------------------------------------------------------
    "oc": {
        "acceptable": 1.0,   # < 1% OK for construction
        "marginal": 2.0,     # 1-2% needs evaluation
        "high": 5.0,         # 2-5% problematic
        "organic_soil": 12.0, # > 12% is organic soil - NOT for construction
        "citation": "Holtz & Kovacs (1981); Coduto et al. (2011) Geotechnical Engineering"
    },
    
    # -------------------------------------------------------------------------
    # pH - Corrosion potential
    # Citation: ACI 318 (Concrete); AWWA C105 (Pipe corrosion)
    # -------------------------------------------------------------------------
    "ph": {
        "very_acidic": 5.0,  # Severe corrosion risk
        "acidic": 5.5,       # Moderate corrosion risk
        "slightly_acidic": 6.0,
        "neutral_low": 6.5,
        "neutral_high": 8.0,
        "alkaline": 8.5,     # Can affect concrete
        "very_alkaline": 9.0,
        "citation": "ACI 318 Building Code; AWWA C105 Pipe Corrosion"
    },
    
    # -------------------------------------------------------------------------
    # EC (Salinity) - Corrosion and concrete deterioration
    # Citation: ACI 318; IS 456 (Indian Standard for Concrete)
    # -------------------------------------------------------------------------
    "ec": {
        "non_corrosive": 1.0,    # Safe
        "mildly_corrosive": 2.0,  # Monitor
        "moderately_corrosive": 4.0,  # Protection needed
        "severely_corrosive": 8.0,    # Special measures required
        "citation": "ACI 318; Portland Cement Association"
    },
    
    # -------------------------------------------------------------------------
    # CEC - Indicator of clay activity (shrink-swell potential)
    # Citation: Nelson & Miller (1992) Expansive Soils
    # -------------------------------------------------------------------------
    "cec": {
        "low_activity": 15,      # Kaolinite-type clays, stable
        "moderate_activity": 25,
        "high_activity": 40,     # Montmorillonite risk, expansive
        "very_high_activity": 60,
        "citation": "Nelson & Miller (1992) Expansive Soils"
    },
    
    # -------------------------------------------------------------------------
    # SODIUM - Dispersive soil indicator
    # Citation: Sherard et al. (1976) Pinhole Test; USDA Soil Taxonomy
    # -------------------------------------------------------------------------
    "na": {
        "safe": 50,              # Non-dispersive
        "marginal": 100,         # Monitor
        "dispersive": 200,       # Risk of piping/erosion
        "highly_dispersive": 400,
        "citation": "Sherard et al. (1976); USDA Handbook 60"
    }
}


# =============================================================================
# USDA TEXTURE CLASSIFICATION
# =============================================================================

def get_texture_class(sand: float, clay: float) -> str:
    """
    USDA Soil Texture Classification.
    Citation: USDA Soil Survey Manual (2017)
    """
    silt = 100 - sand - clay
    
    if sand >= 85:
        return "sand"
    elif sand >= 70 and clay < 15:
        return "loamy_sand"
    elif clay >= 40:
        if silt >= 40:
            return "silty_clay"
        elif sand >= 45:
            return "sandy_clay"
        else:
            return "clay"
    elif clay >= 35:
        return "clay_loam"
    elif clay >= 27:
        if sand >= 45:
            return "sandy_clay_loam"
        else:
            return "clay_loam"
    elif sand >= 52:
        return "sandy_loam"
    elif silt >= 50:
        return "silt_loam"
    else:
        return "loam"


# =============================================================================
# USCS CLASSIFICATION (Engineering Classification)
# =============================================================================

def get_uscs_class(sand: float, clay: float, silt: float, oc: float) -> Dict[str, str]:
    """
    Simplified USCS (Unified Soil Classification System) estimation.
    Citation: ASTM D2487; Das (2010)
    
    Note: True USCS requires Atterberg limits which we don't have.
    This is an approximation based on texture.
    """
    
    # Check for organic soil first
    if oc > 12:
        return {
            "class": "PT/OL/OH",
            "name": "Organic Soil (Peat/Organic)",
            "description": "High organic content - NOT suitable for construction",
            "citation": "ASTM D2487"
        }
    
    fines = clay + silt  # Particles < 0.075mm
    
    # Coarse-grained soils (< 50% fines)
    if fines < 50:
        if sand > (100 - fines) / 2:  # More sand than gravel
            if fines < 5:
                return {"class": "SP/SW", "name": "Sand (poorly/well graded)", 
                        "description": "Clean sand - good drainage, moderate bearing"}
            elif clay > silt:
                return {"class": "SC", "name": "Clayey Sand",
                        "description": "Sand with clay fines - fair drainage, good bearing"}
            else:
                return {"class": "SM", "name": "Silty Sand",
                        "description": "Sand with silt fines - fair drainage"}
        else:
            if fines < 5:
                return {"class": "GP/GW", "name": "Gravel",
                        "description": "Clean gravel - excellent bearing"}
            else:
                return {"class": "GM/GC", "name": "Silty/Clayey Gravel",
                        "description": "Gravel with fines"}
    
    # Fine-grained soils (≥ 50% fines)
    else:
        if clay > 30:
            if clay > 50:
                return {"class": "CH", "name": "Fat Clay (High Plasticity)",
                        "description": "Highly plastic clay - HIGH shrink-swell, poor for construction"}
            else:
                return {"class": "CL", "name": "Lean Clay (Low Plasticity)",
                        "description": "Low plasticity clay - moderate shrink-swell"}
        elif silt > 50:
            return {"class": "ML/MH", "name": "Silt",
                    "description": "Silty soil - frost susceptible, unstable when wet"}
        else:
            return {"class": "CL-ML", "name": "Silty Clay",
                    "description": "Mixed fines - variable properties"}


# =============================================================================
# BEARING CAPACITY ESTIMATION
# =============================================================================

def estimate_bearing_capacity(sand: float, clay: float, bd: float, oc: float) -> Dict[str, Any]:
    """
    Estimate allowable bearing capacity range.
    
    Citation: 
    - IS 1904 (Indian Standard) - Presumptive bearing capacities
    - Bowles (1997) Foundation Analysis and Design
    - Das (2010) Principles of Geotechnical Engineering
    
    Note: These are PRESUMPTIVE values for preliminary assessment only.
    Actual bearing capacity requires proper geotechnical investigation.
    """
    
    # Organic soils - very low
    if oc > 5:
        return {
            "capacity_kpa": "< 25",
            "capacity_description": "Very Low",
            "suitable_for": ["No construction recommended"],
            "not_suitable_for": ["Any structures"],
            "note": "High organic content causes excessive settlement",
            "citation": "Holtz & Kovacs (1981)"
        }
    
    texture = get_texture_class(sand, clay)
    
    # Sandy soils - generally good
    if texture in ["sand", "loamy_sand"]:
        if bd > 1.6:
            return {
                "capacity_kpa": "150-300",
                "capacity_description": "High",
                "suitable_for": ["Heavy structures", "Multi-story buildings", "Industrial facilities"],
                "not_suitable_for": [],
                "note": "Dense sand - excellent foundation material",
                "citation": "IS 1904; Bowles (1997)"
            }
        elif bd > 1.4:
            return {
                "capacity_kpa": "100-200",
                "capacity_description": "Medium-High",
                "suitable_for": ["2-3 story buildings", "Warehouses", "Light industrial"],
                "not_suitable_for": ["Heavy industrial without compaction"],
                "note": "Medium dense sand - good with proper compaction",
                "citation": "IS 1904; Bowles (1997)"
            }
        else:
            return {
                "capacity_kpa": "50-100",
                "capacity_description": "Medium",
                "suitable_for": ["Single story buildings", "Light structures"],
                "not_suitable_for": ["Heavy loads without ground improvement"],
                "note": "Loose sand - needs compaction",
                "citation": "IS 1904; Bowles (1997)"
            }
    
    # Sandy loam - good
    elif texture == "sandy_loam":
        return {
            "capacity_kpa": "100-200",
            "capacity_description": "Medium-High",
            "suitable_for": ["2-3 story buildings", "Warehouses", "Roads"],
            "not_suitable_for": ["Heavy structures without investigation"],
            "note": "Good general-purpose foundation soil",
            "citation": "IS 1904"
        }
    
    # Loam - moderate
    elif texture == "loam":
        return {
            "capacity_kpa": "75-150",
            "capacity_description": "Medium",
            "suitable_for": ["1-2 story buildings", "Residential", "Light commercial"],
            "not_suitable_for": ["Heavy structures without deeper foundation"],
            "note": "Decent foundation soil, monitor drainage",
            "citation": "IS 1904"
        }
    
    # Clay soils - variable and problematic
    elif texture in ["clay", "silty_clay", "sandy_clay"]:
        if bd > 1.5:
            return {
                "capacity_kpa": "100-150",
                "capacity_description": "Medium",
                "suitable_for": ["Light to medium structures with precautions"],
                "not_suitable_for": ["Heavy structures", "Structures sensitive to movement"],
                "note": "Stiff clay - watch for shrink-swell",
                "citation": "IS 1904; Nelson & Miller (1992)"
            }
        else:
            return {
                "capacity_kpa": "50-100",
                "capacity_description": "Low-Medium",
                "suitable_for": ["Light structures only", "With engineered foundation"],
                "not_suitable_for": ["Standard foundations", "Heavy loads"],
                "note": "Soft clay - settlement and shrink-swell concerns",
                "citation": "IS 1904; Nelson & Miller (1992)"
            }
    
    # Clay loam
    elif texture in ["clay_loam", "sandy_clay_loam", "silty_clay_loam"]:
        return {
            "capacity_kpa": "75-125",
            "capacity_description": "Medium",
            "suitable_for": ["1-2 story buildings", "Residential"],
            "not_suitable_for": ["Heavy structures without precautions"],
            "note": "Mixed soil - evaluate shrink-swell potential",
            "citation": "IS 1904"
        }
    
    # Silt - problematic
    elif texture in ["silt", "silt_loam"]:
        return {
            "capacity_kpa": "50-100",
            "capacity_description": "Low-Medium",
            "suitable_for": ["Light structures with proper foundation"],
            "not_suitable_for": ["Heavy loads", "Areas with freeze-thaw"],
            "note": "Silty soil - frost heave risk, unstable when saturated",
            "citation": "Holtz & Kovacs (1981)"
        }
    
    # Default
    else:
        return {
            "capacity_kpa": "50-100",
            "capacity_description": "Unknown - Requires Investigation",
            "suitable_for": ["Light structures only until investigated"],
            "not_suitable_for": ["Any significant construction"],
            "note": "Soil type unclear - geotechnical investigation required",
            "citation": "General engineering practice"
        }


# =============================================================================
# SHRINK-SWELL POTENTIAL
# =============================================================================

def assess_shrink_swell(clay: float, cec: float, oc: float) -> Dict[str, Any]:
    """
    Assess shrink-swell (expansive soil) potential.
    
    Citation:
    - Nelson & Miller (1992) Expansive Soils: Problems and Practice
    - Holtz & Kovacs (1981)
    - ASTM D4829 - Expansion Index Test
    """
    
    # Low clay = low risk regardless
    if clay < 15:
        return {
            "risk": "low",
            "description": "Low shrink-swell potential",
            "precautions": ["Standard foundation practices"],
            "citation": "Nelson & Miller (1992)"
        }
    
    # Use CEC as indicator of clay activity
    # High CEC suggests montmorillonite (swelling clay)
    # Low CEC suggests kaolinite (stable clay)
    
    activity = cec / clay if clay > 0 else 0  # Simplified activity indicator
    
    if clay > 40 and cec > 35:
        return {
            "risk": "very_high",
            "description": "Very high shrink-swell potential - Likely expansive clay",
            "precautions": [
                "Detailed geotechnical investigation required",
                "Consider pier/pile foundations",
                "Maintain consistent soil moisture around foundations",
                "Use flexible utility connections",
                "Structural engineer required for foundation design"
            ],
            "foundation_recommendations": [
                "Drilled piers to stable stratum",
                "Stiffened slab-on-grade",
                "Waffle/ribbed mat foundation"
            ],
            "citation": "Nelson & Miller (1992); Chen (1988) Foundations on Expansive Soils"
        }
    
    elif clay > 30 or (clay > 20 and cec > 30):
        return {
            "risk": "high",
            "description": "High shrink-swell potential",
            "precautions": [
                "Geotechnical investigation recommended",
                "Consider deeper foundations",
                "Drainage control essential",
                "Avoid trees close to foundations"
            ],
            "foundation_recommendations": [
                "Deepened footings below active zone",
                "Stiffened slab",
                "Void space under grade beams"
            ],
            "citation": "Nelson & Miller (1992)"
        }
    
    elif clay > 20:
        return {
            "risk": "moderate",
            "description": "Moderate shrink-swell potential",
            "precautions": [
                "Adequate foundation depth",
                "Good drainage away from structure",
                "Monitor for cracks"
            ],
            "foundation_recommendations": [
                "Standard reinforced footings",
                "Ensure adequate depth"
            ],
            "citation": "Nelson & Miller (1992)"
        }
    
    else:
        return {
            "risk": "low",
            "description": "Low shrink-swell potential",
            "precautions": ["Standard foundation practices"],
            "citation": "Nelson & Miller (1992)"
        }


# =============================================================================
# CORROSION ASSESSMENT
# =============================================================================

def assess_corrosion_risk(ph: float, ec: float, na: float) -> Dict[str, Any]:
    """
    Assess soil corrosivity for buried infrastructure.
    
    Citation:
    - AWWA C105 - Polyethylene Encasement for Ductile-Iron Pipe
    - ACI 318 - Building Code Requirements for Structural Concrete
    - Romanoff (1989) Underground Corrosion, NBS Circular 579
    """
    
    risks = []
    severity = "low"
    
    # pH assessment
    if ph < 5.0:
        risks.append({
            "factor": "Very acidic pH",
            "detail": f"pH {ph:.1f} is highly corrosive to concrete and metals",
            "affected": ["Concrete foundations", "Steel pipes", "Rebar"]
        })
        severity = "severe"
    elif ph < 5.5:
        risks.append({
            "factor": "Acidic pH",
            "detail": f"pH {ph:.1f} may corrode buried infrastructure",
            "affected": ["Concrete", "Cast iron", "Steel"]
        })
        severity = "high" if severity != "severe" else severity
    elif ph > 9.0:
        risks.append({
            "factor": "Very alkaline pH",
            "detail": f"pH {ph:.1f} may affect certain metals",
            "affected": ["Aluminum", "Zinc coatings"]
        })
        severity = "moderate" if severity == "low" else severity
    
    # Salinity (EC) assessment
    if ec > 4:
        risks.append({
            "factor": "High salinity",
            "detail": f"EC {ec:.1f} dS/m indicates high dissolved salts",
            "affected": ["All buried metals", "Concrete", "Rebar"]
        })
        severity = "severe"
    elif ec > 2:
        risks.append({
            "factor": "Moderate salinity",
            "detail": f"EC {ec:.1f} dS/m may accelerate corrosion",
            "affected": ["Unprotected metals"]
        })
        severity = "high" if severity not in ["severe"] else severity
    
    # Sodium (indicator of chlorides)
    if na > 200:
        risks.append({
            "factor": "High sodium",
            "detail": f"Na {na:.0f} mg/kg suggests chloride presence",
            "affected": ["Rebar in concrete", "Steel structures"]
        })
        severity = "high" if severity not in ["severe"] else severity
    
    # Build recommendations
    if severity == "severe":
        recommendations = [
            "Use sulfate-resistant cement (Type V)",
            "Protective coatings on all buried metal",
            "Consider PVC/HDPE pipes instead of metal",
            "Cathodic protection for critical structures",
            "Increased concrete cover for rebar (75mm+)"
        ]
    elif severity == "high":
        recommendations = [
            "Use sulfate-resistant cement (Type II or V)",
            "Epoxy-coated rebar",
            "Protective wrapping for pipes",
            "Increased concrete cover (60mm+)"
        ]
    elif severity == "moderate":
        recommendations = [
            "Standard protective measures",
            "Coated rebar recommended",
            "Monitor infrastructure regularly"
        ]
    else:
        recommendations = [
            "Standard construction practices acceptable"
        ]
    
    return {
        "severity": severity,
        "risks": risks,
        "recommendations": recommendations,
        "citation": "AWWA C105; ACI 318; Romanoff (1989)"
    }


# =============================================================================
# DRAINAGE ASSESSMENT
# =============================================================================

def assess_drainage(sand: float, clay: float, bd: float, awc: float) -> Dict[str, Any]:
    """
    Assess soil drainage characteristics for construction.
    
    Citation:
    - USDA-NRCS Soil Survey Manual
    - Coduto et al. (2011) Geotechnical Engineering
    """
    
    texture = get_texture_class(sand, clay)
    
    # Estimate permeability class
    if texture in ["sand", "loamy_sand"]:
        permeability = "rapid"
        drainage_class = "excessively_drained"
        k_estimate = "> 50 mm/hr"
    elif texture == "sandy_loam":
        permeability = "moderate_rapid"
        drainage_class = "well_drained"
        k_estimate = "15-50 mm/hr"
    elif texture in ["loam", "silt_loam"]:
        permeability = "moderate"
        drainage_class = "moderately_well_drained"
        k_estimate = "5-15 mm/hr"
    elif texture in ["clay_loam", "sandy_clay_loam"]:
        permeability = "moderate_slow"
        drainage_class = "somewhat_poorly_drained"
        k_estimate = "1.5-5 mm/hr"
    elif texture in ["silty_clay_loam", "silty_clay"]:
        permeability = "slow"
        drainage_class = "poorly_drained"
        k_estimate = "0.5-1.5 mm/hr"
    else:  # clay, sandy_clay
        permeability = "very_slow"
        drainage_class = "very_poorly_drained"
        k_estimate = "< 0.5 mm/hr"
    
    # Construction implications
    if permeability in ["rapid", "moderate_rapid"]:
        implications = {
            "excavation": "Easy excavation, may need dewatering in wet conditions",
            "foundations": "Good drainage around foundations",
            "septic_suitability": "Excellent for septic systems",
            "road_subgrade": "Good subgrade material",
            "concerns": ["May need erosion control", "Groundwater protection for pollutants"]
        }
    elif permeability == "moderate":
        implications = {
            "excavation": "Moderate excavation difficulty",
            "foundations": "Adequate drainage with proper grading",
            "septic_suitability": "Suitable for septic with standard design",
            "road_subgrade": "Acceptable subgrade",
            "concerns": ["Ensure positive drainage away from structures"]
        }
    else:
        implications = {
            "excavation": "Difficult excavation, water accumulation likely",
            "foundations": "Drainage system required around foundations",
            "septic_suitability": "Poor - may require engineered system",
            "road_subgrade": "Poor subgrade - stabilization needed",
            "concerns": [
                "Install French drains or perimeter drains",
                "Waterproofing essential for basements",
                "May need pumping during construction"
            ]
        }
    
    return {
        "permeability_class": permeability,
        "drainage_class": drainage_class,
        "estimated_k": k_estimate,
        "implications": implications,
        "citation": "USDA-NRCS; Coduto et al. (2011)"
    }


# =============================================================================
# EXCAVATION DIFFICULTY
# =============================================================================

def assess_excavation(clay: float, sand: float, bd: float, oc: float, fe_ox: float, al_ox: float) -> Dict[str, Any]:
    """
    Assess excavation difficulty and equipment needs.
    
    Citation:
    - Caterpillar Performance Handbook
    - Peurifoy et al. (2010) Construction Planning, Equipment, and Methods
    """
    
    # Check for laterite/hardpan (high Fe/Al oxides in tropical soils)
    laterite_risk = False
    if fe_ox and al_ox:
        if fe_ox > 2.0 or (fe_ox + al_ox) > 3.0:
            laterite_risk = True
    
    texture = get_texture_class(sand, clay)
    
    # Very dense or cemented
    if bd > 1.8 or laterite_risk:
        return {
            "difficulty": "very_hard",
            "description": "Very difficult excavation - possible hardpan or cemented layer",
            "equipment_needed": [
                "Rock breaker / Hydraulic hammer",
                "Heavy excavator (30+ ton)",
                "Possible ripping required"
            ],
            "productivity_factor": "0.3-0.5 (30-50% of normal)",
            "cost_multiplier": "2.0-3.0x standard rates",
            "notes": "May need blasting assessment if cemented",
            "citation": "Caterpillar Performance Handbook"
        }
    
    # Heavy clay
    elif clay > 40:
        if bd > 1.5:
            return {
                "difficulty": "hard",
                "description": "Difficult excavation - stiff clay",
                "equipment_needed": [
                    "Medium-heavy excavator (20-30 ton)",
                    "May need ripper attachment"
                ],
                "productivity_factor": "0.5-0.7",
                "cost_multiplier": "1.5-2.0x",
                "notes": "Sticky when wet - plan for dry season",
                "citation": "Caterpillar Performance Handbook"
            }
        else:
            return {
                "difficulty": "moderate_hard",
                "description": "Moderate-difficult excavation - soft clay",
                "equipment_needed": [
                    "Medium excavator (15-25 ton)",
                    "Wide tracks for soft conditions"
                ],
                "productivity_factor": "0.6-0.8",
                "cost_multiplier": "1.3-1.5x",
                "notes": "May be unstable - shore excavations",
                "citation": "Caterpillar Performance Handbook"
            }
    
    # Sandy soils
    elif sand > 65:
        return {
            "difficulty": "easy",
            "description": "Easy excavation - sandy soil",
            "equipment_needed": [
                "Standard excavator (10-20 ton)",
                "Backhoe adequate for small jobs"
            ],
            "productivity_factor": "1.0-1.2",
            "cost_multiplier": "1.0x (standard)",
            "notes": "Watch for caving - may need shoring",
            "citation": "Caterpillar Performance Handbook"
        }
    
    # Loam/mixed
    else:
        return {
            "difficulty": "moderate",
            "description": "Normal excavation difficulty",
            "equipment_needed": [
                "Standard excavator (15-20 ton)",
                "Backhoe for smaller work"
            ],
            "productivity_factor": "0.8-1.0",
            "cost_multiplier": "1.0-1.2x",
            "notes": "Standard practices apply",
            "citation": "Caterpillar Performance Handbook"
        }


# =============================================================================
# LAND USE SUITABILITY
# =============================================================================

def assess_land_use(soil: Dict[str, float]) -> Dict[str, Any]:
    """
    Determine optimal land use based on soil properties.
    """
    
    clay = soil.get("clay", 20)
    sand = soil.get("sand", 40)
    oc = soil.get("oc", 1.5)
    ec = soil.get("ec", 0.5)
    ph = soil.get("ph", 7.0)
    bd = soil.get("bd", 1.4)
    cec = soil.get("cec", 15)
    
    suitability = {}
    
    # Heavy construction (industrial, multi-story)
    if oc > 5:
        suitability["heavy_construction"] = {"rating": "unsuitable", "score": 0, 
                                              "reason": "High organic content - excessive settlement"}
    elif clay > 45:
        suitability["heavy_construction"] = {"rating": "poor", "score": 25,
                                              "reason": "High clay - shrink-swell risk"}
    elif sand > 60 and bd > 1.5:
        suitability["heavy_construction"] = {"rating": "excellent", "score": 95,
                                              "reason": "Dense sandy soil - high bearing capacity"}
    elif sand > 40 and clay < 30:
        suitability["heavy_construction"] = {"rating": "good", "score": 75,
                                              "reason": "Balanced texture - adequate bearing"}
    else:
        suitability["heavy_construction"] = {"rating": "moderate", "score": 50,
                                              "reason": "Requires geotechnical evaluation"}
    
    # Light construction (residential, small commercial)
    if oc > 8:
        suitability["light_construction"] = {"rating": "unsuitable", "score": 0,
                                              "reason": "Organic soil - not for building"}
    elif oc > 3:
        suitability["light_construction"] = {"rating": "poor", "score": 25,
                                              "reason": "High organic - settlement risk"}
    elif clay > 50:
        suitability["light_construction"] = {"rating": "poor", "score": 30,
                                              "reason": "Very high clay - foundation issues"}
    elif clay > 35:
        suitability["light_construction"] = {"rating": "moderate", "score": 50,
                                              "reason": "High clay - needs proper foundation design"}
    else:
        suitability["light_construction"] = {"rating": "good", "score": 75,
                                              "reason": "Suitable for residential construction"}
    
    # Roads and pavements
    if oc > 5:
        suitability["roads"] = {"rating": "unsuitable", "score": 0,
                                 "reason": "Organic soil - will settle"}
    elif clay > 40:
        suitability["roads"] = {"rating": "poor", "score": 30,
                                 "reason": "High clay - poor subgrade, shrink-swell"}
    elif sand > 70:
        suitability["roads"] = {"rating": "good", "score": 80,
                                 "reason": "Sandy soil - good drainage, stable"}
    elif sand > 40:
        suitability["roads"] = {"rating": "good", "score": 70,
                                 "reason": "Adequate subgrade material"}
    else:
        suitability["roads"] = {"rating": "moderate", "score": 50,
                                 "reason": "May need stabilization"}
    
    # Agriculture (for comparison)
    if ec > 4:
        suitability["agriculture"] = {"rating": "poor", "score": 25,
                                       "reason": "Saline soil - limited crops"}
    elif ph < 5.0 or ph > 8.5:
        suitability["agriculture"] = {"rating": "moderate", "score": 50,
                                       "reason": "pH needs correction"}
    elif oc > 2 and clay < 40 and ec < 2:
        suitability["agriculture"] = {"rating": "excellent", "score": 90,
                                       "reason": "Good fertility and structure"}
    elif oc > 1 and clay < 50:
        suitability["agriculture"] = {"rating": "good", "score": 70,
                                       "reason": "Suitable for farming"}
    else:
        suitability["agriculture"] = {"rating": "moderate", "score": 50,
                                       "reason": "May need amendments"}
    
    # Septic systems
    if clay > 40:
        suitability["septic_system"] = {"rating": "unsuitable", "score": 10,
                                         "reason": "Clay too high - poor percolation"}
    elif sand > 85:
        suitability["septic_system"] = {"rating": "poor", "score": 30,
                                         "reason": "Too sandy - insufficient treatment"}
    elif sand > 50 and clay < 20:
        suitability["septic_system"] = {"rating": "excellent", "score": 90,
                                         "reason": "Good percolation rate"}
    elif clay < 30:
        suitability["septic_system"] = {"rating": "good", "score": 70,
                                         "reason": "Adequate for septic"}
    else:
        suitability["septic_system"] = {"rating": "moderate", "score": 45,
                                         "reason": "May need engineered system"}
    
    # Find best use
    best_use = max(suitability.items(), key=lambda x: x[1]["score"])
    worst_use = min(suitability.items(), key=lambda x: x[1]["score"])
    
    return {
        "suitability_ratings": suitability,
        "recommended_use": best_use[0],
        "recommended_use_score": best_use[1]["score"],
        "avoid_use": worst_use[0] if worst_use[1]["score"] < 40 else None,
        "citation": "Based on USDA-NRCS Land Capability Classification; Engineering guidelines"
    }


# =============================================================================
# MAIN FUNCTION: GET CONSTRUCTION RECOMMENDATIONS
# =============================================================================

def get_construction_recommendations(bigquery_row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate construction/geotechnical recommendations for a site.
    
    Designed to be called when user clicks on a location in the frontend.
    Returns full context for LLM to use in chat.
    
    Args:
        bigquery_row: Single row from BigQuery containing prediction columns
        
    Returns:
        Dictionary with geotechnical assessment and recommendations for LLM context
    """
    
    # Extract soil data
    soil = {}
    for key, col_name in PREDICTION_COLUMNS.items():
        value = bigquery_row.get(col_name)
        if value is not None:
            try:
                soil[key] = float(value)
            except (ValueError, TypeError):
                soil[key] = None
        else:
            soil[key] = None
    
    # Get values with defaults
    clay = soil.get("clay") or 20
    sand = soil.get("sand") or 40
    silt = soil.get("silt") or (100 - clay - sand)
    bd = soil.get("bd") or 1.4
    oc = soil.get("oc") or 1.5
    ph = soil.get("ph") or 7.0
    ec = soil.get("ec") or 0.5
    cec = soil.get("cec") or 15
    na = soil.get("na") or 50
    fe_ox = soil.get("fe_ox") or 0.3
    al_ox = soil.get("al_ox") or 0.2
    
    # Run all assessments
    texture = get_texture_class(sand, clay)
    uscs = get_uscs_class(sand, clay, silt, oc)
    bearing = estimate_bearing_capacity(sand, clay, bd, oc)
    shrink_swell = assess_shrink_swell(clay, cec, oc)
    corrosion = assess_corrosion_risk(ph, ec, na)
    drainage = assess_drainage(sand, clay, bd, soil.get("awc") or 0.15)
    excavation = assess_excavation(clay, sand, bd, oc, fe_ox, al_ox)
    land_use = assess_land_use(soil)
    
    # Build warnings list
    warnings = []
    
    if oc > 3:
        warnings.append({
            "type": "high_organic",
            "severity": "critical" if oc > 5 else "high",
            "message": f"High organic content ({oc:.1f}%) - significant settlement risk",
            "action": "Avoid construction or require deep foundations to stable stratum"
        })
    
    if shrink_swell["risk"] in ["high", "very_high"]:
        warnings.append({
            "type": "expansive_soil",
            "severity": "high",
            "message": f"Expansive clay risk ({shrink_swell['risk']})",
            "action": "Specialized foundation design required"
        })
    
    if corrosion["severity"] in ["high", "severe"]:
        warnings.append({
            "type": "corrosion",
            "severity": corrosion["severity"],
            "message": "Corrosive soil conditions for buried infrastructure",
            "action": "Use protective measures for all buried metal and concrete"
        })
    
    if drainage["permeability_class"] in ["slow", "very_slow"]:
        warnings.append({
            "type": "poor_drainage",
            "severity": "moderate",
            "message": f"Poor drainage ({drainage['permeability_class']})",
            "action": "Install drainage systems around structures"
        })
    
    if excavation["difficulty"] in ["hard", "very_hard"]:
        warnings.append({
            "type": "difficult_excavation",
            "severity": "moderate",
            "message": f"Difficult excavation expected ({excavation['difficulty']})",
            "action": "Plan for heavy equipment and increased costs"
        })
    
    # Determine overall site rating
    critical_issues = [w for w in warnings if w["severity"] == "critical"]
    high_issues = [w for w in warnings if w["severity"] == "high"]
    
    if critical_issues:
        overall_rating = "unsuitable"
        overall_description = "Site has critical constraints for construction"
    elif len(high_issues) >= 2:
        overall_rating = "poor"
        overall_description = "Site has multiple significant constraints"
    elif high_issues:
        overall_rating = "marginal"
        overall_description = "Site has constraints requiring special measures"
    elif warnings:
        overall_rating = "fair"
        overall_description = "Site is buildable with standard precautions"
    else:
        overall_rating = "good"
        overall_description = "Site is suitable for construction"
    
    # Build output
    return {
        "site_assessment": {
            "overall_rating": overall_rating,
            "description": overall_description,
            "warnings_count": len(warnings),
            "critical_issues": len(critical_issues)
        },
        
        "soil_classification": {
            "usda_texture": texture,
            "uscs_class": uscs["class"],
            "uscs_name": uscs["name"],
            "uscs_description": uscs["description"],
            "composition": {
                "clay_pct": round(clay, 1),
                "sand_pct": round(sand, 1),
                "silt_pct": round(silt, 1),
                "organic_carbon_pct": round(oc, 2)
            }
        },
        
        "bearing_capacity": bearing,
        
        "shrink_swell_assessment": shrink_swell,
        
        "corrosion_assessment": corrosion,
        
        "drainage_assessment": drainage,
        
        "excavation_assessment": excavation,
        
        "land_use_suitability": land_use,
        
        "warnings": warnings,
        
        "foundation_recommendations": {
            "type": _get_foundation_recommendation(clay, sand, bd, oc, shrink_swell["risk"]),
            "depth_guidance": _get_depth_guidance(clay, oc, shrink_swell["risk"]),
            "special_considerations": _get_special_considerations(soil, shrink_swell, corrosion)
        },
        
        "disclaimer": "This is a preliminary assessment based on soil properties only. "
                      "A proper geotechnical investigation by a licensed engineer is required "
                      "before any construction project.",
        
        "citations": {
            "bearing_capacity": "IS 1904; Bowles (1997) Foundation Analysis",
            "shrink_swell": "Nelson & Miller (1992) Expansive Soils",
            "corrosion": "ACI 318; AWWA C105",
            "classification": "ASTM D2487; USDA Soil Survey Manual",
            "excavation": "Caterpillar Performance Handbook"
        }
    }


def _get_foundation_recommendation(clay: float, sand: float, bd: float, oc: float, shrink_risk: str) -> Dict[str, Any]:
    """Get foundation type recommendation."""
    
    if oc > 5:
        return {
            "recommended": "Deep foundations (piles/piers)",
            "alternatives": ["Remove and replace organic material", "Ground improvement"],
            "avoid": ["Shallow spread footings", "Slab-on-grade"]
        }
    
    if shrink_risk == "very_high":
        return {
            "recommended": "Drilled piers to stable stratum",
            "alternatives": ["Stiffened slab-on-grade", "Waffle slab"],
            "avoid": ["Standard spread footings"]
        }
    
    if shrink_risk == "high":
        return {
            "recommended": "Deepened spread footings with stiffened grade beam",
            "alternatives": ["Pier and beam", "Ribbed slab"],
            "avoid": ["Shallow footings"]
        }
    
    if sand > 60 and bd > 1.5:
        return {
            "recommended": "Standard spread footings",
            "alternatives": ["Slab-on-grade", "Mat foundation for uniform loading"],
            "avoid": []
        }
    
    if clay > 35:
        return {
            "recommended": "Reinforced spread footings below active zone",
            "alternatives": ["Pier and beam"],
            "avoid": ["Shallow footings in active zone"]
        }
    
    return {
        "recommended": "Standard spread footings",
        "alternatives": ["Slab-on-grade", "Strip footings"],
        "avoid": []
    }


def _get_depth_guidance(clay: float, oc: float, shrink_risk: str) -> str:
    """Get foundation depth guidance."""
    
    if oc > 5:
        return "Below organic layer to competent bearing stratum"
    
    if shrink_risk in ["high", "very_high"]:
        return "Minimum 1.5-3m below surface (below active zone) or to stable stratum"
    
    if clay > 40:
        return "Minimum 1.0-1.5m below surface"
    
    if clay > 25:
        return "Minimum 0.75-1.0m below surface"
    
    return "Minimum 0.5-0.75m below surface (below frost line if applicable)"


def _get_special_considerations(soil: Dict, shrink_swell: Dict, corrosion: Dict) -> List[str]:
    """Get special construction considerations."""
    
    considerations = []
    
    if shrink_swell["risk"] in ["high", "very_high"]:
        considerations.append("Maintain consistent moisture around foundation (avoid extremes)")
        considerations.append("Use flexible connections for utilities")
        considerations.append("Consider post-tensioned slab")
    
    if corrosion["severity"] in ["high", "severe"]:
        considerations.append("Use sulfate-resistant cement")
        considerations.append("Protective coating on all buried metal")
        considerations.append("Consider cathodic protection")
    
    if soil.get("clay", 0) > 40:
        considerations.append("Plan construction during dry season if possible")
        considerations.append("Protect excavations from water ingress")
    
    if soil.get("sand", 0) > 80:
        considerations.append("Shore excavations to prevent cave-in")
        considerations.append("May need dewatering")
    
    if not considerations:
        considerations.append("Standard construction practices apply")
    
    return considerations


# =============================================================================
# CONVENIENCE FUNCTION FOR DIRECT VALUES
# =============================================================================

def get_recommendations_simple(
    clay_pct: float = None,
    sand_pct: float = None,
    silt_pct: float = None,
    bulk_density: float = None,
    organic_carbon_pct: float = None,
    ph: float = None,
    ec_dsm: float = None,
    cec: float = None
) -> Dict[str, Any]:
    """
    Simplified interface for direct values.
    """
    row = {}
    if clay_pct is not None:
        row["pred_clay.tot_usda.a334_w.pct"] = clay_pct
    if sand_pct is not None:
        row["pred_sand.tot_usda.c60_w.pct"] = sand_pct
    if silt_pct is not None:
        row["pred_silt.tot_usda.c62_w.pct"] = silt_pct
    if bulk_density is not None:
        row["pred_bd_usda.a4_g.cm3"] = bulk_density
    if organic_carbon_pct is not None:
        row["pred_oc_usda.c729_w.pct"] = organic_carbon_pct
    if ph is not None:
        row["pred_ph.h2o_usda.a268_index"] = ph
    if ec_dsm is not None:
        row["pred_ec_usda.a364_ds.m"] = ec_dsm
    if cec is not None:
        row["pred_cec_usda.a723_cmolc.kg"] = cec
    
    return get_construction_recommendations(row)


################################
#Unwrap Function
####################################

from typing import Any, Dict, Optional

def unwrap_to_bigquery_row(frontend_row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert the nested frontend row into a flat dict containing the BigQuery-like
    prediction columns expected by get_construction_recommendations().

    NOTE: This function intentionally leaves missing values as None so your main
    function's defaults kick in.
    """
    def get_path(d: Dict[str, Any], path: str) -> Optional[Any]:
        cur: Any = d
        for part in path.split("."):
            if not isinstance(cur, dict) or part not in cur:
                return None
            cur = cur[part]
        return cur

    # Pull best-available sources from your row
    extracted = {
        "clay": get_path(frontend_row, "farm_fertilizer_analysis.soil_analysis.texture.clay_pct"),
        "sand": get_path(frontend_row, "farm_fertilizer_analysis.soil_analysis.texture.sand_pct"),
        "silt": get_path(frontend_row, "farm_fertilizer_analysis.soil_analysis.texture.silt_pct"),
        "ph":   get_path(frontend_row, "farm_fertilizer_analysis.soil_analysis.ph.value"),
        "ec":   get_path(frontend_row, "farm_fertilizer_analysis.soil_analysis.salinity.value"),
        "cec":  get_path(frontend_row, "farm_fertilizer_analysis.soil_analysis.cec.value"),
        "oc":   get_path(frontend_row, "farm_fertilizer_analysis.soil_analysis.organic_carbon.value"),
        "bd":   get_path(frontend_row, "farm_crop_analysis.soil_summary.bulk_density_gcm3"),
        "na":   get_path(frontend_row, "farm_crop_analysis.soil_summary.nutrients.sodium"),
        "fe_ox": None,  # not present in row
        "al_ox": None,  # not present in row
        "awc":  None,   # not present in row (optional; your code defaults)
    }

    # IMPORTANT: map these to your actual BigQuery column names using PREDICTION_COLUMNS
    # e.g. if PREDICTION_COLUMNS["clay"] == "pred_clay_pct", set that key.
    bigquery_like: Dict[str, Any] = {}
    for logical_key, bq_col in PREDICTION_COLUMNS.items():
        bigquery_like[bq_col] = extracted.get(logical_key)

    return bigquery_like
