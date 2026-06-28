import { useState, useRef, useCallback } from "react"
import ChatPanel from "./ChatPanel"
import DiagramPanel from "./DiagramPanel"

export default function App() {
  const [messages, setMessages] = useState([])
  const [diagrams, setDiagrams] = useState([]) // [{label, code}]
  const [systemName, setSystemName] = useState("")
  const [panelWidth, setPanelWidth] = useState(420)
  const isResizing = useRef(false)

  const startResize = useCallback((e) => {
    isResizing.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    const startX = e.clientX
    const startWidth = panelWidth

    function onMouseMove(e) {
      if (!isResizing.current) return
      const newWidth = Math.max(300, Math.min(900, startWidth + e.clientX - startX))
      setPanelWidth(newWidth)
    }
    function onMouseUp() {
      isResizing.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }, [panelWidth])

  function extractSystemName(text) {
    // Try all common patterns
    const patterns = [
      /design\s+(?:a\s+)?([a-zA-Z\s]+?)(?:\s+system|\s+shortener)?$/i,
      /compare\s+([a-zA-Z]+)\s+(?:vs|versus)/i,
      /how does\s+([a-zA-Z]+)\s+scale/i,
      /explain\s+([a-zA-Z\s]+?)(?:\s+system)?$/i,
      /quiz\s+me\s+on\s+([a-zA-Z\s]+)/i,
    ]
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) return match[1].trim()
    }
    return null
  }

  function handleNewMessage(userMsg, assistantMsg) {
    if (userMsg) {
      setMessages(prev => [...prev, userMsg])
      const name = extractSystemName(userMsg.content)
      if (name) setSystemName(name)
    }
    if (assistantMsg) {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last && last.role === "assistant") {
          return [...prev.slice(0, -1), assistantMsg]
        }
        return [...prev, assistantMsg]
      })
      const allBlocks = [...assistantMsg.content.matchAll(/```mermaid\n([\s\S]+?)```/g)]
      if (allBlocks.length > 0) {
        const extracted = allBlocks.map((match) => {
          const before = assistantMsg.content.slice(Math.max(0, match.index - 300), match.index)
          const labelMatch = before.match(/(?:#{2,3}\s+|\*{2})([\w\s\-]+?)(?:\*{2})?\s*\n?\s*$/)
          return { label: labelMatch ? labelMatch[1].trim() : null, code: match[1].trim() }
        })
        setDiagrams(extracted)
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <div style={{
        height: "48px", background: "#111", borderBottom: "1px solid #222",
        display: "flex", alignItems: "center", padding: "0 20px", gap: "12px", flexShrink: 0
      }}>
        <div style={{
          width: "28px", height: "28px", background: "#5b4de8", borderRadius: "6px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: "700", color: "white"
        }}>A</div>
        <span style={{ fontSize: "15px", fontWeight: "500" }}>ArchGPT</span>
        <span style={{ fontSize: "13px", color: "#444" }}>/ AI system design explainer</span>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: `${panelWidth}px`, minWidth: `${panelWidth}px`, overflow: "hidden" }}>
          <ChatPanel messages={messages} onNewMessage={handleNewMessage} />
        </div>
        <div
          onMouseDown={startResize}
          style={{ width: "4px", background: "#222", cursor: "col-resize", flexShrink: 0 }}
          onMouseEnter={e => e.target.style.background = "#5b4de8"}
          onMouseLeave={e => e.target.style.background = "#222"}
        />
        <DiagramPanel diagrams={diagrams} systemName={systemName} />
      </div>
    </div>
  )
}