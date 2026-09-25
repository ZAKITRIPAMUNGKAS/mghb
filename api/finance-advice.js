// Vercel Serverless: POST /api/finance-advice
// Menganalisis ringkasan keuangan Jakarta (uang saku, pengeluaran, breakdown
// per kategori, tagihan bulanan tetap, sisa hari) → nasehat singkat + actionable.
// Kunci Geraikita di server (env). Jika kosong/timeout, kembalikan heuristik lokal.

function heuAdvice({ income, totalSpent, remaining, percentSpent, safeDailyLimit, daysLeft, breakdown, fixedMonthly, variableBudget }) {
  const safe = Math.max(safeDailyLimit, 0);
  const lines = [];
  if (remaining < 0) {
    lines.push(`Defisit Rp ${Math.abs(remaining).toLocaleString('id-ID')}. Kurangi kategori terbesar dan tunda pengeluaran non-esensial hingga gajian berikutnya.`);
  } else if (percentSpent >= 90) {
    lines.push(`Sangat waspada (sudah ${percentSpent}% terpakai). Sisihkan sisa untuk makan pokok + transport, tunda kopi/hangout.`);
  } else if (percentSpent >= 70) {
    lines.push(`Mulai ketat — batasi makan di luar & ojol. Batas aman harian Rp ${safe.toLocaleString('id-ID')}.`);
  } else {
    lines.push(`Kondisi sehat (${percentSpent}% terpakai). Batas aman Rp ${safe.toLocaleString('id-ID')}/hari untuk ${daysLeft} hari ke depan.`);
  }
  if (fixedMonthly > 0) {
    const share = Math.round((fixedMonthly / Math.max(income, 1)) * 100);
    lines.push(`Tagihan tetap Rp ${fixedMonthly.toLocaleString('id-ID')} (${share}% pemasukan) — prioritas bayar di awal bulan.`);
  }
  const top = Object.entries(breakdown).sort((a,b)=>b[1]-a[1])[0];
  if (top && top[1] > income * 0.35) {
    lines.push(`Kategori dominan "${top[0]}" Rp ${top[1].toLocaleString('id-ID')} — cek apakah bisa dipangkas 10-20% bulan depan.`);
  }
  if (variableBudget > 0 && safe < variableBudget * 0.3) {
    lines.push('Anggaran harian menipis — manfaatkan JakLingko gratis & kantin basement untuk tekan biaya.');
  }
  const hacks = [
    'Bawa tumbler & isi ulang di pantry Menara BNI.',
    'Naik KRL Palmerah + JakLingko (Rp 0) dibanding ojol harian.',
    'Pisahkan 20% uang saku ke Wondr/tabungan di awal bulan.'
  ];
  lines.push('Kiat cepat: ' + hacks.join(' '));
  return lines.join(' ');
}

const SYSTEM = 'Kamu penasehat finansial ringkas untuk anak magang rantau di Jakarta (Menara BNI Pejompongan). Jawab Bahasa Indonesia santai-profesional, maksimal 4 kalimat pendek, actionable & spesifik. Jangan tulis angka yang tidak ada di input. Jangan pakai markdown header.';

function buildPrompt(payload) {
  const { income, totalSpent, remaining, percentSpent, safeDailyLimit, daysLeft, breakdown, fixedMonthly, variableBudget } = payload;
  const cat = Object.entries(breakdown).filter(([,v])=>v>0).map(([k,v])=>`${k}: Rp ${v.toLocaleString('id-ID')}`).join(', ') || '(belum ada pengeluaran)';
  return `Konteks keuangan bulanan (Rp, WIB):\n- Pemasukan: ${income.toLocaleString('id-ID')}\n- Pengeluaran: ${totalSpent.toLocaleString('id-ID')} (${percentSpent}%)\n- Sisa: ${remaining.toLocaleString('id-ID')}\n- Sisa hari: ${daysLeft}\n- Batas aman/hari: ${safeDailyLimit.toLocaleString('id-ID')}\n- Tagihan tetap/bulan: ${fixedMonthly.toLocaleString('id-ID')} ; anggaran variabel: ${variableBudget.toLocaleString('id-ID')}\n- Breakdown kategori: ${cat}\n\nTugas: beri penilaian singkat (aman/waspada/defisit), sebut sisa hari & batas aman, soroti kategori terbesar bila dominan, dan 1-2 langkah hemat paling relevan dengan lokasi Menara BNI/Benhil. Jawab 2-4 kalimat ringkas tanpa list/bullet.`;
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

  const income = Math.max(0, parseInt(body.income, 10) || 0);
  const totalSpent = Math.max(0, parseInt(body.totalSpent, 10) || 0);
  const remaining = parseInt(body.remaining, 10) || (income - totalSpent);
  const percentSpent = Math.min(100, Math.max(0, parseInt(body.percentSpent, 10) || (income ? Math.round(totalSpent / income * 100) : 0)));
  const safeDailyLimit = Math.max(0, parseInt(body.safeDailyLimit, 10) || 0);
  const daysLeft = Math.max(1, parseInt(body.daysLeft, 10) || 1);
  const breakdown = (body.breakdown && typeof body.breakdown === 'object') ? body.breakdown : {};
  const fixedMonthly = Math.max(0, parseInt(body.fixedMonthly, 10) || 0);
  const variableBudget = Math.max(0, parseInt(body.variableBudget, 10) || 0);

  const heuristic = heuAdvice({ income, totalSpent, remaining, percentSpent, safeDailyLimit, daysLeft, breakdown, fixedMonthly, variableBudget });

  const apiKey = (process.env.GERAIKITA_API_KEY || process.env.MGHB_TOKEN || '').trim();
  const baseUrl = (process.env.GERAIKITA_BASE_URL || 'https://ai.geraikita.com/v1').replace(/\/+$/, '');
  const model = (process.env.FINANCE_MODEL || process.env.LOGBOOK_MODEL || 'claude-sonnet-5-thinking').trim();

  if (!apiKey) {
    res.status(200).json({ mode: 'heuristic', advice: heuristic, model: null });
    return;
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: buildPrompt({ income, totalSpent, remaining, percentSpent, safeDailyLimit, daysLeft, breakdown, fixedMonthly, variableBudget }) }],
        temperature: 0.35,
        max_tokens: 380
      }),
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!resp.ok) {
      const txt = await resp.text().catch(() => resp.statusText);
      res.status(200).json({ mode: 'heuristic', advice: heuristic, warning: `Geraikita ${resp.status}: ${String(txt).slice(0,180)}`, model });
      return;
    }
    const data = await resp.json();
    const content = (data.choices?.[0]?.message?.content ?? '').trim();
    if (!content) {
      res.status(200).json({ mode: 'heuristic', advice: heuristic, model });
      return;
    }
    const clean = content.replace(/^```[\w]*\n?/, '').replace(/\n?```\s*$/, '').trim();
    res.status(200).json({ mode: 'ai', advice: clean, heuristic, model });
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Timeout' : (err.message || String(err));
    res.status(200).json({ mode: 'heuristic', advice: heuristic, warning: msg, model: null });
  }
};

module.exports.__heuAdvice = heuAdvice;
module.exports.__buildPrompt = buildPrompt;
