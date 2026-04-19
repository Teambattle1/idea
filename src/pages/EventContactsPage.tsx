import { useEffect, useState } from 'react';
import { Plus, Search, Loader2, UserRound, Pencil, Trash2, X, Mail, Phone } from 'lucide-react';
import Header from '../components/Header';
import {
  createEventContact,
  deleteEventContact,
  fetchEventContacts,
  updateEventContact,
} from '../lib/supabase';
import { COUNTRIES, EventContact } from '../types';
import CountrySelect from '../components/CountrySelect';

type Draft = Omit<EventContact, 'id' | 'createdAt'>;

const emptyDraft: Draft = {
  name: '',
  country: '',
  city: '',
  company: '',
  email: '',
  phone: '',
  note: '',
};

const EventContactsPage = () => {
  const [contacts, setContacts] = useState<EventContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventContact | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setContacts(await fetchEventContacts());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setShowForm(true);
  };

  const openEdit = (c: EventContact) => {
    setEditing(c);
    setDraft({
      name: c.name,
      country: c.country,
      city: c.city,
      company: c.company,
      email: c.email,
      phone: c.phone,
      note: c.note,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    const result = editing
      ? await updateEventContact(editing.id, draft)
      : await createEventContact(draft);
    setSaving(false);
    if (result.success) {
      setShowForm(false);
      setEditing(null);
      await load();
    }
  };

  const handleDelete = async (c: EventContact) => {
    if (!confirm(`Delete contact "${c.name}"?`)) return;
    const { success } = await deleteEventContact(c.id);
    if (success) setContacts((prev) => prev.filter((x) => x.id !== c.id));
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? contacts.filter((c) =>
        [c.name, c.company, c.city, c.country, c.email, c.phone, c.note]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    : contacts;

  return (
    <div className="min-h-screen bg-battle-black">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <UserRound className="w-6 h-6 text-battle-orange" />
              Event Contacts
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {loading ? 'Loading…' : `${filtered.length} of ${contacts.length}`}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-battle-orange hover:bg-battle-orangeLight text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add contact
          </button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, company, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-battle-grey border border-white/10 text-white rounded-lg text-sm focus:border-battle-orange focus:outline-none placeholder:text-gray-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-battle-grey/50 rounded-xl border border-white/10 border-dashed">
            <UserRound className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              {contacts.length === 0
                ? 'No contacts yet. Click "Add contact" to create the first one.'
                : 'No contacts match your search.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-battle-grey/30">
            {filtered.map((c) => {
              const country = COUNTRIES[c.country];
              return (
                <div
                  key={c.id}
                  className="group flex items-start gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-battle-dark border border-white/10 flex items-center justify-center flex-shrink-0">
                    <UserRound className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold truncate">{c.name}</h3>
                      {c.company && (
                        <span className="text-sm text-gray-400 truncate">· {c.company}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      {c.country && (
                        <img
                          src={`https://flagcdn.com/20x15/${c.country.toLowerCase()}.png`}
                          alt=""
                          className="w-4 h-3 rounded-sm"
                        />
                      )}
                      <span>
                        {[c.city, country?.label || c.country].filter(Boolean).join(', ') || '—'}
                      </span>
                    </div>
                    {(c.email || c.phone) && (
                      <div className="flex items-center flex-wrap gap-3 mt-1 text-xs">
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="inline-flex items-center gap-1 text-battle-orange hover:underline"
                          >
                            <Mail className="w-3 h-3" />
                            {c.email}
                          </a>
                        )}
                        {c.phone && (
                          <a
                            href={`tel:${c.phone.replace(/\s+/g, '')}`}
                            className="inline-flex items-center gap-1 text-gray-300 hover:text-white"
                          >
                            <Phone className="w-3 h-3" />
                            {c.phone}
                          </a>
                        )}
                      </div>
                    )}
                    {c.note && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2 whitespace-pre-wrap">
                        {c.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(c)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-battle-dark border border-white/10 rounded-xl w-full max-w-lg mt-10 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                {editing ? 'Edit contact' : 'New contact'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Field label="Name">
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none"
                  autoFocus
                />
              </Field>

              <Field label="Company">
                <input
                  type="text"
                  value={draft.company}
                  onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                  className="w-full bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Country">
                  <CountrySelect
                    value={draft.country}
                    onChange={(code) => setDraft({ ...draft, country: code })}
                  />
                </Field>
                <Field label="City">
                  <input
                    type="text"
                    value={draft.city}
                    onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                    className="w-full bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Email">
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    className="w-full bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none"
                  />
                </Field>
                <Field label="Mobil">
                  <input
                    type="tel"
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    className="w-full bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none"
                  />
                </Field>
              </div>

              <Field label="Note">
                <textarea
                  rows={4}
                  value={draft.note}
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                  className="w-full bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none resize-y"
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !draft.name.trim()}
                className="px-4 py-2 bg-battle-orange hover:bg-battle-orangeLight disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
      {label}
    </span>
    {children}
  </label>
);

export default EventContactsPage;
