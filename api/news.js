// Vercel Serverless Function: /api/news.js
// Agregasi berita MagangHub & Kemnaker real-time dengan sorting terbaru di atas.

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const results = [];
  const titleSet = new Set();

  function cleanHtml(raw) {
    if (!raw) return '';
    return raw.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function getSlugKey(title) {
    return (title || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 35);
  }

  // 1. Fetch official Kemnaker Portal News API
  try {
    const kemnakerUrl = 'https://portal.kemnaker.go.id/api/v1/news?search=magang&limit=15';
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 5000);
    const resp = await fetch(kemnakerUrl, {
      signal: c.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    clearTimeout(t);
    if (resp.ok) {
      const json = await resp.json();
      const items = json.data || [];
      for (const item of items) {
        const title = cleanHtml(item.title);
        const key = getSlugKey(title);
        if (!key || titleSet.has(key)) continue;
        titleSet.add(key);

        const dateStr = item.created_at || item.published_at || '';
        const timestamp = dateStr ? new Date(dateStr.replace(' ', 'T')).getTime() : 0;
        const sectionName = item.section?.name || 'Binalavotas';
        const bodyText = cleanHtml(item.body);

        results.push({
          title: title,
          source: `Kemnaker RI (${sectionName})`,
          sourceClass: 'source-kemnaker',
          pubDate: dateStr.slice(0, 10),
          timestamp: timestamp,
          link: `https://kemnaker.go.id/news/detail/${item.slug}`,
          snippet: bodyText ? (bodyText.slice(0, 175) + '...') : 'Warta resmi program pemagangan dari Kemnaker RI.',
          topic: 'pengumuman',
          image: item.banner || item.thumb || ''
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Kemnaker news API:', err.message);
  }

  // 2. Fetch Google RSS via rss2json
  try {
    const rssUrl = 'https://news.google.com/rss/search?q=MagangHub+Kemnaker+2026&hl=id&gl=ID&ceid=ID:id';
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 6000);
    const resp = await fetch(apiUrl, { signal: c.signal });
    clearTimeout(t);
    if (resp.ok) {
      const json = await resp.json();
      if (json.status === 'ok' && Array.isArray(json.items)) {
        for (const item of json.items) {
          let title = item.title || '';
          let source = 'Warta Magang';
          if (title.includes(' - ')) {
            const parts = title.split(' - ');
            source = parts.pop().trim();
            title = parts.join(' - ').trim();
          }

          const key = getSlugKey(title);
          if (!key || titleSet.has(key)) continue;
          titleSet.add(key);

          const ts = item.pubDate ? new Date(item.pubDate).getTime() : 0;
          let cleanSnippet = cleanHtml(item.description);
          if (cleanSnippet.length > 180) {
            cleanSnippet = cleanSnippet.substring(0, 177) + '...';
          }

          results.push({
            title: title,
            source: source,
            sourceClass: 'source-detik',
            pubDate: item.pubDate ? item.pubDate.slice(0, 10) : '',
            timestamp: ts,
            link: item.link || '#',
            snippet: cleanSnippet || `Informasi pemagangan dari ${source}`,
            topic: 'pengumuman',
            image: item.thumbnail || ''
          });
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch RSS news:', err.message);
  }

  // Sort strictly descending: yang paling baru di atas!
  results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  res.status(200).json({
    status: 'ok',
    total: results.length,
    timestamp: Date.now(),
    items: results
  });
};
