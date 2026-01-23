"use client";

import { useState } from "react";
import {
  Droplets,
  Thermometer,
  Leaf,
  Zap,
  FlaskConical,
  Mountain,
  TrendingUp,
  TrendingDown,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import type { Farm } from "./FarmsDropdown";

type SoilProperty = {
  id: string;
  name: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  status: "good" | "warning" | "critical";
  optimal: string;
  trend: "up" | "down" | "stable";
  description: string;
};

type SoilDashboardProps = {
  farm: Farm;
  isOpen: boolean;
  onClose: () => void;
};

// Generate soil properties based on farm
const getSoilProperties = (farm: Farm): SoilProperty[] => {
  // Slightly vary values based on farm healthScore
  const variance = (farm.healthScore - 70) / 30;
  
  return [
    {
      id: "moisture",
      name: "Soil Moisture",
      value: Math.round(35 + variance * 15),
      unit: "%",
      icon: <Droplets size={18} />,
      status: farm.healthScore > 75 ? "good" : "warning",
      optimal: "30-45%",
      trend: "up",
      description: "Water content in soil affecting plant growth",
    },
    {
      id: "temperature",
      name: "Soil Temperature",
      value: Math.round(24 + variance * 4),
      unit: "°C",
      icon: <Thermometer size={18} />,
      status: "good",
      optimal: "20-30°C",
      trend: "stable",
      description: "Temperature at 10cm depth",
    },
    {
      id: "ph",
      name: "pH Level",
      value: Number((6.5 + variance * 0.5).toFixed(1)),
      unit: "",
      icon: <FlaskConical size={18} />,
      status: farm.healthScore > 80 ? "good" : farm.healthScore > 60 ? "warning" : "critical",
      optimal: "6.0-7.5",
      trend: "stable",
      description: "Acidity or alkalinity of soil",
    },
    {
      id: "nitrogen",
      name: "Nitrogen (N)",
      value: Math.round(180 + variance * 40),
      unit: "kg/ha",
      icon: <Leaf size={18} />,
      status: farm.healthScore > 70 ? "good" : "warning",
      optimal: "150-200 kg/ha",
      trend: "down",
      description: "Essential for leaf growth",
    },
    {
      id: "phosphorus",
      name: "Phosphorus (P)",
      value: Math.round(45 + variance * 15),
      unit: "kg/ha",
      icon: <Zap size={18} />,
      status: "good",
      optimal: "40-60 kg/ha",
      trend: "up",
      description: "Supports root development",
    },
    {
      id: "potassium",
      name: "Potassium (K)",
      value: Math.round(220 + variance * 30),
      unit: "kg/ha",
      icon: <Mountain size={18} />,
      status: farm.healthScore > 65 ? "good" : "warning",
      optimal: "200-250 kg/ha",
      trend: "stable",
      description: "Improves disease resistance",
    },
    {
      id: "organic",
      name: "Organic Matter",
      value: Number((2.8 + variance * 1.2).toFixed(1)),
      unit: "%",
      icon: <Leaf size={18} />,
      status: farm.healthScore > 75 ? "good" : "warning",
      optimal: "3-5%",
      trend: "up",
      description: "Decomposed plant/animal material",
    },
    {
      id: "ec",
      name: "Electrical Conductivity",
      value: Number((1.2 + variance * 0.3).toFixed(1)),
      unit: "dS/m",
      icon: <Zap size={18} />,
      status: "good",
      optimal: "0.5-2.0 dS/m",
      trend: "stable",
      description: "Indicates salt content in soil",
    },
  ];
};

export function SoilDashboard({ farm, isOpen, onClose }: SoilDashboardProps) {
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const soilProperties = getSoilProperties(farm);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "#4ade80";
      case "warning":
        return "#facc15";
      case "critical":
        return "#f87171";
      default:
        return "#9aa0a6";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle size={14} />;
      case "warning":
        return <AlertTriangle size={14} />;
      case "critical":
        return <AlertTriangle size={14} />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp size={12} className="trend-up" />;
      case "down":
        return <TrendingDown size={12} className="trend-down" />;
      default:
        return <span className="trend-stable">—</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="soil-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h2 className="dashboard-title">Soil Analysis</h2>
          <p className="farm-name">{farm.name}</p>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="health-overview">
        <div className="health-score-container">
          <div
            className="health-ring"
            style={{
              background: `conic-gradient(${getStatusColor(
                farm.healthScore > 75 ? "good" : farm.healthScore > 50 ? "warning" : "critical"
              )} ${farm.healthScore * 3.6}deg, #3c4043 0deg)`,
            }}
          >
            <div className="health-inner">
              <span className="health-value">{farm.healthScore}</span>
              <span className="health-label">Health</span>
            </div>
          </div>
        </div>
        <div className="health-details">
          <div className="detail-row">
            <span className="detail-label">Soil Type</span>
            <span className="detail-value">{farm.soilType}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Area</span>
            <span className="detail-value">{farm.area}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Last Updated</span>
            <span className="detail-value">2 hours ago</span>
          </div>
        </div>
      </div>

      <div className="properties-section">
        <h3 className="section-title">Soil Properties</h3>
        <div className="properties-list">
          {soilProperties.map((property) => (
            <div
              key={property.id}
              className={`property-card ${expandedProperty === property.id ? "expanded" : ""}`}
              onClick={() =>
                setExpandedProperty(expandedProperty === property.id ? null : property.id)
              }
            >
              <div className="property-header">
                <div className="property-icon" style={{ color: getStatusColor(property.status) }}>
                  {property.icon}
                </div>
                <div className="property-info">
                  <span className="property-name">{property.name}</span>
                  <div className="property-value-row">
                    <span className="property-value">
                      {property.value}
                      <span className="property-unit">{property.unit}</span>
                    </span>
                    {getTrendIcon(property.trend)}
                  </div>
                </div>
                <div className="property-status" style={{ color: getStatusColor(property.status) }}>
                  {getStatusIcon(property.status)}
                </div>
                <ChevronRight
                  size={16}
                  className={`expand-icon ${expandedProperty === property.id ? "rotated" : ""}`}
                />
              </div>
              {expandedProperty === property.id && (
                <div className="property-details">
                  <p className="property-description">{property.description}</p>
                  <div className="optimal-range">
                    <span className="optimal-label">Optimal Range:</span>
                    <span className="optimal-value">{property.optimal}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="recommendations-section">
        <h3 className="section-title">Recommendations</h3>
        <div className="recommendation-card">
          <AlertTriangle size={16} className="rec-icon warning" />
          <p>Consider adding organic compost to improve soil structure</p>
        </div>
        <div className="recommendation-card">
          <CheckCircle size={16} className="rec-icon success" />
          <p>pH levels are within optimal range for most crops</p>
        </div>
      </div>

      <style jsx>{`
        .soil-dashboard {
          position: absolute;
          top: 0;
          left: 0;
          width: 380px;
          height: 100%;
          background: linear-gradient(180deg, #1e1e2e 0%, #252536 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 900;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dashboard-title {
          font-size: 18px;
          font-weight: 600;
          color: #e8eaed;
          margin: 0;
        }

        .farm-name {
          font-size: 13px;
          color: #4ade80;
          margin: 0;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          padding: 8px;
          border-radius: 8px;
          color: #9aa0a6;
          cursor: pointer;
          transition: all 0.15s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #e8eaed;
        }

        .health-overview {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
        }

        .health-score-container {
          flex-shrink: 0;
        }

        .health-ring {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .health-inner {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #1e1e2e;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .health-value {
          font-size: 22px;
          font-weight: 700;
          color: #e8eaed;
        }

        .health-label {
          font-size: 10px;
          color: #9aa0a6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .health-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-label {
          font-size: 12px;
          color: #9aa0a6;
        }

        .detail-value {
          font-size: 13px;
          color: #e8eaed;
          font-weight: 500;
        }

        .properties-section {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: #9aa0a6;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 12px 0;
        }

        .properties-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .property-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          overflow: hidden;
        }

        .property-card:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .property-card.expanded {
          border-color: rgba(74, 222, 128, 0.3);
        }

        .property-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
        }

        .property-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .property-info {
          flex: 1;
        }

        .property-name {
          display: block;
          font-size: 13px;
          color: #e8eaed;
          font-weight: 500;
        }

        .property-value-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .property-value {
          font-size: 16px;
          font-weight: 600;
          color: #e8eaed;
        }

        .property-unit {
          font-size: 12px;
          font-weight: 400;
          color: #9aa0a6;
          margin-left: 2px;
        }

        .property-status {
          display: flex;
          align-items: center;
        }

        .expand-icon {
          color: #9aa0a6;
          transition: transform 0.2s;
        }

        .expand-icon.rotated {
          transform: rotate(90deg);
        }

        .property-details {
          padding: 0 12px 12px 60px;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .property-description {
          font-size: 12px;
          color: #9aa0a6;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .optimal-range {
          display: flex;
          gap: 8px;
          font-size: 12px;
        }

        .optimal-label {
          color: #9aa0a6;
        }

        .optimal-value {
          color: #4ade80;
          font-weight: 500;
        }

        .trend-up {
          color: #4ade80;
        }

        .trend-down {
          color: #f87171;
        }

        .trend-stable {
          color: #9aa0a6;
          font-size: 14px;
        }

        .recommendations-section {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .recommendation-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .recommendation-card p {
          font-size: 12px;
          color: #e8eaed;
          margin: 0;
          line-height: 1.4;
        }

        .rec-icon.warning {
          color: #facc15;
          flex-shrink: 0;
        }

        .rec-icon.success {
          color: #4ade80;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
