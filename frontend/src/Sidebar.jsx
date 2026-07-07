import { useState } from "react"

export default function Sidebar({ sessions, onLoad, onDelete, onNew }) {
  // starts collapsed — user can open when needed
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100%", flexShrink: 0 }}>

      {/* Thin toggle strip — always visible */}
      <div
        onClick={() => setOpen(o => !o)}
        title={open ? "Collapse" : "Sessions"}
        style={{
          width: "30px", height: "100%",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
          transition: "background 0.15s"
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
        onMouseLeave={e => e.currentTarget.style.background = "var(--bg-surface)"}
      >
        {/* sidebar icon with chevron that flips direction */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-muted)" }}>
          <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
          <line x1="5" y1="1" x2="5" y2="15" stroke="currentColor" strokeWidth="1.2"/>
          {open
            ? <polyline points="8,6 6,8 8,10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            : <polyline points="7,6 9,8 7,10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          }
        </svg>
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={{
          width: "210px", height: "100%",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          overflow: "hidden"
        }}>

          {/* New chat button */}
          <div style={{ padding: "12px 10px 8px" }}>
            <button
              onClick={onNew}
              style={{
                width: "100%",
                background: "var(--accent-dim)",
                border: "none",
                borderRadius: "8px",
                padding: "8px",
                fontSize: "13px",
                color: "var(--accent-text)",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >+ New Chat</button>
          </div>

          {/* Sessions label */}
          <div style={{
            fontSize: "10px", color: "var(--text-muted)",
            fontWeight: "600", letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "4px 18px 6px"
          }}>
            Sessions
          </div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 10px" }}>
            {sessions.length === 0 && (
              <div style={{
                fontSize: "12px", color: "var(--text-muted)",
                textAlign: "center", padding: "20px 10px", lineHeight: "1.7"
              }}>
                no saved sessions yet<br />start chatting!
              </div>
            )}

            {sessions.map(session => (
              <div
                key={session.id}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 8px", borderRadius: "7px",
                  marginBottom: "2px", cursor: "pointer",
                  background: "transparent",
                  transition: "background 0.1s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div
                  style={{
                    flex: 1, fontSize: "12px", color: "var(--text-secondary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    lineHeight: "1.4"
                  }}
                  onClick={() => onLoad(session.id)}
                >
                  {session.title || "Untitled session"}
                </div>

                {/* delete button */}
                <button
                  onClick={() => onDelete(session.id)}
                  style={{
                    background: "none", border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer", fontSize: "16px",
                    padding: "0 2px", flexShrink: 0, lineHeight: 1
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
