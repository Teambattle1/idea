import type { Handler } from '@netlify/functions';

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
    // Fetch the main page
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,da;q=0.8,no;q=0.7',
      'Cache-Control': 'no-cache',
    };

    // Try fetching with timeout, retry once on failure
    let response: Response;
    try {
      response = await fetch(url, {
        headers: fetchHeaders,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
    } catch (fetchErr: any) {
      // Retry once
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

    const html = await response.text();
    const baseUrl = new URL(url);

    // Find all internal links - be thorough: look in nav, main, product listings etc.
    const linkRegex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>/gi;
    const links = new Set<string>();
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1];
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
      if (href.startsWith('//')) href = baseUrl.protocol + href;
      else if (href.startsWith('/')) href = baseUrl.origin + href;
      else if (!href.startsWith('http')) href = baseUrl.origin + '/' + href;

      try {
        const linkUrl = new URL(href);
        if (linkUrl.hostname === baseUrl.hostname) {
          // Skip common non-content pages
          const path = linkUrl.pathname.toLowerCase();
          if (path.match(/\/(cart|checkout|login|register|account|wp-admin|feed|xmlrpc|wp-json)\b/)) continue;
          if (path.match(/\.(css|js|xml|json|png|jpg|gif|svg|ico|woff|ttf)$/)) continue;
          links.add(linkUrl.href);
        }
      } catch {
        // Skip invalid URLs
      }
    }

    // Fetch each sub-page (limit to 50 for better coverage)
    const subPages: Array<{ url: string; html: string }> = [];
    const pagesToFetch = Array.from(links).slice(0, 50);

    // Fetch in batches of 10 for speed
    for (let i = 0; i < pagesToFetch.length; i += 10) {
      const batch = pagesToFetch.slice(i, i + 10);
      const results = await Promise.allSettled(
        batch.map(async (pageUrl) => {
          const pageResponse = await fetch(pageUrl, {
            headers: fetchHeaders,
            redirect: 'follow',
            signal: AbortSignal.timeout(8000),
          });
          if (pageResponse.ok) {
            const pageHtml = await pageResponse.text();
            return { url: pageUrl, html: pageHtml };
          }
          return null;
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          subPages.push(r.value);
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        mainPage: { url, html },
        subPages,
        totalLinks: links.size,
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
