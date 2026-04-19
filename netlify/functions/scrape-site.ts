import type { Handler } from '@netlify/functions';

// Scrape ONLY the page the caller asked for. No sub-page discovery.
// Keeps us well inside Netlify's 10 s sync timeout and 6 MB response cap.

function stripHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/\s+style=["'][^"']*["']/gi, '')
    .replace(/\s+on[a-z]+=["'][^"']*["']/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { url } = JSON.parse(event.body || '{}');

  if (!url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing url parameter' }),
    };
  }

  try {
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,da;q=0.8,no;q=0.7',
      'Cache-Control': 'no-cache',
    };

    let response: Response;
    try {
      response = await fetch(url, {
        headers: fetchHeaders,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
    } catch (fetchErr: any) {
      try {
        response = await fetch(url, {
          headers: fetchHeaders,
          redirect: 'follow',
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({ error: `Could not connect to site: ${fetchErr.message}` }),
        };
      }
    }

    if (!response!.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: `Site returned HTTP ${response!.status}` }),
      };
    }

    const rawHtml = await response.text();
    const html = stripHtml(rawHtml);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        mainPage: { url, html },
        subPages: [],
        totalLinks: 0,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Scrape failed' }),
    };
  }
};

export { handler };
