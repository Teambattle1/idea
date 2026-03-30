import { useState, useEffect } from 'react';
import {
  Building2,
  Globe,
  Plus,
  Check,
  Loader2,
  X,
  Phone,
  MessageCircle,
  Mail,
  Pencil,
  Trash2,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import { CompanyProfile, ContactInfo, COUNTRIES } from '../types';
import { fetchCompanies, createCompany, updateCompany, deleteCompany } from '../lib/supabase';

function countryFlag(code: string): string {
  if (!code) return '';
  if (COUNTRIES[code]?.flag) return COUNTRIES[code].flag;
  const upper = code.toUpperCase();
  if (upper.length === 2) {
    return String.fromCodePoint(...[...upper].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
  }
  return '';
}

const EMPTY_COMPANY = {
  company: '', country: '', address: '', city: '', zip: '',
  website: '', phone: '', whatsapp: '', email: '', notes: '', gameOwner: '',
};

const CompanySelector = ({
  contact,
  author,
  onChange,
  onAuthorChange,
}: {
  contact: ContactInfo;
  author: string;
  onChange: (contact: ContactInfo) => void;
  onAuthorChange: (author: string) => void;
}) => {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showForm, setShowForm] = useState<'new' | 'edit' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_COMPANY });

  useEffect(() => { loadCompanies(); }, []);

  const loadCompanies = async () => {
    setIsLoading(true);
    const data = await fetchCompanies();
    setCompanies(data);
    setIsLoading(false);
  };

  const applyCompany = (comp: CompanyProfile | typeof EMPTY_COMPANY & { gameOwner: string }) => {
    onChange({
      company: comp.company, country: comp.country,
      address: comp.address, city: comp.city, zip: comp.zip,
      website: comp.website, phone: comp.phone,
      whatsapp: comp.whatsapp, email: comp.email, notes: comp.notes,
    });
    onAuthorChange(comp.gameOwner);
  };

  const selectCompany = (comp: CompanyProfile) => {
    applyCompany(comp);
    setSelectedId(comp.id);
    setShowDropdown(false);
  };

  const clearSelection = () => {
    onChange({ company: '', country: '', address: '', city: '', zip: '', website: '', phone: '', whatsapp: '', email: '', notes: '' });
    onAuthorChange('');
    setSelectedId(null);
  };

  const openNew = () => {
    setFormData({ ...EMPTY_COMPANY });
    setShowForm('new');
    setShowDropdown(false);
  };

  const openEdit = (comp: CompanyProfile) => {
    setFormData({
      company: comp.company, country: comp.country,
      address: comp.address, city: comp.city, zip: comp.zip,
      website: comp.website, phone: comp.phone,
      whatsapp: comp.whatsapp, email: comp.email,
      notes: comp.notes, gameOwner: comp.gameOwner,
    });
    setShowForm('edit');
    setShowDropdown(false);
  };

  const handleSave = async () => {
    if (!formData.company.trim()) return;
    setIsSaving(true);

    if (showForm === 'edit' && selectedId) {
      await updateCompany(selectedId, formData);
    } else {
      await createCompany(formData);
    }

    await loadCompanies();
    applyCompany(formData);
    setShowForm(null);
    setIsSaving(false);

    // Re-select if editing
    if (showForm === 'new') {
      const updated = await fetchCompanies();
      const match = updated.find(c => c.company === formData.company);
      if (match) setSelectedId(match.id);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteCompany(id);
    if (selectedId === id) clearSelection();
    await loadCompanies();
  };

  const selectedCompany = companies.find((c) => c.id === selectedId);
  const f = formData;
  const setF = (updates: Partial<typeof formData>) => setFormData(prev => ({ ...prev, ...updates }));

  const CompanyForm = () => (
    <div className="bg-battle-dark rounded-lg p-4 border border-battle-orange/30 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm text-white font-medium">
          {showForm === 'edit' ? 'Edit Company' : 'Add New Company'}
        </h4>
        <button type="button" onClick={() => setShowForm(null)} className="text-gray-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Company *</label>
          <input type="text" value={f.company} onChange={e => setF({ company: e.target.value })}
            placeholder="Company name" className="w-full bg-battle-grey border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Country</label>
          <select value={f.country} onChange={e => setF({ country: e.target.value })}
            className="w-full bg-battle-grey border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-battle-orange text-sm">
            {Object.entries(COUNTRIES).map(([code, { label, flag }]) => (
              <option key={code} value={code}>{flag ? `${flag} ${label}` : label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Address</label>
          <input type="text" value={f.address} onChange={e => setF({ address: e.target.value })}
            placeholder="Street address" className="w-full bg-battle-grey border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Zip</label>
          <input type="text" value={f.zip} onChange={e => setF({ zip: e.target.value })}
            placeholder="4016" className="w-full bg-battle-grey border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">City</label>
          <input type="text" value={f.city} onChange={e => setF({ city: e.target.value })}
            placeholder="Stavanger" className="w-full bg-battle-grey border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">GameOwner *</label>
        <input type="text" value={f.gameOwner} onChange={e => setF({ gameOwner: e.target.value })}
          placeholder="Contact person" className="w-full bg-battle-grey border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Phone</label>
          <input type="tel" value={f.phone} onChange={e => setF({ phone: e.target.value })}
            placeholder="+45 12345678" className="w-full bg-battle-grey border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">WhatsApp</label>
          <input type="tel" value={f.whatsapp} onChange={e => setF({ whatsapp: e.target.value })}
            placeholder="+45 12345678" className="w-full bg-battle-grey border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Email</label>
          <input type="email" value={f.email} onChange={e => setF({ email: e.target.value })}
            placeholder="email@company.com" className="w-full bg-battle-grey border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Website</label>
        <input type="url" value={f.website} onChange={e => setF({ website: e.target.value })}
          placeholder="https://company.com" className="w-full bg-battle-grey border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Notes</label>
        <textarea value={f.notes} onChange={e => setF({ notes: e.target.value })}
          placeholder="Notes about this company..." rows={2}
          className="w-full bg-battle-grey border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm resize-none" />
      </div>

      <button type="button" onClick={handleSave} disabled={!f.company.trim() || isSaving}
        className="w-full px-4 py-2.5 bg-battle-orange hover:bg-battle-orangeLight disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {showForm === 'edit' ? 'Save Changes' : 'Save Company'}
      </button>
    </div>
  );

  return (
    <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
      <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
        <Building2 className="w-4 h-4 text-blue-400" />
        Game Designed By
      </h3>

      {/* Company selector */}
      <div className="relative">
        <label className="block text-xs text-gray-400 mb-1">Select Company</label>
        <button type="button" onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-left hover:border-battle-orange/50 transition-colors">
          {selectedCompany ? (
            <span className="flex items-center gap-2 text-white">
              {selectedCompany.country && <span>{countryFlag(selectedCompany.country)}</span>}
              <span className="font-medium">{selectedCompany.company}</span>
              {selectedCompany.city && <span className="text-gray-500 text-sm">· {selectedCompany.city}</span>}
            </span>
          ) : contact.company ? (
            <span className="flex items-center gap-2 text-white">
              {contact.country && <span>{countryFlag(contact.country)}</span>}
              <span>{contact.company}</span>
              <span className="text-gray-500 text-xs">(manual)</span>
            </span>
          ) : (
            <span className="text-gray-500">Choose or create a company...</span>
          )}
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-battle-dark border border-white/20 rounded-lg shadow-xl max-h-72 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-battle-orange animate-spin" />
                </div>
              ) : (
                <>
                  {companies.map((comp) => (
                    <div key={comp.id}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group ${
                        selectedId === comp.id ? 'bg-battle-orange/10' : ''
                      }`}>
                      <button type="button" onClick={() => selectCompany(comp)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                        <span className="text-lg flex-shrink-0">{comp.country ? countryFlag(comp.country) : '🏢'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{comp.company}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {[comp.address, comp.zip, comp.city].filter(Boolean).join(', ') || comp.gameOwner}
                            {comp.email ? ` · ${comp.email}` : ''}
                          </p>
                        </div>
                      </button>
                      {selectedId === comp.id && <Check className="w-4 h-4 text-battle-orange flex-shrink-0" />}
                      <button type="button" onClick={() => openEdit(comp)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-battle-orange transition-all flex-shrink-0" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={(e) => handleDelete(comp.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all flex-shrink-0" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {companies.length === 0 && (
                    <p className="text-sm text-gray-500 px-4 py-3">No companies saved yet</p>
                  )}

                  <button type="button" onClick={openNew}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-battle-orange hover:bg-battle-orange/10 transition-colors border-t border-white/10">
                    <Plus className="w-4 h-4" /> Add New Company
                  </button>

                  {selectedId && (
                    <button type="button" onClick={() => { clearSelection(); setShowDropdown(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 transition-colors border-t border-white/10">
                      <X className="w-4 h-4" /> Clear Selection (enter manually)
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* New/Edit Company Form */}
      {showForm && <CompanyForm />}

      {/* Manual edit fields */}
      {!showForm && !selectedId && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Company
              </label>
              <input type="text" value={contact.company} onChange={e => onChange({ ...contact, company: e.target.value })}
                placeholder="Company name" className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Country</label>
              <select value={contact.country} onChange={e => onChange({ ...contact, country: e.target.value })}
                className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-battle-orange">
                {Object.entries(COUNTRIES).map(([code, { label, flag }]) => (
                  <option key={code} value={code}>{flag ? `${flag} ${label}` : label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Address
              </label>
              <input type="text" value={contact.address} onChange={e => onChange({ ...contact, address: e.target.value })}
                placeholder="Street address" className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Zip</label>
              <input type="text" value={contact.zip} onChange={e => onChange({ ...contact, zip: e.target.value })}
                placeholder="4016" className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">City</label>
              <input type="text" value={contact.city} onChange={e => onChange({ ...contact, city: e.target.value })}
                placeholder="Stavanger" className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">GameOwner *</label>
              <input type="text" value={author} onChange={e => onAuthorChange(e.target.value)}
                placeholder="Contact person / responsible" required
                className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Website</label>
              <input type="url" value={contact.website} onChange={e => onChange({ ...contact, website: e.target.value })}
                placeholder="https://company.com"
                className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </label>
              <input type="tel" value={contact.phone} onChange={e => onChange({ ...contact, phone: e.target.value })}
                placeholder="+45 12345678" className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </label>
              <input type="tel" value={contact.whatsapp} onChange={e => onChange({ ...contact, whatsapp: e.target.value })}
                placeholder="+45 12345678" className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </label>
              <input type="email" value={contact.email} onChange={e => onChange({ ...contact, email: e.target.value })}
                placeholder="email@company.com" className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea value={contact.notes} onChange={e => onChange({ ...contact, notes: e.target.value })}
              placeholder="Notes about this company..." rows={2}
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm resize-none" />
          </div>
        </>
      )}

      {/* Selected company info (read-only) */}
      {selectedId && selectedCompany && !showForm && (
        <div className="bg-battle-dark rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-white font-medium flex items-center gap-2">
              {selectedCompany.country && <span>{countryFlag(selectedCompany.country)}</span>}
              {selectedCompany.company}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => openEdit(selectedCompany)}
                className="text-xs text-battle-orange hover:text-battle-orangeLight flex items-center gap-1">
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button type="button" onClick={clearSelection}
                className="text-xs text-gray-500 hover:text-white">
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            {selectedCompany.gameOwner && (
              <span>GameOwner: <span className="text-white">{selectedCompany.gameOwner}</span></span>
            )}
            {(selectedCompany.address || selectedCompany.city) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[selectedCompany.address, selectedCompany.zip, selectedCompany.city].filter(Boolean).join(', ')}
              </span>
            )}
            {selectedCompany.phone && (
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedCompany.phone}</span>
            )}
            {selectedCompany.email && (
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedCompany.email}</span>
            )}
            {selectedCompany.website && (
              <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-battle-orange hover:text-battle-orangeLight">
                <Globe className="w-3 h-3" /> Website
              </a>
            )}
          </div>
          {selectedCompany.notes && (
            <p className="text-xs text-gray-500 mt-1">{selectedCompany.notes}</p>
          )}
        </div>
      )}
    </section>
  );
};

export default CompanySelector;
