import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const N8N_CHAT_URL = "/api/chat";

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
          sessionId,
          action: "sendMessage",
          chatInput: userMessage.text,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(
          `Request failed with status ${res.status}: ${errorText}`
        );
      }

      const data = await res.json();

      let replyText = "";

      if (data && typeof data === "object" && data.output) {
        replyText = String(data.output).trim();
      } else if (Array.isArray(data) && data[0] && data[0].json) {
        replyText = data[0].json.output || JSON.stringify(data[0].json, null, 2);
      } else if (data && typeof data === "object" && data.reply) {
        replyText = String(data.reply).trim();
      } else {
        replyText =
          typeof data === "string" ? data : JSON.stringify(data, null, 2);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: replyText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
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
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "radial-gradient(circle at top, #020617 0, #020617 40%, #020617 100%)",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          height: "100%",
          maxHeight: "720px",
          margin: "0 auto",
          borderRadius: "24px",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          background:
            "radial-gradient(circle at top left, rgba(15,23,42,1) 0, #020617 45%, #020617 100%)",
          boxShadow:
            "0 18px 45px rgba(0,0,0,0.75), 0 0 0 1px rgba(15,23,42,0.8)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(31,41,55,0.9)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backdropFilter: "blur(10px)",
            background:
              "linear-gradient(90deg, rgba(15,23,42,0.96), rgba(15,23,42,0.92))",
          }}
        >
          <div>
            <div
              style={{
                color: "#e5e7eb",
                fontSize: "18px",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              Should Cost Chatbot
            </div>
            <div
              style={{
                color: "#9ca3af",
                fontSize: "12px",
                marginTop: "2px",
              }}
            >
              Powered by an n8n workflow
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              color: "#9ca3af",
            }}
          >
            <span
              style={{
                padding: "3px 8px",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.4)",
                backgroundColor: "rgba(15,23,42,0.9)",
              }}
            >
              Session: {sessionId.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 20px 16px",
            background:
              "radial-gradient(circle at top left, rgba(56,189,248,0.10), transparent 55%), radial-gradient(circle at bottom right, rgba(129,140,248,0.09), transparent 55%)",
          }}
        >
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: isUser ? "#93c5fd" : "#9ca3af",
                    }}
                  >
                    {isUser ? "You" : "Assistant"}
                  </span>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: isUser
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                      fontSize: "14px",
                      lineHeight: 1.5,
                      backgroundColor: isUser
                        ? "rgba(37,99,235,0.95)"
                        : "rgba(15,23,42,0.96)",
                      color: "#e5e7eb",
                      border: isUser
                        ? "1px solid rgba(59,130,246,0.9)"
                        : "1px solid rgba(31,41,55,0.95)",
                      boxShadow: isUser
                        ? "0 8px 18px rgba(37,99,235,0.35)"
                        : "0 10px 22px rgba(15,23,42,0.8)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {isUser ? (
                      m.text
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => (
                            <p
                              style={{
                                margin: "0 0 6px",
                              }}
                              {...props}
                            />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul
                              style={{
                                paddingLeft: "18px",
                                margin: "4px 0 6px",
                              }}
                              {...props}
                            />
                          ),
                          li: ({ node, ...props }) => (
                            <li
                              style={{
                                marginBottom: "2px",
                              }}
                              {...props}
                            />
                          ),
                          table: ({ node, ...props }) => (
                            <div
                              style={{
                                overflowX: "auto",
                                marginTop: "6px",
                              }}
                            >
                              <table
                                style={{
                                  width: "100%",
                                  borderCollapse: "collapse",
                                  fontSize: "12px",
                                }}
                                {...props}
                              />
                            </div>
                          ),
                          th: ({ node, ...props }) => (
                            <th
                              style={{
                                border: "1px solid #1f2937",
                                padding: "4px 6px",
                                textAlign: "left",
                                backgroundColor: "rgba(15,23,42,0.9)",
                                fontWeight: 600,
                              }}
                              {...props}
                            />
                          ),
                          td: ({ node, ...props }) => (
                            <td
                              style={{
                                border: "1px solid #1f2937",
                                padding: "4px 6px",
                                verticalAlign: "top",
                              }}
                              {...props}
                            />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong
                              style={{
                                color: "#e5e7eb",
                              }}
                              {...props}
                            />
                          ),
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginTop: "4px",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "14px",
                  fontSize: "13px",
                  backgroundColor: "rgba(15,23,42,0.9)",
                  color: "#9ca3af",
                  border: "1px solid rgba(31,41,55,0.9)",
                  fontStyle: "italic",
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
            borderTop: "1px solid rgba(31,41,55,0.9)",
            padding: "10px 14px 12px",
            backgroundColor: "rgba(2,6,23,0.98)",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            style={{
              display: "flex",
              gap: "10px",
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
                minHeight: "44px",
                maxHeight: "120px",
                padding: "10px 12px",
                resize: "vertical",
                borderRadius: "12px",
                border: "1px solid rgba(55,65,81,0.95)",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: "14px",
                outline: "none",
                boxShadow: "0 0 0 1px rgba(15,23,42,0.9)",
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                minWidth: "92px",
                padding: "10px 18px",
                borderRadius: "999px",
                border: "none",
                fontSize: "14px",
                fontWeight: 500,
                cursor:
                  isLoading || !input.trim() ? "not-allowed" : "pointer",
                opacity: isLoading || !input.trim() ? 0.55 : 1,
                background:
                  "linear-gradient(135deg, #2563eb, #4f46e5, #0ea5e9)",
                color: "#f9fafb",
                boxShadow:
                  "0 10px 24px rgba(37,99,235,0.45), 0 0 0 1px rgba(15,23,42,0.9)",
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
