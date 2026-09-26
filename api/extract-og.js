// Vercel Serverless Function: /api/extract-og.js
// SECURITY: SSRF-safe fetch — redirect:manual + per-hop IP validation, max 3 hops
// CORS: restricted to same origin (mghb.tepegrafi.id)

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://mghb.tepegrafi.id';

// Private/loopback ranges yang diblokir
const BLOCKED_IP_RE = /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1$|fc00:|fe80:)/;
const BLOCKED_HOST_RE = /^(localhost|.*\.local|.*\.internal|.*\.vercel\.internal|metadata\.google\.internal)$/i;

async function safeFetch(url, hopCount = 0) {
  if (hopCount > 3) throw new Error('Too many redirects');

  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Malformed URL'); }

  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Protocol not allowed');

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOST_RE.test(host)) throw new Error('Blocked host');
  if (BLOCKED_IP_RE.test(host)) throw new Error('Blocked IP range');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const resp = await fetch(url, {
    signal: controller.signal,
    redirect: 'manual',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; mghb-og-fetcher/1.0)',
      'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en;q=0.7'
    }
  });

  clearTimeout(timeoutId);

  // Ikuti redirect dengan re-validasi setiap hop
  if ([301, 302, 303, 307, 308].includes(resp.status)) {
    const location = resp.headers.get('Location');
    if (!location) throw new Error('Redirect without Location header');
    const nextUrl = new URL(location, url).href;
    return safeFetch(nextUrl, hopCount + 1);
  }

  return resp;
}

module.exports = async (req, res) => {
  // CORS: same-origin only
  const origin = req.headers['origin'] || '';
  if (origin === ALLOWED_ORIGIN || origin === '') {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  } else {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  }
  // Hapus Allow-Credentials — tidak diperlukan untuk OG fetch
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    res.status(400).json({ error: 'Missing or invalid url parameter' });
    return;
  }

  // Validasi awal URL
  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      res.status(400).json({ error: 'Invalid URL protocol' });
      return;
    }
    const host = parsed.hostname.toLowerCase();
    if (BLOCKED_HOST_RE.test(host) || BLOCKED_IP_RE.test(host)) {
      res.status(400).json({ error: 'URL not allowed' });
      return;
    }
  } catch {
    res.status(400).json({ error: 'Malformed URL' });
    return;
  }

  try {
    const response = await safeFetch(targetUrl);

    if (!response.ok) {
      // Jangan echo status detail upstream ke client
      res.status(502).json({ error: 'Upstream tidak merespons' });
      return;
    }

    const html = await response.text();

    // Extract og:image or twitter:image
    const ogImage = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
                 || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i)?.[1]
                 || html.match(/<meta[^>]+(?:property|name)=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
                 || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']twitter:image["']/i)?.[1]
                 || html.match(/<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/i)?.[1];

    // Extract title
    const ogTitle = html.match(/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
                 || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];

    // Extract site name
    const siteName = html.match(/<meta[^>]+(?:property|name)=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)?.[1];

    // Extract description
    const ogDesc = html.match(/<meta[^>]+(?:property|name)=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
                || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:description["']/i)?.[1]
                || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1];

    // Normalize image URL to absolute URL (validasi ulang host)
    let finalImageUrl = null;
    if (ogImage) {
      try {
        const absImg = new URL(ogImage, targetUrl).href;
        const imgHost = new URL(absImg).hostname.toLowerCase();
        // Blokir jika og:image mengarah ke host internal
        if (!BLOCKED_HOST_RE.test(imgHost) && !BLOCKED_IP_RE.test(imgHost)) {
          finalImageUrl = absImg;
        }
      } catch {
        // Abaikan og:image yang tidak valid
      }
    }

    // Cache at edge for 1 day
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');

    // SECURITY: Jangan echo finalUrl (host internal oracle)
    res.status(200).json({
      success: true,
      image: finalImageUrl,
      title: ogTitle ? ogTitle.trim().substring(0, 300) : null,
      description: ogDesc ? ogDesc.trim().substring(0, 500) : null,
      siteName: siteName ? siteName.trim().substring(0, 100) : null
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Request timeout' });
    } else if (err.message === 'Too many redirects' || err.message === 'Blocked host' || err.message === 'Blocked IP range') {
      res.status(400).json({ error: 'URL not allowed' });
    } else {
      // Jangan echo err.message ke client
      res.status(500).json({ error: 'Gagal mengambil metadata halaman' });
    }
  }
};
