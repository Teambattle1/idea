import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { COUNTRIES, DIAL_CODES } from '../types';

const flagUrl = (code: string) =>
  code ? `https://flagcdn.com/20x15/${code.toLowerCase()}.png` : '';

interface Props {
  value: string;
  onChange: (code: string) => void;
}

const DialCodeSelect = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const countryForCode = (dial: string) =>
    Object.entries(DIAL_CODES).find(([, v]) => v === dial)?.[0] || '';

  const uniqueCodes = Array.from(new Set(Object.values(DIAL_CODES))).sort((a, b) => {
    const la = COUNTRIES[countryForCode(a)]?.label || '';
    const lb = COUNTRIES[countryForCode(b)]?.label || '';
    return la.localeCompare(lb);
  });

  const currentCountry = countryForCode(value);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-battle-dark border border-white/10 text-white rounded-lg px-2 py-2 text-sm focus:border-battle-orange focus:outline-none min-w-[90px]"
      >
        {value && currentCountry ? (
          <img src={flagUrl(currentCountry)} alt="" className="w-5 h-[15px] rounded-sm" />
        ) : (
          <span className="text-gray-500">—</span>
        )}
        <span>{value || ''}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto" />
      </button>
      {open && (
        <ul className="absolute z-20 mt-1 max-h-64 overflow-y-auto bg-battle-dark border border-white/10 rounded-lg shadow-xl min-w-full">
          <li>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10 text-gray-400"
            >
              —
            </button>
          </li>
          {uniqueCodes.map((code) => {
            const cc = countryForCode(code);
            const label = COUNTRIES[cc]?.label || '';
            return (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10 whitespace-nowrap ${
                    code === value ? 'bg-white/5 text-white' : 'text-gray-200'
                  }`}
                >
                  <img src={flagUrl(cc)} alt="" className="w-5 h-[15px] flex-shrink-0 rounded-sm" />
                  <span className="font-mono">{code}</span>
                  <span className="text-gray-400 text-xs">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default DialCodeSelect;
