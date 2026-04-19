import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building2 } from 'lucide-react';
import { Agency, AGENCY_BADGE_STYLES } from '../types';

// Country capital coordinates (fallback when city is not set or not in CITY_COORDS).
const COUNTRY_COORDS: Record<string, [number, number]> = {
  DK: [55.6761, 12.5683],
  SE: [59.3293, 18.0686],
  NO: [59.9139, 10.7522],
  DE: [52.52, 13.405],
  BE: [50.8503, 4.3517],
  RO: [44.4268, 26.1025],
  PT: [38.7223, -9.1393],
  IL: [31.7683, 35.2137],
  CZ: [50.0755, 14.4378],
  GR: [37.9838, 23.7275],
  GB: [51.5074, -0.1278],
  US: [38.9072, -77.0369],
  NL: [52.3676, 4.9041],
  FR: [48.8566, 2.3522],
  ES: [40.4168, -3.7038],
  IT: [41.9028, 12.4964],
  TR: [41.0082, 28.9784],
  EE: [59.4370, 24.7536],
  IS: [64.1466, -21.9426],
  AE: [25.2048, 55.2708],
  HK: [22.3193, 114.1694],
  AT: [48.2082, 16.3738],
  CH: [46.9480, 7.4474],
  FI: [60.1699, 24.9384],
  IE: [53.3498, -6.2603],
  PL: [52.2297, 21.0122],
  HU: [47.4979, 19.0402],
  BG: [42.6977, 23.3219],
  HR: [45.8150, 15.9819],
  SI: [46.0569, 14.5058],
  SK: [48.1486, 17.1077],
  RS: [44.7866, 20.4489],
  LU: [49.6116, 6.1319],
  LT: [54.6872, 25.2797],
  LV: [56.9496, 24.1052],
  UA: [50.4501, 30.5234],
  MT: [35.8989, 14.5146],
  CY: [35.1856, 33.3823],
  AL: [41.3275, 19.8187],
  BA: [43.8563, 18.4131],
  MK: [41.9981, 21.4254],
  ME: [42.4304, 19.2594],
  MD: [47.0105, 28.8638],
  BY: [53.9006, 27.5590],
  XK: [42.6629, 21.1655],
  LI: [47.1410, 9.5209],
  MC: [43.7384, 7.4246],
  SM: [43.9424, 12.4578],
  AD: [42.5063, 1.5218],
  VA: [41.9029, 12.4534],
};

// Best-guess coordinates for common agency cities across covered countries.
// Keys are lowercased; used as a simple city lookup before falling back to
// the country capital.
const CITY_COORDS: Record<string, [number, number]> = {
  copenhagen: [55.6761, 12.5683],
  københavn: [55.6761, 12.5683],
  aarhus: [56.1629, 10.2039],
  odense: [55.4038, 10.4024],
  stockholm: [59.3293, 18.0686],
  gothenburg: [57.7089, 11.9746],
  göteborg: [57.7089, 11.9746],
  malmö: [55.6050, 13.0038],
  oslo: [59.9139, 10.7522],
  bergen: [60.3913, 5.3221],
  stavanger: [58.9700, 5.7331],
  trondheim: [63.4305, 10.3951],
  berlin: [52.52, 13.405],
  munich: [48.1351, 11.5820],
  münchen: [48.1351, 11.5820],
  hamburg: [53.5511, 9.9937],
  frankfurt: [50.1109, 8.6821],
  brussels: [50.8503, 4.3517],
  bruxelles: [50.8503, 4.3517],
  antwerp: [51.2194, 4.4025],
  bucharest: [44.4268, 26.1025],
  lisbon: [38.7223, -9.1393],
  porto: [41.1579, -8.6291],
  'tel aviv': [32.0853, 34.7818],
  jerusalem: [31.7683, 35.2137],
  prague: [50.0755, 14.4378],
  praha: [50.0755, 14.4378],
  athens: [37.9838, 23.7275],
  london: [51.5074, -0.1278],
  manchester: [53.4808, -2.2426],
  amsterdam: [52.3676, 4.9041],
  rotterdam: [51.9244, 4.4777],
  paris: [48.8566, 2.3522],
  lyon: [45.7640, 4.8357],
  marseille: [43.2965, 5.3698],
  nice: [43.7102, 7.2620],
  madrid: [40.4168, -3.7038],
  barcelona: [41.3851, 2.1734],
  valencia: [39.4699, -0.3763],
  rome: [41.9028, 12.4964],
  roma: [41.9028, 12.4964],
  milan: [45.4642, 9.1900],
  milano: [45.4642, 9.1900],
  istanbul: [41.0082, 28.9784],
  ankara: [39.9334, 32.8597],
  tallinn: [59.4370, 24.7536],
  reykjavik: [64.1466, -21.9426],
  reykjavík: [64.1466, -21.9426],
  dubai: [25.2048, 55.2708],
  'hong kong': [22.3193, 114.1694],
  vienna: [48.2082, 16.3738],
  wien: [48.2082, 16.3738],
  zurich: [47.3769, 8.5417],
  zürich: [47.3769, 8.5417],
  helsinki: [60.1699, 24.9384],
  dublin: [53.3498, -6.2603],
  warsaw: [52.2297, 21.0122],
  budapest: [47.4979, 19.0402],
  sofia: [42.6977, 23.3219],
  zagreb: [45.8150, 15.9819],
  ljubljana: [46.0569, 14.5058],
  bratislava: [48.1486, 17.1077],
  belgrade: [44.7866, 20.4489],
  luxembourg: [49.6116, 6.1319],
  vilnius: [54.6872, 25.2797],
  riga: [56.9496, 24.1052],
  kyiv: [50.4501, 30.5234],
  kiev: [50.4501, 30.5234],
};

const agencyLatLng = (a: Agency): [number, number] | null => {
  const city = a.city?.trim().toLowerCase();
  if (city && CITY_COORDS[city]) return CITY_COORDS[city];
  if (a.country && COUNTRY_COORDS[a.country]) return COUNTRY_COORDS[a.country];
  return null;
};

// Offset agencies that share a coordinate so the markers don't stack.
const jitter = (coord: [number, number], index: number): [number, number] => {
  if (index === 0) return coord;
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 0.35 + index * 0.05;
  return [coord[0] + Math.cos(angle) * radius, coord[1] + Math.sin(angle) * radius];
};

const markerIcon = (agency: Agency): L.DivIcon => {
  const isLoquiz = agency.badges.includes('LOQUIZ');
  const isPartner = agency.badges.includes('PARTNER');
  const ring = isLoquiz
    ? '#3b82f6'
    : isPartner
      ? '#f97316'
      : 'rgba(255,255,255,0.4)';
  const img = agency.logo
    ? `<img src="${agency.logo}" alt="" style="width:100%;height:100%;object-fit:contain;padding:4px;background:white;border-radius:9999px" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>`
    : '';
  const fallback = `<div style="width:100%;height:100%;display:${agency.logo ? 'none' : 'flex'};align-items:center;justify-content:center;background:white;border-radius:9999px;color:#6b7280">🏢</div>`;
  return L.divIcon({
    className: 'agency-map-marker',
    html: `<div style="width:44px;height:44px;border-radius:9999px;border:3px solid ${ring};box-shadow:0 2px 6px rgba(0,0,0,0.4);overflow:hidden;background:white;cursor:pointer">${img}${fallback}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

interface Props {
  agencies: Agency[];
  onSelect: (agency: Agency) => void;
}

const FitBounds = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (!positions.length) return;
    map.fitBounds(positions, { padding: [40, 40], maxZoom: 6 });
  }, [map, positions]);
  return null;
};

type Filter = 'all' | 'partner' | 'loquiz' | 'other';

const AgencyMap = ({ agencies, onSelect }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return agencies;
    if (filter === 'partner') return agencies.filter((a) => a.badges.includes('PARTNER'));
    if (filter === 'loquiz') return agencies.filter((a) => a.badges.includes('LOQUIZ'));
    return agencies.filter(
      (a) => !a.badges.includes('PARTNER') && !a.badges.includes('LOQUIZ'),
    );
  }, [agencies, filter]);

  const counts = useMemo(
    () => ({
      all: agencies.length,
      partner: agencies.filter((a) => a.badges.includes('PARTNER')).length,
      loquiz: agencies.filter((a) => a.badges.includes('LOQUIZ')).length,
      other: agencies.filter(
        (a) => !a.badges.includes('PARTNER') && !a.badges.includes('LOQUIZ'),
      ).length,
    }),
    [agencies],
  );

  const placed = useMemo(() => {
    const byKey = new Map<string, number>();
    return filtered
      .map((a) => {
        const base = agencyLatLng(a);
        if (!base) return null;
        const key = base.join(',');
        const idx = byKey.get(key) ?? 0;
        byKey.set(key, idx + 1);
        return { agency: a, pos: jitter(base, idx) };
      })
      .filter((x): x is { agency: Agency; pos: [number, number] } => !!x);
  }, [filtered]);

  const positions = placed.map((p) => p.pos);

  return (
    <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-battle-grey/50">
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-white/10 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Building2 className="w-4 h-4" />
          Agencies on the map
          <span className="text-xs text-gray-500">({placed.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          {([
            ['all', 'All', counts.all],
            ['partner', 'Partners', counts.partner],
            ['loquiz', 'Loquiz', counts.loquiz],
            ['other', 'Other', counts.other],
          ] as const).map(([key, label, count]) => {
            const active = filter === key;
            const activeBg =
              key === 'partner'
                ? 'bg-battle-orange text-white'
                : key === 'loquiz'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-black';
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider border transition-colors ${
                  active
                    ? `${activeBg} border-transparent`
                    : 'border-white/15 text-gray-300 hover:bg-white/5'
                }`}
              >
                {label} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-xs text-gray-400 hover:text-white"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      <div
        ref={containerRef}
        style={{ height: expanded ? '70vh' : '360px' }}
        className="w-full"
      >
        <MapContainer
          center={[50, 10]}
          zoom={4}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ background: '#0f172a' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds positions={positions} />
          {placed.map(({ agency, pos }) => {
            const isPartner = agency.badges.includes('PARTNER');
            return (
              <Marker
                key={agency.id}
                position={pos}
                icon={markerIcon(agency)}
                eventHandlers={{ click: () => onSelect(agency) }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold uppercase tracking-wide">{agency.name}</div>
                    <div className="text-gray-600 text-xs mt-0.5">
                      {[agency.city, agency.country].filter(Boolean).join(', ')}
                    </div>
                    {agency.badges.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {agency.badges.map((b) => {
                          const s = AGENCY_BADGE_STYLES[b];
                          const bg = b === 'PARTNER' ? '#fed7aa' : '#e9d5ff';
                          const color = b === 'PARTNER' ? '#c2410c' : '#6b21a8';
                          return (
                            <span
                              key={b}
                              style={{
                                background: bg,
                                color,
                                padding: '2px 8px',
                                borderRadius: 9999,
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: 1,
                              }}
                            >
                              {b}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelect(agency)}
                      style={{
                        marginTop: 8,
                        background: isPartner ? '#f97316' : '#1f2937',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      Open card
                    </button>
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

export default AgencyMap;
