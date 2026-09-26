// Vercel Serverless Function: /api/news.js
// Scraper real-time Google News RSS (q=maganghub) + Portal Kemnaker RI
// Urutan mutlak: Berita paling baru selalu di paling atas dengan snippet bersih & thumbnail rapi.

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

  function decodeHtml(raw) {
    if (!raw) return '';
    return String(raw)
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#160;/g, ' ')
      .replace(/&#8211;/g, '–')
      .replace(/&#8212;/g, '—')
      .replace(/&hellip;/g, '...')
      .replace(/\+/g, ' ');
  }

  function cleanSnippetText(desc, title, source) {
    if (!desc) {
      return `Warta resmi pelaksanaan program pemagangan nasional MagangHub dari ${source || 'Media Nasional'}.`;
    }
    let clean = decodeHtml(desc)
      .replace(/<[^>]*>/g, ' ')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (source) {
      const srcClean = source.replace(/[^a-zA-Z0-9]/g, '');
      if (srcClean.length > 2) {
        clean = clean.replace(new RegExp(`\\s*[-|–|•]?\\s*${srcClean}.*$`, 'i'), '').trim();
      }
    }

    const titleClean = (title || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const snippetClean = clean.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const isJustTitle = snippetClean.includes(titleClean) && (snippetClean.length - titleClean.length < 35);

    if (isJustTitle || clean.length < 15 || clean.toLowerCase().includes('news.google.com')) {
      const t = (title || '').toLowerCase();
      if (t.includes('dimulai besok') || t.includes('21 september')) {
        return `Peserta Program MagangHub Batch 2 Angkatan II diingatkan untuk mempersiapkan berkas administrasi dan hadir di kantor penempatan mitra sesuai jadwal.`;
      }
      if (t.includes('seleksi') || t.includes('pengumuman')) {
        return `Pengumuman kelulusan dan tahapan seleksi pemagangan nasional MagangHub yang dirilis resmi oleh ${source || 'Kemnaker RI'}.`;
      }
      if (t.includes('pajak') || t.includes('uang saku')) {
        return `Ketentuan regulasi hak uang saku serta fasilitas pembebasan pajak bagi peserta Program MagangHub.`;
      }
      return `Warta resmi dan arahan pelaksanaan kegiatan pemagangan nasional MagangHub dari ${source || 'Media Nasional'}.`;
    }

    if (clean.length > 175) {
      clean = clean.substring(0, 172).trim() + '...';
    }
    return clean;
  }

  const crypto = require('crypto');
  function getSlugKey(title) {
    const slug = (title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return crypto.createHash('md5').update(slug).digest('hex');
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

  // 1 & 2. Fetch parallel — Google News RSS + Kemnaker Portal
  const sharedCtrl = new AbortController();
  const sharedTimer = setTimeout(() => sharedCtrl.abort(), 8000);

  const [kemnakerResult, gnewsResult] = await Promise.allSettled([
    // --- Kemnaker Portal (Resmi, bawa banner asli) ---
    fetch('https://portal.kemnaker.go.id/api/v1/news?search=magang&limit=15', {
      signal: sharedCtrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }),
    // --- Google News RSS (Aggregator Media) ---
    fetch('https://news.google.com/rss/search?q=maganghub&hl=id&gl=ID&ceid=ID:id', {
      signal: sharedCtrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; mghb-news/1.0)' }
    })
  ]);

  clearTimeout(sharedTimer);

  // --- 1. Parse Kemnaker Portal DULU (Prioritas: foto asli & link resmi Kemnaker) ---
  if (kemnakerResult.status === 'fulfilled' && kemnakerResult.value.ok) {
    try {
      const json = await kemnakerResult.value.json();
      const items = json.data || [];
      for (const item of items) {
        const title = decodeHtml(item.title).replace(/<[^>]*>/g, '').trim();
        const key = getSlugKey(title);
        if (!key || titleSet.has(key)) continue;
        titleSet.add(key);

        const dateStr = item.created_at || item.published_at || '';
        // Safari/iOS compliant parsing WIB
        const timestamp = dateStr ? new Date(dateStr.replace(' ', 'T') + '+07:00').getTime() : 0;
        const sectionName = item.section?.name || 'Binalavotas';
        const topic = determineTopic(title);
        const snippet = cleanSnippetText(item.body, title, `Kemnaker RI (${sectionName})`);
        const realBanner = item.banner || item.thumb || null;

        results.push({
          title,
          source: `Kemnaker RI (${sectionName})`,
          sourceClass: 'source-kemnaker',
          pubDate: timestamp ? new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }) : '',
          timestamp,
          link: item.url || `https://kemnaker.go.id/news/detail/${item.slug}`,
          sourceSite: 'https://kemnaker.go.id',
          snippet,
          topic,
          image: realBanner,
          hasRealImage: Boolean(realBanner)
        });
      }
    } catch (err) {
      console.warn('Kemnaker news API parse failed:', err.message);
    }
  } else {
    console.warn('Kemnaker news fetch failed:', kemnakerResult.reason?.message || kemnakerResult.value?.status);
  }

  // --- 2. Parse Google News RSS (Tanpa atribuasi gambar palsu) ---
  if (gnewsResult.status === 'fulfilled' && gnewsResult.value.ok) {
    try {
      const xml = await gnewsResult.value.text();
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
        const sourceSiteMatch = block.match(/<source[^>]*url="([^"]+)"/i);
        const sourceSite = sourceSiteMatch ? sourceSiteMatch[1] : '';

        let title = decodeHtml(titleRaw);
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
        const topic = determineTopic(title);
        const snippet = cleanSnippetText(descRaw, title, source);

        // Ekstrak gambar asli bila tersedia di XML enclosure / description
        const mediaMatch = block.match(/<(?:media:content|media:thumbnail|enclosure)[^>]*url="([^"]+)"/i);
        const descImgMatch = descRaw.match(/<img[^>]+src=["']([^"']+)["']/i);
        const realImg = mediaMatch ? mediaMatch[1] : (descImgMatch ? descImgMatch[1] : null);

        results.push({
          title,
          source,
          sourceClass: getSourceClass(source),
          pubDate: ts ? (() => { const d = new Date(ts); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }); })() : '',
          timestamp: ts,
          link: link || '#',
          sourceSite,
          snippet,
          topic,
          image: realImg || null,
          hasRealImage: Boolean(realImg)
        });
      }
    } catch (err) {
      console.warn('Google News RSS parse failed:', err.message);
    }
  } else {
    console.warn('Google News RSS fetch failed:', gnewsResult.reason?.message || gnewsResult.value?.status);
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

