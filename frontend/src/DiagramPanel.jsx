import { useEffect, useRef, useState } from "react"

function SingleDiagram({ code, containerRef }) {
  return <div ref={containerRef} />
}

export default function DiagramPanel({ diagrams, systemName }) {
  const [activeTab, setActiveTab] = useState(0)
  const [error, setError] = useState(false)
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef(null)

  const activeDiagram = diagrams[activeTab]
  const diagramCode = activeDiagram?.code || ""

  // Reset tab if diagrams array shrinks
  useEffect(() => {
    if (activeTab >= diagrams.length && diagrams.length > 0) setActiveTab(0)
  }, [diagrams.length])

  useEffect(() => {
    if (!diagramCode || !containerRef.current) return
    setError(false)
    setZoom(1)

    async function render() {
      try {
        let attempts = 0
        while (!window.mermaid && attempts < 20) {
          await new Promise(r => setTimeout(r, 100))
          attempts++
        }
        if (!window.mermaid) { setError(true); return }

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
  }, [diagramCode, activeTab])

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

  const tabLabel = (d, i) => d.label || (systemName ? `${systemName} ${i + 1}` : `Diagram ${i + 1}`)

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0f0f0f", overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        padding: "10px 16px", borderBottom: "1px solid #222",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0
      }}>
        <span style={{ fontSize: "14px", fontWeight: "500", color: "#888" }}>
          {systemName ? `${systemName} — Architecture` : "Architecture Diagram"}
        </span>

        {diagramCode && !error && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} style={btnStyle}>−</button>
            <span style={{ fontSize: "11px", color: "#555", minWidth: "35px", textAlign: "center" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} style={btnStyle}>+</button>
            <button onClick={() => setZoom(1)} style={{ ...btnStyle, marginLeft: "4px" }}>Reset</button>
            <button onClick={downloadDiagram} style={{ ...btnStyle, marginLeft: "4px", color: "#5b4de8", borderColor: "#5b4de8" }}>
              ↓ SVG
            </button>
          </div>
        )}

        {!diagramCode && (
          <span style={{ fontSize: "12px", color: "#444" }}>Mermaid.js · auto-generated</span>
        )}
      </div>

      {/* Tabs — only shown when there are multiple diagrams */}
      {diagrams.length > 1 && (
        <div style={{
          display: "flex", gap: "2px", padding: "8px 16px 0",
          borderBottom: "1px solid #1a1a1a", flexShrink: 0, background: "#0f0f0f"
        }}>
          {diagrams.map((d, i) => (
            <button
              key={i}
              onClick={() => { setActiveTab(i); setError(false) }}
              style={{
                background: activeTab === i ? "#1e1e1e" : "transparent",
                border: activeTab === i ? "1px solid #2a2a2a" : "1px solid transparent",
                borderBottom: activeTab === i ? "1px solid #0f0f0f" : "1px solid transparent",
                borderRadius: "6px 6px 0 0",
                padding: "5px 14px", fontSize: "12px",
                color: activeTab === i ? "#c8c8f0" : "#555",
                cursor: "pointer", marginBottom: "-1px",
                transition: "color 0.15s"
              }}
            >
              {tabLabel(d, i)}
            </button>
          ))}
        </div>
      )}

      {/* Diagram content */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px" }}>

        {!diagramCode && (
          <div style={{ textAlign: "center", color: "#333", marginTop: "80px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⬡</div>
            <div style={{ fontSize: "14px" }}>Architecture diagram appears here</div>
            <div style={{ fontSize: "12px", marginTop: "8px", color: "#2a2a2a" }}>Try "Design YouTube"</div>
          </div>
        )}

        {diagramCode && error && (
          <div style={{ width: "100%", maxWidth: "500px", marginTop: "40px" }}>
            <div style={{
              background: "#1a1a1a", border: "1px solid #333",
              borderRadius: "8px", padding: "16px"
            }}>
              <div style={{ fontSize: "13px", color: "#f87171", marginBottom: "8px" }}>
                ⚠ Diagram too complex to render
              </div>
              <pre style={{ fontSize: "11px", color: "#666", overflow: "auto", maxHeight: "300px" }}>
                {diagramCode}
              </pre>
            </div>
          </div>
        )}

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

const btnStyle = {
  background: "#1a1a1a", border: "1px solid #333", borderRadius: "6px",
  padding: "4px 10px", fontSize: "12px", color: "#888", cursor: "pointer"
}
