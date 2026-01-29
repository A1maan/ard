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
          background: #eef1f5;
          color: #111111;
          --background: 0 0% 100%;
          --foreground: 0 0% 7%;
          --muted: 210 24% 96%;
          --muted-foreground: 0 0% 20%;
          --border: 210 16% 82%;
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

        .chat-page :global(.max-w-3xl) {
          max-width: 56rem !important;
        }

        .chat-page :global(.assistant-row) {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .chat-page :global(.assistant-icon) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #e6f0ff;
          color: #2b6fe8;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .chat-page :global(.assistant-icon svg) {
          width: 14px;
          height: 14px;
        }

        .chat-page :global(.assistant-text) {
          line-height: 1.6;
          color: #111111;
        }

        .chat-page :global(.user-bubble) {
          background: #e9eef7 !important;
          color: #111111;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
        }

        .chat-page :global(.markdown-content h1),
        .chat-page :global(.markdown-content h2),
        .chat-page :global(.markdown-content h3) {
          font-weight: 600;
          margin: 0.6em 0 0.4em;
          letter-spacing: -0.01em;
        }

        .chat-page :global(.markdown-content ul),
        .chat-page :global(.markdown-content ol) {
          padding-left: 1.25rem;
          margin: 0.4em 0 0.8em;
        }

        .chat-page :global(.markdown-content pre) {
          background: #0f172a;
          color: #e2e8f0;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 0.9em;
          line-height: 1.5;
        }

        .chat-page :global(.markdown-content code) {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        .chat-page :global(.chat-input-shell) {
          background: #ffffff !important;
          border: none !important;
          border-radius: 999px !important;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12) !important;
          padding: 4px 8px !important;
        }

        .chat-page :global(.chat-input-area) {
          padding: 10px 16px 12px !important;
          font-size: 15px;
          line-height: 1.5;
        }

        .chat-page :global(.text-muted-foreground),
        .chat-page :global(.text-slate-400),
        .chat-page :global(.text-slate-500),
        .chat-page :global(.text-slate-600) {
          color: #111111 !important;
        }

      `}</style>
    </div>
  );
  
}
<style jsx>{`
.chat-page :global(p) {
  overflow: visible !important;
  max-height: none !important;
  -webkit-line-clamp: unset !important;
  display: block !important;
}

  .chat-page {
    height: 100vh;
    width: 100%;
  }

  .chat-full {
    height: 100%;
    width: 100%;
  }

  /* ✅ HARD OVERRIDES: stop any “line clamp to 2 lines” behavior */
  .chat-page :global(.assistant-text),
  .chat-page :global(.markdown-content),
  .chat-page :global(.markdown-content p),
  .chat-page :global(.markdown-content li),
  .chat-page :global(.markdown-content div),
  .chat-page :global(.markdown-content span) {
    display: block !important;
    overflow: visible !important;
    max-height: none !important;
    height: auto !important;
    -webkit-line-clamp: unset !important;
    line-clamp: unset !important;
    -webkit-box-orient: unset !important;
    white-space: pre-wrap !important;
    word-break: break-word !important;
  }

  /* ✅ ensure the message area can scroll instead of clipping */
  .chat-page :global(.chat-message-area) {
    overflow: auto !important;
    min-height: 0 !important;
  }
`}</style>

