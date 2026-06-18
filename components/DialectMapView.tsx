"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { City, Cluster } from "@/lib/scoring";
import Link from "next/link";
import { useT, useLang } from "@/contexts/LanguageContext";

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

function flagEmoji(code: string) {
  return [...code.toUpperCase()]
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join("");
}

type TooltipSel = d3.Selection<HTMLDivElement, unknown, null, undefined>;

interface Props {
  cities: City[];
  clusters: Cluster[];
}

export function DialectMapView({ cities, clusters }: Props) {
  const t = useT();
  const { lang } = useLang();
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const cityDotsRef = useRef<d3.Selection<SVGCircleElement, City, SVGGElement, unknown> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const tooltipRef = useRef<TooltipSel | null>(null);
  const selectedRef = useRef<string | null>(null);
  const langRef = useRef(lang);
  const [isZoomed, setIsZoomed] = useState(false);

  const clusterMap = useMemo(
    () => Object.fromEntries(clusters.map(c => [c.id, c])),
    [clusters]
  );

  function clusterName(cluster: Cluster) {
    return (lang === "ar" && cluster.name_ar) ? cluster.name_ar : cluster.name;
  }

  const clusterCountries = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const city of cities) {
      if (!map[city.cluster]) map[city.cluster] = [];
      if (!map[city.cluster].includes(city.country)) map[city.cluster].push(city.country);
    }
    return map;
  }, [cities]);

  const groupedClusters = useMemo(() => {
    const groups: Record<string, Cluster[]> = {};
    for (const cluster of clusters) {
      if (!groups[cluster.macro_group]) groups[cluster.macro_group] = [];
      groups[cluster.macro_group].push(cluster);
    }
    return groups;
  }, [clusters]);

  const selectedCluster = selectedClusterId ? clusterMap[selectedClusterId] : null;
  const selectedCities = useMemo(
    () => cities.filter(c => c.cluster === selectedClusterId),
    [selectedClusterId, cities]
  );

  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    selectedRef.current = selectedClusterId;
    cityDotsRef.current?.attr("opacity", (d: City) =>
      !selectedClusterId || d.cluster === selectedClusterId ? 1 : 0.12
    );
  }, [selectedClusterId]);

  useEffect(() => {
    if (!containerRef.current || svgRef.current) return;
    const container = containerRef.current;
    const styles = getComputedStyle(document.documentElement);
    const landColor      = styles.getPropertyValue("--land").trim();
    const landOtherColor = styles.getPropertyValue("--land-other").trim();
    const borderColor    = styles.getPropertyValue("--border").trim();
    const bgColor        = styles.getPropertyValue("--bg").trim();

    const svg = d3
      .select(container)
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

    const path = d3.geoPath(projection);
    const zoomGroup     = svg.append("g");
    const countriesLayer = zoomGroup.append("g");
    const citiesLayer    = zoomGroup.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .filter(e => e.type !== "dblclick")
      .on("zoom", event => {
        zoomGroup.attr("transform", event.transform);
        setIsZoomed(event.transform.k > 1.01);
        tooltipRef.current?.style("opacity", "0");
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    const tooltip = d3
      .select(container)
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "var(--surface)")
      .style("color", "var(--text)")
      .style("border", "0.5px solid var(--border)")
      .style("padding", "4px 10px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("line-height", "1.5")
      .style("white-space", "nowrap")
      .style("opacity", "0")
      .style("transition", "opacity 0.1s")
      .style("z-index", "10") as TooltipSel;

    tooltipRef.current = tooltip;

    fetch("/world-atlas.json")
      .then(r => r.json())
      .then((world: Topology) => {
        const countries = topojson.feature(
          world,
          world.objects.countries as GeometryCollection
        ).features;

        countriesLayer
          .selectAll("path")
          .data(countries)
          .join("path")
          .attr("d", d => path(d) ?? "")
          .attr("fill", d => {
            const name = (d.properties as { name?: string })?.name ?? "";
            return ARAB_COUNTRY_NAMES.has(name) ? landColor : landOtherColor;
          })
          .attr("stroke", borderColor)
          .attr("stroke-width", 0.5);

        const cityDots = citiesLayer
          .selectAll("circle")
          .data(cities)
          .join("circle")
          .attr("cx", d => projection([d.lon, d.lat])?.[0] ?? 0)
          .attr("cy", d => projection([d.lon, d.lat])?.[1] ?? 0)
          .attr("r", 4)
          .attr("fill", d => clusterMap[d.cluster]?.color ?? "#888")
          .attr("stroke", bgColor)
          .attr("stroke-width", 1.2)
          .style("cursor", "pointer")
          .on("mouseover", (event, d) => {
            const cluster = clusterMap[d.cluster];
            const label = cluster
              ? (langRef.current === "ar" && cluster.name_ar ? cluster.name_ar : cluster.name)
              : d.cluster;
            tooltip
              .html(`${flagEmoji(d.country)} <strong>${d.name}</strong><br/><span style="color:var(--text-muted)">${label}</span>`)
              .style("opacity", "1");
            d3.select(event.currentTarget as SVGCircleElement).attr("r", 6);
          })
          .on("mousemove", (event: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            tooltip
              .style("left", `${event.clientX - rect.left + 12}px`)
              .style("top", `${event.clientY - rect.top - 40}px`);
          })
          .on("mouseout", event => {
            tooltip.style("opacity", "0");
            d3.select(event.currentTarget as SVGCircleElement).attr("r", 4);
          })
          .on("click", (_event, d) => {
            const next = selectedRef.current === d.cluster ? null : d.cluster;
            setSelectedClusterId(next);
          });

        cityDotsRef.current = cityDots as d3.Selection<SVGCircleElement, City, SVGGElement, unknown>;
      });
  }, []);

  function resetZoom() {
    const svg = svgRef.current;
    const zoom = zoomRef.current;
    if (!svg || !zoom) return;
    svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
  }

  const regionNames = useMemo(
    () => new Intl.DisplayNames([lang], { type: "region" }),
    [lang]
  );

  return (
    <div className="max-w-3xl mx-auto px-5 pt-14 pb-12">
      {/* text-left is a physical property — keeps the back link on the left even in RTL */}
      <div className="text-left mb-5">
        <Link href="/play" className="text-sm" style={{ color: "var(--on-bg-muted)" }}>
          {t.backLink}
        </Link>
      </div>

      {/* Page heading on dark bg */}
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        <span style={{ color: "var(--heading)" }}>Lahjat </span>
        <span className="ar-display" style={{ color: "var(--heading)", fontSize: "1.6rem" }}>لهجات</span>
        <span style={{ color: "var(--on-bg-muted)", fontWeight: 400 }}>{" — "}{t.dialectMap}</span>
      </h1>
      <p className="text-sm mb-4" style={{ color: "var(--on-bg-muted)" }}>
        {t.dialectMapSubtitle}
      </p>

      {/* Map */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden mb-4"
        style={{ position: "relative", background: "var(--surface)", cursor: "crosshair" }}
      >
        {isZoomed && (
          <button
            onClick={resetZoom}
            className="absolute top-2 right-2 z-10 text-xs px-2 py-1 rounded-md"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "0.5px solid var(--border)", cursor: "pointer" }}
          >
            {t.resetZoom}
          </button>
        )}
      </div>

      {/* Selected cluster panel — on parchment surface card */}
      {selectedCluster && (
        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: "var(--surface)", border: `2px solid ${selectedCluster.color}` }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                style={{ background: selectedCluster.color }}
              />
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                  {clusterName(selectedCluster)}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t.macroGroupName(selectedCluster.macro_group)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedClusterId(null)}
              className="text-lg leading-none"
              style={{ color: "var(--text-faint)", cursor: "pointer" }}
            >
              ×
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCities.map(city => (
              <span
                key={`${city.name}-${city.country}`}
                className="text-xs px-2 py-1 rounded-md"
                style={{ background: "var(--surface-2)", color: "var(--text)" }}
              >
                {flagEmoji(city.country)} {city.name}
                <span style={{ color: "var(--text-faint)" }}> · {regionNames.of(city.country)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Legend — macro group labels are on dark bg, cluster buttons are on parchment */}
      <div className="flex flex-col gap-5">
        {Object.entries(groupedClusters).map(([macroId, macroCluster]) => (
          <div key={macroId}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--on-bg-faint)" }}>
              {t.macroGroupName(macroId)}
            </p>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {macroCluster.map(cluster => (
                <button
                  key={cluster.id}
                  onClick={() => setSelectedClusterId(selectedClusterId === cluster.id ? null : cluster.id)}
                  className="flex items-center gap-2 text-start px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{
                    background: selectedClusterId === cluster.id ? "var(--surface-2)" : "var(--surface)",
                    border: selectedClusterId === cluster.id ? `1.5px solid ${cluster.color}` : "1.5px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cluster.color }} />
                  <span className="text-xs font-medium flex-1 truncate" style={{ color: "var(--text)" }}>
                    {clusterName(cluster)}
                  </span>
                  <span className="text-sm shrink-0">
                    {(clusterCountries[cluster.id] ?? []).map(flagEmoji).join("")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
