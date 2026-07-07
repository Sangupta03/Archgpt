import { useState, useRef, useEffect } from "react"
import ChatPanel from "./ChatPanel"
import DiagramPanel from "./DiagramPanel"
import AuthButton from "./AuthButton"
import Sidebar from "./Sidebar"
import AuthSuccess from "./AuthSuccess"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

// Sun icon for "switch to light mode" button
function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

// Moon icon for "switch to dark mode" button
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [diagrams, setDiagrams] = useState([]) // [{label, code}]
  const [systemName, setSystemName] = useState("")
  const [panelWidth, setPanelWidth] = useState(440)

  // "dark" or "light" — persisted to localStorage
  const [theme, setTheme] = useState(() => localStorage.getItem("archgpt_theme") || "dark")
  const [model, setModel] = useState("gemini-2.5-flash-lite")

  // Auth state
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("archgpt_token"))
  const [sessions, setSessions] = useState([])

  const isAuthCallback = window.location.pathname === "/auth/success"
  const isResizing = useRef(false)

  // Whenever theme changes, update the data-theme attribute on <html>
  // This makes all CSS variables in index.css switch automatically
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("archgpt_theme", theme)
  }, [theme])

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
    const t = text.trim()

    // "compare X and Y" → "X vs Y"
    const compareAnd = t.match(/compare\s+([a-zA-Z]+)\s+and\s+([a-zA-Z]+)/i)
    if (compareAnd) return `${compareAnd[1]} vs ${compareAnd[2]}`

    // "compare X vs Y" or "compare X versus Y"
    const compareVs = t.match(/compare\s+([a-zA-Z]+)\s+(?:vs|versus)\s+([a-zA-Z]+)/i)
    if (compareVs) return `${compareVs[1]} vs ${compareVs[2]}`

    // "X vs Y" typed directly (e.g. "myntra vs youtube")
    const directVs = t.match(/^([a-zA-Z\s]+?)\s+(?:vs|versus)\s+([a-zA-Z\s]+?)$/i)
    if (directVs) return `${directVs[1].trim()} vs ${directVs[2].trim()}`

    const patterns = [
      /design\s+(?:a\s+)?([a-zA-Z\s]+?)(?:\s+system|\s+shortener)?$/i,
      /how does\s+([a-zA-Z]+)\s+scale/i,
      /quiz\s+me\s+on\s+([a-zA-Z\s]+)/i,
    ]
    for (const p of patterns) {
      const m = t.match(p)
      if (m) return m[1].trim()
    }
    return null
  }

  function handleNewMessage(userMsg, assistantMsg) {
    if (userMsg) {
      setMessages(prev => [...prev, userMsg])
      const name = extractSystemName(userMsg.content)
      // always update — clears stale name from previous question
      setSystemName(name || "")
    }
    if (assistantMsg) {
      // Replace last assistant bubble during streaming (not append)
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last && last.role === "assistant") {
          return [...prev.slice(0, -1), assistantMsg]
        }
        return [...prev, assistantMsg]
      })
      // Extract all mermaid diagrams with auto-labels from surrounding text
      const allBlocks = [...assistantMsg.content.matchAll(/```mermaid\n([\s\S]+?)```/g)]
      if (allBlocks.length > 0) {
        const extracted = allBlocks.map((match) => {
          const before = assistantMsg.content.slice(Math.max(0, match.index - 300), match.index)
          // match any ## to ###### heading or **bold** label before the mermaid block
          const labelMatch = before.match(/(?:#{2,6}\s+|\*{2})([^\n]+?)(?:\*{2})?\s*\n?\s*$/)
          return { label: labelMatch ? labelMatch[1].trim() : null, code: match[1].trim() }
        })
        setDiagrams(extracted)
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        height: "50px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 14px", gap: "10px",
        flexShrink: 0,
        boxShadow: "var(--shadow)"
      }}>

        {/* Logo: purple gradient square with "A" */}
        <div style={{
          width: "28px", height: "28px",
          background: "linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%)",
          borderRadius: "7px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: "800", color: "white",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(108,92,245,0.25)"
        }}>A</div>

        <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          ArchGPT
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          — learn system design
        </span>

        <div style={{ flex: 1 }} />

        {/* Save session button (only visible when logged in and there are messages) */}
        {user && messages.length > 0 && (
          <button
            onClick={saveCurrentSession}
            style={{
              background: "var(--green-dim)",
              border: "none",
              borderRadius: "7px",
              padding: "5px 12px",
              fontSize: "11px",
              color: "var(--green-text)",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >↓ Save</button>
        )}

        {/* Export to PDF — uses browser print dialog with print-specific CSS */}
        {messages.length > 0 && (
          <button
            onClick={() => window.print()}
            title="Export as PDF"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "7px",
              padding: "5px 12px",
              fontSize: "11px",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >⎙ PDF</button>
        )}

        {/* Light / dark toggle */}
        <button
          onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "7px",
            padding: "5px 8px",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 0
          }}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        <AuthButton user={user} onLogin={() => {}} onLogout={handleLogout} />
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {user && (
          <Sidebar
            sessions={sessions}
            onLoad={loadSession}
            onDelete={deleteSession}
            onNew={newChat}
          />
        )}

        {/* Chat panel — resizable width */}
        <div style={{ width: `${panelWidth}px`, minWidth: `${panelWidth}px`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <ChatPanel messages={messages} onNewMessage={handleNewMessage} token={token} model={model} onModelChange={setModel} />
        </div>

        {/* Drag handle between panels */}
        <div
          onMouseDown={startResize}
          style={{
            width: "4px",
            background: "var(--border-subtle)",
            cursor: "col-resize",
            flexShrink: 0,
            transition: "background 0.15s"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--accent)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--border-subtle)"}
        />

        {/* Diagram panel — gets theme so mermaid picks the right color scheme */}
        <DiagramPanel diagrams={diagrams} systemName={systemName} theme={theme} />
      </div>
    </div>
  )
}
