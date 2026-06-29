// AuthButton.jsx — Login with Google button + user display

export default function AuthButton({ user, onLogin, onLogout }) {

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
        <img
          src={user.picture}
          alt={user.name}
          style={{ width: "26px", height: "26px", borderRadius: "50%", border: "1px solid #333" }}
        />
        <span style={{ fontSize: "13px", color: "#888" }}>{user.name}</span>
        <button
          onClick={onLogout}
          style={{
            background: "none", border: "1px solid #333", borderRadius: "6px",
            padding: "4px 10px", fontSize: "12px", color: "#666", cursor: "pointer"
          }}
        >Logout</button>
      </div>
    )
  }

  return (
    <button
      onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/login`}
      style={{
        marginLeft: "auto", background: "#1a1a2e", border: "1px solid #2e2e4e",
        borderRadius: "8px", padding: "6px 14px", fontSize: "13px",
        color: "#8b83f5", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
      }}
    >
      <span>G</span> Login with Google
    </button>
  )
}