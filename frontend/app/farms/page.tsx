"use client";

import { useState, useEffect } from "react";
import { ChatWidget as ChatWidgetUI, type ChatWidgetProps } from "chat-widget";

export function ChatWidgetDemo(props: ChatWidgetProps) {
  return (
    <div className="h-full w-full">
      <ChatWidgetUI
        apiUrl="http://localhost:2024"
        assistantId="agent"
        apiKey={null}
      />
    </div>
  );
}




import Link from "next/link";
import { ArrowLeft, MapPin, Leaf, Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api, type FarmListItem } from "@/lib/api";
import { FARMS_DATA } from "@/components/FarmsDropdown";

export default function FarmsPage() {
  const [farms, setFarms] = useState<FarmListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFarms() {
      try {
        const response = await api.getFarms(50);
        setFarms(response.farms);
      } catch (err) {
        console.error("Failed to fetch farms:", err);
        setError(err instanceof Error ? err.message : "Failed to load farms");
        setFarms(FARMS_DATA as FarmListItem[]); // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchFarms();
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 80) return "#4ade80";
    if (score >= 60) return "#facc15";
    return "#f87171";
  };

  const getHealthLabel = (health: string) => {
    if (health === "good") return "Healthy";
    if (health === "warning") return "Needs Attention";
    return "Critical";
  };

  if (loading) {
    return (
      <main className="farms-page loading">
        <LoadingSpinner message="Loading farms..." size="large" />
        <style jsx>{`
          .farms-page.loading {
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="farms-page">
      <header className="page-header">
        <Link href="/" className="back-btn">
          <ArrowLeft size={20} />
          <span>Back to Map</span>
        </Link>
        <div className="header-title">
          <Leaf size={24} className="leaf-icon" />
          <h1>My Farms</h1>
        </div>
        <button className="add-btn">
          <Plus size={18} />
          <span>Add Farm</span>
        </button>
      </header>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error} - Showing sample data</p>
        </div>
      )}

      <div className="farms-grid">
        {farms.map((farm) => (
          <Link href={`/farm/${farm.id}`} key={farm.id} className="farm-card">
            <div className="farm-card-header">
              <div className="farm-icon-wrapper">
                <MapPin size={24} />
              </div>
              <div
                className="health-badge"
                style={{ backgroundColor: `${getHealthColor(farm.healthScore)}20`, color: getHealthColor(farm.healthScore) }}
              >
                {getHealthLabel(farm.health)}
              </div>
            </div>
            
            <h2 className="farm-name">{farm.name}</h2>
            <p className="farm-location">{farm.location}</p>
            
            <div className="farm-stats">
              <div className="stat">
                <span className="stat-label">Size</span>
                <span className="stat-value">{farm.size}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Soil Type</span>
                <span className="stat-value">{farm.soilType}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Health Score</span>
                <span className="stat-value" style={{ color: getHealthColor(farm.healthScore) }}>
                  {farm.healthScore}%
                </span>
              </div>
            </div>

            <div className="health-bar">
              <div 
                className="health-fill" 
                style={{ 
                  width: `${farm.healthScore}%`,
                  backgroundColor: getHealthColor(farm.healthScore)
                }} 
              />
            </div>
          </Link>
        ))}

        <button className="farm-card add-farm-card">
          <div className="add-icon">
            <Plus size={32} />
          </div>
          <span>Add New Farm</span>
        </button>
      </div>

      <style jsx>{`
        .farms-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 24px;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        :global(.back-btn) {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #e8eaed;
          padding: 10px 16px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
          text-decoration: none;
        }

        :global(.back-btn:hover) {
          background: rgba(255, 255, 255, 0.2);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-title :global(.leaf-icon) {
          color: #4ade80;
        }

        .header-title h1 {
          color: #e8eaed;
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #4ade80;
          border: none;
          color: #1a1a2e;
          padding: 10px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .add-btn:hover {
          background: #22c55e;
          transform: translateY(-1px);
        }

        .farms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        :global(.farm-card) {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        :global(.farm-card:hover) {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(74, 222, 128, 0.3);
          transform: translateY(-2px);
        }

        .farm-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .farm-icon-wrapper {
          width: 48px;
          height: 48px;
          background: rgba(74, 222, 128, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4ade80;
        }

        .health-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        :global(.farm-name) {
          color: #e8eaed;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        :global(.farm-location) {
          color: #9aa0a6;
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        .farm-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          color: #9aa0a6;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          color: #e8eaed;
          font-size: 14px;
          font-weight: 500;
        }

        .health-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .health-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .add-farm-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 2px dashed rgba(74, 222, 128, 0.3);
          background: transparent;
          min-height: 280px;
          color: #4ade80;
          font-size: 16px;
          font-weight: 500;
        }

        .add-farm-card:hover {
          border-color: rgba(74, 222, 128, 0.6);
          background: rgba(74, 222, 128, 0.05);
        }

        .add-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(74, 222, 128, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .error-banner {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 24px;
          color: #f87171;
          font-size: 14px;
        }

        .error-banner p {
          margin: 0;
        }
      `}</style>
    </main>
  );
}
