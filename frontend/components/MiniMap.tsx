"use client";

import { useEffect, useRef } from "react";

type MiniMapProps = {
  center?: [number, number];
};

export function MiniMap({ center = [28.24, 64.46] }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw a simple mini-map representation
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/2/${Math.floor(
      (90 - center[0]) / 45
    )}/${Math.floor((center[1] + 180) / 90)}`;

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    img.onerror = () => {
      // Fallback: draw a simple gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#1a3a5c");
      gradient.addColorStop(0.5, "#2d5a3d");
      gradient.addColorStop(1, "#5a4a2d");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
  }, [center]);

  return (
    <div className="mini-map">
      <canvas ref={canvasRef} width={80} height={80} className="mini-map-canvas" />
      <style jsx>{`
        .mini-map {
          position: absolute;
          bottom: 52px;
          left: 16px;
          width: 80px;
          height: 80px;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          z-index: 1000;
          cursor: pointer;
          transition: transform 0.15s;
        }

        .mini-map:hover {
          transform: scale(1.05);
        }

        .mini-map-canvas {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
    </div>
  );
}
