import { useEffect, useState } from "react"

const VISIBLE_MS = 10000
const FADE_MS = 300

// One-time toast telling first-time visitors why the first reply is slow —
// the free-tier backend spins down when idle and takes ~30-60s to wake up.
export default function ColdStartNotice() {
  const [visible, setVisible] = useState(true)
  const [closing, setClosing] = useState(false)

  function dismiss() {
    setClosing(true)
    setTimeout(() => setVisible(false), FADE_MS)
  }

  useEffect(() => {
    const t = setTimeout(dismiss, VISIBLE_MS)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: "fixed",
        top: "62px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--accent)",
        borderRadius: "9px",
        padding: "9px 12px",
        boxShadow: "var(--shadow)",
        fontSize: "12px",
        color: "var(--text-muted)",
        maxWidth: "min(90vw, 420px)",
        opacity: closing ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`
      }}
    >
      <span>
        ⏳ First reply can take up to a minute — the free-tier server is waking up. It'll be fast after that.
      </span>
      <button
        onClick={dismiss}
        title="Dismiss"
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: "13px",
          lineHeight: 1,
          padding: "2px",
          flexShrink: 0
        }}
      >✕</button>
    </div>
  )
}
