import { Building2, Trash2 } from 'lucide-react';
import { Agency, AGENCY_BADGE_STYLES } from '../types';

interface Props {
  agency: Agency;
  onEdit: (agency: Agency) => void;
  onDelete: (agency: Agency) => void;
}

const AgencyCard = ({ agency, onEdit, onDelete }: Props) => {
  return (
    <button
      type="button"
      onClick={() => onEdit(agency)}
      className="group relative flex flex-col items-center text-center p-3 rounded-xl hover:bg-white/5 transition-colors w-full cursor-pointer"
      title={`Åbn ${agency.name}`}
    >
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-black border border-white/10 overflow-hidden flex items-center justify-center">
          {agency.logo ? (
            <img
              src={agency.logo}
              alt={agency.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = 'none';
                const fallback = el.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="w-full h-full flex items-center justify-center text-gray-400"
            style={{ display: agency.logo ? 'none' : 'flex' }}
          >
            <Building2 className="w-8 h-8" />
          </div>
        </div>

        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(agency);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onDelete(agency);
            }
          }}
          className="absolute -top-1 -right-1 p-1.5 rounded-full bg-battle-dark border border-white/10 text-gray-300 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 justify-center">
        {agency.country ? (
          <img
            src={`https://flagcdn.com/20x15/${agency.country.toLowerCase()}.png`}
            alt=""
            className="w-5 h-[15px] rounded-sm flex-shrink-0"
          />
        ) : null}
        <h3
          className="text-white font-bold uppercase tracking-wide text-sm leading-tight line-clamp-2"
          title={agency.name}
        >
          {agency.name}
        </h3>
      </div>

      {agency.badges.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1 justify-center">
          {agency.badges.map((b) => {
            const style = AGENCY_BADGE_STYLES[b] || {
              bg: 'bg-white/10',
              text: 'text-gray-300',
              border: 'border-white/20',
            };
            return (
              <span
                key={b}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${style.bg} ${style.text} ${style.border}`}
              >
                {b}
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
};

export default AgencyCard;
