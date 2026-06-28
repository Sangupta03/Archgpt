// handles the redirect back from Google OAuth
// Google → FastAPI → redirects to /auth/success?token=xxx
// This page reads the token from URL and stores it

import { useEffect } from "react"

export default function AuthSuccess({ onAuth }) {
  useEffect(() => {
    // Read token from URL query params
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")

    if (token) {
      localStorage.setItem("archgpt_token", token)
      onAuth(token)
    }

    // Clean up URL — remove token from URL bar (security)
    window.history.replaceState({}, "", "/")
  }, [])

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", color: "#888", fontSize: "14px" }}>
      Logging you in...
    </div>
  )
}