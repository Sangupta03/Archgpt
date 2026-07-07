import { useEffect, useRef, useState } from "react"

export default function DiagramPanel({ diagrams, systemName, theme }) {
  const [activeTab, setActiveTab] = useState(0)
  const [error, setError] = useState(false)
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef(null)

  const activeDiagram = diagrams[activeTab]
  const diagramCode = activeDiagram?.code || ""

  // Reset active tab if diagrams array shrinks (e.g. new conversation)
  useEffect(() => {
    if (activeTab >= diagrams.length && diagrams.length > 0) setActiveTab(0)
  }, [diagrams.length])

  // Re-render diagram whenever the code, active tab, or app theme changes
  useEffect(() => {
    if (!diagramCode || !containerRef.current) return
    setError(false)
    setZoom(1)

    async function render() {
      try {
        // Wait for mermaid to load from CDN (max 2s)
        let attempts = 0
        while (!window.mermaid && attempts < 20) {
          await new Promise(r => setTimeout(r, 100))
          attempts++
        }
        if (!window.mermaid) { setError(true); return }

        // Pick mermaid theme to match the current app theme
        window.mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "dark" : "neutral",
          securityLevel: "loose"
        })

        let code = diagramCode.trim()
        if (code.startsWith("```")) {
          code = code.replace(/^```mermaid\n?/, "").replace(/```$/, "").trim()
        }

        const id = "diagram-" + Date.now()
        const { svg } = await window.mermaid.render(id, code)
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
          const svgEl = containerRef.current.querySelector("svg")
          if (svgEl) {
            svgEl.style.width = "100%"
            svgEl.style.height = "auto"
          }
        }
      } catch (e) {
        console.error("Mermaid error:", e)
        setError(true)
      }
    }
    render()
  }, [diagramCode, activeTab, theme])

  function downloadDiagram() {
    const svgEl = containerRef.current?.querySelector("svg")
    if (!svgEl) return
    const blob = new Blob([svgEl.outerHTML], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const name = activeDiagram?.label || systemName || "diagram"
    a.download = `${name}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabLabel = (d, i) => {
    // if every diagram got the same label, it's a generic heading like "Architecture Diagram"
    // — fall back to splitting the system name instead
    const allSame = diagrams.length > 1 && diagrams.every(x => x.label === diagrams[0].label)

    if (d.label && !allSame) return d.label

    // "Myntra vs YouTube" → tab 0 = "Myntra", tab 1 = "YouTube"
    if (systemName?.includes(" vs ")) {
      const parts = systemName.split(" vs ")
      return parts[i]?.trim() || `Diagram ${i + 1}`
    }

    return d.label || `Diagram ${i + 1}`
  }

  // Shared style for the zoom / download buttons
  const btnStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "12px",
    color: "var(--text-secondary)",
    cursor: "pointer"
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-base)", overflow: "hidden" }}>

      {/* ── Header bar ─────────────────────────────────────── */}
      <div style={{
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
        background: "var(--bg-surface)"
      }}>
        <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-secondary)" }}>
          {systemName ? `${systemName} — Architecture` : "Architecture Diagram"}
        </span>

        {/* Zoom controls + SVG download — only shown when a diagram is rendered */}
        {diagramCode && !error && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} style={btnStyle}>−</button>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "35px", textAlign: "center" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} style={btnStyle}>+</button>
            <button onClick={() => setZoom(1)} style={{ ...btnStyle, marginLeft: "4px" }}>Reset</button>
            <button
              onClick={downloadDiagram}
              style={{ ...btnStyle, marginLeft: "4px", color: "var(--accent)", borderColor: "var(--accent)" }}
            >
              ↓ SVG
            </button>
          </div>
        )}

        {!diagramCode && (
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Mermaid.js · auto-generated</span>
        )}
      </div>

      {/* ── Tabs — only shown when comparing multiple diagrams ── */}
      {diagrams.length > 1 && (
        <div style={{
          display: "flex", gap: "2px",
          padding: "8px 16px 0",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          background: "var(--bg-surface)"
        }}>
          {diagrams.map((d, i) => (
            <button
              key={i}
              onClick={() => { setActiveTab(i); setError(false) }}
              style={{
                background: activeTab === i ? "var(--bg-base)" : "transparent",
                border: activeTab === i ? "1px solid var(--border)" : "1px solid transparent",
                borderBottom: activeTab === i ? `1px solid var(--bg-base)` : "1px solid transparent",
                borderRadius: "6px 6px 0 0",
                padding: "5px 14px",
                fontSize: "12px",
                color: activeTab === i ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
                marginBottom: "-1px",
                fontWeight: activeTab === i ? "500" : "400",
                transition: "color 0.15s"
              }}
            >
              {tabLabel(d, i)}
            </button>
          ))}
        </div>
      )}

      {/* ── Diagram viewport ────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "28px 20px"
      }}>

        {/* Empty state */}
        {!diagramCode && (
          <div style={{ textAlign: "center", marginTop: "80px", color: "var(--text-muted)" }}>
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ marginBottom: "14px", opacity: 0.35 }}>
              <path d="M22 4L38 13V31L22 40L6 31V13L22 4Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M22 12L31 17V27L22 32L13 27V17L22 12Z" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            <div style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>
              diagram appears here
            </div>
            <div style={{ fontSize: "12px" }}>
              try "Design YouTube" to see one
            </div>
          </div>
        )}

        {/* Error state */}
        {diagramCode && error && (
          <div style={{ width: "100%", maxWidth: "500px", marginTop: "40px" }}>
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "16px"
            }}>
              <div style={{ fontSize: "13px", color: "#f87171", marginBottom: "10px" }}>
                ⚠ Diagram too complex to render
              </div>
              <pre style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "auto", maxHeight: "300px", lineHeight: "1.5" }}>
                {diagramCode}
              </pre>
            </div>
          </div>
        )}

        {/* Rendered diagram */}
        {diagramCode && !error && (
          <div style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease",
            width: "100%"
          }}>
            <div ref={containerRef} />
          </div>
        )}
      </div>
    </div>
  )
}
