import { useState, useRef, useCallback } from "react"
import ChatPanel from "./ChatPanel"
import DiagramPanel from "./DiagramPanel"

export default function App() {
  const [messages, setMessages] = useState([])
  const [diagramCode, setDiagramCode] = useState("")
  const [systemName, setSystemName] = useState("")

  // Panel width in pixels — starts at 420
  const [panelWidth, setPanelWidth] = useState(420)
  const isResizing = useRef(false)

  // Mouse drag to resize the left panel
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

  function handleNewMessage(userMsg, assistantMsg) {
    if (userMsg) {
      setMessages(prev => [...prev, userMsg])
      const match = userMsg.content.match(
        /design\s+(\w+)|how does\s+(\w+)|explain\s+(\w+)/i
      )
      if (match) setSystemName(match[1] || match[2] || match[3])
    }

    if (assistantMsg) {
      setMessages(prev => [...prev, assistantMsg])
      const mermaidMatch = assistantMsg.content.match(
        /```mermaid\n([\s\S]+?)```/
      )
      if (mermaidMatch) {
        setDiagramCode(mermaidMatch[1].trim())
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        height: "48px", background: "#111",
        borderBottom: "1px solid #222",
        display: "flex", alignItems: "center",
        padding: "0 20px", gap: "12px", flexShrink: 0
      }}>
        <div style={{
          width: "28px", height: "28px", background: "#5b4de8",
          borderRadius: "6px", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "14px", fontWeight: "700", color: "white"
        }}>A</div>
        <span style={{ fontSize: "15px", fontWeight: "500" }}>ArchGPT</span>
        <span style={{ fontSize: "13px", color: "#444" }}>/ AI system design explainer</span>
      </div>

      {/* Main panels */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left panel — resizable */}
        <div style={{ width: `${panelWidth}px`, minWidth: `${panelWidth}px`, overflow: "hidden" }}>
          <ChatPanel messages={messages} onNewMessage={handleNewMessage} />
        </div>

        {/* Drag handle — the thin line between panels */}
        <div
          onMouseDown={startResize}
          style={{
            width: "4px",
            background: "#222",
            cursor: "col-resize",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.target.style.background = "#5b4de8"}
          onMouseLeave={e => e.target.style.background = "#222"}
        />

        {/* Right panel — takes remaining space */}
        <DiagramPanel diagramCode={diagramCode} systemName={systemName} />

      </div>
    </div>
  )
}