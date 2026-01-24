"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SatelliteMap, type SatelliteMapRef } from "@/components/SatelliteMap";
import { MapControls } from "@/components/MapControls";
import { StatusBar } from "@/components/StatusBar";
import { MetricsSidebar } from "@/components/MetricsSidebar";
import { SoilHeatmapLayer } from "@/components/SoilHeatmapLayer";
import { ChatButton } from "@/components/ChatButton";
import { FARMS_DATA, type Farm } from "@/components/FarmsDropdown";

export default function FarmPage() {
  const params = useParams();
  const farmId = params.id as string;
  
  const [farm, setFarm] = useState<Farm | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([24.7136, 46.6753]);
  const [mapZoom, setMapZoom] = useState(12);
  const [is3D, setIs3D] = useState(false);
  const [mapInstance, setMapInstance] = useState<unknown>(null);
  
  const mapRef = useRef<SatelliteMapRef>(null);

  useEffect(() => {
    const foundFarm = FARMS_DATA.find(f => f.id === farmId);
    if (foundFarm) {
      setFarm(foundFarm);
      setMapCenter(foundFarm.coordinates);
    }
  }, [farmId]);

  useEffect(() => {
    if (farm && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.flyTo(farm.coordinates, 12);
      }, 500);
    }
  }, [farm]);

  const handleMapReady = useCallback((map: unknown) => {
    setMapInstance(map);
  }, []);

  const handleZoomIn = useCallback(() => {
    setMapZoom((prev) => Math.min(prev + 1, 18));
  }, []);

  const handleZoomOut = useCallback(() => {
    setMapZoom((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleToggle3D = useCallback(() => {
    setIs3D((prev) => !prev);
  }, []);

  if (!farm) {
    return (
      <div className="loading-page">
        <p>Loading farm data...</p>
        <style jsx>{`
          .loading-page {
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1a1a2e;
            color: #9aa0a6;
          }
        `}</style>
      </div>
    );
  }

  return (
    <main className="farm-page">
      {/* Farm Header */}
      <header className="farm-header">
        <Link href="/farms" className="back-btn">
          <ArrowLeft size={20} />
          <span>My Farms</span>
        </Link>
        <div className="farm-title">
          <h1>{farm.name}</h1>
          <span className={`health-badge ${farm.health}`}>
            {farm.health === "good" ? "Healthy" : farm.health === "warning" ? "Needs Attention" : "Critical"}
          </span>
        </div>
        <div className="farm-meta">
          <span>{farm.size}</span>
          <span className="separator">•</span>
          <span>{farm.coordinates[0].toFixed(4)}°N, {farm.coordinates[1].toFixed(4)}°E</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="farm-content">
        {/* Metrics Sidebar - Fixed position outside map */}
        <MetricsSidebar farm={farm} />

        {/* Map Area */}
        <div className="map-area">
          <SatelliteMap
            ref={mapRef}
            center={mapCenter}
            zoom={mapZoom}
            onCenterChange={setMapCenter}
            onZoomChange={setMapZoom}
            onMapReady={handleMapReady}
          />
          
          {!!mapInstance && (
            <SoilHeatmapLayer
              map={mapInstance}
              farm={farm}
              visible={true}
            />
          )}

          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            on3DToggle={handleToggle3D}
            is3D={is3D}
          />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        coordinates={{ lat: mapCenter[0], lng: mapCenter[1] }}
        zoom={mapZoom}
      />

      {/* Chat Button */}
      <ChatButton farm={farm} />

      <style jsx>{`
        .farm-page {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #1a1a2e;
          overflow: hidden;
        }

        .farm-header {
          background: linear-gradient(180deg, #3c4043 0%, #35363a 100%);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 24px;
          border-bottom: 1px solid #5f6368;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #e8eaed;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .farm-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .farm-title h1 {
          color: #e8eaed;
          font-size: 20px;
          font-weight: 500;
          margin: 0;
        }

        .health-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .health-badge.good {
          background: rgba(52, 211, 153, 0.2);
          color: #34d399;
        }

        .health-badge.warning {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .health-badge.critical {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .farm-meta {
          margin-left: auto;
          color: #9aa0a6;
          font-size: 13px;
          display: flex;
          gap: 8px;
        }

        .separator {
          opacity: 0.5;
        }

        .farm-content {
          flex: 1;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        .map-area {
          flex: 1;
          position: relative;
        }
      `}</style>
    </main>
  );
}
