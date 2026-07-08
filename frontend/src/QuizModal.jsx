// QuizModal — 5-question MCQ mode with instant feedback
import { useState } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ── Overlay backdrop ─────────────────────────────────────
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
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)"
      }}>
        {children}
      </div>
    </div>
  )
}

export default function QuizModal({ onClose }) {
  const [topic, setTopic] = useState("")
  const [phase, setPhase] = useState("input") // input | loading | quiz | done
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null) // letter the user picked
  const [score, setScore] = useState(0)

  async function startQuiz() {
    if (!topic.trim()) return
    setPhase("loading")
    try {
      const res = await fetch(`${API}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), num_questions: 5 })
      })
      const data = await res.json()
      if (data.questions?.length) {
        setQuestions(data.questions)
        setCurrent(0)
        setSelected(null)
        setScore(0)
        setPhase("quiz")
      } else {
        setPhase("input")
      }
    } catch {
      setPhase("input")
    }
  }

  function pickAnswer(letter) {
    if (selected) return // already picked
    setSelected(letter)
    if (letter === questions[current].answer) setScore(s => s + 1)
  }

  function next() {
    if (current + 1 >= questions.length) {
      setPhase("done")
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
    }
  }

  function restart() {
    setTopic("")
    setPhase("input")
    setQuestions([])
    setCurrent(0)
    setSelected(null)
    setScore(0)
  }

  // ── Input screen ──────────────────────────────────────
  if (phase === "input" || phase === "loading") {
    return (
      <Overlay onClose={onClose}>
        <div style={{ padding: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>Quiz Mode</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>5 MCQs · immediate feedback</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>What do you want to be quizzed on?</div>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && startQuiz()}
            placeholder="e.g. YouTube, Kafka, consistent hashing..."
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

          {/* Quick topic chips */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
            {["YouTube", "Kafka", "Uber", "Netflix", "CAP theorem"].map(t => (
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
            onClick={startQuiz}
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
            {phase === "loading" ? "Generating Questions…" : "Start Quiz →"}
          </button>
        </div>
      </Overlay>
    )
  }

  // ── Quiz screen ───────────────────────────────────────
  if (phase === "quiz") {
    const q = questions[current]
    const isCorrect = selected === q.answer

    return (
      <Overlay onClose={onClose}>
        <div style={{ padding: "28px 32px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              question {current + 1} of {questions.length}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "600" }}>
                {score} correct
              </span>
              <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "16px", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: "3px", background: "var(--bg-hover)", borderRadius: "2px", marginBottom: "24px" }}>
            <div style={{
              height: "100%", background: "var(--accent)", borderRadius: "2px",
              width: `${((current) / questions.length) * 100}%`,
              transition: "width 0.3s ease"
            }} />
          </div>

          {/* Question */}
          <div style={{
            fontSize: "16px", fontWeight: "600", color: "var(--text-primary)",
            lineHeight: "1.5", marginBottom: "24px"
          }}>
            {q.question}
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {q.options.map((opt, i) => {
              const letter = opt[0] // "A", "B", "C", "D"
              let bg = "var(--bg-card)"
              let border = "var(--border)"
              let color = "var(--text-secondary)"

              if (selected) {
                if (letter === q.answer) { bg = "var(--green-dim)"; border = "var(--green)"; color = "var(--green-text)" }
                else if (letter === selected) { bg = "#fee2e2"; border = "#f87171"; color = "#b91c1c" }
                else { color = "var(--text-muted)" }
              }

              return (
                <button
                  key={i}
                  onClick={() => pickAnswer(letter)}
                  disabled={!!selected}
                  style={{
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: "10px", padding: "12px 16px",
                    textAlign: "left", cursor: selected ? "default" : "pointer",
                    color, fontSize: "13px", lineHeight: "1.5",
                    transition: "all 0.15s",
                    display: "flex", gap: "10px", alignItems: "flex-start"
                  }}
                >
                  <span style={{ fontWeight: "700", flexShrink: 0 }}>{letter}</span>
                  <span>{opt.slice(3).trim()}</span>
                </button>
              )
            })}
          </div>

          {/* Explanation + Next — shown after answering */}
          {selected && (
            <div>
              <div style={{
                background: isCorrect ? "var(--green-dim)" : "#fee2e2",
                border: `1px solid ${isCorrect ? "var(--green)" : "#f87171"}`,
                borderRadius: "10px", padding: "12px 16px",
                fontSize: "13px", color: isCorrect ? "var(--green-text)" : "#b91c1c",
                marginBottom: "16px", lineHeight: "1.6"
              }}>
                <strong>{isCorrect ? "Correct! " : `Wrong — Answer is ${q.answer}. `}</strong>
                {q.explanation}
              </div>

              <button
                onClick={next}
                style={{
                  width: "100%", padding: "11px",
                  background: "var(--accent)", border: "none", borderRadius: "10px",
                  color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer"
                }}
              >
                {current + 1 >= questions.length ? "see results →" : "next question →"}
              </button>
            </div>
          )}
        </div>
      </Overlay>
    )
  }

  // ── Results screen ────────────────────────────────────
  const pct = Math.round((score / questions.length) * 100)
  const emoji = pct === 100 ? "🎉" : pct >= 60 ? "👍" : "📚"
  const msg = pct === 100 ? "Perfect Score!" : pct >= 60 ? "Good Job!" : "Keep Studying!"

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "40px 32px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>{emoji}</div>
        <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "6px" }}>
          {score}/{questions.length} — {msg}
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "32px" }}>
          {pct}% on {topic}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={restart} style={{
            flex: 1, padding: "11px",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "10px", color: "var(--text-secondary)",
            fontSize: "13px", cursor: "pointer"
          }}>Try Another Topic</button>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px",
            background: "var(--accent)", border: "none",
            borderRadius: "10px", color: "white",
            fontSize: "13px", fontWeight: "600", cursor: "pointer"
          }}>Done</button>
        </div>
      </div>
    </Overlay>
  )
}
