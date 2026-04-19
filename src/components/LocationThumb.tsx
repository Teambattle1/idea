import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Shared capital/city coords. Mirrors the lookup in AgencyMap; duplicated here
// so the thumbnail works without pulling the full map module.
const COUNTRY_COORDS: Record<string, [number, number]> = {
  DK: [55.6761, 12.5683], SE: [59.3293, 18.0686], NO: [59.9139, 10.7522],
  DE: [52.52, 13.405], BE: [50.8503, 4.3517], RO: [44.4268, 26.1025],
  PT: [38.7223, -9.1393], IL: [31.7683, 35.2137], CZ: [50.0755, 14.4378],
  GR: [37.9838, 23.7275], GB: [51.5074, -0.1278], US: [38.9072, -77.0369],
  NL: [52.3676, 4.9041], FR: [48.8566, 2.3522], ES: [40.4168, -3.7038],
  IT: [41.9028, 12.4964],
};

const CITY_COORDS: Record<string, [number, number]> = {
  copenhagen: [55.6761, 12.5683], københavn: [55.6761, 12.5683],
  aarhus: [56.1629, 10.2039], odense: [55.4038, 10.4024],
  stockholm: [59.3293, 18.0686], gothenburg: [57.7089, 11.9746],
  göteborg: [57.7089, 11.9746], malmö: [55.6050, 13.0038],
  oslo: [59.9139, 10.7522], bergen: [60.3913, 5.3221],
  stavanger: [58.9700, 5.7331], trondheim: [63.4305, 10.3951],
  berlin: [52.52, 13.405], munich: [48.1351, 11.5820],
  münchen: [48.1351, 11.5820], hamburg: [53.5511, 9.9937],
  frankfurt: [50.1109, 8.6821], brussels: [50.8503, 4.3517],
  bruxelles: [50.8503, 4.3517], antwerp: [51.2194, 4.4025],
  bucharest: [44.4268, 26.1025], lisbon: [38.7223, -9.1393],
  porto: [41.1579, -8.6291], 'tel aviv': [32.0853, 34.7818],
  jerusalem: [31.7683, 35.2137], prague: [50.0755, 14.4378],
  praha: [50.0755, 14.4378], athens: [37.9838, 23.7275],
  london: [51.5074, -0.1278], manchester: [53.4808, -2.2426],
  amsterdam: [52.3676, 4.9041], rotterdam: [51.9244, 4.4777],
  paris: [48.8566, 2.3522], lyon: [45.7640, 4.8357],
  marseille: [43.2965, 5.3698], nice: [43.7102, 7.2620],
  madrid: [40.4168, -3.7038], barcelona: [41.3851, 2.1734],
  valencia: [39.4699, -0.3763], rome: [41.9028, 12.4964],
  roma: [41.9028, 12.4964], milan: [45.4642, 9.1900],
  milano: [45.4642, 9.1900],
};

const pinIcon = L.divIcon({
  className: 'location-thumb-pin',
  html: `<div style="width:20px;height:20px;border-radius:9999px;background:#f97316;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const Recenter = ({ pos, zoom }: { pos: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(pos, zoom, { animate: true });
    // Force tile layer to redraw after the modal mount/paint.
    setTimeout(() => map.invalidateSize(), 50);
  }, [map, pos, zoom]);
  return null;
};

interface Props {
  country: string;
  city?: string;
  name?: string;
}

const LocationThumb = ({ country, city, name }: Props) => {
  const { pos, zoom } = useMemo(() => {
    const key = city?.trim().toLowerCase();
    if (key && CITY_COORDS[key]) return { pos: CITY_COORDS[key], zoom: 10 };
    if (country && COUNTRY_COORDS[country]) return { pos: COUNTRY_COORDS[country], zoom: 5 };
    return { pos: null as null | [number, number], zoom: 4 };
  }, [country, city]);

  if (!pos) {
    return (
      <div className="w-[140px] h-[140px] ml-auto rounded-lg border-2 border-battle-orange/60 bg-battle-dark flex items-center justify-center text-gray-500 text-xs gap-1.5 text-center px-2">
        <MapPin className="w-3.5 h-3.5" />
        Vælg land eller by
      </div>
    );
  }

  return (
    <div className="w-[140px] h-[140px] ml-auto rounded-lg overflow-hidden border-2 border-battle-orange/60">
      <MapContainer
        center={pos}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        doubleClickZoom={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', background: '#0f172a' }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <Recenter pos={pos} zoom={zoom} />
        <Marker position={pos} icon={pinIcon} title={name} />
      </MapContainer>
    </div>
  );
};

export default LocationThumb;
