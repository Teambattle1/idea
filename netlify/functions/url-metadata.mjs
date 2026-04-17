// Netlify function: fetch page and extract OpenGraph / meta title + image.
// GET /.netlify/functions/url-metadata?url=<encoded>
// Pure regex parsing — no dependencies.

const UA =
  'Mozilla/5.0 (compatible; IdeaBox/1.0; +https://github.com) AppleWebKit/537.36';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
};

function pick(html, re) {
  const m = html.match(re);
  return m ? decode(m[1].trim()) : null;
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function absolute(maybeUrl, base) {
  if (!maybeUrl) return null;
  try {
    return new URL(maybeUrl, base).toString();
  } catch {
    return null;
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const target = event.queryStringParameters?.url;
  if (!target) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing ?url=' }),
    };
  }

  let parsed;
  try {
    parsed = new URL(target);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error('bad protocol');
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid URL' }),
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(parsed.toString(), {
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          url: parsed.toString(),
          error: `Upstream ${res.status}`,
        }),
      };
    }

    // Only parse HTML (cap at ~500KB)
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ url: parsed.toString(), title: parsed.hostname }),
      };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let html = '';
    let received = 0;
    const MAX = 500_000;
    while (received < MAX) {
      const { value, done } = await reader.read();
      if (done) break;
      received += value.byteLength;
      html += decoder.decode(value, { stream: true });
    }
    try {
      reader.cancel();
    } catch {}

    const ogTitle =
      pick(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      pick(html, /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
    const title =
      ogTitle ||
      pick(html, /<title[^>]*>([^<]+)<\/title>/i) ||
      parsed.hostname;

    const description =
      pick(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      pick(html, /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i) ||
      pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);

    const rawImage =
      pick(html, /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i) ||
      pick(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      pick(html, /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

    const siteName =
      pick(html, /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);

    const image = absolute(rawImage, parsed.toString());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: parsed.toString(),
        title,
        description,
        image,
        siteName,
      }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: parsed.toString(),
        error: err.name === 'AbortError' ? 'Timeout' : String(err.message || err),
      }),
    };
  }
};
