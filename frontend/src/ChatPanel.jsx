import { useState, useEffect, useRef } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ── Markdown / response formatter ──────────────────────────
function formatContent(content) {
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

          if (/^[A-D]\)/.test(line)) {
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

          if (line.startsWith("Answer:")) return null

          if (line.startsWith("|") && line.endsWith("|")) {
            if (line.includes("---")) return null
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

          if (line.trim() && line.includes("**")) {
            return (
              <div key={j} style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "3px 0", lineHeight: "1.7" }}
                dangerouslySetInnerHTML={{
                  __html: line.replace(/\*\*(.+?)\*\*/g, "<strong style='color:var(--text-primary)'>$1</strong>")
                }}
              />
            )
          }

          if (!line.trim()) return <div key={j} style={{ height: "6px" }} />

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

// ── Single chat bubble — shows content + sources + feedback ──
function MessageBubble({ role, content, sources, messageIndex }) {
  const isUser = role === "user"
  const [feedback, setFeedback] = useState(null) // "up" | "down" | null

  async function submitFeedback(vote) {
    if (feedback) return  // already voted
    setFeedback(vote)
    try {
      await fetch(`${API}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_index: messageIndex,
          rating: vote === "up" ? 1 : -1
        })
      })
    } catch {
      // silently fail — feedback is non-critical
    }
  }

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "18px" }}>

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

      <div style={{
        background: isUser ? "var(--user-bg)" : "var(--ai-bg)",
        border: `1px solid ${isUser ? "var(--user-border)" : "var(--ai-border)"}`,
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

        {/* Source citations — only shown on AI messages that have them */}
        {!isUser && sources && sources.length > 0 && (
          <div style={{
            marginTop: "10px",
            paddingTop: "8px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600" }}>
              from docs:
            </span>
            {sources.map(s => (
              <span key={s} style={{
                fontSize: "10px",
                background: "var(--accent-dim)",
                color: "var(--accent-text)",
                borderRadius: "4px",
                padding: "2px 7px",
                fontWeight: "500"
              }}>{s}</span>
            ))}
          </div>
        )}

        {/* Thumbs up / down — only on AI messages */}
        {!isUser && (
          <div style={{ display: "flex", gap: "4px", marginTop: "10px" }}>
            <button
              onClick={() => submitFeedback("up")}
              title="helpful"
              style={{
                background: feedback === "up" ? "var(--green-dim)" : "transparent",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "2px 8px",
                fontSize: "12px",
                cursor: feedback ? "default" : "pointer",
                opacity: feedback && feedback !== "up" ? 0.3 : 1,
                transition: "opacity 0.15s, background 0.15s",
                color: "var(--text-muted)"
              }}
            >👍</button>
            <button
              onClick={() => submitFeedback("down")}
              title="not helpful"
              style={{
                background: feedback === "down" ? "var(--bg-hover)" : "transparent",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "2px 8px",
                fontSize: "12px",
                cursor: feedback ? "default" : "pointer",
                opacity: feedback && feedback !== "down" ? 0.3 : 1,
                transition: "opacity 0.15s, background 0.15s",
                color: "var(--text-muted)"
              }}
            >👎</button>
            {feedback && (
              <span style={{ fontSize: "10px", color: "var(--text-muted)", alignSelf: "center", marginLeft: "4px" }}>
                {feedback === "up" ? "thanks!" : "noted, will improve"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ChatPanel ──────────────────────────────────────────
export default function ChatPanel({ messages, onNewMessage, token, model, onModelChange }) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // shared streaming logic so sendMessage and sendSuggestion don't repeat
  async function streamChat(text) {
    const userMsg = { role: "user", content: text }
    onNewMessage(userMsg, null)
    setInput("")
    setLoading(true)

    try {
      const allMessages = [...messages, userMsg]
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, model }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""
      let finalSources = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) {
              fullText += data.text
              onNewMessage(null, { role: "assistant", content: fullText })
            } else if (data.sources) {
              // sources arrive as a separate event at the end of the stream
              finalSources = data.sources
            }
          } catch {}
        }
      }

      // attach sources to the final message
      if (finalSources.length > 0) {
        onNewMessage(null, { role: "assistant", content: fullText, sources: finalSources })
      }
    } catch {
      onNewMessage(null, { role: "assistant", content: "Error connecting to backend." })
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    await streamChat(text)
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestionCards = [
    { label: "YouTube", prompt: "Design YouTube", emoji: "📺", desc: "Video streaming at scale" },
    { label: "Swiggy", prompt: "Design Swiggy", emoji: "🛵", desc: "Food delivery system" },
    { label: "URL Shortener", prompt: "Design a URL Shortener", emoji: "🔗", desc: "High-throughput redirects" },
    { label: "WhatsApp", prompt: "Design WhatsApp", emoji: "💬", desc: "Real-time messaging" },
  ]

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

        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "50px", padding: "0 12px" }}>

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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%", maxWidth: "340px" }}>
              {suggestionCards.map(s => (
                <button
                  key={s.label}
                  onClick={() => streamChat(s.prompt)}
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

        {/* Pass messageIndex so feedback knows which message to tag */}
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            sources={msg.sources}
            messageIndex={i}
          />
        ))}

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

        {messages.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "9px" }}>
            {suggestionChips.map(s => (
              <button
                key={s.label}
                onClick={() => streamChat(s.prompt)}
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

        {/* Model selector + textarea + send button */}
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>

            {/* Model picker — small, tucked above the textarea */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>model:</span>
              <select
                value={model}
                onChange={e => onModelChange(e.target.value)}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "2px 6px",
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="gemini-2.5-flash-lite">Flash Lite (fast)</option>
                <option value="gemini-2.5-flash">Flash (better)</option>
              </select>
            </div>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Design a system, ask a concept, or request a quiz…"
              rows={2}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "10px 14px",
                color: "var(--text-primary)",
                fontSize: "13px",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: "1.5",
                width: "100%",
                boxSizing: "border-box"
              }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

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
              transition: "background 0.15s",
              alignSelf: "flex-end"
            }}
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}
