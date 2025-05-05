import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMemo } from 'react';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const defaultCenter = [24.8607, 67.0011];

const VenueMap = ({ venues, selectedVenue, onMarkerClick }) => {
  const getMarkerColor = (status) => {
    switch (status) {
      case 'Available':
        return '#4CAF50'; // Green
      case 'Booked':
        return '#FFC107'; // Yellow
      case 'Maintenance':
        return '#F44336'; // Red
      default:
        return '#757575'; // Grey
    }
  };

  const customIcon = (color) => {
    return L.divIcon({
      className: 'custom-icon',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const markers = useMemo(() => {
    return venues.map(venue => ({
      id: venue._id,
      position: [venue.coordinates.lat, venue.coordinates.lng],
      name: venue.name,
      status: venue.status,
      icon: customIcon(getMarkerColor(venue.status))
    }));
  }, [venues]);

  return (
    <MapContainer
      center={selectedVenue ? [selectedVenue.coordinates.lat, selectedVenue.coordinates.lng] : defaultCenter}
      zoom={12}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={marker.icon}
          eventHandlers={{
            click: () => onMarkerClick(venues.find(v => v._id === marker.id))
          }}
        >
          <Popup>
            <div>
              <strong>{marker.name}</strong>
              <br />
              Status: {marker.status}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default VenueMap; 