"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Feature, FeatureCollection, Geometry, Point } from "geojson";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
// Import the base state map data
import usStatesTopology from "us-atlas/states-10m.json" assert { type: "json" }; 
import { AppHeader } from "@/components/AppHeader";

// --- TYPES DEFINITION ---

// Define the shape of the GeoJSON Feature we expect from the backend
type SoilProperties = {
  id: string;
  // NOTE: latitude and longitude are now expected to be in geometry.coordinates,
  // but we keep the structure flexible for other properties
  [key: string]: any; 
};

// GeoJSON Feature representing a single soil prediction point
type SoilPointFeature = Feature<Point, SoilProperties>;

// The structure of the US states base map data
type StatesTopology = {
  type: "Topology";
  objects: {
    states: object;
  };
};

type StateFeature = Feature<Geometry, { id: string; name: string }>;

// State metadata (only needed for names/FIPS lookup for the base map)
const STATE_META: Record<string, { abbr: string; name: string }> = {
  "01": { abbr: "AL", name: "Alabama" },
  "02": { abbr: "AK", name: "Alaska" },
  "04": { abbr: "AZ", name: "Arizona" },
  "05": { abbr: "AR", name: "Arkansas" },
  "06": { abbr: "CA", name: "California" },
  "08": { abbr: "CO", name: "Colorado" },
  "09": { abbr: "CT", name: "Connecticut" },
  "10": { abbr: "DE", name: "Delaware" },
  "11": { abbr: "DC", name: "District of Columbia" },
  "12": { abbr: "FL", name: "Florida" },
  "13": { abbr: "GA", name: "Georgia" },
  "15": { abbr: "HI", name: "Hawaii" },
  "16": { abbr: "ID", name: "Idaho" },
  "17": { abbr: "IL", name: "Illinois" },
  "18": { abbr: "IN", name: "Indiana" },
  "19": { abbr: "IA", name: "Iowa" },
  "20": { abbr: "KS", name: "Kansas" },
  "21": { abbr: "KY", name: "Kentucky" },
  "22": { abbr: "LA", name: "Louisiana" },
  "23": { abbr: "ME", name: "Maine" },
  "24": { abbr: "MD", name: "Maryland" },
  "25": { abbr: "MA", name: "Massachusetts" },
  "26": { abbr: "MI", name: "Michigan" },
  "27": { abbr: "MN", name: "Minnesota" },
  "28": { abbr: "MS", name: "Mississippi" },
  "29": { abbr: "MO", name: "Missouri" },
  "30": { abbr: "MT", name: "Montana" },
  "31": { abbr: "NE", name: "Nebraska" },
  "32": { abbr: "NV", name: "Nevada" },
  "33": { abbr: "NH", name: "New Hampshire" },
  "34": { abbr: "NJ", name: "New Jersey" },
  "35": { abbr: "NM", name: "New Mexico" },
  "36": { abbr: "NY", name: "New York" },
  "37": { abbr: "NC", name: "North Carolina" },
  "38": { abbr: "ND", name: "North Dakota" },
  "39": { abbr: "OH", name: "Ohio" },
  "40": { abbr: "OK", name: "Oklahoma" },
  "41": { abbr: "OR", name: "Oregon" },
  "42": { abbr: "PA", name: "Pennsylvania" },
  "44": { abbr: "RI", name: "Rhode Island" },
  "45": { abbr: "SC", name: "South Carolina" },
  "46": { abbr: "SD", name: "South Dakota" },
  "47": { abbr: "TN", name: "Tennessee" },
  "48": { abbr: "TX", name: "Texas" },
  "49": { abbr: "UT", name: "Utah" },
  "50": { abbr: "VT", name: "Vermont" },
  "51": { abbr: "VA", name: "Virginia" },
  "53": { abbr: "WA", name: "Washington" },
  "54": { abbr: "WV", name: "West Virginia" },
  "55": { abbr: "WI", name: "Wisconsin" },
  "56": { abbr: "WY", name: "Wyoming" },
  "72": { abbr: "PR", name: "Puerto Rico" },
};


// --- DATA PREPARATION FUNCTIONS ---

// Function to convert TopoJSON states data into GeoJSON FeatureCollection
const buildStateFeatures = (): StateFeature[] => {
  const topology = usStatesTopology as StatesTopology;
  const collection = feature(
    topology,
    topology.objects.states,
  ) as FeatureCollection<Geometry, { id: string }>;

  // Filter features to only include states with metadata (continental US, etc.)
  const features = collection.features
    .map((shape) => {
      const stateId = String(shape.id ?? "");
      const stateMeta = STATE_META[stateId];
      if (!stateMeta) return null;
      
      return {
        ...shape,
        properties: { id: stateId, name: stateMeta.name },
      } as StateFeature;
    })
    .filter((shape): shape is StateFeature => Boolean(shape));
    
  return features;
};


// --- MAIN COMPONENT ---

export default function SoilPointsMap() {
  const [soilPoints, setSoilPoints] = useState<SoilPointFeature[] | null>(null);
  // Renamed to 'selectedPoint' to reflect click-based selection
  const [selectedPoint, setSelectedPoint] = useState<SoilPointFeature | null>(null); 
  // We keep 'hoveredPoint' state for visual feedback (bigger circle)
  const [hoveredPoint, setHoveredPoint] = useState<SoilPointFeature | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use the simpler states-only map for the base layer
  const stateFeatures = useMemo(() => buildStateFeatures(), []);
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const groupRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // 1. D3 Projection and Path Setup
  const projection = useMemo(() => {
    if (!stateFeatures.length) return null;
    const collection: FeatureCollection<Geometry, { id: string; name: string }> = {
      type: "FeatureCollection",
      features: stateFeatures,
    };
    return geoAlbersUsa().fitExtent(
      [
        [20, 20],
        [740, 460],
      ],
      collection,
    );
  }, [stateFeatures]);

  const path = useMemo(() => (projection ? geoPath(projection) : null), [projection]);


  // 2. Fetch Data from Backend
  useEffect(() => {
    const fetchSoilData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/samples");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const geojson: FeatureCollection<Point, SoilProperties> = await response.json();
        setSoilPoints(geojson.features);
      } catch (error) {
        console.error("Error fetching soil prediction data:", error);
        setSoilPoints([]); // Set to empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchSoilData();
  }, []);

  // 3. D3 Zoom Setup
  useEffect(() => {
    if (!svgRef.current || !groupRef.current) return;
    const svg = select(svgRef.current);
    const g = select(groupRef.current);
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [760, 480],
      ])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    svg.call(zoomBehavior as unknown as (selection: SVGSVGElement) => void);
    zoomRef.current = zoomBehavior;

    return () => {
      svg.on(".zoom", null);
    };
  }, []);

  const handleReset = () => {
    setSelectedPoint(null); // Reset selected point
    setHoveredPoint(null); // Reset hover state
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).call(zoomRef.current.transform, zoomIdentity);
    }
  };
  
  // New handler for click event to toggle the detail panel
  const handleClick = (point: SoilPointFeature) => {
    if (selectedPoint?.properties.id === point.properties.id) {
      setSelectedPoint(null); // Deselect if already selected
    } else {
      setSelectedPoint(point); // Select new point
    }
  };
  
  // --- RENDERING LOGIC ---
  
  const getSoilMetricValue = (point: SoilPointFeature, metricKey: string) => {
      return point.properties[metricKey];
  }

  const getColorForSoilHealth = (value: number): string => {
      if (value > 85) return "#2f855a";
      if (value > 60) return "#48a868";
      return "#ff6b6b"; 
  };


  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f5f1e8] via-[#f0ecdf] to-[#e9e2d4] text-[#1f2c1a]">
      <AppHeader
        action={
          <button
            className="rounded-full border border-[#9ab07b] px-5 py-2 text-sm font-medium text-[#2f472f] transition hover:border-[#5d7a46] hover:text-[#1f341f]"
            onClick={handleReset}
          >
            Reset Map View
          </button>
        }
      />

      <section className="relative w-full flex-1">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-[#5f714d]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#8ca36d]">ML Model Visualization</p>
            <p className="text-2xl font-semibold text-[#1f341f]">Soil Prediction Point Map</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {isLoading ? (
              <span className="text-[#a6c05c]">Loading data...</span>
            ) : (
              <span className="text-[#7c6b43]">{soilPoints?.length || 0} Predicted Samples Loaded</span>
            )}
            <span className="rounded-full border border-[#d1c5a6] px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-[#7c7355]">
              GeoJSON API Source
            </span>
          </div>
        </div>
        
        <div className="mt-4 w-full">
          <div className="relative h-[72vh] w-full">
            {path ? (
              <svg
                ref={svgRef}
                viewBox="0 0 760 480"
                className="h-full w-full"
                role="img"
                aria-label="Interactive US state map with soil prediction points"
                // Removed global onMouseLeave here, handled by individual points
              >
                <g ref={groupRef}>
                  {/* --- RENDER US STATE BOUNDARIES --- */}
                  {stateFeatures.map((stateFeature) => (
                    <path
                      key={stateFeature.properties.id}
                      d={path(stateFeature) ?? undefined}
                      className="cursor-default"
                      style={{
                        fill: "#e0e0e0", 
                        stroke: "rgba(82, 102, 77, 0.8)",
                        strokeWidth: 0.8,
                      }}
                    >
                      <title>{stateFeature.properties.name}</title> 
                    </path>
                  ))}
                  
                  {/* --- RENDER SOIL PREDICTION POINTS (from GeoJSON) --- */}
                  {soilPoints?.map((pointFeature) => {
                    // GeoJSON Point geometry is [lon, lat]
                    const [lon, lat] = pointFeature.geometry.coordinates; 
                    const coords = projection(pointFeature.geometry.coordinates);
                    const properties = pointFeature.properties;
                    
                    if (!coords) return null;

                    // Example: Using 'oc_usda.c729_w.pct' (Organic Carbon) to drive color
                    const ocValue = getSoilMetricValue(pointFeature, 'oc_usda.c729_w.pct') || 0;
                    const fill = getColorForSoilHealth(ocValue);
                    
                    // Highlight if hovered OR selected
                    const isHovered = hoveredPoint?.properties.id === properties.id;
                    const isSelected = selectedPoint?.properties.id === properties.id;
                    const radius = isHovered || isSelected ? 4 : 2.5;

                    return (
                      <circle
                        key={properties.id}
                        cx={coords[0]}
                        cy={coords[1]}
                        r={radius} 
                        fill={fill} 
                        stroke={isSelected ? "#b83232" : (isHovered ? "#1f341f" : "#fff")} // Red stroke for selected
                        strokeWidth={isSelected ? 1.5 : 0.5}
                        className="transition duration-150 ease-out cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(pointFeature)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onClick={() => handleClick(pointFeature)} // <--- CLICK HANDLER ADDED
                        style={{ filter: isHovered || isSelected ? "drop-shadow(0 0 5px rgba(0, 0, 0, 0.5))" : "none" }}
                      >
                        <title>
                          {/* Use 'lat' and 'lon' variables from geometry */}
                          {`ID: ${properties.id} 
                          OC %: ${ocValue.toFixed(2)}
                          Lat/Lon: ${lat.toFixed(2)}, ${lon.toFixed(2)}`}
                        </title>
                      </circle>
                    );
                  })}
                </g>
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#7b7056]">Loading map projection...</div>
            )}
            
            {/* --- HOVER DETAILS PANEL (Modified for selectedPoint and scrollable) --- */}
            {selectedPoint && (
              <div 
                className="absolute top-6 right-6 rounded-2xl border border-[#d1c7a6] bg-white/90 p-4 shadow-xl backdrop-blur"
                style={{ width: '300px', maxHeight: '90%', overflowY: 'auto' }} // <--- SCROLLABLE STYLES ADDED
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[#b83232] font-bold">
                  Selected Sample Details
                  <button className="ml-4 text-[#8c9484] hover:text-[#5c6c50]" onClick={() => setSelectedPoint(null)} aria-label="Close details panel">
                      &times;
                  </button>
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[#1f341f]">Sample ID: {selectedPoint.properties.id}</h3>
                <p className="text-sm text-[#5c6c50]">Lat: {selectedPoint.geometry.coordinates[1].toFixed(4)}, Lon: {selectedPoint.geometry.coordinates[0].toFixed(4)}</p>

                <hr className="my-3 border-t border-[#d1c7a6]" />

                {/* Dynamically displaying ALL predicted metrics */}
                <dl className="text-sm space-y-2">
                  {Object.entries(selectedPoint.properties)
                    // Filter out metadata and description keys that shouldn't be listed
                    .filter(([key]) => 
                      !['id', 'descriptions', 'country', 'latitude', 'longitude'].includes(key)
                    ) 
                    .map(([key, value]) => {
                      // Look up the human-readable description if available
                      const description = selectedPoint.properties.descriptions?.[key];
                      
                      if (typeof value === 'number') {
                        return (
                          <div key={key}>
                            <dt className="font-medium text-[#5c6c50]">{description || key}</dt>
                            <dd className="text-base font-semibold text-[#2f855a]">
                              {value.toFixed(3)}
                              {key.includes('pct') ? ' %' : (key.includes('mg.kg') ? ' mg/kg' : '')} 
                            </dd>
                          </div>
                        );
                      }
                      return null;
                    })
                  }
                </dl>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <aside className="rounded-3xl border border-[#d8cfb4] bg-white/90 px-6 py-5 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-[#7c6b43]">Integration Note</p>
          <p className="mt-2 text-sm text-[#5c6c50]">
            This page successfully fetches the GeoJSON FeatureCollection from 
            <code className="bg-gray-100 p-1 rounded">/api/samples</code>. The ML model predictions 
            are displayed as colored points on the map using the **GeoJSON `geometry.coordinates`** and properties are read from the **GeoJSON `properties`** field for styling and the detail panel.
          </p>
        </aside>
      </div>
    </div>
  );
}