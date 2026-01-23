"use client";

import { useEffect, useRef, useState } from "react";
import type { Farm } from "./FarmsDropdown";

type SoilHeatmapLayerProps = {
  map: L.Map | null;
  farm: Farm | null;
  visible: boolean;
};

// Generate heatmap points around a farm location
const generateHeatmapPoints = (
  center: [number, number],
  count: number = 50
): [number, number, number][] => {
  const points: [number, number, number][] = [];
  
  for (let i = 0; i < count; i++) {
    // Random offset within ~5km radius
    const latOffset = (Math.random() - 0.5) * 0.1;
    const lngOffset = (Math.random() - 0.5) * 0.1;
    const intensity = 0.3 + Math.random() * 0.7; // Random intensity 0.3-1.0
    
    points.push([
      center[0] + latOffset,
      center[1] + lngOffset,
      intensity,
    ]);
  }
  
  return points;
};

export function SoilHeatmapLayer({ map, farm, visible }: SoilHeatmapLayerProps) {
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  // Dynamically import Leaflet to avoid SSR issues
  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  useEffect(() => {
    if (!L || !map || !farm || !visible) {
      // Clean up if not visible
      if (markersRef.current && map) {
        map.removeLayer(markersRef.current);
        markersRef.current = null;
      }
      return;
    }

    // Clean up previous layer
    if (markersRef.current) {
      map.removeLayer(markersRef.current);
    }

    // Create heatmap points
    const heatmapPoints = generateHeatmapPoints(farm.coordinates, 80);
    
    // Create circle markers with gradient for heatmap effect
    const markers = L.layerGroup();
    
    heatmapPoints.forEach(([lat, lng, intensity]) => {
      // Determine color based on intensity and farm health
      const healthFactor = farm.healthScore / 100;
      const r = Math.round(255 * (1 - intensity * healthFactor));
      const g = Math.round(180 * intensity * healthFactor);
      const b = Math.round(50);
      
      const color = `rgba(${r}, ${g}, ${b}, ${intensity * 0.6})`;
      
      const circle = L.circleMarker([lat, lng], {
        radius: 15 + intensity * 20,
        fillColor: color,
        fillOpacity: 0.5,
        stroke: false,
        interactive: false,
      });
      
      markers.addLayer(circle);
    });

    // Add soil sample markers (larger, more visible points)
    const samplePoints = [
      { offset: [0, 0], value: farm.healthScore },
      { offset: [0.02, 0.02], value: farm.healthScore + 5 },
      { offset: [-0.02, 0.02], value: farm.healthScore - 8 },
      { offset: [0.02, -0.02], value: farm.healthScore + 2 },
      { offset: [-0.02, -0.02], value: farm.healthScore - 3 },
      { offset: [0.04, 0], value: farm.healthScore + 10 },
      { offset: [-0.04, 0], value: farm.healthScore - 5 },
    ];

    samplePoints.forEach(({ offset, value }) => {
      const clampedValue = Math.max(0, Math.min(100, value));
      const color = clampedValue > 75 ? "#4ade80" : clampedValue > 50 ? "#facc15" : "#f87171";
      
      const marker = L.circleMarker(
        [farm.coordinates[0] + offset[0], farm.coordinates[1] + offset[1]],
        {
          radius: 8,
          fillColor: color,
          fillOpacity: 0.9,
          color: "#fff",
          weight: 2,
        }
      );
      
      marker.bindPopup(`
        <div style="text-align: center; padding: 4px;">
          <strong>Soil Sample Point</strong><br/>
          Health Score: <span style="color: ${color}; font-weight: bold;">${clampedValue}%</span>
        </div>
      `);
      
      markers.addLayer(marker);
    });

    // Add farm boundary polygon
    const boundaryPoints: [number, number][] = [
      [farm.coordinates[0] + 0.05, farm.coordinates[1] - 0.05],
      [farm.coordinates[0] + 0.05, farm.coordinates[1] + 0.05],
      [farm.coordinates[0] - 0.05, farm.coordinates[1] + 0.05],
      [farm.coordinates[0] - 0.05, farm.coordinates[1] - 0.05],
    ];
    
    const boundary = L.polygon(boundaryPoints, {
      color: "#4ade80",
      weight: 2,
      fillColor: "#4ade80",
      fillOpacity: 0.1,
      dashArray: "5, 10",
    });
    
    markers.addLayer(boundary);

    // Add farm label
    const farmLabel = L.marker(farm.coordinates, {
      icon: L.divIcon({
        className: "farm-label",
        html: `<div style="
          background: rgba(30, 30, 46, 0.9);
          color: #4ade80;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          border: 1px solid rgba(74, 222, 128, 0.3);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">${farm.name}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, -20],
      }),
    });
    
    markers.addLayer(farmLabel);

    markers.addTo(map);
    markersRef.current = markers;

    return () => {
      if (markersRef.current) {
        map.removeLayer(markersRef.current);
        markersRef.current = null;
      }
    };
  }, [L, map, farm, visible]);

  return null;
}
