"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ChatWidget as ChatWidgetUI } from "chat-widget";
import { useEffect, useState } from "react";

export default function ChatPage() {

  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    const root = document.querySelector(".chat-page");
    if (!root) return;

    const compute = () => {
      const hasMessages = root.querySelector(".chat-message-row");
      setIsEmpty(!hasMessages);
    };

    compute();

    // Observe DOM changes because messages appear after render
    const obs = new MutationObserver(compute);
    obs.observe(root, { childList: true, subtree: true });

    return () => obs.disconnect();
  }, []);

  return (
    <div className={`chat-page ${isEmpty ? "chat-empty" : ""}`}>
      <NuqsAdapter>
        <div className="chat-full">
          <ChatWidgetUI apiUrl="http://127.0.0.1:2024" assistantId="agent" apiKey={null} />
        </div>
      </NuqsAdapter>

      <style jsx>{`
        .chat-page {
          height: 100vh;
          width: 100%;
          /* Gemini dark */
          background: #202124;
          color: #e8eaed;

          --background: 0 0% 12%;
          --foreground: 0 0% 92%;
          --muted: 0 0% 18%;
          --muted-foreground: 220 6% 65%;
          --border: 0 0% 20%;
        }

        /* Sidebar background */
        .chat-page
          :global([class*="sidebar"]),
        .chat-page
          :global([class*="thread"]),
        .chat-page
          :global([class*="history"]) {
          background: #171717 !important;
        }
        
        /* Main chat canvas */
        .chat-page :global(.chat-message-area) {
          background: #202124;
        }

        .chat-page :global(.assistant-text),
        .chat-page :global(.assistant-row) {
          color: #e8eaed;
        }

        .chat-page :global(.user-bubble) {
          background: #2a2a2a !important;
          color: #e8eaed !important;
          box-shadow: none !important;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .chat-page :global(.chat-input-shell) {
          background: #2b2b2b !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          box-shadow: none !important;
        }

        .chat-page :global(.chat-input-area) {
          color: #e8eaed !important;
        }

        .chat-page :global(.chat-input-area) {
          color: #e8eaed !important;
        }


        .chat-page :global(textarea::placeholder) {
          color: #9aa0a6 !important;
        }

        .chat-page :global(button) {
  color: #e8eaed;
}
        .chat-page :global(button:hover) {
  background: rgba(255,255,255,0.06);
}
        .chat-page :global(.chat-send-btn) {
  background: #8ab4f8 !important;
  color: #202124 !important;
}
        .chat-page :global(button.w-\[280px\]) {
  color: #e8eaed;
}

.chat-page :global(button.w-\[280px\]:hover) {
  background: rgba(255,255,255,0.06);
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
          width: 100% !important;
          margin-left: auto !important;
          margin-right: auto !important;
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

        .chat-page :global(.chat-message-area) {
          max-width: 56rem;
          width: 100%;
          margin: 0 auto;
        }

        .chat-page :global(.chat-message-row) {
          width: 100%;
          display: flex;
        }

        .chat-page :global(.chat-message-row--assistant) {
          justify-content: flex-start;
        }

        .chat-page :global(.chat-message-row--human) {
          justify-content: flex-end;
        }

        /* ✅ Always right-align the human bubble (short + long) */
        .chat-page :global(.chat-message-row--human .user-bubble) {
          margin-left: auto !important;
          margin-right: 0 !important;

          /* critical: make it shrink-to-fit even when wrapping */
          display: inline-block !important;

          /* allow wrapping without becoming full width */
          width: auto !important;

          /* cap bubble width */
          max-width: min(90%, 44rem) !important;

          /* prevent long strings from forcing width */
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }


        .chat-page :global(.chat-message-row--human .flex.flex-col.gap-2) {
          width: auto !important;
          max-width: 100%;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-end !important;
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
          border: none !important;
          border-radius: 24px !important;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12) !important;
          padding: 8px 10px !important;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: visible;
        }

        .chat-page :global(.chat-input-area) {
          padding: 10px 16px 12px !important;
          font-size: 15px;
          line-height: 1.5;
          flex: 1;
        }

        .chat-page :global(.chat-input-row) {
          display: flex;
          align-items: flex-end;
          gap: 12px;
        }

        .chat-page :global(.chat-send-btn) {
          align-self: flex-end;
          padding: 10px 16px;
          border-radius: 999px;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
        }

        .chat-page :global(.chat-input-actions) {
          flex-wrap: wrap;
          gap: 12px;
        }

        .chat-page :global(button[role="switch"][data-state="checked"]) {
          background-color: #22c55e !important;
        }

        .chat-page :global(button[role="switch"][data-state="checked"] span) {
          background-color: #ffffff !important;
        }

        .chat-page :global(button[role="switch"][data-state="unchecked"]) {
          background-color: #e2e8f0 !important;
          border: 1px solid #cbd5e1 !important;
        }

        .chat-page :global(button[role="switch"][data-state="unchecked"] span) {
          background-color: #ffffff !important;
          border: 1px solid #94a3b8 !important;
        }

        .chat-page :global(.chat-input-actions label[for="render-tool-calls"]) {
          margin-left: 6px;
        }

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

          /* Keep only the pill input white */
          .chat-page :global(.chat-input-shell) {
            background: #ffffff !important;
          }


          /* ✅ Give all saved chat buttons breathing room */
          .chat-page
            :global(button.w-\[280px\]) {
            margin-left: 0.75rem;
            margin-right: 0.75rem;
          }

          .chat-page
            :global(button.w-\[280px\]) {
            margin-bottom: 0.25rem;
          }



          /* ----------------------------------------------
          
          /* ===============================
            Empty "New Chat" centering
            =============================== */

          /* Center ONLY the "Agent Chat" header */
          .chat-page.chat-empty
            :global(div:has(> h1.text-2xl.font-semibold.tracking-tight)) {
            position: fixed !important;
            top: 42% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 40 !important;
          }


          /* your input box */
          .chat-page.chat-empty :global(.chat-input-shell) {
            position: fixed !important;
            top: 56% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 50 !important;
            margin-bottom: 0 !important;
          }

          /* prevent any scroll area from fighting the centered layout */
          .chat-page.chat-empty :global(.chat-message-area) {
            display: none !important;
          }

          /* Keep GitHub icon pinned top-right */
          .chat-page :global(svg[role="img"]:has(title)) {
            position: fixed !important;
            top: 5px !important;
            right: 30px !important;
            z-index: 60 !important;
            fill: #e8eaed !important;
          }

          /* Keep sidebar toggle button pinned top-left */
          .chat-page :global(button:has(.lucide-panel-right-open)) {
            position: fixed !important;
            top: 2px !important;
            left: 12px !important;
            z-index: 60 !important;
          }

          /* Give "Thread History" breathing room from the right edge */
          .chat-page
            :global(.flex.w-full.items-center.justify-between h1) {
            margin-left: 10rem;
            margin-top: 0.3rem;
          }

          /* Input pill: keep layout, set dark colors */
          .chat-page :global(.chat-input-shell) {
            background: #2b2b2b !important;
            border: 1px solid rgba(255,255,255,0.10) !important;
            border-radius: 24px !important;

            /* keep your layout styling */
            padding: 8px 10px !important;
            display: flex;
            flex-direction: column;
            gap: 4px;
            overflow: visible;

            /* kill the light shadow */
            box-shadow: none !important;
          }

          /* Footer strip behind input */
          .chat-page :global(.sticky.bottom-0.flex.flex-col.items-center.gap-8.bg-white) {
            background: #171717 !important; /* match page */
          }

          /* Sidebar container (parent that holds the thread buttons) */
          .chat-page :global(div:has(> button.w-\[280px\])),
          .chat-page :global(div:has(button.w-\[280px\])) {
            background: #171717 !important;
          }


          .chat-page :global(button.w-\[280px\]:hover) {
            background: rgba(255,255,255,0.08);
          }

          .chat-page
            :global(div:has(button.w-\[280px\])) {
            border-right: 1px solid rgba(200,200,200,0.06);
          }

          /* Ensure input action row stays horizontal */
.chat-page :global(.chat-input-actions) {
  display: flex !important;
  align-items: center !important;
}
          /* Push Send button to the right of the input row */
.chat-page :global(.chat-input-actions .chat-send-btn) {
  margin-left: auto !important;
  align-self: center !important;
}
        
/* Push Send button to the right of the input row */
.chat-page :global(.chat-input-actions .chat-send-btn) {
  margin-left: auto !important;
  align-self: center !important;
}

          /* More padding inside human message bubbles */
.chat-page
  :global(.chat-message-row--human .user-bubble) {
  padding: 12px 16px !important; /* vertical | horizontal */
}

/* ✅ Sidebar panel background (exact container) */
.chat-page :global(.shadow-inner-right.w-\[300px\]) {
  background: #232325 !important; /* lighter than #171717 */
  border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
}

/* Lower scrollable part of the sidebar */
.chat-page
  :global(.shadow-inner-right.w-\[300px\] .flex.h-full.w-full.flex-col.items-start.justify-start.gap-2.overflow-y-scroll) {
  background: #232325 !important; /* same as top sidebar, or tweak */
}

/* Individual thread row wrapper */
.chat-page
  :global(.shadow-inner-right.w-\[300px\] .w-full.px-1) {
  background: #232325 !important; /* same as sidebar */
}

.chat-page
  :global(.shadow-inner-right.w-\[300px\] button.w-\[280px\]:hover) {
  background: rgba(255,255,255,0.08);
}

/* Make the text input more spacious (Gemini-like) */
.chat-page :global(.chat-input-area) {
  min-height: 7px !important;   /* key: gives breathing room */
  padding: 8px 10px !important; /* more inner space */
  line-height: 1.6 !important;
  font-size: 15px;
}


/* Align input actions on the same baseline (Gemini-style) */
.chat-page :global(.chat-input-actions) {
  align-items: baseline !important;
}

/* Fine vertical adjustment for Send button */
.chat-page :global(.chat-send-btn) {
  margin-top: 2px; /* try 1–4px */
}

        .chat-page :global(a[href*="github.com/langchain-ai/agent-chat-ui"]) {
          color: #e5e7eb;
        }

        .chat-page :global(a[href*="github.com/langchain-ai/agent-chat-ui"]:hover) {
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}
