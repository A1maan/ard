"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import type { Farm } from "./FarmsDropdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type ChatButtonProps = {
  farm: Farm | null;
};

export function ChatButton({ farm }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && farm && messages.length === 0) {
      // Add initial greeting
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm your AI soil assistant for **${farm.name}**. I can help you with:

• Soil health analysis and recommendations
• Crop suggestions based on soil conditions
• Irrigation and fertilization advice
• Historical trends and predictions

How can I help you today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, farm]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const generateResponse = (userMessage: string, farm: Farm): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("health") || lowerMessage.includes("score")) {
      return `Based on my analysis of **${farm.name}**, the current soil health score is **${farm.healthScore}%**. ${
        farm.healthScore > 75
          ? "This is excellent! Your soil is in great condition."
          : farm.healthScore > 50
          ? "This is moderate. There's room for improvement in organic matter and nutrient balance."
          : "This needs attention. I recommend a comprehensive soil treatment plan."
      }`;
    }

    if (lowerMessage.includes("crop") || lowerMessage.includes("plant") || lowerMessage.includes("grow")) {
      const crops =
        farm.soilType === "Sandy Loam"
          ? "carrots, potatoes, lettuce, and tomatoes"
          : farm.soilType === "Clay Loam"
          ? "wheat, rice, cabbage, and broccoli"
          : farm.soilType === "Sandy"
          ? "watermelon, peanuts, and peppers"
          : farm.soilType === "Alluvial"
          ? "sugarcane, rice, wheat, and vegetables"
          : "wheat, barley, and drought-resistant crops";

      return `Given the **${farm.soilType}** soil type at ${farm.name}, I recommend growing: **${crops}**. These crops are well-suited to your soil's drainage and nutrient profile.`;
    }

    if (lowerMessage.includes("water") || lowerMessage.includes("irrigation")) {
      return `For **${farm.name}** with ${farm.area} of ${farm.soilType} soil:

• **Recommended irrigation**: Drip irrigation system
• **Frequency**: Every 3-4 days during growing season
• **Best time**: Early morning (5-7 AM)
• **Water depth**: 15-20cm per session

Current soil moisture levels are within acceptable range.`;
    }

    if (lowerMessage.includes("fertilizer") || lowerMessage.includes("nutrient")) {
      return `Fertilizer recommendations for **${farm.name}**:

• **Nitrogen (N)**: Apply 25kg/ha in 2-3 split doses
• **Phosphorus (P)**: Apply 15kg/ha at planting
• **Potassium (K)**: Apply 20kg/ha monthly
• **Organic matter**: Add 2-3 tons/ha of compost annually

Consider a soil test every 6 months to adjust these values.`;
    }

    if (lowerMessage.includes("problem") || lowerMessage.includes("issue") || lowerMessage.includes("help")) {
      return `I can help diagnose soil issues at **${farm.name}**. Please describe what you're observing:

• Are plants showing yellowing leaves? (nitrogen deficiency)
• Stunted growth? (pH or compaction issues)
• Poor drainage? (soil structure problems)
• Salt buildup? (over-irrigation)

Share more details and I'll provide specific solutions.`;
    }

    return `I understand you're asking about "${userMessage}" for **${farm.name}**. 

To give you the most accurate advice, I'm analyzing:
• Soil type: ${farm.soilType}
• Farm area: ${farm.area}
• Current health score: ${farm.healthScore}%

Could you provide more specific details about what aspect of your farm you'd like to focus on?`;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !farm) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = generateResponse(userMessage.content, farm);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!farm) return null;

  return (
    <>
      {/* Chat Button */}
      <button
        className={`chat-button ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with AI Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-info">
              <Bot size={20} className="bot-icon" />
              <div>
                <h3>Soil AI Assistant</h3>
                <span className="status">Online • {farm.name}</span>
              </div>
            </div>
            <button className="minimize-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-avatar">
                  {message.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className="message-content">
                  <p dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-avatar">
                  <Bot size={16} />
                </div>
                <div className="message-content loading">
                  <Loader2 size={16} className="spinner" />
                  <span>Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about your soil..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .chat-button {
          position: absolute;
          bottom: 60px;
          right: 80px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(74, 222, 128, 0.4);
          transition: all 0.2s;
          z-index: 1000;
        }

        .chat-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 24px rgba(74, 222, 128, 0.5);
        }

        .chat-button.active {
          background: #3c4043;
        }

        .chat-window {
          position: absolute;
          bottom: 130px;
          right: 20px;
          width: 380px;
          height: 500px;
          background: #1e1e2e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
          z-index: 999;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(74, 222, 128, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bot-icon {
          color: #4ade80;
        }

        .header-info h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #e8eaed;
        }

        .status {
          font-size: 11px;
          color: #4ade80;
        }

        .minimize-btn {
          background: none;
          border: none;
          color: #9aa0a6;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.15s;
        }

        .minimize-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e8eaed;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message {
          display: flex;
          gap: 10px;
          max-width: 90%;
        }

        .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message.assistant .message-avatar {
          background: rgba(74, 222, 128, 0.2);
          color: #4ade80;
        }

        .message.user .message-avatar {
          background: rgba(96, 165, 250, 0.2);
          color: #60a5fa;
        }

        .message-content {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
        }

        .message.assistant .message-content {
          background: rgba(255, 255, 255, 0.05);
          color: #e8eaed;
          border-bottom-left-radius: 4px;
        }

        .message.user .message-content {
          background: rgba(74, 222, 128, 0.2);
          color: #e8eaed;
          border-bottom-right-radius: 4px;
        }

        .message-content p {
          margin: 0;
        }

        .message-content strong {
          color: #4ade80;
        }

        .message-time {
          display: block;
          font-size: 10px;
          color: #9aa0a6;
          margin-top: 6px;
        }

        .message-content.loading {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9aa0a6;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .chat-input {
          display: flex;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chat-input input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 12px 16px;
          font-size: 13px;
          color: #e8eaed;
          outline: none;
          transition: all 0.15s;
        }

        .chat-input input::placeholder {
          color: #9aa0a6;
        }

        .chat-input input:focus {
          border-color: rgba(74, 222, 128, 0.5);
          background: rgba(255, 255, 255, 0.08);
        }

        .send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #4ade80;
          border: none;
          color: #1e1e2e;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .send-btn:hover:not(:disabled) {
          background: #22c55e;
          transform: scale(1.05);
        }

        .send-btn:disabled {
          background: #3c4043;
          color: #9aa0a6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
