// Vercel Serverless Function: /api/news.js
// Scraper real-time Google News RSS (q=maganghub) + Portal Kemnaker RI
// Urutan mutlak: Berita paling baru selalu di paling atas.

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

  function determineTopic(title) {
    const t = (title || '').toLowerCase();
    if (t.includes('pengumuman') || t.includes('batch') || t.includes('hasil') || t.includes('jadwal') || t.includes('seleksi')) return 'pengumuman';
    if (t.includes('sertifikasi') || t.includes('bnsp') || t.includes('kompetensi')) return 'sertifikasi';
    if (t.includes('uang saku') || t.includes('hak') || t.includes('aturan') || t.includes('sop') || t.includes('presensi') || t.includes('pajak')) return 'regulasi';
    if (t.includes('bni') || t.includes('bumn') || t.includes('kemnaker')) return 'kemnaker';
    return 'pengumuman';
  }

  function getSourceClass(sourceName) {
    const s = (sourceName || '').toLowerCase();
    if (s.includes('kemnaker') || s.includes('rri')) return 'source-kemnaker';
    if (s.includes('antara')) return 'source-antara';
    if (s.includes('kompas')) return 'source-kompas';
    if (s.includes('detik')) return 'source-detik';
    if (s.includes('cnbc') || s.includes('cnn') || s.includes('pajak')) return 'source-antara';
    return 'source-detik';
  }

  // 1. Scrape Google News RSS (query: maganghub)
  try {
    const rssUrl = 'https://news.google.com/rss/search?q=maganghub&hl=id&gl=ID&ceid=ID:id';
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 6000);
    const resp = await fetch(rssUrl, {
      signal: c.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    clearTimeout(t);

    if (resp.ok) {
      const xml = await resp.text();
      const regex = /<item>([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = regex.exec(xml)) !== null) {
        const block = match[1];
        const getTag = (tag) => {
          const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
          if (!m) return '';
          return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
        };

        const titleRaw = getTag('title');
        const link = getTag('link');
        const pubDate = getTag('pubDate');
        const sourceRaw = getTag('source');
        const descRaw = getTag('description');

        let title = titleRaw;
        let source = sourceRaw || 'Warta Magang';
        if (title.includes(' - ')) {
          const parts = title.split(' - ');
          source = parts.pop().trim();
          title = parts.join(' - ').trim();
        }

        const key = getSlugKey(title);
        if (!key || titleSet.has(key)) continue;
        titleSet.add(key);

        const ts = pubDate ? new Date(pubDate).getTime() : 0;
        let cleanSnippet = cleanHtml(descRaw);
        if (cleanSnippet.length > 180) {
          cleanSnippet = cleanSnippet.substring(0, 177) + '...';
        }

        results.push({
          title,
          source,
          sourceClass: getSourceClass(source),
          pubDate: pubDate ? new Date(pubDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
          timestamp: ts,
          link: link || '#',
          snippet: cleanSnippet || `Informasi pemagangan nasional dari ${source}.`,
          topic: determineTopic(title),
          image: ''
        });
      }
    }
  } catch (err) {
    console.warn('Google News RSS direct fetch failed:', err.message);
  }

  // 2. Fetch official Kemnaker Portal News API
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
          title,
          source: `Kemnaker RI (${sectionName})`,
          sourceClass: 'source-kemnaker',
          pubDate: dateStr ? new Date(dateStr.replace(' ', 'T')).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
          timestamp,
          link: `https://kemnaker.go.id/news/detail/${item.slug}`,
          snippet: bodyText ? (bodyText.slice(0, 175) + '...') : 'Warta resmi program pemagangan dari Kemnaker RI.',
          topic: determineTopic(title),
          image: item.banner || item.thumb || ''
        });
      }
    }
  } catch (err) {
    console.warn('Kemnaker news API failed:', err.message);
  }

  // Sort strictly descending: yang paling baru selalu di paling atas
  results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  res.status(200).json({
    status: 'ok',
    total: results.length,
    timestamp: Date.now(),
    items: results
  });
};
