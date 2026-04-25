import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Default center: Vijayawada, Andhra Pradesh
const DEFAULT_CENTER = { lat: 16.5062, lng: 80.6480 };

// Fix Leaflet's default marker icon broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Listens for map clicks and calls the setter on click.
 */
const ClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

/**
 * LocationPicker — Leaflet map with a draggable marker.
 *
 * Props:
 *  value       - { lat, lng } or null
 *  onChange    - (position: { lat, lng }) => void
 */
const LocationPicker = ({ value, onChange }) => {
  const [position, setPosition] = useState(value || DEFAULT_CENTER);
  const markerRef = useRef(null);

  // Sync internal state if parent resets value
  useEffect(() => {
    if (value) setPosition(value);
  }, [value]);

  const handleLocationSelect = (pos) => {
    setPosition(pos);
    onChange(pos);
  };

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const latLng = marker.getLatLng();
      const pos = { lat: latLng.lat, lng: latLng.lng };
      setPosition(pos);
      onChange(pos);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-outline-variant/20 shadow-ambient-sm" style={{ height: 280 }}>
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onLocationSelect={handleLocationSelect} />
          <Marker
            position={[position.lat, position.lng]}
            draggable={true}
            ref={markerRef}
            eventHandlers={{ dragend: handleDragEnd }}
          />
        </MapContainer>
      </div>

      {/* Coordinate Display */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-lg border border-outline-variant/10 text-sm font-mono">
        <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
        <span className="text-on-surface-variant">Lat:</span>
        <span className="text-on-surface font-semibold">{position.lat.toFixed(6)}</span>
        <span className="text-on-surface-variant ml-3">Lng:</span>
        <span className="text-on-surface font-semibold">{position.lng.toFixed(6)}</span>
      </div>

      <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[14px] text-secondary">info</span>
        Click on the map or drag the marker to set the exact issue location.
      </p>
    </div>
  );
};

export default LocationPicker;
