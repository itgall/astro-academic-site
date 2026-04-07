/**
 * ResearchGraph.tsx — Interactive research knowledge graph Island.
 *
 * Hydration: client:load — the graph IS the page content on /graph/,
 * so it must load immediately.
 *
 * Renders a D3.js force-directed graph of all content pages and their
 * bidirectional links. Data is read from a <script type="application/json">
 * block embedded in the graph page.
 *
 * Features:
 *   - Nodes shaped by type: circle (publication), square (post),
 *     diamond (project), hexagon (note)
 *   - Size-coded by connection count
 *   - Color-coded by content type
 *   - Click → navigate to page
 *   - Hover → highlight connected nodes
 *   - Filter toggles by content type
 *   - Zoom and pan via D3 zoom behavior
 *   - Accessible table alternative below the graph
 *
 * D3 is dynamically imported to ensure it loads ONLY on /graph/.
 */

import { useEffect, useRef, useState, useCallback } from "react";

/* ── Types mirroring backlinks.ts LinkGraph ──────────────────────────────── */

interface GraphNode {
  id: string;
  title: string;
  type: "publication" | "post" | "project" | "note" | "teaching";
  connections: number;
  /* D3 simulation adds these at runtime */
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface LinkGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/* ── Color palette matching site design tokens ──────────────────────────── */

const TYPE_COLORS: Record<string, string> = {
  post: "#AFFFAB",
  project: "#818cf8",
  note: "#d29922",
  publication: "#3fb950",
  teaching: "#f97316",
};

const TYPE_LABELS: Record<string, string> = {
  post: "Blog Post",
  project: "Project",
  note: "Note",
  publication: "Publication",
  teaching: "Teaching",
};

/* ── Node shape path generators ──────────────────────────────────────────── */

function nodeShape(type: string, r: number): string {
  switch (type) {
    case "post": {
      /* Square */
      const s = r * 0.85;
      return `M${-s},${-s}L${s},${-s}L${s},${s}L${-s},${s}Z`;
    }
    case "project": {
      /* Diamond */
      const d = r * 1.1;
      return `M0,${-d}L${d},0L0,${d}L${-d},0Z`;
    }
    case "note": {
      /* Hexagon */
      const h = r * 0.95;
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        pts.push(`${h * Math.cos(angle)},${h * Math.sin(angle)}`);
      }
      return `M${pts.join("L")}Z`;
    }
    default:
      /* Circle (publication, teaching, fallback) — approximated with many-sided polygon */
      return "";
  }
}

export default function ResearchGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [graphData, setGraphData] = useState<LinkGraph | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(["post", "project", "note", "publication", "teaching"]),
  );
  const [loading, setLoading] = useState(true);

  /* Load graph data from embedded JSON */
  useEffect(() => {
    const el = document.getElementById("link-graph-data");
    if (el) {
      try {
        const data = JSON.parse(el.textContent ?? '{"nodes":[],"edges":[]}') as LinkGraph;
        setGraphData(data);
      } catch {
        setGraphData({ nodes: [], edges: [] });
      }
    }
    setLoading(false);
  }, []);

  /* Toggle a content type filter */
  const toggleFilter = useCallback(
    (type: string) => {
      setActiveFilters((prev) => {
        const next = new Set(prev);
        if (next.has(type)) next.delete(type);
        else next.add(type);
        return next;
      });
    },
    [],
  );

  /* Render D3 graph when data or filters change */
  useEffect(() => {
    if (!graphData || !containerRef.current) return;

    /* Filter nodes and edges */
    const filteredNodes = graphData.nodes.filter((n) =>
      activeFilters.has(n.type),
    );
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = graphData.edges.filter((e) => {
      const src = typeof e.source === "string" ? e.source : e.source.id;
      const tgt = typeof e.target === "string" ? e.target : e.target.id;
      return nodeIds.has(src) && nodeIds.has(tgt);
    });

    if (filteredNodes.length === 0) {
      if (containerRef.current) {
        containerRef.current.innerHTML =
          '<p style="text-align:center;color:var(--color-muted);padding:4rem;">No nodes match the current filters.</p>';
      }
      return;
    }

    /* Dynamic D3 import — only loads on this page */
    import("d3")
      .then((d3) => {
        renderGraph(d3, filteredNodes, filteredEdges);
      })
      .catch((err) => {
        console.error("Failed to load D3:", err);
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<p style="text-align:center;color:var(--color-muted);padding:4rem;">Failed to load the graph visualization. Please try refreshing the page.</p>';
        }
      });
  }, [graphData, activeFilters]);

  function renderGraph(
    d3: typeof import("d3"),
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): void {
    const container = containerRef.current;
    if (!container) return;

    /* Clear previous render */
    container.innerHTML = "";

    const width = container.clientWidth || 800;
    const height = Math.max(500, Math.min(width * 0.65, 700));

    const svg = d3
      .select(container)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height)
      .style("background", "var(--color-bg-off)")
      .style("border-radius", "8px")
      .style("border", "1px solid var(--color-border)");

    svgRef.current = svg.node();

    /* Zoom behavior */
    const g = svg.append("g");
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    /* Deep clone nodes/edges to avoid mutating cached data */
    const simNodes: GraphNode[] = nodes.map((n) => ({ ...n }));
    const simEdges: GraphEdge[] = edges.map((e) => ({
      source: typeof e.source === "string" ? e.source : e.source.id,
      target: typeof e.target === "string" ? e.target : e.target.id,
    }));

    /* Force simulation */
    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphEdge>(simEdges)
          .id((d) => d.id)
          .distance(80),
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => nodeRadius(d) + 4));

    /* Edges */
    const link = g
      .append("g")
      .selectAll("line")
      .data(simEdges)
      .join("line")
      .attr("stroke", "var(--color-border)")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.6);

    /* Nodes */
    const node = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(simNodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    /* Render node shapes */
    node.each(function (d) {
      const el = d3.select(this);
      const r = nodeRadius(d);
      const color = TYPE_COLORS[d.type] ?? "#8b949e";
      const shapePath = nodeShape(d.type, r);

      if (shapePath) {
        el.append("path")
          .attr("d", shapePath)
          .attr("fill", color + "30")
          .attr("stroke", color)
          .attr("stroke-width", 1.5);
      } else {
        /* Circle for publications/teaching */
        el.append("circle")
          .attr("r", r)
          .attr("fill", color + "30")
          .attr("stroke", color)
          .attr("stroke-width", 1.5);
      }
    });

    /* Labels for high-connection nodes */
    node
      .filter((d) => d.connections >= 2)
      .append("text")
      .text((d) => truncateTitle(d.title, 20))
      .attr("dy", (d) => nodeRadius(d) + 14)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "var(--color-muted)")
      .attr("font-family", "var(--font-mono)")
      .attr("pointer-events", "none");

    /* Hover tooltip */
    const tooltip = d3
      .select(container)
      .append("div")
      .style("position", "absolute")
      .style("padding", "8px 12px")
      .style("background", "var(--color-surface)")
      .style("border", "1px solid var(--color-border)")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("color", "var(--color-text)")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("white-space", "nowrap")
      .style("box-shadow", "var(--shadow-md)")
      .style("z-index", "10");

    node
      .on("mouseenter", (event, d) => {
        /* Highlight connected nodes */
        const connected = new Set<string>();
        connected.add(d.id);
        simEdges.forEach((e) => {
          const src = typeof e.source === "object" ? e.source.id : e.source;
          const tgt = typeof e.target === "object" ? e.target.id : e.target;
          if (src === d.id) connected.add(tgt);
          if (tgt === d.id) connected.add(src);
        });

        node.style("opacity", (n) => (connected.has(n.id) ? 1 : 0.15));
        link.style("opacity", (l) => {
          const src = typeof l.source === "object" ? l.source.id : l.source;
          const tgt = typeof l.target === "object" ? l.target.id : l.target;
          return src === d.id || tgt === d.id ? 1 : 0.05;
        });

        /* Show tooltip */
        const color = TYPE_COLORS[d.type] ?? "var(--color-muted)";
        tooltip
          .html(
            `<span style="color:${color};font-weight:600;">[${d.type}]</span> ${escapeHtml(d.title)}`,
          )
          .style("opacity", "1")
          .style("left", `${event.offsetX + 12}px`)
          .style("top", `${event.offsetY - 30}px`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.offsetX + 12}px`)
          .style("top", `${event.offsetY - 30}px`);
      })
      .on("mouseleave", () => {
        node.style("opacity", 1);
        link.style("opacity", 0.6);
        tooltip.style("opacity", "0");
      })
      .on("click", (_event, d) => {
        window.location.href = d.id;
      });

    /* Tick handler */
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => ((d.source as GraphNode).x ?? 0))
        .attr("y1", (d) => ((d.source as GraphNode).y ?? 0))
        .attr("x2", (d) => ((d.target as GraphNode).x ?? 0))
        .attr("y2", (d) => ((d.target as GraphNode).y ?? 0));

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });
  }

  /* Determine what to show */
  const hasData = graphData && graphData.nodes.length > 0;
  const availableTypes = hasData ? [...new Set(graphData.nodes.map((n) => n.type))] : [];

  return (
    <div>
      {/* Filter toggles — only visible when data is loaded */}
      {!loading && hasData && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
        {availableTypes.map((type) => {
          const active = activeFilters.has(type);
          const color = TYPE_COLORS[type] ?? "#8b949e";
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              aria-pressed={active}
              style={{
                padding: "4px 12px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                border: `1px solid ${active ? color : "var(--color-border)"}`,
                background: active ? color + "20" : "transparent",
                color: active ? color : "var(--color-muted)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                minHeight: "28px",
              }}
            >
              {TYPE_LABELS[type] ?? type}
            </button>
          );
        })}
      </div>
      )}

      {/* D3 graph container — ALWAYS visible at full width so clientWidth is never zero.
       * Loading and empty states render as centered text inside the container area.
       * D3 clears the container and draws the SVG when ready. */}
      <div
        ref={containerRef}
        style={{ position: "relative", width: "100%", minHeight: "500px" }}
        role="img"
        aria-label="Interactive research knowledge graph showing connections between content pages"
      >
        {/* Show loading or empty message inside the container until D3 takes over */}
        {(loading || !hasData) && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "500px",
            color: "var(--color-muted)",
            fontSize: "14px",
          }}>
            {loading
              ? "Loading research graph…"
              : "No content connections found. Add cross-links between pages to populate the graph."}
          </div>
        )}
      </div>

      {/* Accessible table alternative */}
      {!loading && hasData && (
      <details style={{ marginTop: "24px" }}>
        <summary
          style={{
            cursor: "pointer",
            fontSize: "13px",
            fontFamily: "var(--font-mono)",
            color: "var(--color-muted)",
            padding: "8px 0",
          }}
        >
          View connections as table
        </summary>
        <div style={{ overflowX: "auto", marginTop: "8px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Target</th>
                <th style={thStyle}>Type</th>
              </tr>
            </thead>
            <tbody>
              {graphData.edges.map((edge, i) => {
                const src =
                  typeof edge.source === "string"
                    ? edge.source
                    : edge.source.id;
                const tgt =
                  typeof edge.target === "string"
                    ? edge.target
                    : edge.target.id;
                const srcNode = graphData.nodes.find((n) => n.id === src);
                const tgtNode = graphData.nodes.find((n) => n.id === tgt);
                return (
                  <tr key={i}>
                    <td style={tdStyle}>
                      <a href={src} style={{ color: "var(--color-link)" }}>
                        {srcNode?.title ?? src}
                      </a>
                    </td>
                    <td style={tdStyle}>{srcNode?.type ?? "—"}</td>
                    <td style={tdStyle}>
                      <a href={tgt} style={{ color: "var(--color-link)" }}>
                        {tgtNode?.title ?? tgt}
                      </a>
                    </td>
                    <td style={tdStyle}>{tgtNode?.type ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
      )}
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function nodeRadius(d: GraphNode): number {
  return Math.max(6, Math.min(18, 4 + d.connections * 3));
}

function truncateTitle(title: string, maxLen: number): string {
  return title.length > maxLen ? title.slice(0, maxLen - 1) + "…" : title;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "2px solid var(--color-border)",
  fontWeight: 600,
  color: "var(--color-text)",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderBottom: "1px solid var(--color-border-subtle)",
  color: "var(--color-text-secondary)",
};
