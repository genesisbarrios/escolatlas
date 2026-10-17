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
  selectedId,
  height = 420,
}: {
  schools: School[];
  selectedId?: string | null;
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds schools={withCoords} />
      {withCoords.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat!, s.lng!]}
          icon={s.id === selectedId ? ICON_ACTIVE : ICON}
        >
          <Popup>
            <div className="text-sm">
              <Link
                href={`/schools/${s.id}`}
                className="font-semibold text-blue-700 hover:underline"
              >
                {s.name}
              </Link>
              <div className="text-slate-600">
                {s.address}, {s.city} {s.zip}
              </div>
              <div className="text-slate-600">
                {s.sector === "charter" ? "Charter" : "Public"} · Grades{" "}
                {s.grades.length ? `${s.grades[0]}–${s.grades[s.grades.length - 1]}` : "n/a"}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
