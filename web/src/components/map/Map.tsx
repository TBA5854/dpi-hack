'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; title: string }>;
}

export default function Map({ center, zoom = 13, markers = [] }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      className: 'map-tiles-light'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Update Center & Zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(center, zoom);
  }, [center, zoom]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add new markers
    const featureGroup = L.featureGroup();
    
    markers.forEach(m => {
      const marker = L.marker([m.lat, m.lng], { icon })
        .addTo(mapInstanceRef.current!)
        .bindPopup(m.title)
        .bindTooltip(m.title, { permanent: false, direction: 'top' }); // Show on hover
      
      featureGroup.addLayer(marker);
      markersRef.current.push(marker);
    });

    // Auto-fit bounds if there are multiple markers or if it's the first load
    if (markers.length > 0) {
        const bounds = featureGroup.getBounds();
        if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }
  }, [markers]);

  return (
    <div ref={mapContainerRef} className="h-full w-full rounded-2xl z-0" />
  );
}
