import { useEffect, useRef, useState } from "react"

export default function DiagramPanel({ diagramCode, systemName }) {
  const containerRef = useRef(null)
  const [error, setError] = useState(false)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (!diagramCode || !containerRef.current) return

    setError(false)
    setRendered(false)

    async function render() {
      try {
        // Wait for mermaid to be available on window
        // (it loads from CDN so might take a moment)
        let attempts = 0
        while (!window.mermaid && attempts < 20) {
          await new Promise(r => setTimeout(r, 100))
          attempts++
        }

        if (!window.mermaid) {
          setError(true)
          return
        }

        // Clean the diagram code before rendering
        // Remove any backticks if accidentally included
        let code = diagramCode.trim()
        if (code.startsWith("```")) {
          code = code.replace(/^```mermaid\n?/, "").replace(/```$/, "").trim()
        }

        const id = "diagram-" + Date.now()
        const { svg } = await window.mermaid.render(id, code)

        if (containerRef.current) {
          containerRef.current.innerHTML = svg

          // Make SVG fill the panel nicely
          const svgEl = containerRef.current.querySelector("svg")
          if (svgEl) {
            svgEl.style.maxWidth = "100%"
            svgEl.style.height = "auto"
            svgEl.style.filter = "invert(0)"
          }
          setRendered(true)
        }
      } catch(e) {
        console.error("Mermaid render error:", e)
        setError(true)
      }
    }

    render()
  }, [diagramCode])

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "#0f0f0f",
      overflow: "hidden"
    }}>

      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid #222",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0
      }}>
        <span style={{ fontSize: "14px", fontWeight: "500", color: "#888" }}>
          {systemName ? `${systemName} — Architecture` : "Architecture Diagram"}
        </span>
        <span style={{ fontSize: "12px", color: "#444" }}>Mermaid.js · auto-generated</span>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        overflow: "auto"
      }}>

        {/* Placeholder — no diagram yet */}
        {!diagramCode && (
          <div style={{ textAlign: "center", color: "#333" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⬡</div>
            <div style={{ fontSize: "14px" }}>Architecture diagram appears here</div>
            <div style={{ fontSize: "12px", marginTop: "8px", color: "#2a2a2a" }}>
              Try "Design YouTube"
            </div>
          </div>
        )}

        {/* Error state — show raw code so user isn't lost */}
        {diagramCode && error && (
          <div style={{ width: "100%", maxWidth: "600px" }}>
            <div style={{
              background: "#1a1a1a", border: "1px solid #333",
              borderRadius: "8px", padding: "16px", marginBottom: "12px"
            }}>
              <div style={{ fontSize: "13px", color: "#f87171", marginBottom: "8px" }}>
                ⚠ Diagram too complex to render — raw structure:
              </div>
              <pre style={{
                fontSize: "11px", color: "#888", overflow: "auto",
                maxHeight: "400px", lineHeight: "1.6"
              }}>{diagramCode}</pre>
            </div>
            <div style={{ fontSize: "12px", color: "#555", textAlign: "center" }}>
              Ask a simpler question to get a cleaner diagram
            </div>
          </div>
        )}

        {/* The actual diagram */}
        {diagramCode && !error && (
          <div
            ref={containerRef}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          />
        )}

      </div>
    </div>
  )
}