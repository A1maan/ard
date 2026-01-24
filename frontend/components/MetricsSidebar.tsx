"use client";

import { useState } from "react";
import {
  Droplets,
  Thermometer,
  Leaf,
  Zap,
  FlaskConical,
  Mountain,
  Layers,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import type { Farm } from "./FarmsDropdown";

type MetricSection = {
  id: string;
  icon: React.ReactNode;
  label: string;
  metrics: {
    name: string;
    value: string | number;
    unit: string;
    status: "good" | "warning" | "critical";
    optimal: string;
    trend: "up" | "down" | "stable";
  }[];
};

type MetricsSidebarProps = {
  farm: Farm;
};

export function MetricsSidebar({ farm }: MetricsSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const variance = (farm.healthScore - 70) / 30;

  const sections: MetricSection[] = [
    {
      id: "moisture",
      icon: <Droplets size={20} />,
      label: "Moisture",
      metrics: [
        {
          name: "Soil Moisture",
          value: Math.round(35 + variance * 15),
          unit: "%",
          status: farm.healthScore > 75 ? "good" : "warning",
          optimal: "30-45%",
          trend: "up",
        },
        {
          name: "Water Retention",
          value: Math.round(68 + variance * 10),
          unit: "%",
          status: "good",
          optimal: "60-80%",
          trend: "stable",
        },
      ],
    },
    {
      id: "temperature",
      icon: <Thermometer size={20} />,
      label: "Temperature",
      metrics: [
        {
          name: "Soil Temperature",
          value: Math.round(24 + variance * 4),
          unit: "°C",
          status: "good",
          optimal: "20-28°C",
          trend: "stable",
        },
        {
          name: "Surface Temp",
          value: Math.round(32 + variance * 5),
          unit: "°C",
          status: farm.healthScore > 70 ? "good" : "warning",
          optimal: "25-35°C",
          trend: "up",
        },
      ],
    },
    {
      id: "nutrients",
      icon: <Leaf size={20} />,
      label: "Nutrients",
      metrics: [
        {
          name: "Nitrogen (N)",
          value: Math.round(42 + variance * 20),
          unit: "ppm",
          status: farm.healthScore > 80 ? "good" : farm.healthScore > 60 ? "warning" : "critical",
          optimal: "40-60 ppm",
          trend: "down",
        },
        {
          name: "Phosphorus (P)",
          value: Math.round(28 + variance * 10),
          unit: "ppm",
          status: "good",
          optimal: "25-50 ppm",
          trend: "stable",
        },
        {
          name: "Potassium (K)",
          value: Math.round(180 + variance * 40),
          unit: "ppm",
          status: farm.healthScore > 70 ? "good" : "warning",
          optimal: "150-250 ppm",
          trend: "up",
        },
      ],
    },
    {
      id: "ph",
      icon: <FlaskConical size={20} />,
      label: "pH Level",
      metrics: [
        {
          name: "Soil pH",
          value: (6.5 + variance * 0.5).toFixed(1),
          unit: "",
          status: farm.healthScore > 75 ? "good" : "warning",
          optimal: "6.0-7.0",
          trend: "stable",
        },
        {
          name: "Buffer pH",
          value: (7.0 + variance * 0.3).toFixed(1),
          unit: "",
          status: "good",
          optimal: "6.8-7.2",
          trend: "stable",
        },
      ],
    },
    {
      id: "organic",
      icon: <Mountain size={20} />,
      label: "Organic Matter",
      metrics: [
        {
          name: "Organic Carbon",
          value: (2.8 + variance * 0.8).toFixed(1),
          unit: "%",
          status: farm.healthScore > 65 ? "good" : "warning",
          optimal: "2.5-4.0%",
          trend: "up",
        },
        {
          name: "Humus Content",
          value: (4.2 + variance * 1.0).toFixed(1),
          unit: "%",
          status: "good",
          optimal: "3.5-5.5%",
          trend: "stable",
        },
      ],
    },
    {
      id: "conductivity",
      icon: <Zap size={20} />,
      label: "Conductivity",
      metrics: [
        {
          name: "EC Level",
          value: (1.2 + variance * 0.4).toFixed(1),
          unit: "dS/m",
          status: farm.healthScore > 75 ? "good" : "warning",
          optimal: "0.8-1.6 dS/m",
          trend: "stable",
        },
        {
          name: "CEC",
          value: Math.round(18 + variance * 6),
          unit: "meq/100g",
          status: "good",
          optimal: "15-25 meq/100g",
          trend: "up",
        },
      ],
    },
    {
      id: "texture",
      icon: <Layers size={20} />,
      label: "Soil Texture",
      metrics: [
        {
          name: "Sand",
          value: 45,
          unit: "%",
          status: "good",
          optimal: "40-60%",
          trend: "stable",
        },
        {
          name: "Silt",
          value: 35,
          unit: "%",
          status: "good",
          optimal: "25-45%",
          trend: "stable",
        },
        {
          name: "Clay",
          value: 20,
          unit: "%",
          status: "good",
          optimal: "15-30%",
          trend: "stable",
        },
      ],
    },
  ];

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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp size={14} />;
      case "down":
        return <TrendingDown size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="metrics-sidebar">
      <div className="icon-bar">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`icon-btn ${expandedSection === section.id ? "active" : ""}`}
            onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
            title={section.label}
          >
            {section.icon}
          </button>
        ))}
      </div>

      {expandedSection && (
        <div className="expanded-panel">
          <div className="panel-header">
            <h3>{sections.find((s) => s.id === expandedSection)?.label}</h3>
            <button className="close-btn" onClick={() => setExpandedSection(null)}>
              <X size={18} />
            </button>
          </div>
          <div className="metrics-list">
            {sections
              .find((s) => s.id === expandedSection)
              ?.metrics.map((metric, idx) => (
                <div key={idx} className="metric-card">
                  <div className="metric-header">
                    <span className="metric-name">{metric.name}</span>
                    <div className="metric-status" style={{ color: getStatusColor(metric.status) }}>
                      {metric.status === "good" && <CheckCircle size={14} />}
                      {metric.status === "warning" && <AlertTriangle size={14} />}
                      {metric.status === "critical" && <AlertTriangle size={14} />}
                    </div>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-value" style={{ color: getStatusColor(metric.status) }}>
                      {metric.value}
                      <span className="metric-unit">{metric.unit}</span>
                    </span>
                    <span className="metric-trend" style={{ color: metric.trend === "up" ? "#4ade80" : metric.trend === "down" ? "#f87171" : "#9aa0a6" }}>
                      {getTrendIcon(metric.trend)}
                    </span>
                  </div>
                  <div className="metric-optimal">
                    Optimal: {metric.optimal}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .metrics-sidebar {
          display: flex;
          z-index: 100;
          flex-shrink: 0;
        }

        .icon-bar {
          width: 56px;
          background: rgba(30, 30, 46, 0.98);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          padding: 12px 8px;
          gap: 4px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          color: #9aa0a6;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e8eaed;
        }

        .icon-btn.active {
          background: rgba(74, 222, 128, 0.2);
          color: #4ade80;
        }

        .expanded-panel {
          width: 280px;
          background: rgba(30, 30, 46, 0.98);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          animation: slideIn 0.2s ease-out;
          overflow-y: auto;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .panel-header h3 {
          color: #e8eaed;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .close-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #9aa0a6;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #e8eaed;
        }

        .metrics-list {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .metric-name {
          color: #9aa0a6;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .metric-status {
          display: flex;
          align-items: center;
        }

        .metric-value-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 600;
        }

        .metric-unit {
          font-size: 14px;
          margin-left: 2px;
          opacity: 0.7;
        }

        .metric-trend {
          display: flex;
          align-items: center;
        }

        .metric-optimal {
          color: #9aa0a6;
          font-size: 11px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
