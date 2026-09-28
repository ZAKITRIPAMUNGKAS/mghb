// Vercel Serverless: POST /api/finance-advice
// Menganalisis ringkasan keuangan Jakarta (uang saku, pengeluaran, breakdown
// per kategori, tagihan bulanan tetap, sisa hari) → nasehat singkat + actionable.
// Kunci Geraikita di server (env). Jika kosong/timeout, kembalikan heuristik lokal.

function heuAdvice({ income, totalSpent, remaining, percentSpent, safeDailyLimit, daysLeft, breakdown, fixedMonthly, variableBudget, promptType }) {
  const safe = Math.max(safeDailyLimit, 0);
  const lines = [];

  if (promptType === 'saving') {
    lines.push(`Strategi hemat untuk sisa ${daysLeft} hari: manfaatkan fasilitas gratis Menara BNI (refill tumbler di pantry SSE hemat ±Rp150rb/bln, sarapan/makan siang kantin basement harga karyawan Rp15rb-20rb).`);
    lines.push(`Gunakan Mikrotrans JakLingko (JAK-08/14) tarif Rp0 dari Palmerah/Benhil dibanding ojol harian.`);
    lines.push(`Dengan batas aman Rp ${safe.toLocaleString('id-ID')}/hari, kamu berpotensi menyisihkan cadangan tambahan di rekening Wondr BNI.`);
    return lines.join(' ');
  }

  if (promptType === 'leakage') {
    const top = Object.entries(breakdown).sort((a,b)=>b[1]-a[1])[0];
    const topName = top ? top[0] : 'harian';
    const topAmt = top ? top[1] : 0;
    lines.push(`Audit kebocoran: Kategori terbesar saat ini adalah "${topName}" sebesar Rp ${topAmt.toLocaleString('id-ID')} (${totalSpent > 0 ? Math.round((topAmt/totalSpent)*100) : 0}% belanja).`);
    lines.push(`Waspadai "latte factor" seperti jajan kopi sore (Rp18rb-25rb) atau pesanan ojol jarak pendek yang terakumulasi cepat.`);
    lines.push(`Rekomendasi: batasi jajan kopi maksimal 1-2x per minggu untuk mengamankan sisa anggaran Rp ${Math.max(0, remaining).toLocaleString('id-ID')}.`);
    return lines.join(' ');
  }

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

function heuReport({ income, totalSpent, remaining, percentSpent, safeDailyLimit, daysLeft, breakdown, fixedMonthly, paidBills, unpaidBills, healthScore, goals }) {
  const safe = Math.max(safeDailyLimit, 0);
  const topEntries = Object.entries(breakdown).sort((a,b)=>b[1]-a[1]);
  const topCat = topEntries[0] ? `${topEntries[0][0]} (Rp ${topEntries[0][1].toLocaleString('id-ID')})` : 'Belum ada';
  const scoreNum = healthScore && healthScore.total != null ? healthScore.total : 75;
  const grade = scoreNum >= 85 ? 'A (Sangat Sehat)' : scoreNum >= 70 ? 'B (Baik & Stabil)' : scoreNum >= 55 ? 'C (Cukup / Waspada)' : 'D (Perlu Penyesuaian)';

  return `1. DIAGNOSIS KESEHATAN KEUANGAN
Kondisi finansial bulan ini berada pada kategori Grade ${grade} dengan skor ${scoreNum}/100. Dari total pemasukan Rp ${income.toLocaleString('id-ID')}, belanja terpakai sebesar Rp ${totalSpent.toLocaleString('id-ID')} (${percentSpent}%). Sisa likuiditas bersih tercatat Rp ${remaining.toLocaleString('id-ID')} dengan batas belanja aman harian sebesar Rp ${safe.toLocaleString('id-ID')}/hari untuk sisa ${daysLeft} hari ke depan.

2. IDENTIFIKASI KEBOCORAN & ANOMALI
Pos pengeluaran terbesar jatuh pada kategori ${topCat}. Tagihan tetap tercatat Rp ${fixedMonthly.toLocaleString('id-ID')} (Lunas: Rp ${(paidBills||0).toLocaleString('id-ID')}, Tertunda: Rp ${(unpaidBills||0).toLocaleString('id-ID')}). Perhatikan pengeluaran impulsif pada pos jajan luar kantor dan transportasi fleksibel yang berpotensi menggerus jatah harian.

3. STRATEGI SURVIVAL & PENGHEMATAN MENARA BNI
- Manfaatkan makan siang di Kantin Karyawan Basement Menara BNI (Rp15rb-20rb) daripada memesan makanan online.
- Maksimalkan rute hemat Mikrotrans JakLingko (JAK-08 / JAK-14) dengan tarif Rp 0 cukup tap kartu uang elektronik.
- Bawa tumbler sendiri dan manfaatkan dispenser air mineral di pantry lantai divisi SSE untuk memangkas biaya air minum.

4. TARGET & ROADMAP BULAN DEPAN
- Prioritaskan pelunasan tagihan tetap di minggu pertama gajian.
- Amankan alokasi tabungan (20%) langsung ke rekening Wondr sebelum dana terpakai untuk belanja harian.
- Pertahankan disiplin jatah belanja harian di bawah Rp ${safe.toLocaleString('id-ID')} agar terhindar dari defisit akhir bulan.`;
}

const SYSTEM = 'Kamu penasehat finansial ringkas untuk anak magang rantau di Jakarta (Menara BNI Pejompongan). Jawab Bahasa Indonesia santai-profesional, maksimal 4 kalimat pendek, actionable & spesifik. Jangan tulis angka yang tidak ada di input. Jangan pakai markdown header.';

const SYSTEM_REPORT = 'Kamu adalah konsultan perencana keuangan pribadi untuk mahasiswa pemagangan/anak rantau di Jakarta (PT Bank Negara Indonesia / Menara BNI Pejompongan). Berikan evaluasi keuangan bulanan yang tajam, empatik, konstruktif, dan sangat terstruktur dalam Bahasa Indonesia formal-santai. Format jawabanmu terdiri dari 4 bagian jelas tanpa markdown header (#): \n\n1. DIAGNOSIS KESEHATAN KEUANGAN\n2. IDENTIFIKASI KEBOCORAN & ANOMALI\n3. STRATEGI SURVIVAL & PENGHEMATAN MENARA BNI\n4. TARGET & ROADMAP BULAN DEPAN';

function buildPrompt(payload) {
  const { income, totalSpent, remaining, percentSpent, safeDailyLimit, daysLeft, breakdown, fixedMonthly, variableBudget, promptType } = payload;
  const cat = Object.entries(breakdown).filter(([,v])=>v>0).map(([k,v])=>`${k}: Rp ${v.toLocaleString('id-ID')}`).join(', ') || '(belum ada pengeluaran)';
  
  if (promptType === 'saving') {
    return `Konteks keuangan rantau (Rp, WIB):\n- Pemasukan: ${income.toLocaleString('id-ID')}\n- Pengeluaran: ${totalSpent.toLocaleString('id-ID')} (${percentSpent}%)\n- Sisa: ${remaining.toLocaleString('id-ID')}\n- Sisa hari: ${daysLeft}\n- Batas aman/hari: ${safeDailyLimit.toLocaleString('id-ID')}\n- Tagihan: ${fixedMonthly.toLocaleString('id-ID')}\n- Kategori belanja: ${cat}\n\nTugas: berikan 3 kiat penghematan konkret paling berdampak untuk anak rantau di area Menara BNI / Benhil agar bisa menambah porsi tabungan. Jawab 3-4 kalimat ringkas tanpa bullet.`;
  }

  if (promptType === 'leakage') {
    return `Konteks keuangan rantau (Rp, WIB):\n- Pemasukan: ${income.toLocaleString('id-ID')}\n- Pengeluaran: ${totalSpent.toLocaleString('id-ID')} (${percentSpent}%)\n- Sisa: ${remaining.toLocaleString('id-ID')}\n- Kategori belanja: ${cat}\n\nTugas: audit pos pengeluaran di atas, tunjukkan di mana letak potensi kebocoran dana (latte factor, jajan, ojol, dll) dan cara menambalnya. Jawab 3-4 kalimat ringkas tanpa bullet.`;
  }

  return `Konteks keuangan bulanan (Rp, WIB):\n- Pemasukan: ${income.toLocaleString('id-ID')}\n- Pengeluaran: ${totalSpent.toLocaleString('id-ID')} (${percentSpent}%)\n- Sisa: ${remaining.toLocaleString('id-ID')}\n- Sisa hari: ${daysLeft}\n- Batas aman/hari: ${safeDailyLimit.toLocaleString('id-ID')}\n- Tagihan tetap/bulan: ${fixedMonthly.toLocaleString('id-ID')} ; anggaran variabel: ${variableBudget.toLocaleString('id-ID')}\n- Breakdown kategori: ${cat}\n\nTugas: beri penilaian singkat (aman/waspada/defisit), sebut sisa hari & batas aman, soroti kategori terbesar bila dominan, dan 1-2 langkah hemat paling relevan dengan lokasi Menara BNI/Benhil. Jawab 2-4 kalimat ringkas tanpa list/bullet.`;
}

function buildReportPrompt(payload) {
  const { income, totalSpent, remaining, percentSpent, safeDailyLimit, daysLeft, breakdown, fixedMonthly, paidBills, unpaidBills, healthScore, goals } = payload;
  const cat = Object.entries(breakdown).filter(([,v])=>v>0).map(([k,v])=>`${k}: Rp ${v.toLocaleString('id-ID')}`).join(', ') || '(belum ada pengeluaran)';
  const scoreInfo = healthScore ? `Skor: ${healthScore.total}/100 (Tabungan: ${healthScore.savingsScore}, Harian: ${healthScore.dailyScore}, Tagihan: ${healthScore.billScore}, Amplop: ${healthScore.envelopeScore})` : 'Belum terhitung';
  const goalsInfo = Array.isArray(goals) && goals.length > 0 ? goals.map(g => `${g.name}: ${g.saved}/${g.target}`).join('; ') : 'Belum ada tujuan aktif';

  return `DATA REKAP KEUANGAN ANAK RANTAU MAGANG BNI (Menara BNI Pejompongan):
- Pemasukan Uang Saku: Rp ${income.toLocaleString('id-ID')}
- Total Belanja Aktual: Rp ${totalSpent.toLocaleString('id-ID')} (${percentSpent}%)
- Sisa Anggaran Bersih: Rp ${remaining.toLocaleString('id-ID')}
- Batas Aman Belanja Harian: Rp ${safeDailyLimit.toLocaleString('id-ID')} / hari (sisa ${daysLeft} hari)
- Tagihan Tetap: Total Rp ${fixedMonthly.toLocaleString('id-ID')} (Lunas: Rp ${(paidBills||0).toLocaleString('id-ID')}, Belum: Rp ${(unpaidBills||0).toLocaleString('id-ID')})
- Rincian Pengeluaran: ${cat}
- Evaluasi Skor Kesehatan: ${scoreInfo}
- Status Tujuan Tabungan: ${goalsInfo}

Buatlah laporan evaluasi finansial bulanan profesional, tajam, dan realistis untuk anak rantau dengan format persis 4 bagian:
1. DIAGNOSIS KESEHATAN KEUANGAN
2. IDENTIFIKASI KEBOCORAN & ANOMALI
3. STRATEGI SURVIVAL & PENGHEMATAN MENARA BNI
4. TARGET & ROADMAP BULAN DEPAN`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://mghb.tepegrafi.id');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  const isReport = body.mode === 'report';
  const promptType = body.promptType || 'quick';
  const income = Math.max(0, parseInt(body.income, 10) || 0);
  const totalSpent = Math.max(0, parseInt(body.totalSpent, 10) || 0);
  const remaining = parseInt(body.remaining, 10) || (income - totalSpent);
  const percentSpent = Math.min(100, Math.max(0, parseInt(body.percentSpent, 10) || (income ? Math.round(totalSpent / income * 100) : 0)));
  const safeDailyLimit = Math.max(0, parseInt(body.safeDailyLimit, 10) || 0);
  const daysLeft = Math.max(1, parseInt(body.daysLeft, 10) || 1);
  const fixedMonthly = Math.max(0, parseInt(body.fixedMonthly, 10) || 0);
  const variableBudget = Math.max(0, parseInt(body.variableBudget, 10) || 0);
  const paidBills = Math.max(0, parseInt(body.paidBills, 10) || 0);
  const unpaidBills = Math.max(0, parseInt(body.unpaidBills, 10) || 0);
  const healthScore = body.healthScore && typeof body.healthScore === 'object' ? body.healthScore : null;
  const goals = Array.isArray(body.goals) ? body.goals : [];

  // SECURITY: Sanitasi breakdown — cap 50 keys, coerce semua value ke number, tolak array
  const rawBreakdown = body.breakdown;
  let breakdown = {};
  if (rawBreakdown && typeof rawBreakdown === 'object' && !Array.isArray(rawBreakdown)) {
    breakdown = Object.fromEntries(
      Object.entries(rawBreakdown)
        .slice(0, 50)
        .map(([k, v]) => [String(k).substring(0, 50), Math.max(0, Number(v) || 0)])
        .filter(([, v]) => isFinite(v))
    );
  }

  const apiKey = (process.env.GERAIKITA_API_KEY || process.env.MGHB_TOKEN || '').trim();
  const baseUrl = (process.env.GERAIKITA_BASE_URL || 'https://ai.geraikita.com/v1').replace(/\/+$/, '');
  const model = (process.env.FINANCE_MODEL || process.env.LOGBOOK_MODEL || 'claude-sonnet-5-thinking').trim();

  // heuAdvice dipanggil di dalam try-catch untuk menghindari uncaught TypeError
  let heuristic = '';
  try {
    heuristic = isReport
      ? heuReport({ income, totalSpent, remaining, percentSpent, safeDailyLimit, daysLeft, breakdown, fixedMonthly, paidBills, unpaidBills, healthScore, goals })
      : heuAdvice({ income, totalSpent, remaining, percentSpent, safeDailyLimit, daysLeft, breakdown, fixedMonthly, variableBudget, promptType });
  } catch (heuErr) {
    console.error('[finance-advice] heu error:', heuErr);
    heuristic = 'Kelola pengeluaran sesuai anggaran harian dan prioritaskan kebutuhan pokok.';
  }

  if (!apiKey) {
    // SECURITY: Jangan bedakan pesan berdasarkan keberadaan key (oracle)
    res.status(200).json({ mode: 'heuristic', advice: heuristic, model: null });
    return;
  }

  try {
    const sysPrompt = isReport ? SYSTEM_REPORT : SYSTEM;
    const userPrompt = isReport
      ? buildReportPrompt({ income, totalSpent, remaining, percentSpent, safeDailyLimit, daysLeft, breakdown, fixedMonthly, paidBills, unpaidBills, healthScore, goals })
      : buildPrompt({ income, totalSpent, remaining, percentSpent, safeDailyLimit, daysLeft, breakdown, fixedMonthly, variableBudget, promptType });
    const maxTokens = isReport ? 1000 : 380;
    const temp = isReport ? 0.4 : 0.35;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
        temperature: temp,
        max_tokens: maxTokens
      }),
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!resp.ok) {
      const txt = await resp.text().catch(() => resp.statusText);
      console.error('[finance-advice] upstream error', resp.status, String(txt).slice(0, 400));
      res.status(200).json({ mode: 'heuristic', advice: heuristic, model });
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
module.exports.__heuReport = heuReport;
module.exports.__buildPrompt = buildPrompt;
module.exports.__buildReportPrompt = buildReportPrompt;
