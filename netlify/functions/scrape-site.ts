import type { Handler } from '@netlify/functions';

// Netlify synchronous functions cap response bodies at 6 MB. Modern pages with
// inlined scripts/trackers can easily push 50 sub-pages past that limit, which
// surfaces as a 502 back to the client. We strip everything the downstream
// extractor doesn't need before returning.
const MAX_RESPONSE_BYTES = 5_000_000; // headroom under Netlify's 6 MB cap
const MAX_SUBPAGES = 30;

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

    const rawHtml = await response.text();
    const html = stripHtml(rawHtml);
    const baseUrl = new URL(url);
    let accumulatedBytes = html.length;

    // Find all internal links - be thorough: look in nav, main, product listings etc.
    // Run against raw HTML so link discovery isn't affected by the strip pass.
    const linkRegex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>/gi;
    const links = new Set<string>();
    let match;

    while ((match = linkRegex.exec(rawHtml)) !== null) {
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

    // Fetch each sub-page, capped so we don't exceed Netlify's 6 MB response limit.
    const subPages: Array<{ url: string; html: string }> = [];
    const pagesToFetch = Array.from(links).slice(0, MAX_SUBPAGES);
    let budgetExceeded = false;

    // Fetch in batches of 10 for speed
    for (let i = 0; i < pagesToFetch.length && !budgetExceeded; i += 10) {
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
            return { url: pageUrl, html: stripHtml(pageHtml) };
          }
          return null;
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          accumulatedBytes += r.value.html.length + r.value.url.length;
          if (accumulatedBytes > MAX_RESPONSE_BYTES) {
            budgetExceeded = true;
            break;
          }
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
