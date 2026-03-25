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

  const { text, from, to } = JSON.parse(event.body || '{}');

  if (!text || !from || !to) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing text, from, or to parameter' }),
    };
  }

  try {
    // Split text into chunks if too long (MyMemory limit is ~500 chars per request)
    const chunks = splitText(text, 450);
    const translated: string[] = [];

    for (const chunk of chunks) {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${from}|${to}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        translated.push(data.responseData.translatedText);
      } else {
        translated.push(chunk); // fallback to original
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ translatedText: translated.join(' ') }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Translation failed' }),
    };
  }
};

function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Find last sentence break within limit
    let splitAt = remaining.lastIndexOf('. ', maxLen);
    if (splitAt === -1 || splitAt < maxLen / 2) {
      splitAt = remaining.lastIndexOf(' ', maxLen);
    }
    if (splitAt === -1) splitAt = maxLen;

    chunks.push(remaining.substring(0, splitAt + 1).trim());
    remaining = remaining.substring(splitAt + 1).trim();
  }

  return chunks;
}

export { handler };
