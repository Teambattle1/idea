import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { COUNTRIES } from '../types';

// Windows renders regional indicator emoji (🇳🇴) as the letter pair ("NO")
// in native <select> elements. We render SVG flags from flagcdn.com instead.
const flagUrl = (code: string) =>
  code ? `https://flagcdn.com/20x15/${code.toLowerCase()}.png` : '';

interface Props {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

const CountrySelect = ({ value, onChange, className = '' }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current = COUNTRIES[value] || COUNTRIES[''];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-battle-dark border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none"
      >
        <span className="flex items-center gap-2 min-w-0">
          {value && (
            <img
              src={flagUrl(value)}
              alt=""
              className="w-5 h-[15px] flex-shrink-0 rounded-sm"
            />
          )}
          <span className="truncate">{current?.label || 'Select country'}</span>
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>
      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-battle-dark border border-white/10 rounded-lg shadow-xl">
          {Object.entries(COUNTRIES).map(([code, { label }]) => (
            <li key={code || 'none'}>
              <button
                type="button"
                onClick={() => {
                  onChange(code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10 ${
                  code === value ? 'bg-white/5 text-white' : 'text-gray-200'
                }`}
              >
                {code ? (
                  <img
                    src={flagUrl(code)}
                    alt=""
                    className="w-5 h-[15px] flex-shrink-0 rounded-sm"
                  />
                ) : (
                  <span className="w-5" />
                )}
                <span className="truncate">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CountrySelect;
