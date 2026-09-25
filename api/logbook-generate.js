// Vercel Serverless Function: POST /api/logbook-generate
// Penerima catatan cepat harian/rapat (format: "[waktu] kegiatan" per baris)
// Mengembalikan 3 bagian logbook formal Kemnaker via Geraikita (OpenAI-compatible)
// Tanpa biaya tambahan di sisi klien; kunci API disimpan di server (env GERAIKITA_API_KEY).
// Sabtu/Minggu di-skip (libur) — sesuai kebijakan program.
// Jika env kunci kosong atau API gagal, fallback template lokal (tanpa AI) tetap dikembalikan.

const SYSTEM_PROMPT =
  'Kamu asisten penulisan logbook magang formal Divisi SSE BNI (MagangHub Kemnaker). ' +
  'Bahasa Indonesia formal, sudut pandang orang pertama ("Saya"). ' +
  'Ubah catatan mentah per baris "[waktu] kegiatan" menjadi 3 bagian narasi mengalir ' +
  '(paragraf panjang, bukan bullet), kaitkan konteks divisi/mentor/proyek bila ada. ' +
  'Jika catatan tidak menyebut kendala, tulis "Tidak terdapat kendala yang signifikan..." ' +
  'dengan nuansa wajar dan rencanakan tindak lanjut standar.';

function promptFor(isoDate, catatanRaw) {
  const d = new Date(isoDate + 'T00:00:00+07:00');
  const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getUTCDay() ? d.getDay() : 6];
  // Fallback hari via weekday manual agar stabil di server UTC
  const wd = new Date(isoDate).getUTCDay(); // 0 Sun
  const hariId = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][wd];
  const tgl = isoDate.split('-').reverse().join('/');
  return `Tanggal: ${isoDate} (${hariId}, ${tgl})\nCatatan mentah (waktu, kegiatan):\n---\n${catatanRaw}\n---\n` +
    'Tugas: Rangkai logbook kronologis. Output TEPAT 3 bagian dengan format:\n\n' +
    'Uraian Aktivitas\n[paragraf panjang 3-5 kalimat, alur waktu, sebut mentor/divisi/proyek bila ada]\n\n' +
    'Pembelajaran yang Diperoleh\n[paragraf 2-4 kalimat organik, insight tiap kegiatan]\n\n' +
    'Kendala yang Dialami\n[paragraf; kalau tak ada kendala, tulis tidak ada kendala signifikan + proses berjalan baik; kalau ada (izin/sakit/keterlambatan data), sebut jujur + penyesuaian]\n\n' +
    'Aturan: tanpa bullet/numbering, tanpa markdown header, hanya 3 judul di atas. Tanpa placeholder (<...>, [isi...]). Bahasa Indonesia formal rapi.';
}

function isWeekend(isoDate) {
  const wd = new Date(isoDate + 'T12:00:00Z').getUTCDay();
  return wd === 0 || wd === 6;
}

function stripBOM(s) {
  return (s || '').replace(/^\uFEFF/, '');
}

function fallback(catatanRaw) {
  const lines = stripBOM(catatanRaw).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const uraian = lines.length
    ? 'Pada hari ini kegiatan diawali dengan ' + lines.join('; selanjutnya ') + '.'
    : 'Tidak ada catatan kegiatan yang tersedia untuk hari ini.';
  return {
    activity: uraian,
    learning: 'Mendapatkan pengalaman terkait pelaksanaan kegiatan dan kolaborasi tim selama menjalankan tugas hari ini.',
    obstacle: 'Tidak terdapat kendala yang signifikan selama pelaksanaan kegiatan. Proses berjalan dengan baik sesuai rencana.'
  };
}

function splitSections(raw) {
  // Model kadang balut output dengan ``` — buang
  let text = stripBOM(raw).trim().replace(/^```[\w]*\n?/, '').replace(/\n?```\s*$/, '').trim();
  const titles = ['Uraian Aktivitas','Pembelajaran yang Diperoleh','Kendala yang Dialami'];
  const titlesRe = titles.map(t => new RegExp('^\\s*(?:\\d+\\.\\s*)?' + t.replace(/\s+/g,'\\s+') + '\\s*$', 'mi'));
  const hits = titlesRe.map((re, i) => {
    const m = re.exec(text);
    return m ? { i, index: m.index, len: m[0].length } : null;
  });
  if (hits.some(h => !h)) {
    const parts = text.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      return { activity: parts[0].replace(/^[^a-zA-Z0-9]*/,''), learning: parts[1].replace(/^[^a-zA-Z0-9]*/,''), obstacle: parts[2].replace(/^[^a-zA-Z0-9]*/,''), raw: text };
    }
    return null;
  }
  hits.sort((a, b) => a.index - b.index);
  const spans = [];
  for (let k = 0; k < hits.length; k++) {
    const start = hits[k].index + hits[k].len;
    const end = k + 1 < hits.length ? hits[k+1].index : text.length;
    let seg = text.slice(start, end).trim().replace(/^[:.\-\s]+/, '').trim();
    spans[hits[k].i] = seg;
  }
  if (!spans[0] || !spans[1] || !spans[2]) return null;
  return { activity: spans[0], learning: spans[1], obstacle: spans[2], raw: text };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  const catatanRaw = stripBOM((body.catatan ?? body.rough ?? body.notes ?? '') + '').trim();
  const isoDate = (body.date ?? body.tanggal ?? new Date().toISOString().slice(0,10) + '').trim().slice(0,10);
  const obstacleInput = stripBOM((body.obstacle ?? '') + '').trim();
  const category = (body.category ?? '') + '';

  // Guard libur
  if (isWeekend(isoDate)) {
    res.status(200).json({
      mode: 'skip',
      date: isoDate,
      message: 'Sabtu/Minggu libur — generate di-skip.',
      activity: '',
      learning: '',
      obstacle: ''
    });
    return;
  }

  if (!catatanRaw || catatanRaw.length < 3) {
    res.status(400).json({ error: 'Catatan harian masih kosong. Isi dulu poin [waktu] kegiatan.' });
    return;
  }

  // Sisipkan kendala eksplisit bila diisi di form (opsional)
  const catatanEff = obstacleInput ? (catatanRaw + '\nKendala lapangan: ' + obstacleInput) : catatanRaw;
  const fb = fallback(catatanEff);

  const apiKey = stripBOM((process.env.GERAIKITA_API_KEY || process.env.MGHB_TOKEN || '') + '').trim();
  const baseUrl = (process.env.GERAIKITA_BASE_URL || 'https://ai.geraikita.com/v1').replace(/\/+$/, '');
  const model = (process.env.LOGBOOK_MODEL || 'claude-sonnet-5-thinking').trim();

  if (!apiKey) {
    // Tanpa AI: kembalikan fallback (offline-safe)
    res.status(200).json({
      mode: 'fallback',
      date: isoDate,
      category,
      model: null,
      warning: 'GERAIKITA_API_KEY belum diset di server — hasil fallback lokal (tanpa AI).',
      activity: fb.activity,
      learning: fb.learning,
      obstacle: fb.obstacle
    });
    return;
  }

  try {
    const payload = {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: promptFor(isoDate, catatanEff) }
      ],
      temperature: 0.3,
      max_tokens: 1400
    };
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 45000);
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!resp.ok) {
      const txt = await resp.text().catch(() => resp.statusText);
      console.warn('Geraikita logbook error', resp.status, txt.slice(0,400));
      res.status(200).json({
        mode: 'fallback',
        date: isoDate,
        category,
        model,
        warning: `Geraikita ${resp.status}: ${String(txt).slice(0,200)} — fallback dipakai.`,
        activity: fb.activity,
        learning: fb.learning,
        obstacle: fb.obstacle
      });
      return;
    }
    const data = await resp.json();
    const content = (data.choices?.[0]?.message?.content ?? '').trim();
    if (!content || content.length < 30) {
      res.status(200).json({
        mode: 'fallback',
        date: isoDate,
        category,
        model,
        warning: 'Respons AI kosong — fallback dipakai.',
        activity: fb.activity,
        learning: fb.learning,
        obstacle: fb.obstacle
      });
      return;
    }
    const parts = splitSections(content);
    if (!parts) {
      // AI menjawab tapi format tidak terpola — kembalikan apa adanya di activity
      res.status(200).json({
        mode: 'ai_raw',
        date: isoDate,
        category,
        model,
        activity: content,
        learning: fb.learning,
        obstacle: fb.obstacle,
        raw: content
      });
      return;
    }
    res.status(200).json({
      mode: 'ai',
      date: isoDate,
      category,
      model,
      activity: parts.activity,
      learning: parts.learning,
      obstacle: parts.obstacle,
      raw: parts.raw
    });
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Timeout Geraikita' : (err.message || String(err));
    console.warn('logbook-generate crash', msg);
    res.status(200).json({
      mode: 'fallback',
      date: isoDate,
      category,
      model,
      warning: msg + ' — fallback dipakai.',
      activity: fb.activity,
      learning: fb.learning,
      obstacle: fb.obstacle
    });
  }
};
module.exports.__promptFor = promptFor;
module.exports.__fallback = fallback;
module.exports.__splitSections = splitSections;
module.exports.__isWeekend = isWeekend;
