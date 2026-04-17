import type { Handler } from '@netlify/functions';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Synthesize an HTML snippet with og:meta tags so the client-side regex parser
// in InspirationPage can extract title/image from Microlink's JSON response.
function synthHtml(data: { title?: string; image?: string; description?: string }): string {
  const esc = (s: string) => s.replace(/"/g, '&quot;');
  const parts: string[] = ['<!DOCTYPE html><html><head>'];
  if (data.title) {
    parts.push(`<title>${esc(data.title)}</title>`);
    parts.push(`<meta property="og:title" content="${esc(data.title)}">`);
  }
  if (data.image) parts.push(`<meta property="og:image" content="${esc(data.image)}">`);
  if (data.description) parts.push(`<meta property="og:description" content="${esc(data.description)}">`);
  parts.push('</head><body></body></html>');
  return parts.join('');
}

async function fetchViaMicrolink(url: string): Promise<{ html: string } | null> {
  try {
    const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    if (json.status !== 'success' || !json.data) return null;

    const image =
      typeof json.data.image === 'string'
        ? json.data.image
        : json.data.image?.url || json.data.logo?.url || '';

    return {
      html: synthHtml({
        title: json.data.title || '',
        image: image || '',
        description: json.data.description || '',
      }),
    };
  } catch {
    return null;
  }
}

// True if the direct-fetched HTML actually has an og:image we can use.
// If not, we fall back to Microlink.
function hasOgImage(html: string): boolean {
  return /<meta\s+(?:property|name)=["']og:image["']\s+content=["'][^"']+["']/i.test(html);
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const url = event.queryStringParameters?.url;
  if (!url) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Missing url parameter' }),
    };
  }

  // First try: direct fetch with browser UA.
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (response.ok) {
      const html = await response.text();
      if (hasOgImage(html)) {
        return {
          statusCode: 200,
          headers: CORS,
          body: JSON.stringify({ html, fetchedUrl: url, source: 'direct' }),
        };
      }
      // Got HTML but no og:image (e.g. Amazon captcha wall) — try Microlink.
    }
    // Non-2xx (e.g. Etsy 403) — try Microlink.
  } catch {
    // Network error — try Microlink.
  }

  const fallback = await fetchViaMicrolink(url);
  if (fallback) {
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ...fallback, fetchedUrl: url, source: 'microlink' }),
    };
  }

  return {
    statusCode: 502,
    headers: CORS,
    body: JSON.stringify({ error: 'Could not extract metadata from URL' }),
  };
};

export { handler };
