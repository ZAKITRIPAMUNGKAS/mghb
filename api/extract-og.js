// Vercel Serverless Function: /api/extract-og.js
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    res.status(400).json({ error: 'Missing or invalid url parameter' });
    return;
  }

  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      res.status(400).json({ error: 'Invalid URL protocol' });
      return;
    }
  } catch {
    res.status(400).json({ error: 'Malformed URL' });
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      res.status(502).json({ error: `Upstream HTTP ${response.status}` });
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

    // Normalize image URL to absolute URL if needed
    let finalImageUrl = null;
    if (ogImage) {
      try {
        finalImageUrl = new URL(ogImage, response.url).href;
      } catch {
        finalImageUrl = ogImage;
      }
    }

    // Cache at edge for 1 day
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');

    res.status(200).json({
      success: true,
      url: targetUrl,
      finalUrl: response.url,
      image: finalImageUrl,
      title: ogTitle ? ogTitle.trim() : null,
      description: ogDesc ? ogDesc.trim() : null,
      siteName: siteName || null
    });
  } catch (err) {
    res.status(500).json({
      error: err.name === 'AbortError' ? 'Upstream request timeout' : err.message
    });
  }
};
