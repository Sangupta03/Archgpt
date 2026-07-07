import { useState, useEffect, useRef } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ── Markdown / response formatter ──────────────────────────
// Parses the AI's text and renders it with proper hierarchy.
// All colors use CSS variables so they switch with dark/light theme.
function formatContent(content) {
  // Split on mermaid code blocks — those get a "diagram rendered" notice
  const parts = content.split(/(```mermaid[\s\S]*?```)/g)

  return parts.map((part, i) => {
    if (part.startsWith("```mermaid")) {
      return (
        <div key={i} style={{
          background: "var(--green-dim)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "8px 12px",
          margin: "8px 0",
          fontSize: "12px",
          color: "var(--green-text)",
          display: "flex",
          gap: "8px",
          alignItems: "center"
        }}>
          <span>✓</span>
          <span>Architecture diagram rendered on the right →</span>
        </div>
      )
    }

    const lines = part.split("\n")
    let qNum = 0

    return (
      <div key={i}>
        {lines.map((line, j) => {

          // ## Heading
          if (line.startsWith("## ")) {
            return (
              <div key={j} style={{
                fontSize: "15px", fontWeight: "600", color: "var(--text-primary)",
                margin: "14px 0 6px", paddingBottom: "5px",
                borderBottom: "1px solid var(--border)"
              }}>
                {line.replace("## ", "")}
              </div>
            )
          }

          // ### Sub-heading
          if (line.startsWith("### ")) {
            return (
              <div key={j} style={{
                fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)",
                margin: "10px 0 4px"
              }}>
                {line.replace("### ", "")}
              </div>
            )
          }

          // Numbered list  1. 2. 3.
          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={j} style={{ display: "flex", gap: "8px", margin: "4px 0", fontSize: "13px" }}>
                <span style={{ color: "var(--accent)", fontWeight: "600", flexShrink: 0 }}>
                  {line.match(/^(\d+)\./)[1]}.
                </span>
                <span style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                  dangerouslySetInnerHTML={{
                    __html: line.replace(/^\d+\.\s/, "").replace(/\*\*(.+?)\*\*/g, "<strong style='color:var(--text-primary)'>$1</strong>")
                  }}
                />
              </div>
            )
          }

          // Bullet point  - or •
          if (line.startsWith("- ") || line.startsWith("• ")) {
            const text = line.replace(/^[-•]\s/, "")
            return (
              <div key={j} style={{ display: "flex", gap: "8px", margin: "4px 0", fontSize: "13px" }}>
                <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }}>▸</span>
                <span style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                  dangerouslySetInnerHTML={{
                    __html: text.replace(/\*\*(.+?)\*\*/g, "<strong style='color:var(--text-primary)'>$1</strong>")
                  }}
                />
              </div>
            )
          }

          // Quiz question  Q:
          if (line.startsWith("Q:")) {
            qNum++
            return (
              <div key={j} style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderLeft: "3px solid var(--accent)",
                borderRadius: "0 8px 8px 0",
                padding: "10px 14px",
                margin: "12px 0 4px",
                fontSize: "13px",
                color: "var(--text-primary)",
                fontWeight: "500"
              }}>
                Q{qNum}. {line.replace("Q:", "").trim()}
              </div>
            )
          }

          // Quiz options  A) B) C) D) — may all appear on one line
          if (/^[A-D]\)/.test(line)) {
            // Split "A) x B) y C) z D) w" into individual options
            const opts = line.split(/(?=[B-D]\))/).map(s => s.trim()).filter(Boolean)
            return (
              <div key={j}>
                {opts.map((opt, k) => (
                  <div key={k} style={{
                    padding: "4px 14px",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    display: "flex",
                    gap: "10px",
                    margin: "2px 0"
                  }}>
                    <span style={{
                      background: "var(--bg-hover)",
                      borderRadius: "4px",
                      padding: "1px 7px",
                      color: "var(--text-secondary)",
                      fontWeight: "600",
                      flexShrink: 0,
                      fontSize: "12px"
                    }}>
                      {opt[0]}
                    </span>
                    <span>{opt.slice(3).trim()}</span>
                  </div>
                ))}
              </div>
            )
          }

          // Answer line — hidden so quiz works properly
          if (line.startsWith("Answer:")) {
            return null
          }

          // Table row  | a | b |
          if (line.startsWith("|") && line.endsWith("|")) {
            if (line.includes("---")) return null // skip separator row
            const cells = line.split("|").filter(c => c.trim())
            const isHeader = lines[j + 1]?.includes("---")
            return (
              <div key={j} style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
                gap: "1px",
                marginBottom: "1px"
              }}>
                {cells.map((cell, k) => (
                  <div key={k} style={{
                    padding: "6px 10px",
                    fontSize: "12px",
                    background: isHeader ? "var(--bg-hover)" : "var(--bg-card)",
                    color: isHeader ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: isHeader ? "600" : "400",
                    border: "1px solid var(--border)"
                  }}
                    dangerouslySetInnerHTML={{
                      __html: cell.trim().replace(/\*\*(.+?)\*\*/g, "<strong style='color:var(--text-primary)'>$1</strong>")
                    }}
                  />
                ))}
              </div>
            )
          }

          // Inline bold paragraph
          if (line.trim() && line.includes("**")) {
            return (
              <div key={j} style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "3px 0", lineHeight: "1.7" }}
                dangerouslySetInnerHTML={{
                  __html: line.replace(/\*\*(.+?)\*\*/g, "<strong style='color:var(--text-primary)'>$1</strong>")
                }}
              />
            )
          }

          // Empty line → small spacer
          if (!line.trim()) return <div key={j} style={{ height: "6px" }} />

          // Plain paragraph
          return (
            <div key={j} style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "3px 0", lineHeight: "1.7" }}>
              {line}
            </div>
          )
        })}
      </div>
    )
  })
}

// ── Single chat bubble ──────────────────────────────────────
function MessageBubble({ role, content }) {
  const isUser = role === "user"
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "18px" }}>

      {/* Avatar chip */}
      <div style={{
        width: "28px", height: "28px",
        borderRadius: "7px",
        background: isUser ? "var(--accent-dim)" : "var(--green-dim)",
        color: isUser ? "var(--accent-text)" : "var(--green-text)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "10px", fontWeight: "700",
        flexShrink: 0, marginTop: "1px"
      }}>
        {isUser ? "You" : "AI"}
      </div>

      {/* Message content */}
      <div style={{
        background: isUser ? "var(--user-bg)" : "var(--ai-bg)",
        border: `1px solid ${isUser ? "var(--user-border)" : "var(--ai-border)"}`,
        // Corners: user = no bottom-right, AI = no top-left — subtle distinction
        borderRadius: isUser ? "12px 12px 4px 12px" : "4px 12px 12px 12px",
        padding: "12px 16px",
        maxWidth: "680px",
        width: "100%",
        lineHeight: "1.6"
      }}>
        {isUser
          ? <div style={{ fontSize: "13px", color: "var(--user-text)", lineHeight: "1.6" }}>{content}</div>
          : formatContent(content)
        }
      </div>
    </div>
  )
}

// ── Main ChatPanel ──────────────────────────────────────────
export default function ChatPanel({ messages, onNewMessage, token }) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: "user", content: text }
    onNewMessage(userMsg, null)
    setInput("")
    setLoading(true)

    try {
      const allMessages = [...messages, userMsg]
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const { text } = JSON.parse(line.slice(6))
              fullText += text
              onNewMessage(null, { role: "assistant", content: fullText })
            } catch {}
          }
        }
      }
    } catch (e) {
      onNewMessage(null, { role: "assistant", content: "Error connecting to backend." })
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Send a preset suggestion prompt immediately
  function sendSuggestion(text) {
    setInput(text)
    setTimeout(() => {
      const userMsg = { role: "user", content: text }
      onNewMessage(userMsg, null)
      setInput("")
      setLoading(true)
      const allMessages = [...messages, userMsg]
      fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
      }).then(res => {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let fullText = ""
        function read() {
          reader.read().then(({ done, value }) => {
            if (done) { setLoading(false); return }
            const chunk = decoder.decode(value)
            for (const line of chunk.split("\n")) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const { text } = JSON.parse(line.slice(6))
                  fullText += text
                  onNewMessage(null, { role: "assistant", content: fullText })
                } catch {}
              }
            }
            read()
          })
        }
        read()
      }).catch(() => {
        onNewMessage(null, { role: "assistant", content: "Error connecting to backend." })
        setLoading(false)
      })
    }, 0)
  }

  // Cards shown in the empty state — 2×2 grid
  const suggestionCards = [
    { label: "YouTube", prompt: "Design YouTube", emoji: "📺", desc: "Video streaming at scale" },
    { label: "Swiggy", prompt: "Design Swiggy", emoji: "🛵", desc: "Food delivery system" },
    { label: "URL Shortener", prompt: "Design a URL Shortener", emoji: "🔗", desc: "High-throughput redirects" },
    { label: "WhatsApp", prompt: "Design WhatsApp", emoji: "💬", desc: "Real-time messaging" },
  ]

  // Compact chips shown above input once conversation starts
  const suggestionChips = [
    { label: "YouTube", prompt: "Design YouTube" },
    { label: "Swiggy", prompt: "Design Swiggy" },
    { label: "URL Shortener", prompt: "Design a URL Shortener" },
    { label: "WhatsApp", prompt: "Design WhatsApp" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-base)" }}>

      {/* ── Message area ──────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 18px 16px" }}>

        {/* Empty state — shown before any message is sent */}
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "50px", padding: "0 12px" }}>

            {/* Logo */}
            <div style={{
              width: "50px", height: "50px",
              background: "linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%)",
              borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", fontWeight: "800", color: "white",
              boxShadow: "0 4px 20px rgba(108,92,245,0.25)",
              marginBottom: "18px"
            }}>A</div>

            <h2 style={{
              fontSize: "20px", fontWeight: "700", color: "var(--text-primary)",
              marginBottom: "6px", textAlign: "center", letterSpacing: "-0.02em"
            }}>
              what do you want to design?
            </h2>

            <p style={{
              fontSize: "13px", color: "var(--text-muted)",
              marginBottom: "28px", textAlign: "center", lineHeight: "1.6"
            }}>
              design systems · compare architectures · ace your interviews
            </p>

            {/* 2×2 suggestion cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%", maxWidth: "340px" }}>
              {suggestionCards.map(s => (
                <button
                  key={s.label}
                  onClick={() => sendSuggestion(s.prompt)}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "14px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s, transform 0.1s",
                    lineHeight: "normal"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "var(--accent)"
                    e.currentTarget.style.background = "var(--accent-dim)"
                    e.currentTarget.style.transform = "translateY(-1px)"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--border)"
                    e.currentTarget.style.background = "var(--bg-surface)"
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                >
                  <div style={{ fontSize: "18px", marginBottom: "6px" }}>{s.emoji}</div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "2px" }}>{s.label}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {/* Animated typing dots while AI is responding */}
        {loading && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "18px" }}>
            <div style={{
              width: "28px", height: "28px",
              borderRadius: "7px",
              background: "var(--green-dim)",
              color: "var(--green-text)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", fontWeight: "700",
              flexShrink: 0
            }}>AI</div>
            <div style={{
              background: "var(--ai-bg)",
              border: "1px solid var(--ai-border)",
              borderRadius: "4px 12px 12px 12px",
              padding: "14px 16px",
              display: "flex",
              gap: "5px",
              alignItems: "center"
            }}>
              {/* These use the .typing-dot CSS class for the blink animation */}
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ────────────────────────────────────── */}
      <div style={{
        padding: "10px 14px 14px",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-surface)",
        flexShrink: 0
      }}>

        {/* Quick chips above input — shown once conversation has started */}
        {messages.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "9px" }}>
            {suggestionChips.map(s => (
              <button
                key={s.label}
                onClick={() => sendSuggestion(s.prompt)}
                disabled={loading}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  padding: "3px 11px",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "500"
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = "var(--accent)"
                    e.currentTarget.style.color = "var(--accent-text)"
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.color = "var(--text-muted)"
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Textarea + Send */}
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Design a system, ask a concept, or request a quiz…"
            rows={2}
            style={{
              flex: 1,
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "10px 14px",
              color: "var(--text-primary)",
              fontSize: "13px",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: "1.5"
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? "var(--bg-hover)" : "var(--accent)",
              border: "none",
              borderRadius: "10px",
              padding: "0 18px",
              height: "60px",
              color: loading || !input.trim() ? "var(--text-muted)" : "white",
              fontSize: "13px",
              fontWeight: "500",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              flexShrink: 0,
              transition: "background 0.15s"
            }}
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}
