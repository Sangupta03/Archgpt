import { useState, useEffect, useRef } from "react"

// A single chat bubble — reused for every message
// props.role = "user" or "assistant"
// props.content = the text
// Replace your MessageBubble function with this improved version

function formatContent(content) {
  // Split content into sections — mermaid blocks vs regular text
  const parts = content.split(/(```mermaid[\s\S]*?```)/g)

  return parts.map((part, i) => {
    // Skip mermaid blocks entirely — diagram panel shows them
    if (part.startsWith("```mermaid")) {
      return (
        <div key={i} style={{
          background: "#1a2e1a", border: "1px solid #2a4a2a",
          borderRadius: "8px", padding: "8px 12px", margin: "8px 0",
          fontSize: "12px", color: "#4caf50"
        }}>
          ✓ Architecture diagram rendered on the right panel →
        </div>
      )
    }

    // Format regular markdown text
    const lines = part.split("\n")
    let qNum = 0
    return (
      <div key={i}>
        {lines.map((line, j) => {
          // ## Heading
          if (line.startsWith("## ")) {
            return <div key={j} style={{
              fontSize: "15px", fontWeight: "600", color: "#fff",
              margin: "14px 0 6px", paddingBottom: "4px",
              borderBottom: "1px solid #2a2a2a"
            }}>{line.replace("## ", "")}</div>
          }
          // ### Sub heading
          if (line.startsWith("### ")) {
            return <div key={j} style={{
              fontSize: "13px", fontWeight: "600", color: "#ccc",
              margin: "10px 0 4px"
            }}>{line.replace("### ", "")}</div>
          }
          // Numbered list  1. 2. 3.
          if (/^\d+\.\s/.test(line)) {
            return <div key={j} style={{
              display: "flex", gap: "8px", margin: "4px 0", fontSize: "13px"
            }}>
              <span style={{ color: "#5b4de8", fontWeight: "600", flexShrink: 0 }}>
                {line.match(/^(\d+)\./)[1]}.
              </span>
              <span style={{ color: "#ccc" }} dangerouslySetInnerHTML={{
                __html: line.replace(/^\d+\.\s/, "").replace(/\*\*(.+?)\*\*/g, "<strong style='color:#fff'>$1</strong>")
              }} />
            </div>
          }
          // Bullet point
          if (line.startsWith("- ") || line.startsWith("• ")) {
            const text = line.replace(/^[-•]\s/, "")
            return <div key={j} style={{
              display: "flex", gap: "8px", margin: "3px 0", fontSize: "13px"
            }}>
              <span style={{ color: "#5b4de8", flexShrink: 0, marginTop: "1px" }}>▸</span>
              <span style={{ color: "#ccc" }} dangerouslySetInnerHTML={{
                __html: text.replace(/\*\*(.+?)\*\*/g, "<strong style='color:#fff'>$1</strong>")
              }} />
            </div>
          }
          // Quiz question line  Q:
          if (line.startsWith("Q:")) {
            qNum++
            return <div key={j} style={{
              background: "#1e1e2e", border: "1px solid #2e2e4e",
              borderRadius: "8px", padding: "10px 12px", margin: "10px 0 4px",
              fontSize: "13px", color: "#c8c8f0", fontWeight: "500"
            }}>Q{qNum}. {line.replace("Q:", "").trim()}</div>
          }
          // Quiz options  A) B) C) D) — may all be on one line or separate
          if (/^[A-D]\)/.test(line)) {
            // Split "A) foo B) bar C) baz D) qux" into individual options
            const opts = line.split(/(?=[B-D]\))/).map(s => s.trim()).filter(Boolean)
            return (
              <div key={j}>
                {opts.map((opt, k) => (
                  <div key={k} style={{
                    padding: "4px 12px", fontSize: "12px", color: "#888",
                    display: "flex", gap: "8px"
                  }}>
                    <span style={{
                      background: "#2a2a2a", borderRadius: "4px",
                      padding: "1px 7px", color: "#aaa", fontWeight: "500", flexShrink: 0
                    }}>{opt[0]}</span>
                    <span>{opt.slice(3).trim()}</span>
                  </div>
                ))}
              </div>
            )
          }
          // Answer line — hidden from quiz display
          if (line.startsWith("Answer:")) {
            return null
          }
          // Table row  | a | b | c |
          if (line.startsWith("|") && line.endsWith("|")) {
            if (line.includes("---")) return null // skip separator rows
            const cells = line.split("|").filter(c => c.trim())
            const isHeader = lines[j + 1]?.includes("---")
            return <div key={j} style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
              gap: "1px", marginBottom: "1px"
            }}>
              {cells.map((cell, k) => (
                <div key={k} style={{
                  padding: "5px 8px", fontSize: "12px",
                  background: isHeader ? "#2a2a3e" : "#1a1a1a",
                  color: isHeader ? "#c8c8f0" : "#aaa",
                  fontWeight: isHeader ? "600" : "400",
                  border: "1px solid #2a2a2a"
                }} dangerouslySetInnerHTML={{
                  __html: cell.trim().replace(/\*\*(.+?)\*\*/g, "<strong style='color:#fff'>$1</strong>")
                }} />
              ))}
            </div>
          }
          // Bold inline text paragraph
          if (line.trim() && line.includes("**")) {
            return <div key={j} style={{ fontSize: "13px", color: "#bbb", margin: "3px 0", lineHeight: "1.6" }}
              dangerouslySetInnerHTML={{
                __html: line.replace(/\*\*(.+?)\*\*/g, "<strong style='color:#fff'>$1</strong>")
              }} />
          }
          // Empty line = spacing
          if (!line.trim()) return <div key={j} style={{ height: "6px" }} />
          // Regular paragraph
          return <div key={j} style={{
            fontSize: "13px", color: "#bbb", margin: "3px 0", lineHeight: "1.6"
          }}>{line}</div>
        })}
      </div>
    )
  })
}

function MessageBubble({ role, content }) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "16px" }}>
      <div style={{
        width: "28px", height: "28px", borderRadius: "6px",
        background: role === "user" ? "#2a2a3e" : "#1a2e1a",
        color: role === "user" ? "#8b83f5" : "#4caf50",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "11px", fontWeight: "600", flexShrink: 0, marginTop: "2px"
      }}>
        {role === "user" ? "You" : "AI"}
      </div>
      <div style={{
        background: role === "user" ? "#1e1e2e" : "#1a1a1a",
        border: `1px solid ${role === "user" ? "#2e2e4e" : "#2a2a2a"}`,
        borderRadius: "10px", padding: "12px 14px",
        maxWidth: "680px", width: "100%"
      }}>
        {role === "user"
          ? <div style={{ fontSize: "13px", color: "#c8c8f0" }}>{content}</div>
          : formatContent(content)
        }
      </div>
    </div>
  )
}

export default function ChatPanel({ messages, onNewMessage }) {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/chat`, {
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

  function sendSuggestion(text) {
    setInput(text)
    setTimeout(() => {
      const userMsg = { role: "user", content: text }
      onNewMessage(userMsg, null)
      setInput("")
      setLoading(true)
      const allMessages = [...messages, userMsg]
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/chat`, {
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

  const suggestions = [
    { label: "YouTube", prompt: "Design YouTube" },
    { label: "Swiggy", prompt: "Design Swiggy" },
    { label: "URL Shortener", prompt: "Design a URL Shortener" },
    { label: "WhatsApp", prompt: "Design WhatsApp" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0f0f0f" }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#333", marginTop: "60px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⬡</div>
            <div style={{ fontSize: "14px", color: "#555" }}>Ask me to design any system</div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginTop: "20px" }}>
              {suggestions.map(s => (
                <button
                  key={s.label}
                  onClick={() => sendSuggestion(s.prompt)}
                  style={{
                    background: "#1a1a1a", border: "1px solid #2a2a2a",
                    borderRadius: "20px", padding: "6px 14px",
                    fontSize: "12px", color: "#888", cursor: "pointer",
                    transition: "border-color 0.15s, color 0.15s"
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = "#5b4de8"; e.target.style.color = "#c8c8f0" }}
                  onMouseLeave={e => { e.target.style.borderColor = "#2a2a2a"; e.target.style.color = "#888" }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "6px", background: "#1a2e1a",
              color: "#4caf50", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: "600", flexShrink: 0
            }}>AI</div>
            <div style={{ fontSize: "13px", color: "#444" }}>Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #1a1a1a", flexShrink: 0 }}>
        {/* Quick suggestion chips above input */}
        {messages.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
            {suggestions.map(s => (
              <button
                key={s.label}
                onClick={() => sendSuggestion(s.prompt)}
                disabled={loading}
                style={{
                  background: "#1a1a1a", border: "1px solid #2a2a2a",
                  borderRadius: "20px", padding: "3px 10px",
                  fontSize: "11px", color: "#666", cursor: loading ? "not-allowed" : "pointer",
                  transition: "border-color 0.15s, color 0.15s"
                }}
                onMouseEnter={e => { if (!loading) { e.target.style.borderColor = "#5b4de8"; e.target.style.color = "#aaa" } }}
                onMouseLeave={e => { e.target.style.borderColor = "#2a2a2a"; e.target.style.color = "#666" }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "8px" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Design a system, ask a concept, or request a quiz…"
            rows={2}
            style={{
              flex: 1, background: "#1a1a1a", border: "1px solid #2a2a2a",
              borderRadius: "8px", padding: "10px 12px", color: "#e8e8e8",
              fontSize: "13px", resize: "none", outline: "none", fontFamily: "inherit"
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? "#1a1a1a" : "#5b4de8",
              border: "none", borderRadius: "8px", padding: "0 16px",
              color: loading || !input.trim() ? "#444" : "#fff",
              fontSize: "13px", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              flexShrink: 0, transition: "background 0.15s"
            }}
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}