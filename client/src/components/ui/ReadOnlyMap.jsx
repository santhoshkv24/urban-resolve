import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const ReadOnlyMap = ({ lat, lng, height = "200px" }) => {
  const position = [lat, lng];

  return (
    <div className="rounded-xl overflow-hidden shadow-ambient-sm border border-surface-container" style={{ height }}>
      <MapContainer 
        center={position} 
        zoom={15} 
        scrollWheelZoom={true} 
        zoomControl={true}
        dragging={true}
        doubleClickZoom={true}
        touchZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            Incident Location
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default ReadOnlyMap;
