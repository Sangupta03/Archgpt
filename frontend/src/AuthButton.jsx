// shows login button OR the logged-in user's avatar + name + logout

export default function AuthButton({ user, onLogin, onLogout }) {

  // logged in — show avatar, first name, logout
  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
        <img
          src={user.picture}
          alt={user.name}
          style={{ width: "26px", height: "26px", borderRadius: "50%", border: "2px solid var(--border)" }}
        />
        {/* only show first name to keep header clean */}
        <span style={{
          fontSize: "12px", color: "var(--text-secondary)",
          maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>
          {user.name.split(" ")[0]}
        </span>
        <button
          onClick={onLogout}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "7px",
            padding: "4px 10px",
            fontSize: "12px",
            color: "var(--text-muted)",
            cursor: "pointer"
          }}
        >Logout</button>
      </div>
    )
  }

  // not logged in — show Google login button
  return (
    <button
      onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/login`}
      style={{
        marginLeft: "auto",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "6px 14px",
        fontSize: "12px",
        color: "var(--text-secondary)",
        cursor: "pointer",
        display: "flex", alignItems: "center", gap: "7px",
        fontWeight: "500",
        transition: "border-color 0.15s, color 0.15s"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--accent)"
        e.currentTarget.style.color = "var(--accent-text)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--border)"
        e.currentTarget.style.color = "var(--text-secondary)"
      }}
    >
      {/* Google "G" SVG */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748L12.545 10.239z"/>
      </svg>
      Sign in with Google
    </button>
  )
}
