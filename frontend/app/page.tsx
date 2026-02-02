"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { EarthHeader } from "@/components/EarthHeader";
import { SatelliteMap, type SatelliteMapRef } from "@/components/SatelliteMap";
import { StatusBar } from "@/components/StatusBar";
import { MiniMap } from "@/components/MiniMap";
import { FarmMarkers } from "@/components/FarmMarkers";
import { api, type FarmListItem } from "@/lib/api";
import type L from "leaflet";

export default function Home() {
  const [mapCenter, setMapCenter] = useState<[number, number]>([24.7136, 46.6753]); // Saudi Arabia
  const [mapZoom, setMapZoom] = useState(5);
  const [farms, setFarms] = useState<FarmListItem[]>([]);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const mapRef = useRef<SatelliteMapRef>(null);

  // Fetch farms on mount
  useEffect(() => {
    async function fetchFarms() {
      try {
        const response = await api.getFarms(50);
        setFarms(response.farms);
      } catch (err) {
        console.error("Failed to fetch farms:", err);
      }
    }
    fetchFarms();
  }, []);

  const handleMapReady = useCallback((map: unknown) => {
    setMapInstance(map as L.Map);
  }, []);

  const handleSearch = useCallback((query: string) => {
    console.log("Searching for:", query);
    // TODO: Implement geocoding search
  }, []);

  // Calculate camera distance based on zoom level
  const getCameraDistance = (zoom: number): string => {
    const distances = [
      "20,000 km",
      "10,000 km",
      "6,579 km",
      "3,000 km",
      "1,500 km",
      "750 km",
      "400 km",
      "200 km",
      "100 km",
      "50 km",
      "25 km",
      "12 km",
      "6 km",
      "3 km",
      "1.5 km",
      "800 m",
      "400 m",
      "200 m",
      "100 m",
    ];
    return distances[Math.min(zoom, distances.length - 1)] || "100 m";
  };

  const zoomPercentage = Math.round((mapZoom / 18) * 100);

  return (
    <div className="earth-app">
      <EarthHeader projectName="My Farms" onSearch={handleSearch} />

      <div className="map-wrapper">
        <SatelliteMap
          ref={mapRef}
          center={mapCenter}
          zoom={mapZoom}
          onCenterChange={setMapCenter}
          onZoomChange={setMapZoom}
          onMapReady={handleMapReady}
        />

        {/* Farm markers layer */}
        <FarmMarkers 
          map={mapInstance} 
          farms={farms}
        />

        <MiniMap center={mapCenter} />

        <StatusBar
          zoom={zoomPercentage}
          cameraDistance={getCameraDistance(mapZoom)}
          coordinates={{ lat: mapCenter[0], lng: mapCenter[1] }}
        />

      </div>

      <style jsx>{`
        .earth-app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #1a1a2e;
          overflow: hidden;
        }

        .map-wrapper {
          flex: 1;
          position: relative;
          overflow: hidden;
          isolation: isolate; /* ✅ helps z-index work over canvases */
        }

      `}</style>
    </div>
  );
}
