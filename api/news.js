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
    return raw
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ');
  }

  function cleanSnippetText(desc, title, source) {
    if (!desc) {
      return `Warta resmi dan arahan pelaksanaan kegiatan pemagangan nasional MagangHub dari ${source || 'Media Nasional'}.`;
    }
    let clean = decodeHtml(desc)
      .replace(/<[^>]*>/g, ' ')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const titleClean = (title || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const snippetClean = clean.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const isJustTitle = snippetClean.includes(titleClean) && (snippetClean.length - titleClean.length < 40);

    if (isJustTitle || clean.length < 20 || clean.toLowerCase().includes('news.google.com')) {
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
      clean = clean.substring(0, 172) + '...';
    }
    return clean;
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

  function getFallbackImage(topic, source = '') {
    const s = (source || '').toLowerCase();
    if (s.includes('detik') || s.includes('radar')) return 'https://awsimages.detik.net.id/api/wm/2026/09/02/magang-kemnaker-2026-batch-2-1788346807178_169.png?wid=54&w=1200&v=1&t=jpeg';
    if (s.includes('kompas')) return 'https://asset.kompas.com/crops/xtQK1VlOuT2wgLdJgVqnuXUqcHM=/0x0:2880x1440/1200x675/filters:watermark(data/photo/2026/01/30/697c815e7ef28.png,0,-0,1)/data/photo/2026/06/29/6a422eea317b1.png';
    if (s.includes('cnbc') || s.includes('cnn')) return 'https://awsimages.detik.net.id/visual/2025/10/13/warga-membuka-aplikasi-magang-hub-di-jakarta-senin-13102025-1760345197423_169.jpeg?w=650&q=90';
    if (s.includes('antara') || s.includes('koran jakarta') || s.includes('kabarpublik') || s.includes('jurnal')) return 'https://img.antaranews.com/cache/1200x800/2026/09/16/target-vokasi-nasional-2026-2854548.jpg';
    if (s.includes('pajak')) return 'https://img.antaranews.com/cache/1200x800/2026/07/07/3292d4bd-5309-424c-b025-7feaafedb9a1.jpeg';

    const map = {
      pengumuman: 'https://awsimages.detik.net.id/api/wm/2026/09/02/magang-kemnaker-2026-batch-2-1788346807178_169.png?wid=54&w=1200&v=1&t=jpeg',
      regulasi: 'https://img.antaranews.com/cache/1200x800/2026/07/07/3292d4bd-5309-424c-b025-7feaafedb9a1.jpeg',
      sertifikasi: 'https://img.antaranews.com/cache/1200x800/2026/09/16/target-vokasi-nasional-2026-2854548.jpg',
      kemnaker: 'https://img.antaranews.com/cache/1200x800/2025/11/28/1000096979.jpg'
    };
    return map[topic] || 'https://awsimages.detik.net.id/api/wm/2026/09/02/magang-kemnaker-2026-batch-2-1788346807178_169.png?wid=54&w=1200&v=1&t=jpeg';
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
        // <source url="https://money.kompas.com"> → situs penerbit (untuk thumbnail asli)
        const sourceSiteMatch = block.match(/<source[^>]*url="([^"]+)"/i);
        const sourceSite = sourceSiteMatch ? sourceSiteMatch[1] : '';

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
        const topic = determineTopic(title);
        const snippet = cleanSnippetText(descRaw, title, source);
        // Thumbnail: pakai banner asli penerbit bila ada, else gambar topic
        const bannerMatch = block.match(/<media:content[^>]*url="([^"]+)"/i) || block.match(/<media:thumbnail[^>]*url="([^"]+)"/i);
        const image = bannerMatch ? bannerMatch[1] : getFallbackImage(topic, source);

        results.push({
          title,
          source,
          sourceClass: getSourceClass(source),
          pubDate: pubDate ? new Date(pubDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
          timestamp: ts,
          link: link || '#',
          sourceSite,
          snippet,
          topic,
          image
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
        const title = decodeHtml(item.title).replace(/<[^>]*>/g, '').trim();
        const key = getSlugKey(title);
        if (!key || titleSet.has(key)) continue;
        titleSet.add(key);

        const dateStr = item.created_at || item.published_at || '';
        const timestamp = dateStr ? new Date(dateStr.replace(' ', 'T')).getTime() : 0;
        const sectionName = item.section?.name || 'Binalavotas';
        const topic = determineTopic(title);
        const snippet = cleanSnippetText(item.body, title, `Kemnaker RI (${sectionName})`);
        const image = item.banner || item.thumb || getFallbackImage(topic, 'Kemnaker');

        results.push({
          title,
          source: `Kemnaker RI (${sectionName})`,
          sourceClass: 'source-kemnaker',
          pubDate: dateStr ? new Date(dateStr.replace(' ', 'T')).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
          timestamp,
          link: `https://kemnaker.go.id/news/detail/${item.slug}`,
          snippet,
          topic,
          image
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
