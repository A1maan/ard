"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Undo2,
  Redo2,
  Eye,
  MapPin,
  Route,
  Layers,
  Ruler,
  Wrench,
  Settings,
  ChevronDown,
  Leaf,
  MessageSquare,
} from "lucide-react";

type EarthHeaderProps = {
  projectName?: string;
  onSearch?: (query: string) => void;
};

export function EarthHeader({
  projectName = "My Farms",
  onSearch,
}: EarthHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className="earth-header">
      {/* Top Menu Bar */}
      <div className="menu-bar">
        {/* Logo */}
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" fill="url(#earthGradient)" />
              <ellipse cx="24" cy="24" rx="22" ry="22" fill="url(#earthGradient)" />
              <path
                d="M8 24C8 24 12 16 24 16C36 16 40 24 40 24C40 24 36 32 24 32C12 32 8 24 8 24Z"
                fill="rgba(255,255,255,0.3)"
              />
              <defs>
                <linearGradient id="earthGradient" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#4FC3F7" />
                  <stop offset="50%" stopColor="#29B6F6" />
                  <stop offset="100%" stopColor="#0288D1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="menu-items">
          <button className="menu-item">File</button>
          <button className="menu-item">Edit</button>
          <button className="menu-item">View</button>
          <button className="menu-item">Add</button>
          <button className="menu-item">Tools</button>
          <button className="menu-item">Help</button>
        </nav>

        {/* My Farms Link */}
        <Link href="/farms" className="farms-link">
          <Leaf size={14} className="leaf-icon" />
          <span>{projectName}</span>
        </Link>

        {/* Chat Link */}
        <Link href="/chat" className="chat-link">
          <MessageSquare size={14} className="chat-icon" />
          <span>Chat</span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="search-container">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search Google Earth"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </form>

        {/* Toolbar Icons */}
        <div className="toolbar">
          <button className="toolbar-btn" title="Undo">
            <Undo2 size={18} />
          </button>
          <button className="toolbar-btn" title="Redo">
            <Redo2 size={18} />
          </button>
          <div className="toolbar-divider" />
          <button className="toolbar-btn" title="Show imagery">
            <Eye size={18} />
          </button>
          <button className="toolbar-btn" title="Add placemark">
            <MapPin size={18} />
          </button>
          <button className="toolbar-btn" title="Draw path">
            <Route size={18} />
          </button>
          <button className="toolbar-btn" title="Layers">
            <Layers size={18} />
          </button>
          <button className="toolbar-btn" title="Measure">
            <Ruler size={18} />
          </button>
          <button className="toolbar-btn" title="Tools">
            <Wrench size={18} />
          </button>
        </div>

        {/* Right Section */}
        <div className="header-right">
          <button className="settings-btn">
            <Settings size={18} />
          </button>
          <div className="user-info">
            <span className="username">Salman Almansour</span>
          </div>
          <div className="user-avatar">
            <span>S</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .earth-header {
          background: linear-gradient(180deg, #3c4043 0%, #35363a 100%);
          color: #e8eaed;
          user-select: none;
        }

        .menu-bar {
          display: flex;
          align-items: center;
          padding: 6px 12px;
          gap: 8px;
          height: 48px;
        }

        .logo {
          display: flex;
          align-items: center;
          margin-right: 8px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
        }

        .logo-icon svg {
          width: 100%;
          height: 100%;
        }

        .menu-items {
          display: flex;
          gap: 0;
        }

        .menu-item {
          background: none;
          border: none;
          color: #e8eaed;
          padding: 6px 12px;
          font-size: 13px;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.15s;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        :global(.farms-link) {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 8px 14px;
          color: #e8eaed;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          text-decoration: none;
        }

        :global(.farms-link:hover) {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(74, 222, 128, 0.4);
        }

        :global(.farms-link .leaf-icon) {
          color: #4ade80;
        }

        :global(.chat-link) {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 8px 14px;
          color: #e8eaed;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          text-decoration: none;
        }

        :global(.chat-link:hover) {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(96, 165, 250, 0.6);
        }

        :global(.chat-link .chat-icon) {
          color: #60a5fa;
        }

        .search-container {
          display: flex;
          align-items: center;
          background: #5f6368;
          border-radius: 24px;
          padding: 8px 16px;
          flex: 1;
          max-width: 280px;
          margin: 0 8px;
        }

        .search-icon {
          color: #9aa0a6;
          margin-right: 8px;
          flex-shrink: 0;
        }

        .search-input {
          background: none;
          border: none;
          color: #e8eaed;
          font-size: 14px;
          width: 100%;
          outline: none;
        }

        .search-input::placeholder {
          color: #9aa0a6;
        }

        .toolbar {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0 8px;
        }

        .toolbar-btn {
          background: none;
          border: none;
          color: #9aa0a6;
          padding: 8px;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .toolbar-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e8eaed;
        }

        .toolbar-divider {
          width: 1px;
          height: 24px;
          background: #5f6368;
          margin: 0 4px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
        }

        .settings-btn {
          background: none;
          border: none;
          color: #9aa0a6;
          padding: 8px;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .settings-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e8eaed;
        }

        .user-info {
          display: flex;
          align-items: center;
        }

        .username {
          color: #e8eaed;
          font-size: 13px;
          font-weight: 500;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #5e35b1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
          color: white;
          cursor: pointer;
        }
      `}</style>
    </header>
  );
}
