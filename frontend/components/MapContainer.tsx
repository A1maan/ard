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
    const initializedRef = useRef(false);
    const isUserInteractionRef = useRef(false);

    useImperativeHandle(ref, () => ({
      getMap: () => mapInstanceRef.current,
      flyTo: (center: [number, number], zoom: number) => {
        if (mapInstanceRef.current) {
          isUserInteractionRef.current = false;
          mapInstanceRef.current.flyTo(center, zoom, {
            duration: 2,
            easeLinearity: 0.25,
          });
        }
      },
    }));

    useEffect(() => {
      if (!mapRef.current || initializedRef.current) return;
      initializedRef.current = true;

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

      // Track user interaction
      map.on("dragstart", () => {
        isUserInteractionRef.current = true;
      });
      
      map.on("zoomstart", () => {
        isUserInteractionRef.current = true;
      });

      // Only notify parent of changes during user interaction
      map.on("moveend", () => {
        if (isUserInteractionRef.current) {
          const newCenter = map.getCenter();
          onCenterChange?.([newCenter.lat, newCenter.lng]);
        }
      });

      map.on("zoomend", () => {
        if (isUserInteractionRef.current) {
          onZoomChange?.(map.getZoom());
          isUserInteractionRef.current = false;
        }
      });

      mapInstanceRef.current = map;
      onMapReady?.(map);

      return () => {
        map.remove();
        mapInstanceRef.current = null;
        initializedRef.current = false;
      };
    }, []);

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
