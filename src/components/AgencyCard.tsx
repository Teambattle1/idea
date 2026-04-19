import { Globe, Mail, Phone, MapPin, Pencil, Trash2, Building2 } from 'lucide-react';
import { Agency, COUNTRIES } from '../types';
import TagBadge from './TagBadge';

interface Props {
  agency: Agency;
  onEdit: (agency: Agency) => void;
  onDelete: (agency: Agency) => void;
}

const AgencyCard = ({ agency, onEdit, onDelete }: Props) => {
  const country = COUNTRIES[agency.country];
  const location = [agency.city, country?.label].filter(Boolean).join(', ');

  return (
    <div className="bg-battle-grey rounded-xl border border-white/10 hover:border-battle-orange/30 transition-colors overflow-hidden group">
      <div className="flex gap-4 p-4">
        <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-battle-dark border border-white/10 flex items-center justify-center overflow-hidden">
          {agency.logo ? (
            <img
              src={agency.logo}
              alt={agency.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Building2 className="w-8 h-8 text-gray-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-base truncate">
                {country?.flag ? <span className="mr-1.5">{country.flag}</span> : null}
                {agency.name}
              </h3>
              {location && (
                <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {location}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(agency)}
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(agency)}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
            {agency.website && (
              <a
                href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-battle-orange"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="w-3.5 h-3.5" />
                {agency.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
            {agency.contactEmail && (
              <a
                href={`mailto:${agency.contactEmail}`}
                className="flex items-center gap-1 hover:text-battle-orange"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="w-3.5 h-3.5" />
                {agency.contactEmail}
              </a>
            )}
            {agency.contactPhone && (
              <a
                href={`tel:${agency.contactPhone}`}
                className="flex items-center gap-1 hover:text-battle-orange"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="w-3.5 h-3.5" />
                {agency.contactPhone}
              </a>
            )}
          </div>

          {agency.contactName && (
            <p className="mt-1.5 text-xs text-gray-300">Contact: {agency.contactName}</p>
          )}

          {(agency.services.length > 0 || agency.tags.length > 0) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {agency.services.map((s) => (
                <TagBadge key={`s-${s}`} tag={s} />
              ))}
              {agency.tags.map((t) => (
                <TagBadge key={`t-${t}`} tag={t} />
              ))}
            </div>
          )}

          {agency.notes && (
            <p className="mt-2 text-xs text-gray-400 line-clamp-2">{agency.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgencyCard;
