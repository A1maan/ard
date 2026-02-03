"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { Farm } from "./FarmsDropdown";

type SoilHeatmapLayerProps = {
  farm: Farm | null;
  visible: boolean;
};

// Generate heatmap points around a farm location
const generateHeatmapPoints = (
  center: [number, number],
  healthScore: number,
  count: number = 100
): google.maps.LatLng[] => {
  const points: google.maps.LatLng[] = [];
  const healthFactor = healthScore / 100;
  
  for (let i = 0; i < count; i++) {
    // Gaussian-like distribution for natural clustering
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.abs(Math.random() + Math.random() + Math.random() - 1.5) * 0.04;
    
    const latOffset = radius * Math.cos(angle);
    const lngOffset = radius * Math.sin(angle);
    
    points.push(
      new google.maps.LatLng(center[0] + latOffset, center[1] + lngOffset)
    );
  }
  
  // Add more points near center for intensity
  for (let i = 0; i < count * healthFactor; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.abs(Math.random() * Math.random()) * 0.02;
    
    points.push(
      new google.maps.LatLng(
        center[0] + radius * Math.cos(angle),
        center[1] + radius * Math.sin(angle)
      )
    );
  }
  
  return points;
};

// Create an SVG circle icon as a data URL
function createCircleIcon(color: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// All-in-one component that manages heatmap, markers, and overlays
function SoilHeatmapLayerInner({ farm, visible }: SoilHeatmapLayerProps) {
  const map = useMap();
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const labelMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map || !farm || !visible) {
      // Cleanup
      heatmapRef.current?.setMap(null);
      markersRef.current.forEach((m) => m.setMap(null));
      polygonRef.current?.setMap(null);
      labelMarkerRef.current?.setMap(null);
      heatmapRef.current = null;
      markersRef.current = [];
      polygonRef.current = null;
      labelMarkerRef.current = null;
      return;
    }

    // Clear existing
    heatmapRef.current?.setMap(null);
    markersRef.current.forEach((m) => m.setMap(null));
    polygonRef.current?.setMap(null);
    labelMarkerRef.current?.setMap(null);
    markersRef.current = [];

    // Create shared InfoWindow
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    // Generate heatmap data points
    const heatmapPoints = generateHeatmapPoints(farm.coordinates, farm.healthScore, 150);

    // Determine gradient based on health status
    let gradient: string[];
    if (farm.healthScore >= 75) {
      // Good - Green gradient
      gradient = [
        "rgba(0, 0, 0, 0)",
        "rgba(74, 222, 128, 0.1)",
        "rgba(74, 222, 128, 0.3)",
        "rgba(34, 197, 94, 0.5)",
        "rgba(22, 163, 74, 0.7)",
      ];
    } else if (farm.healthScore >= 50) {
      // Warning - Yellow/Orange gradient
      gradient = [
        "rgba(0, 0, 0, 0)",
        "rgba(250, 204, 21, 0.1)",
        "rgba(250, 204, 21, 0.3)",
        "rgba(245, 158, 11, 0.5)",
        "rgba(234, 88, 12, 0.7)",
      ];
    } else {
      // Critical - Red gradient
      gradient = [
        "rgba(0, 0, 0, 0)",
        "rgba(248, 113, 113, 0.1)",
        "rgba(248, 113, 113, 0.3)",
        "rgba(239, 68, 68, 0.5)",
        "rgba(220, 38, 38, 0.7)",
      ];
    }

    // Create the heatmap layer
    heatmapRef.current = new google.maps.visualization.HeatmapLayer({
      data: heatmapPoints,
      map,
      radius: 40,
      opacity: 0.6,
      gradient,
    });

    // Create farm boundary polygon
    const boundaryPoints = [
      { lat: farm.coordinates[0] + 0.05, lng: farm.coordinates[1] - 0.05 },
      { lat: farm.coordinates[0] + 0.05, lng: farm.coordinates[1] + 0.05 },
      { lat: farm.coordinates[0] - 0.05, lng: farm.coordinates[1] + 0.05 },
      { lat: farm.coordinates[0] - 0.05, lng: farm.coordinates[1] - 0.05 },
    ];

    polygonRef.current = new google.maps.Polygon({
      map,
      paths: boundaryPoints,
      strokeColor: "#4ade80",
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: "#4ade80",
      fillOpacity: 0.05,
    });

    // Create soil sample markers
    const samples = [
      { offset: [0, 0], value: farm.healthScore },
      { offset: [0.02, 0.02], value: farm.healthScore + 5 },
      { offset: [-0.02, 0.02], value: farm.healthScore - 8 },
      { offset: [0.02, -0.02], value: farm.healthScore + 2 },
      { offset: [-0.02, -0.02], value: farm.healthScore - 3 },
      { offset: [0.04, 0], value: farm.healthScore + 10 },
      { offset: [-0.04, 0], value: farm.healthScore - 5 },
    ];

    samples.forEach(({ offset, value }) => {
      const clampedValue = Math.max(0, Math.min(100, value));
      const color = clampedValue > 75 ? "#4ade80" : clampedValue > 50 ? "#facc15" : "#f87171";
      const lat = farm.coordinates[0] + offset[0];
      const lng = farm.coordinates[1] + offset[1];

      const marker = new google.maps.Marker({
        map,
        position: { lat, lng },
        icon: {
          url: createCircleIcon(color),
          scaledSize: new google.maps.Size(20, 20),
          anchor: new google.maps.Point(10, 10),
        },
      });

      marker.addListener("click", () => {
        infoWindowRef.current?.setContent(`
          <div style="text-align: center; padding: 4px;">
            <strong>Soil Sample Point</strong><br/>
            Health Score: <span style="color: ${color}; font-weight: bold;">${clampedValue}%</span>
          </div>
        `);
        infoWindowRef.current?.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Create farm label marker
    labelMarkerRef.current = new google.maps.Marker({
      map,
      position: { lat: farm.coordinates[0], lng: farm.coordinates[1] },
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>')}`,
        scaledSize: new google.maps.Size(1, 1),
      },
      label: {
        text: farm.name,
        color: "#4ade80",
        fontSize: "12px",
        fontWeight: "600",
        className: "farm-label-marker",
      },
    });

    return () => {
      heatmapRef.current?.setMap(null);
      markersRef.current.forEach((m) => m.setMap(null));
      polygonRef.current?.setMap(null);
      labelMarkerRef.current?.setMap(null);
      infoWindowRef.current?.close();
    };
  }, [map, farm, visible]);

  return null;
}

export function SoilHeatmapLayer({ farm, visible }: SoilHeatmapLayerProps) {
  if (!farm || !visible) return null;
  return <SoilHeatmapLayerInner farm={farm} visible={visible} />;
}
