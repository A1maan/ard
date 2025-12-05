"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import countiesTopology from "us-atlas/counties-10m.json" assert { type: "json" }; // Still importing the county file, but using the states object inside it
import { AppHeader } from "@/components/AppHeader";

// --- NEW TYPE FOR GEOGRAPHICAL POINTS ---
type GeoPoint = {
  id: string;          // A unique identifier for the point
  lat: number;         // Latitude
  lon: number;         // Longitude
  value: number;       // The metric/value you want to display
};
// ----------------------------------------

type RegionProperties = {
  id: string; // Now a 2-digit State FIPS code
  name: string; // Now the State name
  stateAbbr: string;
  stateName: string;
  region: string;
};

type RegionFeature = Feature<Geometry, RegionProperties>;

// ❌ REMOVED: StateMetrics type is no longer necessary for the state map
// ❌ REMOVED: CountiesTopology type is simplified since we only use the states object
type CountiesTopology = {
  type: "Topology";
  objects: {
    states: object; // Using the states object from the topology
    counties: object; // Still exists in the file, but we only reference 'states'
  };
};


const STATE_META: Record<string, { abbr: string; name: string; region: string }> = {
  "01": { abbr: "AL", name: "Alabama", region: "Southeast" },
  "02": { abbr: "AK", name: "Alaska", region: "Northwest" },
  "04": { abbr: "AZ", name: "Arizona", region: "Southwest" },
  "05": { abbr: "AR", name: "Arkansas", region: "Southeast" },
  "06": { abbr: "CA", name: "California", region: "West Coast" },
  "08": { abbr: "CO", name: "Colorado", region: "Mountain" },
  "09": { abbr: "CT", name: "Connecticut", region: "New England" },
  "10": { abbr: "DE", name: "Delaware", region: "Mid-Atlantic" },
  "11": { abbr: "DC", name: "District of Columbia", region: "Mid-Atlantic" },
  "12": { abbr: "FL", name: "Florida", region: "Southeast" },
  "13": { abbr: "GA", name: "Georgia", region: "Southeast" },
  "15": { abbr: "HI", name: "Hawaii", region: "Pacific" },
  "16": { abbr: "ID", name: "Idaho", region: "Mountain" },
  "17": { abbr: "IL", name: "Illinois", region: "Midwest" },
  "18": { abbr: "IN", name: "Indiana", region: "Midwest" },
  "19": { abbr: "IA", name: "Iowa", region: "Midwest" },
  "20": { abbr: "KS", name: "Kansas", region: "Plains" },
  "21": { abbr: "KY", name: "Kentucky", region: "Southeast" },
  "22": { abbr: "LA", name: "Louisiana", region: "Gulf Coast" },
  "23": { abbr: "ME", name: "Maine", region: "New England" },
  "24": { abbr: "MD", name: "Maryland", region: "Mid-Atlantic" },
  "25": { abbr: "MA", name: "Massachusetts", region: "New England" },
  "26": { abbr: "MI", name: "Michigan", region: "Great Lakes" },
  "27": { abbr: "MN", name: "Minnesota", region: "Upper Midwest" },
  "28": { abbr: "MS", name: "Mississippi", region: "Southeast" },
  "29": { abbr: "MO", name: "Missouri", region: "Midwest" },
  "30": { abbr: "MT", name: "Montana", region: "Mountain" },
  "31": { abbr: "NE", name: "Nebraska", region: "Plains" },
  "32": { abbr: "NV", name: "Nevada", region: "Southwest" },
  "33": { abbr: "NH", name: "New Hampshire", region: "New England" },
  "34": { abbr: "NJ", name: "New Jersey", region: "Mid-Atlantic" },
  "35": { abbr: "NM", name: "New Mexico", region: "Southwest" },
  "36": { abbr: "NY", name: "New York", region: "Mid-Atlantic" },
  "37": { abbr: "NC", name: "North Carolina", region: "Southeast" },
  "38": { abbr: "ND", name: "North Dakota", region: "Plains" },
  "39": { abbr: "OH", name: "Ohio", region: "Midwest" },
  "40": { abbr: "OK", name: "Oklahoma", region: "Plains" },
  "41": { abbr: "OR", name: "Oregon", region: "Pacific Northwest" },
  "42": { abbr: "PA", name: "Pennsylvania", region: "Mid-Atlantic" },
  "44": { abbr: "RI", name: "Rhode Island", region: "New England" },
  "45": { abbr: "SC", name: "South Carolina", region: "Southeast" },
  "46": { abbr: "SD", name: "South Dakota", region: "Plains" },
  "47": { abbr: "TN", name: "Tennessee", region: "Southeast" },
  "48": { abbr: "TX", name: "Texas", region: "Gulf Coast" },
  "49": { abbr: "UT", name: "Utah", region: "Mountain" },
  "50": { abbr: "VT", name: "Vermont", region: "New England" },
  "51": { abbr: "VA", name: "Virginia", region: "Mid-Atlantic" },
  "53": { abbr: "WA", name: "Washington", region: "Pacific Northwest" },
  "54": { abbr: "WV", name: "West Virginia", region: "Appalachia" },
  "55": { abbr: "WI", name: "Wisconsin", region: "Great Lakes" },
  "56": { abbr: "WY", name: "Wyoming", region: "Mountain" },
  "72": { abbr: "PR", name: "Puerto Rico", region: "Territories" },
};

// --- MOCK DATA FOR THE GEOGRAPHICAL POINTS ---
const LIVE_POINTS: GeoPoint[] = [
  { id: "S1", lat: 36.7378, lon: -119.7871, value: 75 }, // Near Fresno, CA
  { id: "S2", lat: 34.0522, lon: -118.2437, value: 92 }, // Near Los Angeles, CA
  { id: "S3", lat: 29.7604, lon: -95.3698, value: 88 },  // Near Houston, TX
  { id: "S4", lat: 40.7128, lon: -74.0060, value: 65 },  // Near New York City, NY
  { id: "S5", lat: 38.9072, lon: -77.0369, value: 81 },  // Near Washington D.C., DC
];
// ---------------------------------------------


const DEFAULT_REGION_ID = "06"; // Now the State FIPS code for California (CA)

// ❌ REMOVED: SUMMARY_TILES (since the metrics are removed, these details are inaccurate)
// ❌ REMOVED: SIGNAL_REGIONS (only county IDs are listed here)
// ❌ REMOVED: PRESET_METRICS (county-level data)

type RegionData = {
  features: RegionFeature[];
  lookup: Record<string, RegionProperties>;
};

// --- MODIFIED buildRegionData TO USE STATES GEOMETRY ---
const buildRegionData = (): RegionData => {
  const topology = countiesTopology as CountiesTopology;

  // KEY CHANGE: Use topology.objects.states instead of topology.objects.counties
  const collection = feature(
    topology,
    topology.objects.states,
  ) as FeatureCollection<Geometry, { id: string; properties: { name?: string } }>;

  const lookup: Record<string, RegionProperties> = {};

  const features = collection.features
    .map((shape) => {
      const stateId = String(shape.id ?? ""); // ID is now the 2-digit State FIPS
      if (!stateId) return null;

      const stateMeta = STATE_META[stateId];
      if (!stateMeta) return null;

      const props: RegionProperties = {
        id: stateId, // Use the 2-digit state code
        name: stateMeta.name, // Use the state name
        stateAbbr: stateMeta.abbr,
        stateName: stateMeta.name,
        region: stateMeta.region,
      };

      lookup[stateId] = props;
      return {
        ...shape,
        properties: props,
      } as RegionFeature;
    })
    .filter((shape): shape is RegionFeature => Boolean(shape));

  return { features, lookup };
};
// --------------------------------------------------------

// ❌ REMOVED: getFallbackMetrics
// ❌ REMOVED: getMetrics (we are now using the LIVE_POINTS data for visualization instead)

// Function to provide placeholder metrics for the UI details panel (since real metrics were removed)
const getPlaceholderMetrics = () => ({
  activeSensors: LIVE_POINTS.length * 10,
  coverage: 75,
  avgLatency: 180,
  energyUse: 2.1,
  soilHealth: 68,
  yoyChange: 4.5,
});

const formatNumber = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function Home() {
  const { features: regionFeatures, lookup: regionLookup } = useMemo(
    () => buildRegionData(),
    [],
  );
  // Default region is now a state ID (CA - "06")
  const [selectedRegion, setSelectedRegion] = useState(DEFAULT_REGION_ID);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const projection = useMemo(() => {
    if (!regionFeatures.length) return null;
    const collection: FeatureCollection<Geometry, RegionProperties> = {
      type: "FeatureCollection",
      features: regionFeatures,
    };
    return geoAlbersUsa().fitExtent(
      [
        [20, 20],
        [740, 460],
      ],
      collection,
    );
  }, [regionFeatures]);

  const path = useMemo(() => (projection ? geoPath(projection) : null), [projection]);

  // We are using state IDs now, but the logic remains the same
  const activeRegionId = hoveredRegion ?? selectedRegion;
  const activeMeta = regionLookup[activeRegionId];
  
  // Use placeholder metrics now
  const activeMetrics = getPlaceholderMetrics(); 

  const svgRef = useRef<SVGSVGElement | null>(null);
  const groupRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

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
  }, [regionFeatures]);

  const handleReset = () => {
    setSelectedRegion(DEFAULT_REGION_ID);
    setHoveredRegion(null);
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).call(zoomRef.current.transform, zoomIdentity);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f5f1e8] via-[#f0ecdf] to-[#e9e2d4] text-[#1f2c1a]">
      <AppHeader
        action={
          <button
            className="rounded-full border border-[#9ab07b] px-5 py-2 text-sm font-medium text-[#2f472f] transition hover:border-[#5d7a46] hover:text-[#1f341f]"
            onClick={handleReset}
          >
            Reset to California focus
          </button>
        }
      />

      <section className="relative w-full flex-1">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-[#5f714d]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#8ca36d]">Terrain intelligence</p>
            <p className="text-2xl font-semibold text-[#1f341f]">Interactive US state map</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#e63946]" />
              Live Sensor Site
            </div>
            <span className="rounded-full border border-[#d1c5a6] px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-[#7c7355]">
              zoom + drag
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
                aria-label="Interactive US state map"
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <g ref={groupRef}>
                  {regionFeatures.map((regionFeature) => {
                    const regionId = regionFeature.properties?.id;
                    if (!regionId) return null;
                    
                    // ❌ METRICS ARE NOW PLACEHOLDER - Map color is static for states
                    const isSelected = selectedRegion === regionId;
                    const isHovered = hoveredRegion === regionId;
                    
                    const fill = isSelected
                      ? "#2f855a"
                      : isHovered
                        ? "#48a868"
                        : `#e0e0e0`; // Static fill for states
                        
                    return (
                      <path
                        key={regionId}
                        d={path(regionFeature) ?? undefined}
                        onMouseEnter={() => setHoveredRegion(regionId)}
                        onMouseLeave={() => setHoveredRegion((current) => (current === regionId ? null : current))}
                        onClick={() => setSelectedRegion(regionId)}
                        className="cursor-pointer transition duration-150 ease-out"
                        style={{
                          fill,
                          // Use a border for all states
                          stroke: isSelected ? "#1f4731" : "rgba(82, 102, 77, 0.8)",
                          strokeWidth: isSelected ? 1.4 : 0.8,
                          filter: isSelected || isHovered ? "drop-shadow(0 0 10px rgba(47,133,90,0.5))" : "none",
                          transform: isSelected || isHovered ? "translateY(-1px)" : "none",
                        }}
                      >
                        {/* Title text updated to use placeholder data */}
                        <title>{`${regionFeature.properties?.name ?? "Unknown"} · State View`}</title> 
                      </path>
                    );
                  })}
                  
                  {/* --- NEW SECTION: DRAW LAT/LON POINTS --- */}
                  {projection && LIVE_POINTS.map((point) => {
                    const coords = projection([point.lon, point.lat]);
                    
                    // Check if the coordinates are valid (not outside the map bounds)
                    if (!coords) return null;

                    return (
                      <circle
                        key={point.id}
                        cx={coords[0]}
                        cy={coords[1]}
                        r={3} // Radius of the sensor point
                        fill="#e63946" // Red color for visibility
                        stroke="#a83232"
                        strokeWidth={1.5}
                        className="transition duration-150 ease-out"
                        style={{ filter: "drop-shadow(0 0 3px rgba(230, 57, 70, 0.9))" }}
                      >
                        <title>{`Sensor ${point.id}: Value ${point.value} at ${point.lat.toFixed(2)}, ${point.lon.toFixed(2)}`}</title>
                      </circle>
                    );
                  })}
                  {/* -------------------------------------- */}
                </g>
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#7b7056]">Loading map…</div>
            )}
            <div className="pointer-events-none absolute left-8 top-6 flex flex-wrap items-center gap-3 rounded-full bg-white/80 px-4 py-2 text-xs text-[#3c4e34] shadow-lg backdrop-blur-sm">
              <span>Scroll/pinch to zoom, drag to pan</span>
              {activeMeta && (
                <span className="text-sm font-semibold text-[#1f341f]">
                  Focus: {activeMeta.name}, {activeMeta.stateAbbr}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-[#d8cfb4] bg-white/85 px-6 py-6 shadow-[0_30px_65px_rgba(76,64,40,0.15)] backdrop-blur lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.25em] text-[#7c6b43]">National highlights</p>
            {/* ❌ Removed the original SUMMARY_TILES data source, but keeping the component structure */}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total Sensor Sites", value: formatNumber(LIVE_POINTS.length), detail: "across all points" },
                { label: "Map Resolution", value: "State Only", detail: "Optimized for performance" },
                { label: "Avg. Site Value", value: `${(LIVE_POINTS.reduce((sum, p) => sum + p.value, 0) / LIVE_POINTS.length).toFixed(1)}`, detail: "from live points" },
              ].map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-2xl border border-[#d4c9a8] bg-gradient-to-br from-[#fffdf7] to-[#f4eddc] px-4 py-5"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8b7b56]">{tile.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-[#1f341f]">{tile.value}</p>
                  <p className="mt-1 text-sm text-[#6a8a3c]">{tile.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* This panel now uses the active state's metadata and placeholder metrics */}
          <div className="rounded-3xl border border-[#d1c7a6] bg-white/90 p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[#7c6b43]">Selected state</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="text-2xl font-semibold text-[#1f341f]">
                {regionLookup[selectedRegion]?.name ?? "United States"}
              </h2>
              <span className="rounded-full bg-[#e8f0df] px-2 py-0.5 text-xs text-[#4a5a42]">
                {regionLookup[selectedRegion]?.stateAbbr ?? "US"}
              </span>
            </div>
            <p className="text-sm text-[#5c6c50]">
              {regionLookup[selectedRegion]?.stateName ?? "National view"} • {regionLookup[selectedRegion]?.region ?? "Multi-region"}
            </p>

            {/* Metrics now use placeholder data (getPlaceholderMetrics) */}
            <dl className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-[#d4c9a8] bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.25em] text-[#7c6b43]">Active sites (Placeholder)</dt>
                <dd className="mt-1 text-3xl font-semibold text-[#1f341f]">
                  {formatNumber(activeMetrics.activeSensors)}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#d4c9a8] bg-white px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.25em] text-[#7c6b43]">Coverage (Placeholder)</dt>
                  <dd className="mt-1 text-2xl font-semibold text-[#1f341f]">{activeMetrics.coverage}%</dd>
                  <div className="mt-2 h-1.5 rounded-full bg-[#efe9d4]">
                    <div className="h-full rounded-full bg-[#8cb255]" style={{ width: `${activeMetrics.coverage}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl border border-[#d4c9a8] bg-white px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.25em] text-[#7c6b43]">Avg latency (Placeholder)</dt>
                  <dd className="mt-1 text-2xl font-semibold text-[#1f341f]">
                    {activeMetrics.avgLatency}
                    <span className="text-base font-normal text-[#5c6c50]"> ms</span>
                  </dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#d4c9a8] bg-white px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.25em] text-[#7c6b43]">Clean energy (Placeholder)</dt>
                  <dd className="mt-1 text-2xl font-semibold text-[#1f341f]">
                    {activeMetrics.energyUse.toFixed(1)}
                    <span className="text-base font-normal text-[#5c6c50]"> GWh</span>
                  </dd>
                </div>
                <div className="rounded-2xl border border-[#d4c9a8] bg-white px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.25em] text-[#7c6b43]">Soil health (Placeholder)</dt>
                  <dd className="mt-1 text-2xl font-semibold text-[#1f341f]">{activeMetrics.soilHealth}</dd>
                </div>
              </div>
              <div className="rounded-2xl border border-[#d4c9a8] bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.25em] text-[#7c6b43]">YoY change (Placeholder)</dt>
                <dd
                  className={`mt-1 text-2xl font-semibold ${
                    activeMetrics.yoyChange >= 0 ? "text-[#3b7f2d]" : "text-rose-500"
                  }`}
                >
                  {activeMetrics.yoyChange >= 0 ? "+" : ""}
                  {activeMetrics.yoyChange.toFixed(1)}%
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ❌ REMOVED: The entire "Signals to watch" aside block, as it relied on county-level metrics (SIGNAL_REGIONS) */}
        
        <aside
          id="narrative"
          className="mt-8 grid gap-4 rounded-3xl border border-[#d8cfb4] bg-white/90 px-6 py-5 shadow-2xl"
        >
          <div className="rounded-2xl border border-[#d4c9a8] bg-gradient-to-br from-white to-[#f4eddc] px-4 py-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#7c6b43]">Narrative insight</p>
            <p className="mt-3 text-lg font-semibold text-[#1f341f]">
              {activeMeta?.name ?? "Select a state"}, {activeMeta?.stateAbbr ?? "US"} is now viewed at the state level. Live sensor data is plotted as red circles on the map.
            </p>
            <p className="mt-2 text-sm text-[#5c6c50]">
              The metric data shown below is placeholder data. To get real-time metrics, you will need to wire up the API call in the `useEffect` hook and update the `activeMetrics` state.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}