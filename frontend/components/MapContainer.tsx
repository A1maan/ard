"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type MapContainerProps = {
  center: [number, number];
  zoom: number;
  onCenterChange?: (center: [number, number]) => void;
  onZoomChange?: (zoom: number) => void;
  onMapReady?: (map: L.Map) => void;
};

export type MapContainerRef = {
  getMap: () => L.Map | null;
  flyTo: (center: [number, number], zoom: number) => void;
};

const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
  function MapContainer(
    { center, zoom, onCenterChange, onZoomChange, onMapReady },
    ref
  ) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useImperativeHandle(ref, () => ({
      getMap: () => mapInstanceRef.current,
      flyTo: (center: [number, number], zoom: number) => {
        mapInstanceRef.current?.flyTo(center, zoom, {
          duration: 2,
          easeLinearity: 0.25,
        });
      },
    }));

    useEffect(() => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Initialize the map
      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Add satellite tile layer
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
        }
      ).addTo(map);

      // Add labels layer on top
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
        }
      ).addTo(map);

      // Event handlers
      map.on("moveend", () => {
        const newCenter = map.getCenter();
        onCenterChange?.([newCenter.lat, newCenter.lng]);
      });

      map.on("zoomend", () => {
        onZoomChange?.(map.getZoom());
      });

      mapInstanceRef.current = map;
      onMapReady?.(map);

      return () => {
        map.remove();
        mapInstanceRef.current = null;
      };
    }, []);

    // Update center when prop changes
    useEffect(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(center, mapInstanceRef.current.getZoom());
      }
    }, [center]);

    // Update zoom when prop changes
    useEffect(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setZoom(zoom);
      }
    }, [zoom]);

    return (
      <>
        <div ref={mapRef} className="map-container" />
        <style jsx>{`
          .map-container {
            width: 100%;
            height: 100%;
          }
        `}</style>
        <style jsx global>{`
          .leaflet-container {
            background: #1a1a2e;
            font-family: inherit;
          }
        `}</style>
      </>
    );
  }
);

export default MapContainer;
