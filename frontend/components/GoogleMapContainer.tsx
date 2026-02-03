"use client";

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, type ReactNode } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

type GoogleMapContainerProps = {
  center: [number, number]; // [lat, lng]
  zoom: number;
  onCenterChange?: (center: [number, number]) => void;
  onZoomChange?: (zoom: number) => void;
  onMapReady?: (map: google.maps.Map) => void;
  children?: ReactNode;
};

export type GoogleMapContainerRef = {
  getMap: () => google.maps.Map | null;
  flyTo: (center: [number, number], zoom: number) => void;
};

// Inner component that has access to the map instance
function MapController({
  center,
  zoom,
  onCenterChange,
  onZoomChange,
  onMapReady,
  mapRef,
}: GoogleMapContainerProps & { mapRef: React.MutableRefObject<google.maps.Map | null> }) {
  const map = useMap();
  const isUserInteractionRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!map) return;
    
    mapRef.current = map;
    
    if (!initializedRef.current) {
      initializedRef.current = true;
      onMapReady?.(map);
    }

    // Track user interaction
    const dragStartListener = map.addListener("dragstart", () => {
      isUserInteractionRef.current = true;
    });

    const idleListener = map.addListener("idle", () => {
      if (isUserInteractionRef.current) {
        const newCenter = map.getCenter();
        if (newCenter) {
          onCenterChange?.([newCenter.lat(), newCenter.lng()]);
        }
        onZoomChange?.(map.getZoom() || zoom);
        isUserInteractionRef.current = false;
      }
    });

    const zoomChangedListener = map.addListener("zoom_changed", () => {
      // Only track if it's from user interaction (scroll/buttons)
      if (!isUserInteractionRef.current) {
        isUserInteractionRef.current = true;
      }
    });

    return () => {
      google.maps.event.removeListener(dragStartListener);
      google.maps.event.removeListener(idleListener);
      google.maps.event.removeListener(zoomChangedListener);
    };
  }, [map, onCenterChange, onZoomChange, onMapReady, zoom, mapRef]);

  return null;
}

const GoogleMapContainer = forwardRef<GoogleMapContainerRef, GoogleMapContainerProps>(
  function GoogleMapContainer(
    { center, zoom, onCenterChange, onZoomChange, onMapReady, children },
    ref
  ) {
    const mapRef = useRef<google.maps.Map | null>(null);

    useImperativeHandle(ref, () => ({
      getMap: () => mapRef.current,
      flyTo: (newCenter: [number, number], newZoom: number) => {
        if (mapRef.current) {
          mapRef.current.panTo({ lat: newCenter[0], lng: newCenter[1] });
          mapRef.current.setZoom(newZoom);
        }
      },
    }));

    if (!GOOGLE_MAPS_API_KEY) {
      return (
        <div className="map-error">
          <p>Google Maps API key not configured.</p>
          <p>Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.</p>
          <style jsx>{`
            .map-error {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: #1a1a2e;
              color: #f87171;
              font-size: 14px;
              gap: 8px;
            }
          `}</style>
        </div>
      );
    }

    return (
      <div className="google-map-container">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["visualization"]}>
          <Map
            defaultCenter={{ lat: center[0], lng: center[1] }}
            defaultZoom={zoom}
            mapTypeId="hybrid"
            disableDefaultUI={true}
            gestureHandling="greedy"
            style={{ width: "100%", height: "100%" }}
          >
            <MapController
              center={center}
              zoom={zoom}
              onCenterChange={onCenterChange}
              onZoomChange={onZoomChange}
              onMapReady={onMapReady}
              mapRef={mapRef}
            />
            {children}
          </Map>
        </APIProvider>
        <style jsx>{`
          .google-map-container {
            width: 100%;
            height: 100%;
          }
        `}</style>
      </div>
    );
  }
);

export default GoogleMapContainer;
