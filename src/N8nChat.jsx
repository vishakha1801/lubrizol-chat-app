import React, { useState, useEffect, useRef } from "react";

const N8N_CHAT_URL = "http://localhost:5678/webhook/chat/your-webhook-id";

function createSessionId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

const N8nChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text:
        "Hi, I am your should cost modeling assistant. Tell me about the chemical or model you want to work on.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [sessionId] = useState(() => {
    const stored = localStorage.getItem("n8nChatSessionId");
    if (stored) return stored;
    const id = createSessionId();
    localStorage.setItem("n8nChatSessionId", id);
    return id;
  });

  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(N8N_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.text,
          sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();

      let replyText = "";
      if (Array.isArray(data) && data[0] && data[0].json) {
        replyText = data[0].json.output || JSON.stringify(data[0].json);
      } else {
        replyText = JSON.stringify(data);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: replyText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage = {
        id: Date.now() + 2,
        role: "assistant",
        text: "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      style={{
        height: "100vh",
        maxHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0f172a",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "900px",
          height: "100%",
          maxHeight: "700px",
          backgroundColor: "#020617",
          borderRadius: "12px",
          border: "1px solid #1e293b",
          boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #1f2937",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background:
              "linear-gradient(to right, #0f172a, #020617 40%, #0f172a)",
          }}
        >
          <div>
            <div
              style={{
                color: "#e5e7eb",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              Should Cost Chatbot
            </div>
            <div
              style={{
                color: "#9ca3af",
                fontSize: "12px",
              }}
            >
              Powered by an n8n workflow
            </div>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              borderRadius: "999px",
              border: "1px solid #334155",
              padding: "4px 8px",
            }}
          >
            Session: {sessionId.slice(0, 8)}
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            background:
              "radial-gradient(circle at top left, rgba(56,189,248,0.08), transparent 60%), radial-gradient(circle at bottom right, rgba(129,140,248,0.08), transparent 60%)",
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap",
                  backgroundColor:
                    m.role === "user" ? "#1d4ed8" : "rgba(15,23,42,0.85)",
                  color: "#e5e7eb",
                  border:
                    m.role === "user"
                      ? "1px solid #2563eb"
                      : "1px solid #1f2937",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  backgroundColor: "rgba(15,23,42,0.85)",
                  color: "#9ca3af",
                  border: "1px solid #1f2937",
                }}
              >
                Thinking...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            borderTop: "1px solid #1f2937",
            padding: "10px 12px",
            backgroundColor: "#020617",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your new chemical or ask a question..."
              style={{
                flex: 1,
                minHeight: "38px",
                maxHeight: "120px",
                padding: "8px 10px",
                resize: "vertical",
                borderRadius: "8px",
                border: "1px solid #374151",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                minWidth: "80px",
                padding: "8px 14px",
                borderRadius: "999px",
                border: "none",
                fontSize: "14px",
                fontWeight: 500,
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                opacity: isLoading || !input.trim() ? 0.5 : 1,
                background:
                  "linear-gradient(to right, #2563eb, #4f46e5, #06b6d4)",
                color: "#f9fafb",
              }}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
          <div
            style={{
              marginTop: "6px",
              fontSize: "11px",
              color: "#6b7280",
            }}
          >
            Press Enter to send, Shift+Enter for a new line.
          </div>
        </div>
      </div>
    </div>
  );
};

export default N8nChat;
