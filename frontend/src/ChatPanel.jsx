import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"

// A single chat bubble — reused for every message
// props.role = "user" or "assistant"
// props.content = the text
function MessageBubble({ role, content }) {
  return (
    <div style={{
      display: "flex",
      gap: "10px",
      alignItems: "flex-start",
      marginBottom: "16px"
    }}>
      {/* Avatar circle */}
      <div style={{
        width: "28px", height: "28px",
        borderRadius: "6px",
        background: role === "user" ? "#2a2a3e" : "#1a2e1a",
        color: role === "user" ? "#8b83f5" : "#4caf50",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "11px", fontWeight: "600", flexShrink: 0
      }}>
        {role === "user" ? "You" : "AI"}
      </div>

      {/* Message content */}
      <div style={{
        background: role === "user" ? "#1e1e2e" : "#1a1a1a",
        border: `1px solid ${role === "user" ? "#2e2e4e" : "#2a2a2a"}`,
        borderRadius: "10px",
        padding: "10px 14px",
        fontSize: "14px",
        lineHeight: "1.6",
        maxWidth: "680px",
        color: "#ddd"
      }}>
        {/* ReactMarkdown converts ## headings, **bold** etc to real HTML */}
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  )
}

// Animated typing dots — shown while waiting for first token
function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: "4px", padding: "4px 0 16px 38px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: "6px", height: "6px",
          background: "#555", borderRadius: "50%",
          animation: "bounce 1s infinite",
          animationDelay: `${i * 0.15}s`
        }} />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}

// The main ChatPanel component
// props:
//   messages — array of {role, content} objects
//   onNewMessage — function to call when AI response is complete
export default function ChatPanel({ messages, onNewMessage }) {
  // isStreaming = true while AI is generating
  // we disable the send button during this time
  const [isStreaming, setIsStreaming] = useState(false)

  // input = what the user is currently typing
  const [input, setInput] = useState("")

  // showTyping = show the bouncing dots before first token arrives
  const [showTyping, setShowTyping] = useState(false)

  // streamingText = the AI message being built token by token
  // this is a local state — once done it goes into messages via onNewMessage
  const [streamingText, setStreamingText] = useState("")

  // this ref points to the bottom of the messages list
  // we use it to auto-scroll down when new messages arrive
  const bottomRef = useRef(null)

  // whenever messages or streamingText changes, scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingText])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isStreaming) return

    // add user message to the list immediately
    const userMessage = { role: "user", content: text }
    onNewMessage(userMessage, null)  // null = no AI response yet

    setInput("")
    setIsStreaming(true)
    setShowTyping(true)
    setStreamingText("")

    try {
      // POST to our FastAPI backend with full conversation history
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage]
          // we send the FULL history so Gemini remembers context
        })
      })

      // Get a reader to consume the stream chunk by chunk
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      // Keep reading until the stream is done
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decode the binary chunk to string
        const chunk = decoder.decode(value)

        // Each SSE message is on its own line starting with "data: "
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)            // remove "data: " prefix
          if (data === "[DONE]") break          // stream finished signal

          try {
            const parsed = JSON.parse(data)
            fullText += parsed.text
            setShowTyping(false)
            setStreamingText(fullText)           // update screen with each token
          } catch(e) { /* ignore partial JSON */ }
        }
      }

      // Stream is done — move text from local state into messages array
      setStreamingText("")
      onNewMessage(null, { role: "assistant", content: fullText })

    } catch(e) {
      setStreamingText("")
      onNewMessage(null, { role: "assistant", content: "Something went wrong. Is the backend running?" })
    }

    setIsStreaming(false)
    setShowTyping(false)
  }

  // Send on Enter key (Shift+Enter = new line)
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      borderRight: "1px solid #222",
      background: "#111",
      overflow: "hidden"
    }}>

      {/* Messages list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>

        {/* Welcome message — shown when no messages yet */}
        {messages.length === 0 && !streamingText && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#444" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⬡</div>
            <div style={{ fontSize: "18px", color: "#888", marginBottom: "8px" }}>Ask me to design any system</div>
            <div style={{ fontSize: "13px" }}>YouTube · WhatsApp · Swiggy · URL shortener</div>
          </div>
        )}

        {/* Render all completed messages */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {/* Typing indicator — before first token */}
        {showTyping && <TypingIndicator />}

        {/* Streaming message — being built live */}
        {streamingText && (
          <MessageBubble role="assistant" content={streamingText} />
        )}

        {/* Invisible div at the bottom — we scroll to this */}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      <div style={{ padding: "0 16px 10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {["Design YouTube", "How does Swiggy scale?", "Design WhatsApp", "URL shortener"].map(s => (
          <button key={s}
            onClick={() => { setInput(s); }}
            style={{
              background: "#1a1a1a", border: "1px solid #2a2a2a",
              borderRadius: "20px", padding: "5px 12px",
              fontSize: "12px", color: "#888", cursor: "pointer"
            }}
          >{s}</button>
        ))}
      </div>

      {/* Input area */}
      <div style={{
        padding: "12px 16px", borderTop: "1px solid #222",
        display: "flex", gap: "8px", alignItems: "flex-end"
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Design Twitter, explain consistent hashing..."
          rows={1}
          style={{
            flex: 1, background: "#1a1a1a", border: "1px solid #2a2a2a",
            borderRadius: "10px", padding: "10px 14px", color: "#e8e8e8",
            fontSize: "14px", fontFamily: "inherit", resize: "none",
            outline: "none", lineHeight: "1.5"
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming}
          style={{
            width: "38px", height: "38px", background: isStreaming ? "#333" : "#5b4de8",
            border: "none", borderRadius: "8px", cursor: isStreaming ? "not-allowed" : "pointer",
            color: "white", fontSize: "18px", display: "flex",
            alignItems: "center", justifyContent: "center"
          }}
        >↑</button>
      </div>
    </div>
  )
}