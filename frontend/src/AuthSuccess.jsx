// handles the redirect back from Google OAuth
// URL looks like: /auth/success?token=xxxxx
// reads the token, stores it, then kicks user back to /

import { useEffect } from "react"

export default function AuthSuccess({ onAuth }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")

    if (token) {
      localStorage.setItem("archgpt_token", token)
      onAuth(token)
    }

    // remove token from URL bar (don't want it visible)
    window.history.replaceState({}, "", "/")
  }, [])

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100vh",
      background: "var(--bg-base)",
      gap: "14px"
    }}>
      {/* mini logo */}
      <div style={{
        width: "36px", height: "36px",
        background: "linear-gradient(135deg, var(--accent), #a78bfa)",
        borderRadius: "10px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "16px", fontWeight: "800", color: "white"
      }}>A</div>

      <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
        logging you in…
      </span>
    </div>
  )
}
