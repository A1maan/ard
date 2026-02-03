"use client";

import Image from "next/image";

type LoadingSpinnerProps = {
  message?: string;
  size?: "small" | "medium" | "large";
};

export function LoadingSpinner({ 
  message = "Loading...", 
  size = "medium" 
}: LoadingSpinnerProps) {
  const sizes = {
    small: { logo: 800, spinner: 40, text: 12 },
    medium: { logo: 1200, spinner: 50, text: 14 },
    large: { logo: 1600, spinner: 60, text: 16 },
  };

  const { logo, spinner, text } = sizes[size];

  return (
    <div className="loading-container">
      {/* Glow effect */}
      <div className="glow-effect" />
      
      {/* Background logo */}
      <Image
        src="/ard-logo.png"
        alt="ARD"
        width={logo}
        height={logo * 0.4}
        className="bg-logo"
        priority
      />
      
      {/* Foreground spinner and text */}
      <div className="loading-content">
        <div className="spinner" />
        <p className="loading-text">{message}</p>
      </div>

      <style jsx>{`
        .loading-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          min-height: 200px;
          padding: 24px;
        }

        .glow-effect {
          position: absolute;
          width: 70vw;
          height: 40vh;
          background: radial-gradient(
            ellipse at center,
            rgba(74, 222, 128, 0.3) 0%,
            rgba(74, 222, 128, 0.2) 30%,
            rgba(74, 222, 128, 0.08) 60%,
            transparent 100%
          );
          filter: blur(60px);
          z-index: 0;
        }

        .loading-container :global(.bg-logo) {
          position: absolute;
          width: 70vw;
          height: auto;
          max-width: 1600px;
          opacity: 0.15;
          z-index: 1;
          filter: drop-shadow(0 0 40px rgba(74, 222, 128, 0.5));
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }

        .loading-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          z-index: 2;
        }

        .spinner {
          width: ${spinner}px;
          height: ${spinner}px;
          border: 3px solid rgba(74, 222, 128, 0.2);
          border-top-color: #4ade80;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          box-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
        }

        .loading-text {
          color: #e8eaed;
          font-size: ${text}px;
          margin: 0;
          font-weight: 500;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
