import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, MapPin } from 'lucide-react';

// Fix for default Leaflet icon in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const GlobalMap = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActiveTickets = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${baseUrl}/tickets?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (!data.success) throw new Error(data.error?.message || 'Failed to fetch tickets');
        
        // Filter out closed tickets if we only want active ones
        // Adjust condition based on your exact business rules
        const activeTickets = data.data.tickets.filter(t => 
          !['RESOLVED', 'REJECTED'].includes(t.status)
        );
        
        setTickets(activeTickets);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveTickets();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center gap-2">
           <MapPin className="h-5 w-5" />
           <p>Error loading map data: {error}</p>
        </div>
      </div>
    );
  }

  const centerObj = tickets.length > 0 && tickets[0].latitude && tickets[0].longitude
    ? [parseFloat(tickets[0].latitude), parseFloat(tickets[0].longitude)]
    : [20.5937, 78.9629]; // Default to India center

  return (
    <div className="flex flex-col h-[calc(100vh-4rem-2px)] bg-surface p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-on-surface">Global Tickets Map</h1>
        <p className="text-on-surface-variant text-sm">Real-time view of all active civic issues across the municipality.</p>
      </div>
      
      <div className="flex-1 rounded-xl overflow-hidden border border-outline/20 shadow-sm relative z-0">
        <MapContainer 
          center={centerObj} 
          zoom={5} 
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {tickets.map((ticket) => {
            if (!ticket.latitude || !ticket.longitude) return null;
            return (
              <Marker 
                key={ticket.id} 
                position={[parseFloat(ticket.latitude), parseFloat(ticket.longitude)]}
              >
                <Popup>
                  <div className="w-48 font-sans">
                    <div className="font-bold border-b pb-2 mb-2 text-on-surface">Ticket #{ticket.id}</div>
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-1">
                      <span className={`w-2 h-2 rounded-full ${
                        ticket.status === 'PENDING_AI' ? 'bg-yellow-500' :
                        ticket.status === 'PENDING_ADMIN' ? 'bg-orange-500' :
                        ticket.status === 'ASSIGNED' ? 'bg-blue-500' :
                        ticket.status === 'ESCALATED_TO_ADMIN' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></span>
                      {ticket.status.replace('_', ' ')}
                    </div>
                    {ticket.department && (
                      <div className="text-sm font-medium mb-2">{ticket.department.name}</div>
                    )}
                    <a 
                      href={`/admin/tickets/${ticket.id}`} 
                      className="text-primary hover:text-primary-hover text-sm font-medium inline-block mt-1"
                    >
                      View Details &rarr;
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default GlobalMap;
