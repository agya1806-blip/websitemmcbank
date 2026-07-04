// ==================== AI CHAT ASSISTANT ====================

const CHAT_DB = 'mughis_chat_history';

function loadChatHistory() { return loadData(CHAT_DB); }
function saveChatHistory(data) { saveData(CHAT_DB, data); }

function getChatDateLabel(msgDate) {
    const today = new Date();
    const d = new Date(msgDate);
    if (d.toDateString() === today.toDateString()) return 'Hari ini';
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    const history = loadChatHistory();
    if (!history.length) {
        container.innerHTML = `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:40px 20px;text-align:center">
                <div style="font-size:48px;opacity:0.3">smart_toy</div>
                <div style="font-size:16px;font-weight:600;color:var(--text-secondary)">AI Asisten Bisnis</div>
                <div style="font-size:13px;color:var(--text-tertiary);line-height:1.6;max-width:280px">
                    Ketik perintah dalam bahasa sehari-hari.<br>
                    Contoh:<br>
                    "catat pemasukan 50rb dari jualan pulsa"<br>
                    "buat pesanan print 2 buku 50rb untuk Budi"<br>
                    "total saldo saya berapa?"
                </div>
            </div>`;
        return;
    }
    let lastDate = '';
    container.innerHTML = history.map(msg => {
        const msgDate = new Date(msg.time);
        const dateLabel = getChatDateLabel(msg.time);
        const showDate = dateLabel !== lastDate;
        lastDate = dateLabel;
        const timeStr = msgDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return (showDate ? `<div style="text-align:center;font-size:11px;color:var(--text-tertiary);padding:8px 0 4px;font-weight:600">${dateLabel}</div>` : '') +
            `<div class="chat-bubble ${msg.role}">
                ${msg.text}
                ${msg.action ? `<div class="bubble-action ${msg.action.type}">${msg.action.label}</div>` : ''}
                <div class="chat-time">${timeStr}</div>
            </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

function addChatMessage(role, text, action) {
    const history = loadChatHistory();
    history.push({ role, text, time: Date.now(), action: action || null });
    saveChatHistory(history);
    renderChatMessages();
}

function showTyping() {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-typing';
    div.id = 'chatTyping';
    div.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('chatTyping');
    if (el) el.remove();
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    if (!CONFIG.GEMINI_API_KEY) {
        alert('⚠️ API Key Gemini belum diisi!\nIsi di Settings → API AI.');
        return;
    }

    input.value = '';
    input.style.height = 'auto';

    addChatMessage('user', text);
    showTyping();

    const results = await processWithAI(text);
    hideTyping();

    if (results && results.length > 0) {
        results.forEach(r => {
            if (r) addChatMessage('ai', r.message, r.action || null);
        });
    } else {
        addChatMessage('ai', 'Maaf, terjadi kesalahan. Coba periksa API Key atau tulis ulang perintah.');
    }
    renderChatMessages();
}

async function processWithAI(userText) {
    const today = new Date().toISOString().split('T')[0];
    const walletNames = loadData(DB.wallets).map(w => w.name).join(', ') || 'SeaBank, BSI, DANA, ShopeePay, Kas Tunai';
    const productNames = loadData(DB.products).map(p => `${p.name} (Rp${p.price})`).join(', ') || '-';
    const customerNames = loadData(DB.customers).map(c => c.name).join(', ') || '-';
    const categories = 'Pemasukan: Penjualan, Jasa, Pendapatan Lain | Pengeluaran: Pembelian, Operasional, Gaji, Pengeluaran Lain';

    const systemPrompt = `Kamu adalah asisten AI untuk aplikasi manajemen bisnis "MUGHIS BANK".
Tugasmu: membaca perintah user dalam bahasa Indonesia, lalu mengembalikan ARRAY OF JSON (bisa 1 atau lebih) valid (tanpa markdown) dengan format:

[
  {
    "action": "transaction" | "pesan" | "customer" | "product" | "debt" | "receivable" | "query" | "unknown",
    "data": { ... field sesuai action ... },
    "message": "Pesan konfirmasi dalam bahasa Indonesia yang ramah"
  }
]

PENTING: Jika user memberikan perintah majemuk (misal "catat pemasukan dan buat pesanan"), kembalikan ARRAY dengan 2 objek atau lebih.
Jika hanya 1 perintah, kembalikan array dengan 1 objek.

Aturan untuk setiap action:

1. **transaction** (pemasukan/pengeluaran):
   data: { type: "income"|"expense", amount: number, category: string (dari: ${categories}), description: string, date: "${today}", wallet: string (dari: ${walletNames}) }

2. **pesan** (pesanan baru):
   data: { customerName: string, phone: string (optional), type: "print"|"laptop"|"handphone"|"tiktok"|"umum", items: [{name: string, qty: number, price: number}], total: number, dp: number (0 jika belum), status: "Belum Dibayar"|"DP"|"Lunas", wallet: string }

3. **customer** (tambah pelanggan):
   data: { name: string, phone: string (optional) }

4. **product** (tambah produk):
   data: { name: string, price: number }

5. **debt** (hutang):
   data: { name: string, amount: number, phone: string (optional), description: string (optional) }

6. **receivable** (piutang):
   data: { name: string, amount: number, phone: string (optional), description: string (optional) }

7. **query** (pertanyaan/informasi):
   data: {} — message akan berisi jawaban sesuai data yang ada.
   Untuk cek saldo, hitung total balance semua dompet.
   Untuk jumlah pesanan, hitung dari data pesanan aktif.

8. **unknown**: jika perintah tidak jelas.

PENTING:
- Jumlah uang selalu dalam RUPIAH (bukan pecahan, tanpa koma).
- Jika user menyebut "DP", set status "DP" dan dp sesuai jumlah.
- Jika tidak disebut DP, status "Belum Dibayar", dp: 0.
- wallet: pilih dari opsi yang ada. Jika tidak disebut, pakai "Kas Tunai".
- Kembalikan hanya JSON array, tanpa markdown atau teks lain.

User: "${userText}"`;

    try {
        const res = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: { temperature: 0.2 }
            })
        });
        if (!res.ok) {
            let errMsg = '';
            try { const err = await res.json(); errMsg = err?.error?.message || ''; } catch {}
            if (res.status === 429) return [{ message: '⚠️ Kuota AI habis atau key tidak valid. Coba periksa key di Settings.' }];
            if (res.status === 403) return [{ message: '❌ API Key tidak valid. Pastikan key sudah benar di Settings.' }];
            return [{ message: 'Error AI (' + res.status + '): ' + errMsg + '\nCek API Key di Settings.' }];
        }
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!raw) return [{ message: 'AI tidak merespon. Coba lagi.' }];

        let parsed;
        try {
            parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) parsed = [parsed];
        } catch {
            const match = raw.match(/\[[\s\S]*\]/);
            if (match) {
                try { parsed = JSON.parse(match[0]); if (!Array.isArray(parsed)) parsed = [parsed]; } catch { parsed = null; }
            } else {
                const single = raw.match(/\{[\s\S]*\}/);
                if (single) { try { const p = JSON.parse(single[0]); parsed = [p]; } catch { parsed = null; } }
                else parsed = null;
            }
        }
        if (!parsed || !Array.isArray(parsed) || parsed.length === 0 || !parsed[0].action) return [{ message: 'Maaf, saya tidak paham maksudnya. Coba tulis ulang dengan lebih jelas.' }];

        return parsed.map(item => executeAction(item.action, item.data, item.message));
    } catch (err) {
        return [{ message: 'Koneksi error: ' + err.message }];
    }
}

function executeAction(action, data, message) {
    try {
        switch (action) {
            case 'transaction':
                return executeTransaction(data, message);
            case 'pesan':
                return executePesan(data, message);
            case 'customer':
                return executeCustomer(data, message);
            case 'product':
                return executeProduct(data, message);
            case 'debt':
                return executeDebt(data, message);
            case 'receivable':
                return executeReceivable(data, message);
            case 'query':
                return executeQuery(data, message);
            default:
                return { message: message || 'Maaf, saya tidak bisa memproses perintah itu.' };
        }
    } catch (err) {
        return { message: 'Error saat menyimpan: ' + err.message };
    }
}

function executeTransaction(data, msg) {
    const wallets = loadData(DB.wallets);
    const wallet = wallets.find(w => w.name.toLowerCase() === (data.wallet || '').toLowerCase()) || wallets[0];
    if (!wallet) return { message: 'Tidak ada dompet tersedia. Buat dompet dulu.' };

    const transactions = loadData(DB.transactions);
    transactions.push({
        id: generateId(), type: data.type, amount: data.amount,
        category: data.category || (data.type === 'income' ? 'Penjualan' : 'Pengeluaran Lain'),
        description: data.description || '',
        date: data.date || new Date().toISOString().split('T')[0],
        wallet: wallet.name, walletId: wallet.id, createdAt: Date.now()
    });
    saveData(DB.transactions, transactions);

    wallet.balance += data.type === 'income' ? data.amount : -data.amount;
    saveData(DB.wallets, wallets);

    recalculateAll(); renderAll();
    const label = data.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    return { message: `✅ ${label} Rp${formatRupiah(data.amount)} berhasil dicatat${data.description ? ' (' + data.description + ')' : ''} ke ${wallet.name}.`, action: { type: 'success', label: 'Tersimpan' } };
}

function executePesan(data, msg) {
    const allPesanan = getPesanData();
    const wallet = loadData(DB.wallets).find(w => w.name.toLowerCase() === (data.wallet || '').toLowerCase());
    const pesan = {
        id: generateId(),
        date: new Date().toISOString(),
        customerId: '', customerName: data.customerName || '',
        customerPhone: data.phone || '', customerAddress: '',
        type: data.type || 'umum',
        items: data.items || [{ name: 'Item', qty: 1, price: data.total || 0 }],
        total: data.total || (data.items || []).reduce((s, i) => s + i.qty * i.price, 0),
        dp: data.dp || 0, dpAmount: data.dp || 0, modalKeluar: 0,
        remaining: (data.total || 0) - (data.dp || 0),
        status: data.status || 'Belum Dibayar',
        walletId: wallet?.id || '', note: '',
        specs: { type: data.type || 'umum' }
    };
    allPesanan.push(pesan);
    savePesanData(allPesanan);
    recalculateAll(); renderAll();
    return { message: `✅ Pesanan ${data.type || 'umum'} atas nama ${data.customerName || '-'} berhasil dibuat sebesar Rp${formatRupiah(data.total || 0)}.`, action: { type: 'success', label: 'Tersimpan' } };
}

function executeCustomer(data, msg) {
    const customers = loadData(DB.customers);
    customers.push({ id: generateId(), name: data.name, phone: data.phone || '', address: '', note: '', createdAt: Date.now() });
    saveData(DB.customers, customers);
    recalculateAll(); renderAll();
    return { message: `✅ Pelanggan "${data.name}" berhasil ditambahkan.`, action: { type: 'success', label: 'Tersimpan' } };
}

function executeProduct(data, msg) {
    const products = loadData(DB.products);
    products.push({ id: generateId(), name: data.name, price: data.price, stock: 0, category: '', createdAt: Date.now() });
    saveData(DB.products, products);
    recalculateAll(); renderAll();
    return { message: `✅ Produk "${data.name}" (Rp${formatRupiah(data.price)}) berhasil ditambahkan.`, action: { type: 'success', label: 'Tersimpan' } };
}

function executeDebt(data, msg) {
    const debts = loadData(DB.debts);
    debts.push({
        id: generateId(), name: data.name, amount: data.amount,
        phone: data.phone || '', description: data.description || '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'Belum Dibayar', createdAt: Date.now()
    });
    saveData(DB.debts, debts);
    recalculateAll(); renderAll();
    return { message: `✅ Hutang Rp${formatRupiah(data.amount)} ke "${data.name}" berhasil dicatat.`, action: { type: 'success', label: 'Tersimpan' } };
}

function executeReceivable(data, msg) {
    const receivables = loadData(DB.receivables);
    receivables.push({
        id: generateId(), name: data.name, amount: data.amount,
        phone: data.phone || '', description: data.description || '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'Belum Dibayar', createdAt: Date.now()
    });
    saveData(DB.receivables, receivables);
    recalculateAll(); renderAll();
    return { message: `✅ Piutang Rp${formatRupiah(data.amount)} dari "${data.name}" berhasil dicatat.`, action: { type: 'success', label: 'Tersimpan' } };
}

function executeQuery(data, msg) {
    if (msg && msg !== '') {
        // AI provided answer, use it
        return { message: msg, action: { type: 'success', label: 'Informasi' } };
    }

    const wallets = loadData(DB.wallets);
    const totalBalance = wallets.reduce((s, w) => s + (parseFloat(w.balance) || 0), 0);
    const transactions = loadData(DB.transactions);
    const monthIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const monthExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const pesanAll = getPesanData();
    const activePesan = pesanAll.filter(p => p.status === 'DP' || p.status === 'Belum Dibayar').length;

    return {
        message: `📊 Ringkasan Bisnis\n💰 Total Saldo: ${formatRupiah(totalBalance)}\n📈 Pemasukan: ${formatRupiah(monthIncome)}\n📉 Pengeluaran: ${formatRupiah(monthExpense)}\n📦 Pesanan Aktif: ${activePesan}`,
        action: { type: 'success', label: 'Informasi' }
    };
}

async function clearChat() {
    if (!await showConfirm('Hapus semua riwayat chat?')) return;
    saveChatHistory([]);
    renderChatMessages();
}

// Auto-scroll and re-render when page is shown
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && document.getElementById('page-chat')?.classList.contains('active')) {
        renderChatMessages();
    }
});

// ==================== VOICE INPUT ====================

let voiceRecognition = null;
let isListening = false;
let voiceInterimTimeout = null;

function toggleVoiceInput() {
    if (isListening) {
        stopVoiceInput();
        return;
    }
    startVoiceInput();
}

function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('Browser tidak mendukung voice input. Gunakan Chrome/Edge di Android atau desktop.');
        return;
    }

    if (location.protocol !== 'https:' && location.protocol !== 'http:') {
        alert('⚠️ Voice input membutuhkan koneksi HTTPS atau localhost.\n\nBuka aplikasi lewat HTTPS (bukan file://) untuk menggunakan fitur ini.');
        return;
    }

    voiceRecognition = new SpeechRecognition();
    voiceRecognition.lang = 'id-ID';
    voiceRecognition.continuous = true;
    voiceRecognition.interimResults = true;

    const micBtn = document.getElementById('chatMicBtn');
    const micIcon = document.getElementById('chatMicIcon');
    const input = document.getElementById('chatInput');

    voiceRecognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('listening');
        micIcon.textContent = 'graphic_eq';
        if (navigator.vibrate) navigator.vibrate(30);
    };

    voiceRecognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                final += transcript;
            } else {
                interim += transcript;
            }
        }
        if (final) {
            input.value = final;
            // Auto-send after silence (debounce)
            if (voiceInterimTimeout) clearTimeout(voiceInterimTimeout);
            voiceInterimTimeout = setTimeout(() => {
                if (isListening) {
                    stopVoiceInput();
                    sendChatMessage();
                }
            }, 1200);
        }
        if (interim) {
            input.value = final + interim;
        }
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    };

    voiceRecognition.onerror = (event) => {
        stopVoiceInput();
        if (event.error === 'no-speech') return;
        if (event.error === 'not-allowed') {
            alert('⚠️ Mikrofon tidak diizinkan.\n\nPastikan:\n1. Aplikasi dibuka lewat HTTPS atau localhost (tidak bisa pakai file://)\n2. Izin mikrofon sudah diberikan di pengaturan browser\n3. Tidak ada aplikasi lain yang pakai mikrofon');
            return;
        }
        alert('Error voice: ' + event.error);
    };

    voiceRecognition.onend = () => {
        // Auto-restart if still listening (for continuous mode)
        if (isListening) {
            try { voiceRecognition.start(); } catch {}
        } else {
            stopVoiceInput();
        }
    };

    voiceRecognition.start();
}

function stopVoiceInput() {
    isListening = false;
    if (voiceInterimTimeout) { clearTimeout(voiceInterimTimeout); voiceInterimTimeout = null; }
    if (voiceRecognition) {
        try { voiceRecognition.stop(); } catch {}
    }
    const micBtn = document.getElementById('chatMicBtn');
    const micIcon = document.getElementById('chatMicIcon');
    if (micBtn) micBtn.classList.remove('listening');
    if (micIcon) micIcon.textContent = 'mic';
    if (navigator.vibrate) navigator.vibrate(20);
}
