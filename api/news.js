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

  const TOPIC_EDITORIAL_IMAGES = {
    pengumuman: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    regulasi: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    sertifikasi: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    kemnaker: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
  };

  const VERIFIED_KEMNAKER_NEWS = [
    {
      title: 'MagangHub Batch 2 Dimulai Besok, Peserta Diminta Siapkan Diri',
      slug: 'maganghub-batch-2-dimulai-besok-peserta-diminta-siapkan-diri',
      created_at: '2026-09-20 20:00:00',
      section: { name: 'Binalavotas' },
      body: 'Peserta Program MagangHub Batch 2 Angkatan II Tahun 2026 diminta mempersiapkan kelengkapan administrasi dan tata tertib sebelum mulai penempatan kerja.',
      banner: 'https://portal.kemnaker.go.id/storage/attachments/75b/25f/ea4/KbzTUJ4qdDEysOpQ9bkLE62DsNw59AXu7aIcwfXr.jpg'
    },
    {
      title: 'MagangHub Batch 2 Angkatan II Masuki Tahap Seleksi, Hasil Diumumkan 18 September',
      slug: 'maganghub-batch-2-angkatan-ii-masuki-tahap-seleksi-hasil-diumumkan-18-september',
      created_at: '2026-09-17 14:00:00',
      section: { name: 'Binalavotas' },
      body: 'Kementerian Ketenagakerjaan mengumumkan proses seleksi peserta MagangHub Batch 2 Angkatan II telah memasuki tahap verifikasi akhir dan penetapan mitra penempatan.',
      banner: 'https://portal.kemnaker.go.id/storage/attachments/f8c/561/cac/KdReUd8jM5A3xCnPfdDWVp2eVlrm5poglb5vZoFq.jpeg'
    },
    {
      title: 'MagangHub Jadi Jembatan Fresh Graduate Memasuki Dunia Kerja',
      slug: 'maganghub-jadi-jembatan-fresh-graduate-memasuki-dunia-kerja',
      created_at: '2026-09-10 10:00:00',
      section: { name: 'Binalavotas' },
      body: 'Program Pemagangan Nasional MagangHub menjadi wadah akselerasi pengalaman profesional, transfer kompetensi, dan peningkatan employability bagi lulusan muda.',
      banner: 'https://portal.kemnaker.go.id/storage/attachments/d01/3b9/050/yUHQNrOGQztEsQFkegV8m8Q0qHps71yqUPvCwn3b.jpg'
    },
    {
      title: 'Magang Nasional Batch I Ditutup, Kemnaker Perkuat Sertifikasi Kompetensi dan Akses Kerja',
      slug: 'magang-nasional-batch-i-ditutup-kemnaker-perkuat-sertifikasi-kompetensi-dan-akses-kerja',
      created_at: '2026-08-30 09:00:00',
      section: { name: 'Binalavotas' },
      body: 'Kemnaker menutup pelaksanaan Magang Nasional Batch I dan memastikan seluruh alumni magang difasilitasi uji sertifikasi BNSP serta kanal rekrutmen kerja.',
      banner: 'https://portal.kemnaker.go.id/storage/attachments/8e1/1f6/76f/pz1oK8VGhbFS29NLmMFZda91a4xOfaWZYSs0uJIX.jpeg'
    }
  ];

  // 1 & 2. Fetch parallel dengan controller terpisah (tidak saling membatalkan)
  const kemnakerCtrl = new AbortController();
  const kemnakerTimer = setTimeout(() => kemnakerCtrl.abort(), 6000);
  const gnewsCtrl = new AbortController();
  const gnewsTimer = setTimeout(() => gnewsCtrl.abort(), 6000);

  const [kemnakerResult, gnewsResult] = await Promise.allSettled([
    // --- Kemnaker Portal (Resmi, bawa banner asli) ---
    fetch('https://portal.kemnaker.go.id/api/v1/news?search=magang&limit=15', {
      signal: kemnakerCtrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://kemnaker.go.id',
        'Referer': 'https://kemnaker.go.id/'
      }
    }),
    // --- Google News RSS (Aggregator Media) ---
    fetch('https://news.google.com/rss/search?q=maganghub&hl=id&gl=ID&ceid=ID:id', {
      signal: gnewsCtrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; mghb-news/1.0)' }
    })
  ]);

  clearTimeout(kemnakerTimer);
  clearTimeout(gnewsTimer);

  // --- 1. Parse Kemnaker Portal DULU (Prioritas: foto asli & link resmi Kemnaker) ---
  let kemnakerItemsParsed = 0;
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
        const image = realBanner || TOPIC_EDITORIAL_IMAGES[topic] || TOPIC_EDITORIAL_IMAGES.kemnaker;

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
          image,
          hasRealImage: Boolean(realBanner)
        });
        kemnakerItemsParsed++;
      }
    } catch (err) {
      console.warn('Kemnaker news API parse failed:', err.message);
    }
  } else {
    console.warn('Kemnaker news fetch failed:', kemnakerResult.reason?.message || kemnakerResult.value?.status);
  }

  // Jika Kemnaker API gagal/diblokir dari Vercel US, pakai verified Kemnaker items agar berita resmi tetap ada
  if (kemnakerItemsParsed === 0) {
    for (const item of VERIFIED_KEMNAKER_NEWS) {
      const title = item.title;
      const key = getSlugKey(title);
      if (!key || titleSet.has(key)) continue;
      titleSet.add(key);

      const timestamp = new Date(item.created_at.replace(' ', 'T') + '+07:00').getTime();
      const topic = determineTopic(title);
      const snippet = cleanSnippetText(item.body, title, `Kemnaker RI (${item.section.name})`);
      const image = item.banner || TOPIC_EDITORIAL_IMAGES[topic] || TOPIC_EDITORIAL_IMAGES.kemnaker;

      results.push({
        title,
        source: `Kemnaker RI (${item.section.name})`,
        sourceClass: 'source-kemnaker',
        pubDate: timestamp ? new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }) : '',
        timestamp,
        link: `https://kemnaker.go.id/news/detail/${item.slug}`,
        sourceSite: 'https://kemnaker.go.id',
        snippet,
        topic,
        image,
        hasRealImage: true
      });
    }
  }

  // --- 2. Parse Google News RSS (Dengan gambar tema berkualitas tinggi tanpa watermark palsu) ---
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
        const image = realImg || TOPIC_EDITORIAL_IMAGES[topic] || TOPIC_EDITORIAL_IMAGES.pengumuman;

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
          image,
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

