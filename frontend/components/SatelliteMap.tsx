"use client";

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { MapContainerRef } from "./MapContainer";

// We need to dynamically import the map to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("./MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="loading-spinner" />
      <p>Loading satellite imagery...</p>
      <style jsx>{`
        .map-loading {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #1a1a2e;
          color: #9aa0a6;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #3c4043;
          border-top-color: #4fc3f7;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  ),
});

type SatelliteMapProps = {
  center?: [number, number];
  zoom?: number;
  onCenterChange?: (center: [number, number]) => void;
  onZoomChange?: (zoom: number) => void;
  onMapReady?: (map: unknown) => void;
};

export type SatelliteMapRef = {
  flyTo: (center: [number, number], zoom: number) => void;
  getMap: () => unknown | null;
};

export const SatelliteMap = forwardRef<SatelliteMapRef, SatelliteMapProps>(
  function SatelliteMap(
    {
      center = [28.24, 64.46],
      zoom = 4,
      onCenterChange,
      onZoomChange,
      onMapReady,
    },
    ref
  ) {
    const mapRef = useRef<MapContainerRef>(null);
    const [isReady, setIsReady] = useState(false);
    const pendingFlyToRef = useRef<{ center: [number, number]; zoom: number } | null>(null);

    useImperativeHandle(ref, () => ({
      flyTo: (center: [number, number], zoom: number) => {
        if (mapRef.current) {
          mapRef.current.flyTo(center, zoom);
        } else {
          // Store for later when map is ready
          pendingFlyToRef.current = { center, zoom };
        }
      },
      getMap: () => mapRef.current?.getMap() ?? null,
    }));

    const handleMapReady = (map: unknown) => {
      setIsReady(true);
      onMapReady?.(map);
      
      // Execute pending flyTo if any
      if (pendingFlyToRef.current && mapRef.current) {
        mapRef.current.flyTo(pendingFlyToRef.current.center, pendingFlyToRef.current.zoom);
        pendingFlyToRef.current = null;
      }
    };

    return (
      <div className="satellite-map-container">
        <MapComponent
          ref={mapRef}
          center={center}
          zoom={zoom}
          onCenterChange={onCenterChange}
          onZoomChange={onZoomChange}
          onMapReady={handleMapReady}
        />
        <style jsx>{`
          .satellite-map-container {
            width: 100%;
            height: 100%;
            position: relative;
          }
        `}</style>
      </div>
    );
  }
);
