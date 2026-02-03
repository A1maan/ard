"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { FarmListItem } from "@/lib/api";

type FarmMarkersProps = {
  farms: FarmListItem[];
  onFarmClick?: (farm: FarmListItem) => void;
};

function getHealthColor(health: string): string {
  return health === "good"
    ? "#4ade80"
    : health === "warning"
    ? "#facc15"
    : "#f87171";
}

// Create an SVG circle icon as a data URL
function createCircleIcon(color: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Component that manages all farm markers and boundaries
function FarmMarkersLayer({ farms, onFarmClick }: FarmMarkersProps) {
  const map = useMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers and circles
    markersRef.current.forEach((marker) => marker.setMap(null));
    circlesRef.current.forEach((circle) => circle.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    // Create shared InfoWindow
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    // Create markers and circles for each farm
    farms.forEach((farm) => {
      const [lat, lng] = farm.coordinates;
      const color = getHealthColor(farm.health);

      // Create boundary circle
      const circle = new google.maps.Circle({
        map,
        center: { lat, lng },
        radius: 500,
        fillColor: color,
        fillOpacity: 0.15,
        strokeColor: color,
        strokeWeight: 2,
        strokeOpacity: 0.6,
      });
      circlesRef.current.push(circle);

      // Create marker
      const marker = new google.maps.Marker({
        map,
        position: { lat, lng },
        icon: {
          url: createCircleIcon(color),
          scaledSize: new google.maps.Size(20, 20),
          anchor: new google.maps.Point(10, 10),
        },
      });
      markersRef.current.push(marker);

      // Add click listener
      marker.addListener("click", () => {
        onFarmClick?.(farm);

        const content = `
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; min-width: 150px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1a1a2e;">
              ${farm.name}
            </h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
              ${farm.location}
            </p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
              Soil: ${farm.soilType}
            </p>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
              <span style="font-size: 12px; color: #333; font-weight: 500;">
                Health: ${farm.healthScore}%
              </span>
            </div>
            <a href="/farm/${farm.id}" style="display: block; text-align: center; background: #4ade80; color: #1a1a2e; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600;">
              View Details
            </a>
          </div>
        `;

        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(map, marker);
      });
    });

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      circlesRef.current.forEach((circle) => circle.setMap(null));
      infoWindowRef.current?.close();
    };
  }, [map, farms, onFarmClick]);

  return null;
}

export function FarmMarkers({ farms, onFarmClick }: FarmMarkersProps) {
  return <FarmMarkersLayer farms={farms} onFarmClick={onFarmClick} />;
}
