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
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IDEAS Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: `Failed to fetch: ${response.status}` }),
      };
    }

    const html = await response.text();
    const baseUrl = new URL(url);

    // Find all internal links
    const linkRegex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>/gi;
    const links = new Set<string>();
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1];
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
      if (href.startsWith('//')) href = baseUrl.protocol + href;
      else if (href.startsWith('/')) href = baseUrl.origin + href;
      else if (!href.startsWith('http')) href = baseUrl.origin + '/' + href;

      // Only include links from the same domain
      try {
        const linkUrl = new URL(href);
        if (linkUrl.hostname === baseUrl.hostname) {
          links.add(linkUrl.href);
        }
      } catch {
        // Skip invalid URLs
      }
    }

    // Fetch each sub-page (limit to 20 to avoid abuse)
    const subPages: Array<{ url: string; html: string }> = [];
    const pagesToFetch = Array.from(links).slice(0, 20);

    await Promise.all(
      pagesToFetch.map(async (pageUrl) => {
        try {
          const pageResponse = await fetch(pageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; IDEAS Bot/1.0)',
              'Accept': 'text/html,*/*',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(5000),
          });
          if (pageResponse.ok) {
            const pageHtml = await pageResponse.text();
            subPages.push({ url: pageUrl, html: pageHtml });
          }
        } catch {
          // Skip failed pages
        }
      })
    );

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
