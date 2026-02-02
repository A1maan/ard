"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { FarmListItem } from "@/lib/api";

type FarmMarkersProps = {
  map: L.Map | null;
  farms: FarmListItem[];
  onFarmClick?: (farm: FarmListItem) => void;
};

export function FarmMarkers({ map, farms, onFarmClick }: FarmMarkersProps) {
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create a layer group to hold all markers
    if (!markersLayerRef.current) {
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add markers for each farm
    farms.forEach((farm) => {
      const [lat, lng] = farm.coordinates;
      
      // Determine color based on health
      const color = farm.health === "good" 
        ? "#4ade80" 
        : farm.health === "warning" 
        ? "#facc15" 
        : "#f87171";

      // Create a circle marker (dot)
      const marker = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: color,
        fillOpacity: 0.9,
        color: "#ffffff",
        weight: 2,
        opacity: 1,
      });

      // Add popup with farm info
      marker.bindPopup(`
        <div style="
          font-family: system-ui, -apple-system, sans-serif;
          padding: 4px;
          min-width: 150px;
        ">
          <h3 style="
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 600;
            color: #1a1a2e;
          ">${farm.name}</h3>
          <p style="
            margin: 0 0 4px 0;
            font-size: 12px;
            color: #666;
          ">${farm.location}</p>
          <p style="
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #666;
          ">Soil: ${farm.soilType}</p>
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 8px;
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${color};
            "></span>
            <span style="
              font-size: 12px;
              color: #333;
              font-weight: 500;
            ">Health: ${farm.healthScore}%</span>
          </div>
          <a href="/farm/${farm.id}" style="
            display: block;
            text-align: center;
            background: #4ade80;
            color: #1a1a2e;
            padding: 6px 12px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 12px;
            font-weight: 600;
          ">View Details</a>
        </div>
      `);

      // Add click handler
      marker.on("click", () => {
        onFarmClick?.(farm);
      });

      // Add to layer group
      markersLayerRef.current?.addLayer(marker);
    });

    return () => {
      // Cleanup on unmount
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
      }
    };
  }, [map, farms, onFarmClick]);

  return null;
}
