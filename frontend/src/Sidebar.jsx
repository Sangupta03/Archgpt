import { useState } from "react"

export default function Sidebar({ sessions, onLoad, onDelete, onNew }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      display: "flex", flexDirection: "row", height: "100%", flexShrink: 0
    }}>
      {/* Collapsed toggle strip */}
      <div
        onClick={() => setOpen(o => !o)}
        title={open ? "Collapse sidebar" : "Expand sidebar"}
        style={{
          width: "28px", height: "100%", background: "#0a0a0a",
          borderRight: "1px solid #1a1a1a", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0, gap: "6px",
          transition: "background 0.15s"
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#111"}
        onMouseLeave={e => e.currentTarget.style.background = "#0a0a0a"}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect x="1" y="1" width="14" height="14" rx="2" stroke="#555" strokeWidth="1.2"/>
          <line x1="5" y1="1" x2="5" y2="15" stroke="#555" strokeWidth="1.2"/>
          {open
            ? <polyline points="8,6 6,8 8,10" stroke="#888" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            : <polyline points="7,6 9,8 7,10" stroke="#888" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          }
        </svg>
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={{
          width: "220px", height: "100%",
          background: "#0a0a0a", borderRight: "1px solid #1a1a1a",
          display: "flex", flexDirection: "column", overflow: "hidden"
        }}>
          <div style={{ padding: "12px" }}>
            <button
              onClick={onNew}
              style={{
                width: "100%", background: "#1a1a2e", border: "1px solid #2e2e4e",
                borderRadius: "8px", padding: "8px", fontSize: "13px",
                color: "#8b83f5", cursor: "pointer"
              }}
            >+ New Chat</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
            {sessions.length === 0 && (
              <div style={{ fontSize: "12px", color: "#333", textAlign: "center", padding: "20px 10px" }}>
                No saved sessions yet.<br />Start chatting!
              </div>
            )}

            {sessions.map(session => (
              <div
                key={session.id}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px", borderRadius: "6px", marginBottom: "2px",
                  cursor: "pointer"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div
                  style={{
                    flex: 1, fontSize: "12px", color: "#888",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}
                  onClick={() => onLoad(session.id)}
                >
                  {session.title || "Untitled session"}
                </div>
                <button
                  onClick={() => onDelete(session.id)}
                  style={{
                    background: "none", border: "none", color: "#444",
                    cursor: "pointer", fontSize: "14px", padding: "0 2px", flexShrink: 0
                  }}
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
