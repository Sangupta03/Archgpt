// FlashcardModal — generates concept cards with a CSS flip animation
// user marks each card as "got it" or "still learning", then can review missed ones
import { useState } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

function Overlay({ onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: "20px"
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        width: "100%", maxWidth: "560px",
        maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)"
      }}>
        {children}
      </div>
    </div>
  )
}

// Category badge colors
const categoryColor = {
  concept:   { bg: "var(--accent-dim)",  text: "var(--accent-text)" },
  "trade-off": { bg: "#fef9c3",           text: "#854d0e" },
  example:   { bg: "var(--green-dim)",   text: "var(--green-text)" },
  why:       { bg: "#fce7f3",            text: "#9d174d" },
}

export default function FlashcardModal({ onClose }) {
  const [topic, setTopic] = useState("")
  const [phase, setPhase] = useState("input") // input | loading | cards | done
  const [cards, setCards] = useState([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const [reviewList, setReviewList] = useState([]) // cards to review again

  async function generateCards() {
    if (!topic.trim()) return
    setPhase("loading")
    try {
      const res = await fetch(`${API}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), num_cards: 8 })
      })
      const data = await res.json()
      if (data.cards?.length) {
        setCards(data.cards)
        setCurrent(0)
        setFlipped(false)
        setKnown(0)
        setReviewList([])
        setPhase("cards")
      } else {
        setPhase("input")
      }
    } catch {
      setPhase("input")
    }
  }

  function markKnown() {
    setKnown(k => k + 1)
    advance()
  }

  function markReview() {
    setReviewList(r => [...r, cards[current]])
    advance()
  }

  function advance() {
    if (current + 1 >= cards.length) {
      setPhase("done")
    } else {
      setCurrent(c => c + 1)
      setFlipped(false)
    }
  }

  // Review missed cards
  function startReview() {
    setCards(reviewList)
    setCurrent(0)
    setFlipped(false)
    setKnown(0)
    setReviewList([])
    setPhase("cards")
  }

  function restart() {
    setTopic("")
    setPhase("input")
    setCards([])
    setCurrent(0)
    setFlipped(false)
    setKnown(0)
    setReviewList([])
  }

  // ── Input screen ──────────────────────────────────────
  if (phase === "input" || phase === "loading") {
    return (
      <Overlay onClose={onClose}>
        <div style={{ padding: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>Flashcards</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>8 cards · click to flip</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>What topic do you want to study?</div>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && generateCards()}
            placeholder="e.g. Kafka, database sharding, Netflix..."
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              background: "var(--bg-input)", border: "1px solid var(--border)",
              borderRadius: "10px", padding: "12px 14px",
              color: "var(--text-primary)", fontSize: "14px",
              outline: "none", marginBottom: "16px",
              fontFamily: "inherit"
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
            {["Kafka", "Redis", "CAP theorem", "Microservices", "CDN"].map(t => (
              <button key={t} onClick={() => setTopic(t)} style={{
                background: topic === t ? "var(--accent-dim)" : "var(--bg-card)",
                border: `1px solid ${topic === t ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "20px", padding: "4px 12px",
                fontSize: "12px", color: topic === t ? "var(--accent-text)" : "var(--text-muted)",
                cursor: "pointer"
              }}>{t}</button>
            ))}
          </div>

          <button
            onClick={generateCards}
            disabled={!topic.trim() || phase === "loading"}
            style={{
              width: "100%", padding: "12px",
              background: !topic.trim() ? "var(--bg-hover)" : "var(--accent)",
              border: "none", borderRadius: "10px",
              color: !topic.trim() ? "var(--text-muted)" : "white",
              fontSize: "14px", fontWeight: "600",
              cursor: !topic.trim() ? "not-allowed" : "pointer"
            }}
          >
            {phase === "loading" ? "Generating Cards…" : "Generate Flashcards →"}
          </button>
        </div>
      </Overlay>
    )
  }

  // ── Cards screen ───────────────────────────────────────
  if (phase === "cards") {
    const card = cards[current]
    const catStyle = categoryColor[card.category] || categoryColor.concept

    return (
      <Overlay onClose={onClose}>
        <div style={{ padding: "28px 32px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              card {current + 1} of {cards.length}
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--green-text)" }}>✓ {known} known</span>
              <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "16px", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: "3px", background: "var(--bg-hover)", borderRadius: "2px", marginBottom: "24px" }}>
            <div style={{
              height: "100%", background: "var(--accent)", borderRadius: "2px",
              width: `${(current / cards.length) * 100}%`,
              transition: "width 0.3s ease"
            }} />
          </div>

          {/* Category badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <span style={{
              fontSize: "10px", fontWeight: "600",
              background: catStyle.bg, color: catStyle.text,
              borderRadius: "4px", padding: "3px 8px",
              textTransform: "uppercase", letterSpacing: "0.05em"
            }}>{card.category}</span>
          </div>

          {/* The flip card — uses CSS classes from index.css */}
          <div
            className="flip-card"
            onClick={() => setFlipped(f => !f)}
            style={{ height: "200px", marginBottom: "20px" }}
          >
            <div className={`flip-inner ${flipped ? "flipped" : ""}`}>
              {/* Front */}
              <div className="flip-front" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "14px", letterSpacing: "0.05em" }}>QUESTION</div>
                <div style={{ fontSize: "17px", fontWeight: "600", color: "var(--text-primary)", lineHeight: "1.5" }}>
                  {card.front}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "20px" }}>Tap to reveal answer</div>
              </div>

              {/* Back */}
              <div className="flip-back" style={{ background: "var(--accent-dim)", border: "1px solid var(--accent)" }}>
                <div style={{ fontSize: "11px", color: "var(--accent-text)", marginBottom: "14px", letterSpacing: "0.05em", fontWeight: "600" }}>ANSWER</div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: "1.6" }}>
                  {card.back}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons — only show after flipping */}
          {flipped ? (
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={markReview} style={{
                flex: 1, padding: "11px",
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "10px", color: "var(--text-secondary)",
                fontSize: "13px", cursor: "pointer"
              }}>✗ Still Learning</button>
              <button onClick={markKnown} style={{
                flex: 1, padding: "11px",
                background: "var(--green-dim)", border: "1px solid var(--green)",
                borderRadius: "10px", color: "var(--green-text)",
                fontSize: "13px", fontWeight: "600", cursor: "pointer"
              }}>✓ Got It</button>
            </div>
          ) : (
            <div style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
              click the card to see the answer
            </div>
          )}
        </div>
      </Overlay>
    )
  }

  // ── Done screen ────────────────────────────────────────
  const total = cards.length + reviewList.length  // cards already includes current batch
  const pct = Math.round((known / cards.length) * 100)

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "40px 32px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>
          {pct === 100 ? "🎉" : pct >= 60 ? "👍" : "📚"}
        </div>
        <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "6px" }}>
          {known}/{cards.length} cards known
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "32px" }}>
          {reviewList.length > 0 ? `${reviewList.length} card${reviewList.length > 1 ? "s" : ""} to review` : "You Know Them All!"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {reviewList.length > 0 && (
            <button onClick={startReview} style={{
              padding: "12px",
              background: "var(--accent)", border: "none",
              borderRadius: "10px", color: "white",
              fontSize: "13px", fontWeight: "600", cursor: "pointer"
            }}>review {reviewList.length} missed cards →</button>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={restart} style={{
              flex: 1, padding: "11px",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "10px", color: "var(--text-secondary)",
              fontSize: "13px", cursor: "pointer"
            }}>New Topic</button>
            <button onClick={onClose} style={{
              flex: 1, padding: "11px",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "10px", color: "var(--text-secondary)",
              fontSize: "13px", cursor: "pointer"
            }}>Done</button>
          </div>
        </div>
      </div>
    </Overlay>
  )
}
