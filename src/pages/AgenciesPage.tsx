import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Loader2, Building2, Download } from 'lucide-react';
import Header from '../components/Header';
import AgencyCard from '../components/AgencyCard';
import AgencyForm from '../components/AgencyForm';
import AgencyMap from '../components/AgencyMap';
import {
  createAgency,
  deleteAgency,
  fetchAgencies,
  importAgenciesFromMeet,
  updateAgency,
} from '../lib/supabase';
import { Agency, COUNTRIES } from '../types';

const AgenciesPage = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [editing, setEditing] = useState<Agency | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await fetchAgencies();
    setAgencies(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const countries = useMemo(() => {
    const set = new Set<string>();
    agencies.forEach((a) => a.country && set.add(a.country));
    return Array.from(set).sort();
  }, [agencies]);

  const services = useMemo(() => {
    const set = new Set<string>();
    agencies.forEach((a) => a.services.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [agencies]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agencies.filter((a) => {
      if (countryFilter && a.country !== countryFilter) return false;
      if (serviceFilter && !a.services.includes(serviceFilter)) return false;
      if (!q) return true;
      const haystack = [
        a.name,
        a.city,
        a.address,
        a.website,
        a.contactName,
        a.contactEmail,
        a.notes,
        ...a.services,
        ...a.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [agencies, search, countryFilter, serviceFilter]);

  const handleSave = async (draft: Omit<Agency, 'id' | 'createdAt'>) => {
    const result = editing
      ? await updateAgency(editing.id, draft)
      : await createAgency(draft);
    if (result.success) await load();
    return result;
  };

  const handleDelete = async (agency: Agency) => {
    if (!confirm(`Delete "${agency.name}"? This cannot be undone.`)) return;
    const { success } = await deleteAgency(agency.id);
    if (success) setAgencies((prev) => prev.filter((a) => a.id !== agency.id));
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (agency: Agency) => {
    setEditing(agency);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImportFromMeet = async () => {
    if (
      !confirm(
        'Import all published companies from meet.eventday.dk?\n\nDuplicates (by name) will be skipped.',
      )
    )
      return;
    setImporting(true);
    setImportMessage(null);
    const result = await importAgenciesFromMeet();
    await load();
    setImporting(false);
    setImportMessage(
      `Import done — ${result.created} created, ${result.skipped} skipped, ${result.failed} failed (of ${result.total}).`,
    );
    setTimeout(() => setImportMessage(null), 8000);
  };

  return (
    <div className="min-h-screen bg-battle-black">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Building2 className="w-6 h-6 text-battle-orange" />
              Agencies
            </h2>
            <p className="text-sm text-gray-400 mt-0.5 uppercase tracking-wide">
              {loading
                ? 'LOADING…'
                : `${filtered.length} OF ${agencies.length} ${agencies.length === 1 ? 'AGENCY' : 'AGENCIES'}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImportFromMeet}
              disabled={importing}
              className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 disabled:opacity-50 text-blue-200 border border-blue-500/30 rounded-lg text-sm font-medium uppercase tracking-wide flex items-center gap-1.5"
              title="Import companies from meet.eventday.dk"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Import from MEET
            </button>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-battle-orange hover:bg-battle-orangeLight text-white rounded-lg text-sm font-medium uppercase tracking-wide flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add agency
            </button>
          </div>
        </div>

        {importMessage && (
          <div className="mb-4 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-200 rounded-lg text-sm">
            {importMessage}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="SEARCH BY NAME, CITY, CONTACT…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-battle-grey border border-white/10 text-white rounded-lg text-sm uppercase tracking-wide focus:border-battle-orange focus:outline-none placeholder:text-gray-500"
            />
          </div>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm uppercase tracking-wide focus:border-battle-orange focus:outline-none"
          >
            <option value="">ALL COUNTRIES</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {(COUNTRIES[c]?.label || c).toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm uppercase tracking-wide focus:border-battle-orange focus:outline-none"
          >
            <option value="">ALL SERVICES</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {!loading && filtered.length > 0 && (
          <AgencyMap agencies={filtered} onSelect={openEdit} />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-battle-grey/50 rounded-xl border border-white/10 border-dashed">
            <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              {agencies.length === 0
                ? 'No agencies yet. Click "Add agency" to create the first one.'
                : 'No agencies match your filters.'}
            </p>
          </div>
        ) : (
          (() => {
            const partners = filtered.filter((a) => a.badges.includes('PARTNER'));
            const others = filtered.filter((a) => !a.badges.includes('PARTNER'));
            const sectionHeading = (title: string, count: number) => (
              <div className="flex items-baseline gap-2 mb-3 mt-6 first:mt-0">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                  {title}
                </h3>
                <span className="text-xs text-gray-500">{count}</span>
              </div>
            );
            const grid = (list: Agency[]) => (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {list.map((a) => (
                  <AgencyCard
                    key={a.id}
                    agency={a}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            );
            return (
              <>
                {partners.length > 0 && (
                  <>
                    {sectionHeading('Partners', partners.length)}
                    {grid(partners)}
                  </>
                )}
                {others.length > 0 && (
                  <>
                    {sectionHeading('Other', others.length)}
                    {grid(others)}
                  </>
                )}
              </>
            );
          })()
        )}
      </div>

      {showForm && (
        <AgencyForm
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AgenciesPage;
