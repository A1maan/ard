"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ChatWidget as ChatWidgetUI } from "chat-widget";

export default function ChatPage() {
  return (
    <div className="chat-page">
      <NuqsAdapter>
        <div className="chat-full">
          <ChatWidgetUI apiUrl="http://127.0.0.1:2024" assistantId="agent" apiKey={null} />
        </div>
      </NuqsAdapter>

      <style jsx>{`
        .chat-page {
          height: 100vh;
          width: 100%;
          background: #f5f6f8;
        }

        .chat-full {
          height: 100%;
          width: 100%;
        }

        /* Keep widget layouts constrained to the page height */
        .chat-page :global(.h-screen) {
          height: 100% !important;
        }

        .chat-page :global(.min-h-screen) {
          min-height: 100% !important;
        }

        .chat-page :global(.w-full) {
          width: 100% !important;
        }

        .chat-page :global(.flex),
        .chat-page :global(.flex-col) {
          min-height: 0 !important;
        }

        .chat-page :global(.overflow-y-scroll),
        .chat-page :global(.overflow-auto) {
          max-height: 100% !important;
        }
      `}</style>
    </div>
  );
}
