"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, MapPin, Leaf } from "lucide-react";
import { api, type FarmListItem } from "@/lib/api";

export type Farm = FarmListItem;

// Sample farms data (fallback)
export const FARMS_DATA: Farm[] = [
  {
    id: "1",
    name: "Farm 1",
    location: "Sample Location",
    coordinates: [24.1500, 47.3000],
    size: "N/A",
    soilType: "Unknown",
    health: "good",
    healthScore: 75,
  },
];

type FarmsDropdownProps = {
  projectName?: string;
};

export function FarmsDropdown({
  projectName = "My Farms",
}: FarmsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch farms from API
  useEffect(() => {
    async function fetchFarms() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getFarms(20);
        setFarms(response.farms);
      } catch (err) {
        console.error("Failed to fetch farms:", err);
        setError(err instanceof Error ? err.message : "Failed to load farms");
        setFarms(FARMS_DATA); // Fallback to sample data
      } finally {
        setLoading(false);
      }
    }
    fetchFarms();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 80) return "#4ade80";
    if (score >= 60) return "#facc15";
    return "#f87171";
  };

  return (
    <div className="farms-dropdown" ref={dropdownRef}>
      <button
        className="dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Leaf size={14} className="farm-icon" />
        <span>{projectName}</span>
        <ChevronDown
          size={14}
          className={`chevron ${isOpen ? "open" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <span>Your Farms</span>
            <span className="farm-count">
              {loading ? "Loading..." : `${farms.length} locations`}
            </span>
          </div>
          <div className="dropdown-list">
            {loading ? (
              <div className="loading-state">
                <Image
                  src="/ard-logo.png"
                  alt="ARD"
                  width={60}
                  height={24}
                  className="loading-logo"
                />
                <span>Loading farms...</span>
              </div>
            ) : error ? (
              <div className="error-state">
                <span>{error}</span>
              </div>
            ) : (
              farms.map((farm) => (
                <Link
                  key={farm.id}
                  href={`/farm/${farm.id}`}
                  className="farm-item"
                  onClick={() => setIsOpen(false)}
                >
                <div className="farm-info">
                  <MapPin size={14} className="pin-icon" />
                  <div className="farm-details">
                    <span className="farm-name">{farm.name}</span>
                    <span className="farm-location">{farm.location}</span>
                  </div>
                </div>
                <div className="farm-health">
                  <div
                    className="health-indicator"
                    style={{ backgroundColor: getHealthColor(farm.healthScore) }}
                  />
                  <span className="health-score">{farm.healthScore}%</span>
                </div>
              </Link>
              ))
            )}
          </div>
          <div className="dropdown-footer">
            <button className="add-farm-btn">
              + Add New Farm
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .farms-dropdown {
          position: relative;
        }

        .dropdown-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
          color: #e8eaed;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .dropdown-trigger:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .farm-icon {
          color: #4ade80;
        }

        .chevron {
          transition: transform 0.2s;
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 320px;
          background: #2d2d3a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          z-index: 1000;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 12px;
          color: #9aa0a6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .farm-count {
          background: rgba(74, 222, 128, 0.2);
          color: #4ade80;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
        }

        .dropdown-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .dropdown-list :global(.farm-item) {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          text-align: left;
          text-decoration: none;
          color: inherit;
        }

        .dropdown-list :global(.farm-item:hover) {
          background: rgba(255, 255, 255, 0.05);
        }

        .dropdown-list :global(.farm-item.selected) {
          background: rgba(74, 222, 128, 0.1);
          border-left: 3px solid #4ade80;
        }

        .dropdown-list :global(.farm-info) {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          flex: 1;
        }

        .dropdown-list :global(.pin-icon) {
          color: #9aa0a6;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .dropdown-list :global(.farm-details) {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dropdown-list :global(.farm-name) {
          color: #e8eaed;
          font-size: 14px;
          font-weight: 500;
        }

        .dropdown-list :global(.farm-location) {
          color: #9aa0a6;
          font-size: 12px;
        }

        .dropdown-list :global(.farm-health) {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .dropdown-list :global(.health-indicator) {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dropdown-list :global(.health-score) {
          color: #9aa0a6;
          font-size: 12px;
          min-width: 32px;
        }

        .loading-state,
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 16px;
          color: #9aa0a6;
          font-size: 13px;
        }

        .error-state {
          color: #f87171;
        }

        .loading-state :global(.loading-logo) {
          animation: breathe 2s ease-in-out infinite;
        }

        @keyframes breathe {
          0%, 100% {
            opacity: 0.5;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .dropdown-footer {
          padding: 12px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .add-farm-btn {
          width: 100%;
          padding: 10px;
          background: rgba(74, 222, 128, 0.1);
          border: 1px dashed rgba(74, 222, 128, 0.3);
          border-radius: 8px;
          color: #4ade80;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .add-farm-btn:hover {
          background: rgba(74, 222, 128, 0.2);
          border-color: rgba(74, 222, 128, 0.5);
        }
      `}</style>
    </div>
  );
}
