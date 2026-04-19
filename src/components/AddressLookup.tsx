import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';

// Uses OpenStreetMap's Nominatim API (free, no key). Tos requires a descriptive
// User-Agent; browsers set their own, which Nominatim accepts for low volume.
// https://nominatim.org/release-docs/latest/api/Search/

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
    country_code?: string;
  };
}

interface Picked {
  address: string;
  city: string;
  country: string; // ISO-2 uppercase
  lat?: number;
  lon?: number;
}

interface Props {
  value: string;
  onChange: (address: string) => void;
  onPick: (picked: Picked) => void;
  className?: string;
  placeholder?: string;
}

const AddressLookup = ({ value, onChange, onPick, className = '', placeholder }: Props) => {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!value || value.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            value,
          )}&format=json&addressdetails=1&limit=5`,
          { headers: { 'Accept-Language': 'en,da' } },
        );
        if (res.ok) {
          const data: NominatimResult[] = await res.json();
          setResults(data);
          setOpen(true);
        }
      } catch {
        // swallow
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handlePick = (r: NominatimResult) => {
    const addr = r.address || {};
    const street = [addr.road, addr.house_number].filter(Boolean).join(' ');
    const city = addr.city || addr.town || addr.village || addr.municipality || '';
    const country = (addr.country_code || '').toUpperCase();
    onPick({
      address: street || r.display_name.split(',')[0] || '',
      city,
      country,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    });
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-battle-dark border border-white/10 text-white rounded-lg pl-3 pr-9 py-2 text-sm focus:border-battle-orange focus:outline-none placeholder:text-gray-500"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </div>
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto bg-battle-dark border border-white/10 rounded-lg shadow-xl">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handlePick(r)}
                className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-white/10 border-b border-white/5 last:border-b-0"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressLookup;
