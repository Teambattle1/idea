// Backfill facebook / linkedin / instagram URLs for all agencies by scraping
// each agency's website. Falls back to DuckDuckGo HTML search when the site
// itself doesn't expose social links.
//
// Run: node scripts/backfill-socials.mjs
//      node scripts/backfill-socials.mjs --dry    (preview, no writes)

const SUPABASE_URL = 'https://ilbjytyukicbssqftmma.supabase.co';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsYmp5dHl1a2ljYnNzcWZ0bW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MzA0NjEsImV4cCI6MjA3MDQwNjQ2MX0.I_PWByMPcOYhWgeq9MxXgOo-NCZYfEuzYmo35XnBFAY';

const DRY = process.argv.includes('--dry');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1] : '';
};

const extractSocials = (html) => ({
  facebook: pick(
    html,
    /href=["'](https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share\.php)[^"'?#\s<>]+)["']/i,
  ),
  linkedin: pick(
    html,
    /href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[^"'?#\s<>]+)["']/i,
  ),
  instagram: pick(
    html,
    /href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"'?#\s<>]+)["']/i,
  ),
});

const fetchText = async (url, timeoutMs = 15000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, accept: 'text/html,*/*' },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
};

const normalizeUrl = (raw) => {
  if (!raw) return '';
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
};

const ddgSearch = async (query, kind) => {
  const patterns = {
    facebook: /https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>]+/i,
    linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[^\s"'<>]+/i,
    instagram: /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>]+/i,
  };
  const html = await fetchText(
    `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
  );
  if (!html) return '';
  // DuckDuckGo wraps external URLs in a redirect: /l/?uddg=<encoded>
  const decoded = html.replace(/\/l\/\?uddg=([^"&]+)/g, (_, enc) => {
    try {
      return decodeURIComponent(enc);
    } catch {
      return '';
    }
  });
  const m = decoded.match(patterns[kind]);
  return m ? m[0].replace(/[.,;:]+$/, '') : '';
};

const supaGet = async (path) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON, authorization: `Bearer ${ANON}` },
  });
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json();
};

const supaPatch = async (path, body) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: {
      apikey: ANON,
      authorization: `Bearer ${ANON}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PATCH ${path} ${res.status}: ${t}`);
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  console.log(`Mode: ${DRY ? 'DRY RUN' : 'WRITE'}`);
  const rows = await supaGet('todos?category=eq.idea-agency&select=id,title,description');
  console.log(`Fetched ${rows.length} agencies.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    let data;
    try {
      data = JSON.parse(row.description || '{}');
    } catch {
      data = {};
    }

    const name = row.title;
    const hasAll = data.facebook && data.linkedin && data.instagram;
    if (hasAll) {
      console.log(`· ${name} — all set, skip`);
      skipped++;
      continue;
    }

    const found = { facebook: '', linkedin: '', instagram: '' };

    // 1. Scrape website
    const website = normalizeUrl(data.website);
    if (website) {
      const html = await fetchText(website);
      if (html) {
        const s = extractSocials(html);
        for (const k of ['facebook', 'linkedin', 'instagram']) {
          if (!data[k] && s[k]) found[k] = s[k];
        }
      }
    }

    // 2. DDG fallback for each missing kind
    const location = [data.city, data.country].filter(Boolean).join(' ');
    for (const k of ['facebook', 'linkedin', 'instagram']) {
      if (data[k] || found[k]) continue;
      const site =
        k === 'linkedin' ? 'linkedin.com/company' : `${k}.com`;
      const q = `${name} ${location} site:${site}`;
      const hit = await ddgSearch(q, k);
      if (hit) found[k] = hit;
      await sleep(400); // be nice to DDG
    }

    const patch = {};
    for (const k of ['facebook', 'linkedin', 'instagram']) {
      if (!data[k] && found[k]) patch[k] = found[k];
    }

    if (!Object.keys(patch).length) {
      console.log(`· ${name} — nothing found`);
      failed++;
      continue;
    }

    console.log(`✓ ${name}`);
    for (const [k, v] of Object.entries(patch)) console.log(`    ${k}: ${v}`);

    if (!DRY) {
      const merged = { ...data, ...patch };
      try {
        await supaPatch(`todos?id=eq.${row.id}`, {
          description: JSON.stringify(merged),
        });
        updated++;
      } catch (e) {
        console.log(`    !! write failed: ${e.message}`);
        failed++;
      }
    } else {
      updated++;
    }

    await sleep(300);
  }

  console.log(`\nDone. updated=${updated} skipped=${skipped} failed=${failed}`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
