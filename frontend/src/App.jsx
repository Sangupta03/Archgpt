import { useState, useRef, useEffect } from "react"
import ChatPanel from "./ChatPanel"
import DiagramPanel from "./DiagramPanel"
import AuthButton from "./AuthButton"
import Sidebar from "./Sidebar"
import AuthSuccess from "./AuthSuccess"

const API = "http://localhost:8000"

export default function App() {
  const [messages, setMessages] = useState([])
  const [diagrams, setDiagrams] = useState([]) // [{label, code}]
  const [systemName, setSystemName] = useState("")
  const [panelWidth, setPanelWidth] = useState(420)

  // Auth state
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("archgpt_token"))
  const [sessions, setSessions] = useState([])

  const isAuthCallback = window.location.pathname === "/auth/success"
  const isResizing = useRef(false)

  useEffect(() => {
    if (token) {
      fetchUser(token)
      fetchSessions(token)
    }
  }, [token])

  async function fetchUser(t) {
    try {
      const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      if (res.ok) setUser(await res.json())
      else handleLogout()
    } catch (e) { console.error("Failed to fetch user:", e) }
  }

  async function fetchSessions(t) {
    try {
      const res = await fetch(`${API}/sessions`, { headers: { Authorization: `Bearer ${t}` } })
      if (res.ok) setSessions(await res.json())
    } catch (e) {}
  }

  async function saveCurrentSession() {
    if (!token || messages.length === 0) return
    const title = messages[0]?.content?.slice(0, 50) || "Untitled"
    try {
      await fetch(`${API}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, messages, diagrams })
      })
      fetchSessions(token)
    } catch (e) {}
  }

  async function loadSession(sessionId) {
    try {
      const res = await fetch(`${API}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const session = await res.json()
        setMessages(session.messages)
        setDiagrams(session.diagrams || (session.diagram ? [{ label: null, code: session.diagram }] : []))
        setSystemName(session.title)
      }
    } catch (e) {}
  }

  async function deleteSession(sessionId) {
    try {
      await fetch(`${API}/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (e) {}
  }

  function handleLogout() {
    localStorage.removeItem("archgpt_token")
    setToken(null)
    setUser(null)
    setSessions([])
  }

  function handleAuthSuccess(newToken) {
    setToken(newToken)
    localStorage.setItem("archgpt_token", newToken)
    fetchUser(newToken)
    fetchSessions(newToken)
  }

  function newChat() {
    setMessages([])
    setDiagrams([])
    setSystemName("")
  }

  if (isAuthCallback) return <AuthSuccess onAuth={handleAuthSuccess} />

  const startResize = (e) => {
    isResizing.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    const startX = e.clientX
    const startWidth = panelWidth
    const onMove = (e) => {
      if (!isResizing.current) return
      setPanelWidth(Math.max(300, Math.min(900, startWidth + e.clientX - startX)))
    }
    const onUp = () => {
      isResizing.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  function extractSystemName(text) {
    const patterns = [
      /design\s+(?:a\s+)?([a-zA-Z\s]+?)(?:\s+system|\s+shortener)?$/i,
      /compare\s+([a-zA-Z]+)\s+(?:vs|versus)/i,
      /how does\s+([a-zA-Z]+)\s+scale/i,
      /quiz\s+me\s+on\s+([a-zA-Z\s]+)/i,
    ]
    for (const p of patterns) {
      const m = text.match(p)
      if (m) return m[1].trim()
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
      // Replace last assistant bubble during streaming instead of appending
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last && last.role === "assistant") {
          return [...prev.slice(0, -1), assistantMsg]
        }
        return [...prev, assistantMsg]
      })
      // Extract all mermaid blocks with labels from surrounding text
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

      {/* Header */}
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

        {user && messages.length > 0 && (
          <button
            onClick={saveCurrentSession}
            style={{
              background: "#1a2e1a", border: "1px solid #2a4a2a", borderRadius: "6px",
              padding: "4px 12px", fontSize: "12px", color: "#4caf50", cursor: "pointer"
            }}
          >↓ Save session</button>
        )}

        <AuthButton user={user} onLogin={() => {}} onLogout={handleLogout} />
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {user && (
          <Sidebar
            sessions={sessions}
            onLoad={loadSession}
            onDelete={deleteSession}
            onNew={newChat}
          />
        )}

        <div style={{ width: `${panelWidth}px`, minWidth: `${panelWidth}px`, overflow: "hidden" }}>
          <ChatPanel messages={messages} onNewMessage={handleNewMessage} token={token} />
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
