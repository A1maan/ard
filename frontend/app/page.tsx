"use client";

import { useState, useCallback, useRef } from "react";
import { EarthHeader } from "@/components/EarthHeader";
import { SatelliteMap, type SatelliteMapRef } from "@/components/SatelliteMap";
import { MapControls } from "@/components/MapControls";
import { StatusBar } from "@/components/StatusBar";
import { MiniMap } from "@/components/MiniMap";
import { SoilDashboard } from "@/components/SoilDashboard";
import { SoilHeatmapLayer } from "@/components/SoilHeatmapLayer";
import { ChatButton } from "@/components/ChatButton";
import type { Farm } from "@/components/FarmsDropdown";

export default function Home() {
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.24, 64.46]);
  const [mapZoom, setMapZoom] = useState(4);
  const [is3D, setIs3D] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [mapInstance, setMapInstance] = useState<unknown>(null);
  
  const mapRef = useRef<SatelliteMapRef>(null);

  const handleSearch = useCallback((query: string) => {
    console.log("Searching for:", query);
    // TODO: Implement geocoding search
  }, []);

  const handleSelectFarm = useCallback((farm: Farm) => {
    setSelectedFarm(farm);
    setShowDashboard(true);
    
    // Fly to the farm location
    mapRef.current?.flyTo(farm.coordinates, 12);
  }, []);

  const handleCloseDashboard = useCallback(() => {
    setShowDashboard(false);
  }, []);

  const handleMapReady = useCallback((map: unknown) => {
    setMapInstance(map as L.Map);
  }, []);

  const handleZoomIn = useCallback(() => {
    setMapZoom((prev) => Math.min(prev + 1, 18));
  }, []);

  const handleZoomOut = useCallback(() => {
    setMapZoom((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleReset = useCallback(() => {
    setMapCenter([28.24, 64.46]);
    setMapZoom(4);
    setSelectedFarm(null);
    setShowDashboard(false);
  }, []);

  const handle3DToggle = useCallback(() => {
    setIs3D((prev) => !prev);
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

  // Calculate zoom percentage
  const zoomPercentage = Math.round((mapZoom / 18) * 100);

  return (
    <div className="earth-app">
      <EarthHeader
        projectName="My Farm"
        onSearch={handleSearch}
        selectedFarm={selectedFarm}
        onSelectFarm={handleSelectFarm}
      />
      
      <div className="map-wrapper">
        <SatelliteMap
          ref={mapRef}
          center={mapCenter}
          zoom={mapZoom}
          onCenterChange={setMapCenter}
          onZoomChange={setMapZoom}
          onMapReady={handleMapReady}
        />
        
        {/* Soil Heatmap Layer */}
        <SoilHeatmapLayer
          map={mapInstance}
          farm={selectedFarm}
          visible={showDashboard && !!selectedFarm}
        />
        
        {/* Soil Dashboard Sidebar */}
        {selectedFarm && (
          <SoilDashboard
            farm={selectedFarm}
            isOpen={showDashboard}
            onClose={handleCloseDashboard}
          />
        )}
        
        <MiniMap center={mapCenter} />
        
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          on3DToggle={handle3DToggle}
          is3D={is3D}
        />
        
        {/* Chat Button */}
        <ChatButton farm={selectedFarm} />
        
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
        }
      `}</style>
    </div>
  );
}