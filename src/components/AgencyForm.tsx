import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, Upload } from 'lucide-react';
import { Agency, AGENCY_BADGES, AGENCY_BADGE_STYLES, AGENCY_SERVICES, COUNTRIES, DIAL_CODES, SUGGESTED_TAGS } from '../types';
import { uploadFile } from '../lib/supabase';
import TagBadge from './TagBadge';
import CountrySelect from './CountrySelect';
import DialCodeSelect from './DialCodeSelect';
import LocationThumb from './LocationThumb';
import AddressLookup from './AddressLookup';
import SocialIconButton from './SocialIconButton';

type AgencyDraft = Omit<Agency, 'id' | 'createdAt'>;

const EMPTY: AgencyDraft = {
  name: '',
  logo: '',
  website: '',
  country: '',
  city: '',
  address: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  contactNote: '',
  contactWhatsapp: '',
  contactTeams: '',
  contactZoom: '',
  contactLinkedin: '',
  facebook: '',
  linkedin: '',
  instagram: '',
  additionalContacts: [],
  services: [],
  tags: [],
  badges: [],
  notes: '',
};

interface Props {
  initial?: Agency | null;
  onClose: () => void;
  onSave: (draft: AgencyDraft) => Promise<{ success: boolean; error?: string }>;
}

const AgencyForm = ({ initial, onClose, onSave }: Props) => {
  const [draft, setDraft] = useState<AgencyDraft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [customTag, setCustomTag] = useState('');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingLogo(true);
    try {
      const uploaded = await uploadFile(file);
      if (uploaded?.url) setDraft((d) => ({ ...d, logo: uploaded.url }));
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    if (initial) {
      const { id: _id, createdAt: _c, ...rest } = initial;
      setDraft(rest);
    } else {
      setDraft(EMPTY);
    }
  }, [initial]);

  const set = <K extends keyof AgencyDraft>(key: K, value: AgencyDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleService = (s: string) =>
    set(
      'services',
      draft.services.includes(s) ? draft.services.filter((x) => x !== s) : [...draft.services, s],
    );

  const toggleTag = (t: string) =>
    set('tags', draft.tags.includes(t) ? draft.tags.filter((x) => x !== t) : [...draft.tags, t]);

  const toggleBadge = (b: string) =>
    set('badges', draft.badges.includes(b) ? draft.badges.filter((x) => x !== b) : [...draft.badges, b]);

  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase();
    if (t && !draft.tags.includes(t)) set('tags', [...draft.tags, t]);
    setCustomTag('');
  };

  // Map common country TLDs so we can default the Country field.
  const TLD_TO_COUNTRY: Record<string, string> = {
    dk: 'DK', se: 'SE', no: 'NO', de: 'DE', be: 'BE', ro: 'RO',
    pt: 'PT', il: 'IL', cz: 'CZ', gr: 'GR', uk: 'GB', nl: 'NL',
    fr: 'FR', es: 'ES', it: 'IT', us: 'US',
  };

  // Extract country from phone dial prefix as a secondary signal.
  const dialToCountry = (phone: string): string => {
    const m = phone.match(/^\+(\d{1,4})/);
    if (!m) return '';
    const dial = '+' + m[1];
    return Object.entries(DIAL_CODES).find(([, v]) => v === dial)?.[0] || '';
  };

  // Scrape main page + (if linked) contact page, then parse logo, name, email,
  // phone, address, country. Each field is only set when currently empty so
  // the user's manual entries win.
  const fetchFromWebsite = async () => {
    if (!draft.website.trim()) return;
    let url = draft.website.trim();
    if (!url.startsWith('http')) url = 'https://' + url;

    setFetchingLogo(true);
    try {
      // Try, in order: scrape-site (returns raw HTML via Netlify fn),
      // corsproxy.io (direct browser fetch, works everywhere), then
      // extract-url (Microlink — only og:meta, last resort for logo/name).
      let html = '';

      // Netlify functions (/api/*) only respond on the deployed host — skip
      // them on localhost so the console isn't spammed with 404s. corsproxy
      // handles dev perfectly on its own.
      const isLocal = /^(localhost|127\.0\.0\.1|\[?::1\]?)$/.test(
        window.location.hostname,
      );

      if (!isLocal) {
        try {
          const scrapeRes = await fetch('/api/scrape-site', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          if (scrapeRes.ok) {
            const ct = scrapeRes.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
              const data = await scrapeRes.json();
              html = data?.mainPage?.html || '';
            }
          }
        } catch {
          // swallow — try next source
        }
      }

      if (!html) {
        try {
          const proxyRes = await fetch(
            `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
          );
          if (proxyRes.ok) html = await proxyRes.text();
        } catch {
          // swallow
        }
      }

      if (!html && !isLocal) {
        try {
          const res = await fetch(`/api/extract-url?url=${encodeURIComponent(url)}`);
          if (res.ok) {
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
              const json = await res.json();
              html = json?.html || '';
            }
          }
        } catch {
          // swallow
        }
      }
      if (!html) return;

      // --- Logo + name -------------------------------------------------
      const og = html.match(
        /<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i,
      );
      const titleTag =
        html.match(
          /<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i,
        ) || html.match(/<title[^>]*>([^<]+)<\/title>/i);

      const resolveUrl = (raw: string): string => {
        try {
          return new URL(raw, url).toString();
        } catch {
          return raw;
        }
      };

      // Prefer dedicated logo <img> / SVG references, then og:image, then
      // apple-touch-icon / link rel=icon. og:image is often a social share
      // banner — not a clean logo — so we try real logo tags first.
      const logoImg =
        html.match(
          /<img[^>]+(?:class|id)=["'][^"']*logo[^"']*["'][^>]*\ssrc=["']([^"']+)["']/i,
        ) ||
        html.match(
          /<img[^>]+\ssrc=["']([^"']+)["'][^>]+(?:class|id)=["'][^"']*logo[^"']*["']/i,
        ) ||
        html.match(/<img[^>]+\ssrc=["']([^"']*logo[^"']*\.(?:svg|png|jpe?g|webp))["']/i);
      const appleIcon = html.match(
        /<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
      );
      const iconLink = html.match(
        /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
      );

      const logoCandidate =
        logoImg?.[1] || og?.[1] || appleIcon?.[1] || iconLink?.[1];
      if (logoCandidate && !draft.logo) set('logo', resolveUrl(logoCandidate));
      if (titleTag && !draft.name) {
        // Strip common " - About us", " | Home" suffixes.
        const raw = titleTag[1].trim();
        const cleaned = raw.split(/\s[|\-–—]\s/)[0].trim();
        set('name', cleaned || raw);
      }

      // --- Email ------------------------------------------------------
      if (!draft.contactEmail) {
        const mailto = html.match(/mailto:([^"'?\s<>]+)/i);
        const emailFree =
          html.match(
            /\b([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})\b/,
          );
        const email = mailto?.[1] || emailFree?.[1];
        // Skip generic no-reply / wordpress junk.
        if (email && !/noreply|no-reply|wordpress|sentry|example/i.test(email)) {
          set('contactEmail', email);
        }
      }

      // --- Phone ------------------------------------------------------
      if (!draft.contactPhone) {
        const tel = html.match(/tel:([+\d\s().\-]+)/i);
        const telFree = html.match(
          /(\+\d{1,4}[\s.\-]?\d[\d\s.\-()]{6,})/,
        );
        const phone = tel?.[1] || telFree?.[1];
        if (phone) set('contactPhone', phone.replace(/\s+/g, ' ').trim());
      }

      // --- Country ----------------------------------------------------
      if (!draft.country) {
        const host = new URL(url).hostname;
        const tld = host.split('.').pop()?.toLowerCase() || '';
        const byTld = TLD_TO_COUNTRY[tld];
        const phoneNow =
          draft.contactPhone ||
          (html.match(/tel:([+\d\s().\-]+)/i)?.[1] ?? '') ||
          (html.match(/(\+\d{1,4}[\s.\-]?\d[\d\s.\-()]{6,})/)?.[1] ?? '');
        const byDial = dialToCountry(phoneNow);
        const guess = byTld || byDial;
        if (guess && COUNTRIES[guess]) set('country', guess);
      }

      // --- Social links (best-effort scrape of header/footer) --------
      const firstMatch = (re: RegExp) => {
        const m = html.match(re);
        return m ? resolveUrl(m[1] || m[0]) : '';
      };
      if (!draft.facebook) {
        const fb = firstMatch(/href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"'?#]+)["']/i);
        if (fb && !/sharer|share\.php/i.test(fb)) set('facebook', fb);
      }
      if (!draft.linkedin) {
        const li = firstMatch(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[^"'?#]+)["']/i);
        if (li) set('linkedin', li);
      }
      if (!draft.instagram) {
        const ig = firstMatch(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"'?#]+)["']/i);
        if (ig) set('instagram', ig);
      }

      // --- City (best-effort from address lines) ----------------------
      if (!draft.city) {
        // e.g. "75008 Paris", "1000 Brussels", "DK-2100 Copenhagen"
        const m = html.match(
          /\b(?:[A-Z]{1,2}-)?\d{4,5}\s+([A-ZÆØÅÉÈÀÂÎÖÜ][A-Za-zÆØÅéèàâîöü\-]{2,})/,
        );
        if (m) set('city', m[1]);
      }
    } catch {
      // Silent — user can fill manually
    } finally {
      setFetchingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await onSave({ ...draft, name: draft.name.trim() });
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'Could not save');
      return;
    }
    onClose();
  };

  const inputClass =
    'w-full bg-battle-dark border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none placeholder:text-gray-500';

  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-battle-grey rounded-xl border border-white/10 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            {initial ? 'Edit agency' : 'Add agency'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-4">
            <div className="space-y-4 min-w-0">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Website</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="example.com"
                className={inputClass}
              />
              <button
                type="button"
                onClick={fetchFromWebsite}
                disabled={fetchingLogo || !draft.website.trim()}
                className="flex-shrink-0 px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 disabled:opacity-40 text-purple-200 rounded-lg text-sm flex items-center gap-1.5 border border-purple-500/30"
                title="Auto-fetch logo and name"
              >
                {fetchingLogo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Auto-fill
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
              Company socials <span className="text-gray-500 font-normal normal-case">(click icon to open, empty = click to add)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              <SocialIconButton kind="facebook" value={draft.facebook} onChange={(v) => set('facebook', v)} />
              <SocialIconButton kind="linkedin" value={draft.linkedin} onChange={(v) => set('linkedin', v)} />
              <SocialIconButton kind="instagram" value={draft.instagram} onChange={(v) => set('instagram', v)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Name *</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Logo</label>
              <div className="flex items-center gap-2">
                {draft.logo && (
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-white border border-white/10 flex items-center justify-center overflow-hidden">
                      <img
                        key={draft.logo}
                        src={draft.logo}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => set('logo', '')}
                      title="Remove logo"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  value={draft.logo}
                  onChange={(e) => set('logo', e.target.value)}
                  placeholder="https://…/logo.png"
                  className={inputClass}
                />
                <label
                  className={`flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs uppercase tracking-wide text-gray-200 cursor-pointer flex-shrink-0 ${
                    uploadingLogo ? 'opacity-60 pointer-events-none' : ''
                  }`}
                  title="Upload logo file"
                >
                  {uploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Country</label>
              <CountrySelect
                value={draft.country}
                onChange={(code) => set('country', code)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">City</label>
              <input
                type="text"
                value={draft.city}
                onChange={(e) => set('city', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Address</label>
              <AddressLookup
                value={draft.address}
                onChange={(v) => set('address', v)}
                onPick={(picked) => {
                  setDraft((d) => ({
                    ...d,
                    address: picked.address,
                    city: picked.city || d.city,
                    country: picked.country && COUNTRIES[picked.country] ? picked.country : d.country,
                  }));
                }}
                placeholder="Start typing street, city…"
              />
            </div>
          </div>
            </div>
            <div className="sm:sticky sm:top-0">
              <LocationThumb country={draft.country} city={draft.city} name={draft.name} />
            </div>
          </div>

          {(() => {
            const knownCodes = Array.from(new Set(Object.values(DIAL_CODES))).sort(
              (a, b) => b.length - a.length,
            );
            const joinPhone = (code: string, num: string) =>
              `${code}${code && num ? ' ' : ''}${num}`.trim();
            const splitPhone = (raw: string) => {
              const v = raw.trim();
              const matched = v.startsWith('+')
                ? knownCodes.find((c) => v.startsWith(c))
                : undefined;
              return {
                code: matched || DIAL_CODES[draft.country] || '',
                number: matched ? v.slice(matched.length).trim() : v,
              };
            };
            const primary = splitPhone(draft.contactPhone);
            const updateExtra = (idx: number, patch: Partial<typeof draft.additionalContacts[number]>) =>
              set(
                'additionalContacts',
                draft.additionalContacts.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
              );
            const removeExtra = (idx: number) =>
              set('additionalContacts', draft.additionalContacts.filter((_, i) => i !== idx));
            const addExtra = () =>
              set('additionalContacts', [
                ...draft.additionalContacts,
                { name: '', email: '', phone: '', note: '', whatsapp: '', teams: '', zoom: '', linkedin: '' },
              ]);
            return (
              <div className="space-y-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Contact name</label>
                      <input
                        type="text"
                        value={draft.contactName}
                        onChange={(e) => set('contactName', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Contact email</label>
                      <input
                        type="email"
                        value={draft.contactEmail}
                        onChange={(e) => set('contactEmail', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Contact phone</label>
                      <div className="flex gap-2">
                        <DialCodeSelect
                          value={primary.code}
                          onChange={(code) => set('contactPhone', joinPhone(code, primary.number))}
                        />
                        <input
                          type="tel"
                          value={primary.number}
                          onChange={(e) => set('contactPhone', joinPhone(primary.code, e.target.value))}
                          placeholder="91322968"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Note</label>
                    <textarea
                      value={draft.contactNote}
                      onChange={(e) => set('contactNote', e.target.value)}
                      rows={2}
                      placeholder="Role, availability, preferred channel…"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
                      Channels <span className="text-gray-500 font-normal normal-case">(click to open, empty = click to add)</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <SocialIconButton kind="linkedin" value={draft.contactLinkedin} onChange={(v) => set('contactLinkedin', v)} />
                      <SocialIconButton kind="whatsapp" value={draft.contactWhatsapp} onChange={(v) => set('contactWhatsapp', v)} />
                      <SocialIconButton kind="teams" value={draft.contactTeams} onChange={(v) => set('contactTeams', v)} />
                      <SocialIconButton kind="zoom" value={draft.contactZoom} onChange={(v) => set('contactZoom', v)} />
                    </div>
                  </div>
                </div>

                {draft.additionalContacts.map((c, idx) => {
                  const extra = splitPhone(c.phone);
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-3 relative"
                    >
                      <button
                        type="button"
                        onClick={() => removeExtra(idx)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 flex items-center justify-center"
                        title="Remove contact"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Contact name</label>
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => updateExtra(idx, { name: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Contact email</label>
                          <input
                            type="email"
                            value={c.email}
                            onChange={(e) => updateExtra(idx, { email: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Contact phone</label>
                          <div className="flex gap-2">
                            <DialCodeSelect
                              value={extra.code}
                              onChange={(code) => updateExtra(idx, { phone: joinPhone(code, extra.number) })}
                            />
                            <input
                              type="tel"
                              value={extra.number}
                              onChange={(e) => updateExtra(idx, { phone: joinPhone(extra.code, e.target.value) })}
                              placeholder="91322968"
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Note</label>
                        <textarea
                          value={c.note || ''}
                          onChange={(e) => updateExtra(idx, { note: e.target.value })}
                          rows={2}
                          placeholder="Role, availability, preferred channel…"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Channels</label>
                        <div className="flex flex-wrap gap-1.5">
                          <SocialIconButton kind="linkedin" value={c.linkedin || ''} onChange={(v) => updateExtra(idx, { linkedin: v })} />
                          <SocialIconButton kind="whatsapp" value={c.whatsapp || ''} onChange={(v) => updateExtra(idx, { whatsapp: v })} />
                          <SocialIconButton kind="teams" value={c.teams || ''} onChange={(v) => updateExtra(idx, { teams: v })} />
                          <SocialIconButton kind="zoom" value={c.zoom || ''} onChange={(v) => updateExtra(idx, { zoom: v })} />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addExtra}
                  className="px-3 py-1.5 rounded-full text-xs font-bold tracking-wider border border-white/15 text-gray-200 hover:bg-white/5"
                >
                  + Add contact
                </button>
              </div>
            );
          })()}

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
              Badges <span className="text-gray-500 font-normal normal-case">(click to toggle)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AGENCY_BADGES.map((b) => {
                const active = draft.badges.includes(b);
                const style = AGENCY_BADGE_STYLES[b];
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBadge(b)}
                    title={active ? `Fjern ${b}` : `Tilføj ${b}`}
                    className={`group px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider border transition-colors flex items-center gap-1 ${
                      active
                        ? `${style.bg} ${style.text} ${style.border}`
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {b}
                    {active && (
                      <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Services</label>
            <div className="flex flex-wrap gap-1.5">
              {AGENCY_SERVICES.map((s) => (
                <TagBadge
                  key={s}
                  tag={s}
                  active={draft.services.includes(s)}
                  onClick={() => toggleService(s)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[...new Set([...SUGGESTED_TAGS, ...draft.tags])].map((t) => (
                <TagBadge
                  key={t}
                  tag={t}
                  active={draft.tags.includes(t)}
                  onClick={() => toggleTag(t)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="Add custom tag…"
                className={inputClass}
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={!customTag.trim()}
                className="flex-shrink-0 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-lg text-sm"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Relevant info, past collaborations, strengths…"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white rounded-lg text-sm uppercase tracking-wide"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-battle-orange hover:bg-battle-orangeLight disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 uppercase tracking-wide"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {initial ? 'Save changes' : 'Create agency'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgencyForm;
