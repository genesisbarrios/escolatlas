"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import type { School } from "@/lib/school";
import type { PoliceStation } from "@/lib/police";
import { LEVEL_LABELS, SECTOR_LABELS, formatGrades } from "@/lib/school";
import { CompareButton } from "./CompareButton";

const ICON = new L.Icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ICON_ACTIVE = new L.Icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [33, 54],
  iconAnchor: [16, 54],
  popupAnchor: [1, -44],
  shadowSize: [54, 54],
  className: "hue-rotate-[140deg]",
});

const STATION_ICON = L.divIcon({
  html: '<span style="font-size:22px;line-height:22px" role="img" aria-label="police station">🚓</span>',
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -10],
});

function FitBounds({ schools }: { schools: School[] }) {
  const map = useMap();
  const key = useMemo(
    () => schools.map((s) => s.id).join(","),
    [schools],
  );
  useEffect(() => {
    const pts = schools
      .filter((s) => s.lat !== null && s.lng !== null)
      .map((s) => [s.lat!, s.lng!] as [number, number]);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 13);
    } else {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
    }
  }, [map, key]);
  return null;
}

export default function SchoolMap({
  schools,
  stations = [],
  selectedId,
  onSelect,
  height = 420,
}: {
  schools: School[];
  stations?: PoliceStation[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number;
}) {
  const withCoords = schools.filter((s) => s.lat !== null && s.lng !== null);
  return (
    <MapContainer
      center={[25.7617, -80.1918]}
      zoom={10}
      style={{ height, width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds schools={withCoords} />
      {withCoords.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat!, s.lng!]}
          icon={s.id === selectedId ? ICON_ACTIVE : ICON}
          eventHandlers={{ click: () => onSelect?.(s.id) }}
        >
          <Popup>
            <div className="text-sm">
              <Link
                href={`/schools/${s.id}`}
                className="font-semibold text-link hover:underline leading-snug"
              >
                {s.name}
              </Link>
              <div className="mt-0.5 text-muted-foreground">
                {s.address}
                {s.city ? `, ${s.city}` : ""} {s.zip}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="chip chip-primary">{SECTOR_LABELS[s.sector]}</span>
                <span className="chip chip-muted">{LEVEL_LABELS[s.level]}</span>
                {s.stateGrade && (
                  <span className="chip chip-warn">FL Grade {s.stateGrade}</span>
                )}
                <span className="chip chip-muted">Grades {formatGrades(s)}</span>
                <span className="chip chip-muted">
                  {s.enrollment !== null
                    ? `${s.enrollment.toLocaleString()} students`
                    : "Enrollment n/a"}
                </span>
                {s.programs.map((p) => (
                  <span key={p} className="chip chip-success">{p}</span>
                ))}
              </div>
              <div className="mt-2">
                <CompareButton id={s.id} />
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      {stations.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={STATION_ICON}
          zIndexOffset={-500}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-semibold leading-snug">🚓 {p.name}</div>
              <div className="mt-0.5 text-muted-foreground">
                {p.address}
                {p.city ? `, ${p.city}` : ""} {p.zip}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {p.agency === "county"
                  ? "Miami-Dade Sheriff's Office"
                  : (p.jurisdiction ?? "Municipal police")}
                {p.phone ? ` · ${p.phone}` : ""}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
