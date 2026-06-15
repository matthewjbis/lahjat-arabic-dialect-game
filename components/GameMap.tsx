"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

const W = 1000;
const H = 680;

const ARAB_COUNTRY_NAMES = new Set([
  "Morocco", "W. Sahara", "Algeria", "Tunisia", "Libya", "Egypt", "Sudan",
  "S. Sudan", "Mauritania", "Mali", "Niger", "Chad", "Eritrea", "Ethiopia",
  "Djibouti", "Somalia", "Saudi Arabia", "Yemen", "Oman",
  "United Arab Emirates", "Qatar", "Bahrain", "Kuwait", "Iraq", "Iran",
  "Syria", "Lebanon", "Jordan", "Israel", "Palestine", "Turkey", "Cyprus",
  "Comoros",
]);

interface GuessPin {
  lat: number;
  lon: number;
}

interface GameMapProps {
  onGuess: (lat: number, lon: number) => void;
  locked: boolean;
  guess: GuessPin | null;
  answer: { lat: number; lon: number } | null;
}

export function GameMap({ onGuess, locked, guess, answer }: GameMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const projRef = useRef<d3.GeoProjection | null>(null);
  const markerRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [isZoomed, setIsZoomed] = useState(false);

  const lockedRef = useRef(locked);
  useEffect(() => { lockedRef.current = locked; }, [locked]);

  const onGuessRef = useRef(onGuess);
  useEffect(() => { onGuessRef.current = onGuess; }, [onGuess]);

  // Initialize the map once
  useEffect(() => {
    if (!containerRef.current || svgRef.current) return;

    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const styles = getComputedStyle(document.documentElement);
    const landColor = styles.getPropertyValue("--land").trim();
    const landOtherColor = styles.getPropertyValue("--land-other").trim();
    const borderColor = styles.getPropertyValue("--border").trim();

    const svg = d3
      .select(containerRef.current)
      .append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("display", "block")
      .style("width", "100%");

    svgRef.current = svg;

    const projection = d3
      .geoMercator()
      .center([21, 23])
      .scale(720)
      .translate([W / 2, H / 2]);
    projRef.current = projection;

    // Single group that receives the zoom transform — everything lives inside it
    const zoomGroup = svg.append("g");
    const markerLayer = zoomGroup.append("g");
    markerRef.current = markerLayer;

    // Zoom behavior — disable double-click zoom so it doesn't interfere with pinning
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .filter((event) => event.type !== "dblclick")
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
        setIsZoomed(event.transform.k > 1.01);
        tooltip.style("opacity", "0");
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Click → place pin (invert through zoom transform first, then projection)
    svg.on("click", function (event) {
      if (lockedRef.current) return;
      const svgNode = svg.node();
      if (!svgNode) return;
      const [x, y] = d3.pointer(event, svgNode);
      const transform = d3.zoomTransform(svgNode);
      const [mx, my] = transform.invert([x, y]);
      const coords = projection.invert!([mx, my]);
      if (!coords) return;
      const [lon, lat] = coords;
      onGuessRef.current(lat, lon);
    });

    // Tooltip
    const container = containerRef.current;
    const tooltip = d3
      .select(container)
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "var(--surface)")
      .style("color", "var(--text)")
      .style("border", "0.5px solid var(--border)")
      .style("padding", "3px 8px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("line-height", "1.4")
      .style("white-space", "nowrap")
      .style("opacity", "0")
      .style("transition", "opacity 0.1s")
      .style("z-index", "10");

    // Load and render the world map
    fetch("/world-atlas.json")
      .then((r) => r.json())
      .then((world: Topology) => {
        const countries = topojson.feature(
          world,
          world.objects.countries as GeometryCollection
        ).features;

        const path = d3.geoPath(projection);

        zoomGroup
          .insert("g", ":first-child")
          .selectAll("path")
          .data(countries)
          .join("path")
          .attr("d", (d) => path(d) ?? "")
          .attr("fill", (d) => {
            const name = (d.properties as { name?: string })?.name ?? "";
            return ARAB_COUNTRY_NAMES.has(name) ? landColor : landOtherColor;
          })
          .attr("stroke", borderColor)
          .attr("stroke-width", 0.5)
          .on("mouseover", (_event, d) => {
            const name = (d.properties as { name?: string })?.name;
            if (!name) return;
            tooltip.text(name).style("opacity", "1");
          })
          .on("mousemove", (event: MouseEvent) => {
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const x = event.clientX - rect.left + 12;
            const y = event.clientY - rect.top - 28;
            tooltip.style("left", `${x}px`).style("top", `${y}px`);
          })
          .on("mouseout", () => {
            tooltip.style("opacity", "0");
          });
      })
      .catch(() => {
        zoomGroup
          .insert("rect", ":first-child")
          .attr("x", 0).attr("y", 0)
          .attr("width", W).attr("height", H)
          .attr("fill", isDark ? "#1a1a18" : "#e8e6df");
      });
  }, []);

  // Redraw pins whenever guess or answer changes
  useEffect(() => {
    const proj = projRef.current;
    const markers = markerRef.current;
    if (!proj || !markers) return;

    markers.selectAll("*").remove();

    if (guess) {
      const [gx, gy] = proj([guess.lon, guess.lat]) ?? [0, 0];

      if (answer) {
        const [ax, ay] = proj([answer.lon, answer.lat]) ?? [0, 0];
        markers
          .append("line")
          .attr("x1", gx).attr("y1", gy)
          .attr("x2", ax).attr("y2", ay)
          .attr("stroke", "#888780")
          .attr("stroke-width", 1.2)
          .attr("stroke-dasharray", "4,3");

        markers
          .append("circle")
          .attr("cx", ax).attr("cy", ay).attr("r", 6)
          .attr("fill", "#1D9E75")
          .attr("stroke", "var(--bg)")
          .attr("stroke-width", 1.5);
      }

      markers
        .append("circle")
        .attr("cx", gx).attr("cy", gy).attr("r", 6)
        .attr("fill", "#D85A30")
        .attr("stroke", "var(--bg)")
        .attr("stroke-width", 1.5);
    }
  }, [guess, answer]);

  function resetZoom() {
    const svg = svgRef.current;
    const zoom = zoomRef.current;
    if (!svg || !zoom) return;
    svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden mb-3.5"
      style={{
        position: "relative",
        background: "var(--surface)",
        cursor: locked ? "default" : "crosshair",
      }}
    >
      {isZoomed && (
        <button
          onClick={resetZoom}
          className="absolute top-2 right-2 z-10 text-xs px-2 py-1 rounded-md"
          style={{
            background: "var(--surface-2)",
            color: "var(--text-muted)",
            border: "0.5px solid var(--border)",
            cursor: "pointer",
          }}
        >
          Reset zoom
        </button>
      )}
    </div>
  );
}
