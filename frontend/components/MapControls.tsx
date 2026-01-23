"use client";

import { useState } from "react";
import { Plus, Minus, RotateCcw, Compass, User, Box } from "lucide-react";

type MapControlsProps = {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  on3DToggle?: () => void;
  is3D?: boolean;
};

export function MapControls({
  onZoomIn,
  onZoomOut,
  onReset,
  on3DToggle,
  is3D = false,
}: MapControlsProps) {
  return (
    <div className="map-controls">
      {/* Street View Person */}
      <button className="control-btn street-view" title="Street View">
        <User size={20} />
      </button>

      {/* Compass */}
      <button className="control-btn compass" title="Reset North" onClick={onReset}>
        <Compass size={24} />
      </button>

      {/* 3D Toggle */}
      <button
        className={`control-btn toggle-3d ${is3D ? "active" : ""}`}
        title="Toggle 3D"
        onClick={on3DToggle}
      >
        <span>3D</span>
      </button>

      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button className="control-btn zoom-btn" title="Zoom In" onClick={onZoomIn}>
          <Plus size={18} />
        </button>
        <button className="control-btn zoom-btn" title="Zoom Out" onClick={onZoomOut}>
          <Minus size={18} />
        </button>
      </div>

      <style jsx>{`
        .map-controls {
          position: absolute;
          bottom: 100px;
          right: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 1000;
        }

        .control-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(60, 64, 67, 0.9);
          border: none;
          color: #e8eaed;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .control-btn:hover {
          background: rgba(95, 99, 104, 0.95);
          transform: scale(1.05);
        }

        .street-view {
          background: rgba(60, 64, 67, 0.9);
        }

        .compass {
          background: rgba(60, 64, 67, 0.9);
        }

        .toggle-3d {
          font-size: 12px;
          font-weight: 600;
        }

        .toggle-3d.active {
          background: #4fc3f7;
          color: #1a1a2e;
        }

        .zoom-controls {
          display: flex;
          flex-direction: column;
          background: rgba(60, 64, 67, 0.9);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .zoom-btn {
          width: 40px;
          height: 36px;
          border-radius: 0;
          box-shadow: none;
        }

        .zoom-btn:first-child {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
