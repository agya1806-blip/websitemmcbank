// ==================== TRANSACTION MODULE ====================

function openTransactionModal() {
    document.getElementById('transactionId').value = '';
    document.getElementById('transactionType').value = currentTransactionType;
    document.getElementById('transactionModalTitle').textContent = 'Tambah Transaksi';
    document.getElementById('transactionDate').value = new Date().toISOString().split('T');
    document.getElementById('transactionDesc').value = '';
    document.getElementById('transactionAmount').value = '';
    updateCategoryOptions();
    const cabangEl = document.getElementById('transactionCabang');
    if (cabangEl) {
        const cabang = getCabang();
        cabangEl.innerHTML = '<option value="">Pusat</option>' + cabang.map(c => `<option value="${c}">${c}</option>`).join('');
    }
    openModal('transactionModal');
}

function setTransactionType(type) {
    currentTransactionType = type;
    document.getElementById('transactionType').value = type;
    document.querySelectorAll('#transactionModal .tab').forEach(t => t.classList.remove('active'));
    if (event?.target) event.target.classList.add('active');
    updateCategoryOptions();
}

function updateCategoryOptions() {
    const type = document.getElementById('transactionType').value;
    const cats = type === 'income' ? incomeCategories : expenseCategories;
    document.getElementById('transactionCategory').innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function saveTransaction() {
    const id = document.getElementById('transactionId').value;
    const type = document.getElementById('transactionType').value;
    const date = document.getElementById('transactionDate').value;
    const category = document.getElementById('transactionCategory').value;
    const desc = document.getElementById('transactionDesc').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value) || 0;
    const walletId = document.getElementById('transactionWallet').value;
    const cabang = document.getElementById('transactionCabang')?.value || '';

    if (!date || !desc || amount <= 0 || !walletId) {
        alert('⚠️ Lengkapi semua field!');
        return;
    }

    const transactions = loadData(DB.transactions);
    const isModal = modalCategories.includes(category);
    if (id) {
        const idx = transactions.findIndex(t => t.id === id);
        if (idx >= 0) transactions[idx] = { ...transactions[idx], date, category, description: desc, amount, walletId, cabang, isModalKeluar: modalCategories.includes(category) };
    } else {
        transactions.push({ id: generateId(), type, date, category, description: desc, amount, walletId, cabang, isModalKeluar: isModal, createdAt: Date.now() });
    }

    saveData(DB.transactions, transactions);
    addActivity(`${type === 'income' ? '📥 Pemasukan' : '📤 Pengeluaran'} ${formatRupiah(amount)} - ${desc}`);
    closeModal('transactionModal');
    recalculateAll();
    renderAll();
}

function editTransaction(id) {
    const t = loadData(DB.transactions).find(x => x.id === id);
    if (!t) return;
    document.getElementById('transactionId').value = t.id;
    document.getElementById('transactionType').value = t.type;
    document.getElementById('transactionDate').value = t.date;
    document.getElementById('transactionDesc').value = t.description;
    document.getElementById('transactionAmount').value = t.amount;
    document.getElementById('transactionWallet').value = t.walletId;
    const cabangEl = document.getElementById('transactionCabang');
    if (cabangEl) cabangEl.value = t.cabang || '';
    updateCategoryOptions();
    document.getElementById('transactionCategory').value = t.category;
    document.getElementById('transactionModalTitle').textContent = 'Edit Transaksi';
    openModal('transactionModal');
}

async function deleteTransaction(id) {
    if (!await showConfirm('❌ Hapus transaksi ini?')) return;
    const transactions = loadData(DB.transactions).filter(t => t.id !== id);
    saveData(DB.transactions, transactions);
    addActivity('🗑️ Menghapus transaksi');
    recalculateAll();
    renderAll();
}

// ==================== WALLET MODULE ====================

function openWalletModal() {
    document.getElementById('walletId').value = '';
    document.getElementById('walletName').value = '';
    document.getElementById('walletModalTitle').textContent = 'Tambah Dompet';
    openModal('walletModal');
}

function saveWallet() {
    const id = document.getElementById('walletId').value;
    const name = document.getElementById('walletName').value;
    const icon = document.getElementById('walletIcon').value;
    if (!name) {
        alert('⚠️ Nama dompet wajib diisi!');
        return;
    }

    const wallets = loadData(DB.wallets);
    if (id) {
        const idx = wallets.findIndex(w => w.id === id);
        if (idx >= 0) wallets[idx] = { ...wallets[idx], name, icon };
    } else {
        wallets.push({ id: generateId(), name, icon, balance: 0, createdAt: Date.now() });
    }
    saveData(DB.wallets, wallets);
    addActivity(id ? '✏️ Mengupdate dompet' : '➕ Menambah dompet baru');
    closeModal('walletModal');
    recalculateAll();
    renderAll();
}

function editWallet(id) {
    const w = loadData(DB.wallets).find(x => x.id === id);
    if (!w) return;
    document.getElementById('walletId').value = w.id;
    document.getElementById('walletName').value = w.name;
    document.getElementById('walletIcon').value = w.icon;
    document.getElementById('walletModalTitle').textContent = 'Edit Dompet';
    openModal('walletModal');
}

async function deleteWallet(id) {
    const transactions = loadData(DB.transactions);
    if (transactions.some(t => t.walletId === id)) {
        alert('⚠️ Dompet ini memiliki transaksi. Hapus transaksi terlebih dahulu!');
        return;
    }
    if (!await showConfirm('❌ Hapus dompet ini?')) return;
    saveData(DB.wallets, loadData(DB.wallets).filter(w => w.id !== id));
    addActivity('🗑️ Menghapus dompet');
    recalculateAll();
    renderAll();
}

function openTransferModal(fromId) {
    document.getElementById('transferFrom').value = fromId || '';
    document.getElementById('transferTo').value = '';
    document.getElementById('transferAmount').value = '';
    document.getElementById('transferDesc').value = '';
    openModal('transferModal');
}

function saveTransfer() {
    const fromId = document.getElementById('transferFrom').value;
    const toId = document.getElementById('transferTo').value;
    const amount = parseFloat(document.getElementById('transferAmount').value) || 0;
    const desc = document.getElementById('transferDesc').value;
    if (!fromId || !toId || fromId === toId || amount <= 0) {
        alert('⚠️ Pilih dompet asal dan tujuan yang berbeda dengan nominal valid!');
        return;
    }
    const transactions = loadData(DB.transactions);
    const ts = Date.now();
    const fromName = document.querySelector(`#transferFrom option[value="${fromId}"]`)?.textContent || '';
    const toName = document.querySelector(`#transferTo option[value="${toId}"]`)?.textContent || '';
    
    transactions.push({ id: generateId(), type: 'transfer_out', date: new Date().toISOString().split('T'), category: 'Transfer Keluar', description: `Transfer ke ${toName} - ${desc}`, amount, walletId: fromId, createdAt: ts });
    transactions.push({ id: generateId(), type: 'transfer_in', date: new Date().toISOString().split('T'), category: 'Transfer Masuk', description: `Transfer dari ${fromName} - ${desc}`, amount, walletId: toId, createdAt: ts + 1 });
    
    saveData(DB.transactions, transactions);
    addActivity(`↔️ Transfer ${formatRupiah(amount)} antar dompet`);
    closeModal('transferModal');
    recalculateAll();
    renderAll();
}

// ==================== CUSTOMER MODULE ====================

function openCustomerModal() {
    document.getElementById('customerId').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerNote').value = '';
    document.getElementById('customerModalTitle').textContent = 'Tambah Pelanggan';
    openModal('customerModal');
}

function saveCustomer() {
    const id = document.getElementById('customerId').value;
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const address = document.getElementById('customerAddress').value;
    const note = document.getElementById('customerNote').value;
    if (!name) {
        alert('⚠️ Nama pelanggan wajib diisi!');
        return;
    }
    
    const customers = loadData(DB.customers);
    if (id) {
        const idx = customers.findIndex(c => c.id === id);
        if (idx >= 0) customers[idx] = { ...customers[idx], name, phone, address, note };
    } else {
        customers.push({ id: generateId(), name, phone, address, note, createdAt: Date.now() });
    }
    saveData(DB.customers, customers);
    addActivity(id ? '✏️ Mengupdate pelanggan' : '➕ Menambah pelanggan baru');
    closeModal('customerModal');
    renderAll();
}

function editCustomer(id) {
    const c = loadData(DB.customers).find(x => x.id === id);
    if (!c) return;
    document.getElementById('customerId').value = c.id;
    document.getElementById('customerName').value = c.name;
    document.getElementById('customerPhone').value = c.phone;
    document.getElementById('customerAddress').value = c.address;
    document.getElementById('customerNote').value = c.note || '';
    document.getElementById('customerModalTitle').textContent = 'Edit Pelanggan';
    openModal('customerModal');
}

async function deleteCustomer(id) {
    const hasPesan = typeof getPesanData === 'function' && getPesanData().some(p => p.customerId === id);
    if (hasPesan) {
        alert('⚠️ Pelanggan ini memiliki pesanan. Hapus pesanan terlebih dahulu!');
        return;
    }
    if (!await showConfirm('❌ Hapus pelanggan ini?')) return;
    saveData(DB.customers, loadData(DB.customers).filter(c => c.id !== id));
    addActivity('🗑️ Menghapus pelanggan');
    renderAll();
}

// ==================== PRODUCT MODULE ====================

function openProductModal() {
    document.getElementById('productId').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = 0;
    document.getElementById('productModalTitle').textContent = 'Tambah Item';
    openModal('productModal');
}

function saveProduct() {
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value) || 0;
    const stock = parseInt(document.getElementById('productStock').value) || 0;
    const type = document.getElementById('productType').value;
    if (!name) {
        alert('⚠️ Nama item wajib diisi!');
        return;
    }
    
    const products = loadData(DB.products);
    if (id) {
        const idx = products.findIndex(p => p.id === id);
        if (idx >= 0) products[idx] = { ...products[idx], name, category, price, stock, type };
    } else {
        products.push({ id: generateId(), name, category, price, stock, type, createdAt: Date.now() });
    }
    saveData(DB.products, products);
    addActivity(id ? '✏️ Mengupdate produk/jasa' : '➕ Menambah produk/jasa baru');
    closeModal('productModal');
    renderAll();
}

function adjustStock(productId, delta) {
    const products = loadData(DB.products);
    const p = products.find(x => x.id === productId);
    if (!p) return;
    p.stock = Math.max(0, (p.stock || 0) + delta);
    saveData(DB.products, products);
    renderAll();
}

function editProduct(id) {
    const p = loadData(DB.products).find(x => x.id === id);
    if (!p) return;
    document.getElementById('productId').value = p.id;
    document.getElementById('productName').value = p.name;
    document.getElementById('productCategory').value = p.category;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productStock').value = p.stock || 0;
    document.getElementById('productType').value = p.type || 'service';
    document.querySelectorAll('#page-products .tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`#page-products .tab[onclick*="'${p.type||'service'}'"]`)?.classList.add('active');
    document.getElementById('productModalTitle').textContent = 'Edit Item';
    openModal('productModal');
}

async function deleteProduct(id) {
    if (!await showConfirm('❌ Hapus item ini?')) return;
    saveData(DB.products, loadData(DB.products).filter(p => p.id !== id));
    addActivity('🗑️ Menghapus produk/jasa');
    renderAll();
}

// ==================== DEBT MODULE ====================

function openDebtModal() {
    document.getElementById('debtId').value = '';
    document.getElementById('debtName').value = '';
    document.getElementById('debtPhone').value = '';
    document.getElementById('debtAmount').value = '';
    document.getElementById('debtDesc').value = '';
    document.getElementById('debtDate').value = new Date().toISOString().split('T');
    document.getElementById('debtDue').value = new Date().toISOString().split('T');
    document.getElementById('debtModalTitle').textContent = 'Tambah Hutang';
    openModal('debtModal');
}

function saveDebt() {
    const id = document.getElementById('debtId').value;
    const name = document.getElementById('debtName').value;
    const phone = document.getElementById('debtPhone').value;
    const amount = parseFloat(document.getElementById('debtAmount').value) || 0;
    const desc = document.getElementById('debtDesc').value;
    const date = document.getElementById('debtDate').value;
    const dueDate = document.getElementById('debtDue').value;
    const walletId = document.getElementById('debtWallet').value;
    
    if (!name || amount <= 0) {
        alert('⚠️ Nama dan nominal wajib diisi!');
        return;
    }
    
    const debts = loadData(DB.debts);
    if (id) {
        const idx = debts.findIndex(d => d.id === id);
        if (idx >= 0) debts[idx] = { ...debts[idx], name, phone, amount, description: desc, date, dueDate, walletId };
    } else {
        debts.push({ id: generateId(), name, phone, amount, description: desc, date, dueDate, walletId, status: 'Belum Lunas', createdAt: Date.now() });
    }
    saveData(DB.debts, debts);
    addActivity(id ? '✏️ Mengupdate hutang' : '➕ Menambah hutang baru');
    closeModal('debtModal');
    recalculateAll();
    renderAll();
}

function editDebt(id) {
    const d = loadData(DB.debts).find(x => x.id === id);
    if (!d) return;
    document.getElementById('debtId').value = d.id;
    document.getElementById('debtName').value = d.name;
    document.getElementById('debtPhone').value = d.phone;
    document.getElementById('debtAmount').value = d.amount;
    document.getElementById('debtDesc').value = d.description || '';
    document.getElementById('debtDate').value = d.date;
    document.getElementById('debtDue').value = d.dueDate;
    document.getElementById('debtWallet').value = d.walletId || '';
    document.getElementById('debtModalTitle').textContent = 'Edit Hutang';
    openModal('debtModal');
}

async function deleteDebt(id) {
    if (!await showConfirm('❌ Hapus hutang ini?')) return;
    saveData(DB.debts, loadData(DB.debts).filter(d => d.id !== id));
    addActivity('🗑️ Menghapus hutang');
    recalculateAll();
    renderAll();
}

function payDebt(id) {
    const debts = loadData(DB.debts);
    const debt = debts.find(d => d.id === id);
    if (!debt) return;
    
    const wallets = loadData(DB.wallets);
    let walletHtml = '<select id="debtPaymentWallet" class="form-select">';
    walletHtml += '<option value="">Pilih Dompet</option>';
    wallets.forEach(w => {
        walletHtml += `<option value="${w.id}" data-balance="${w.balance}">${w.icon} ${w.name} (${formatRupiah(w.balance)})</option>`;
    });
    walletHtml += '</select>';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <span class="modal-title">💰 Bayar Hutang</span>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Nama Hutang</label>
                    <input type="text" class="form-input" value="${debt.name}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Nominal</label>
                    <input type="text" class="form-input" value="${formatRupiah(debt.amount)}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Pilih Dompet Pembayaran</label>
                    ${walletHtml}
                </div>
                <button class="btn btn-primary" onclick="confirmPayDebt('${id}', document.getElementById('debtPaymentWallet').value); this.closest('.modal-overlay').remove();">✅ Bayar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmPayDebt(debtId, walletId) {
    if (!walletId) {
        alert('⚠️ Pilih dompet!');
        return;
    }
    
    const debts = loadData(DB.debts);
    const debt = debts.find(d => d.id === debtId);
    const wallets = loadData(DB.wallets);
    const wallet = wallets.find(w => w.id === walletId);
    
    if (wallet.balance < debt.amount) {
        alert('⚠️ Saldo dompet tidak mencukupi!');
        return;
    }
    
    const transactions = loadData(DB.transactions);
    transactions.push({ 
        id: generateId(), 
        type: 'expense', 
        date: new Date().toISOString().split('T'), 
        category: 'Bayar Hutang', 
        description: `Pembayaran hutang ke ${debt.name}`, 
        amount: debt.amount, 
        walletId: walletId, 
        createdAt: Date.now() 
    });
    
    debt.status = 'Lunas';
    debt.paidAt = new Date().toISOString().split('T');
    debt.paidWalletId = walletId;
    showConfetti();
    saveData(DB.transactions, transactions);
    saveData(DB.debts, debts);
    addActivity(`💳 Membayar hutang ${debt.name} ${formatRupiah(debt.amount)}`);
    recalculateAll();
    renderAll();
}

// ==================== RECEIVABLE MODULE ====================

function openReceivableModal() {
    document.getElementById('receivableId').value = '';
    document.getElementById('receivableName').value = '';
    document.getElementById('receivablePhone').value = '';
    document.getElementById('receivableAmount').value = '';
    document.getElementById('receivableDesc').value = '';
    document.getElementById('receivableDate').value = new Date().toISOString().split('T');
    document.getElementById('receivableDue').value = new Date().toISOString().split('T');
    document.getElementById('receivableModalTitle').textContent = 'Tambah Piutang';
    openModal('receivableModal');
}

function saveReceivable() {
    const id = document.getElementById('receivableId').value;
    const name = document.getElementById('receivableName').value;
    const phone = document.getElementById('receivablePhone').value;
    const amount = parseFloat(document.getElementById('receivableAmount').value) || 0;
    const desc = document.getElementById('receivableDesc').value;
    const date = document.getElementById('receivableDate').value;
    const dueDate = document.getElementById('receivableDue').value;
    const walletId = document.getElementById('receivableWallet').value;
    
    if (!name || amount <= 0) {
        alert('⚠️ Nama dan nominal wajib diisi!');
        return;
    }
    
    const receivables = loadData(DB.receivables);
    if (id) {
        const idx = receivables.findIndex(r => r.id === id);
        if (idx >= 0) receivables[idx] = { ...receivables[idx], name, phone, amount, description: desc, date, dueDate, walletId };
    } else {
        receivables.push({ id: generateId(), name, phone, amount, description: desc, date, dueDate, walletId, status: 'Belum Lunas', createdAt: Date.now() });
    }
    saveData(DB.receivables, receivables);
    addActivity(id ? '✏️ Mengupdate piutang' : '➕ Menambah piutang baru');
    closeModal('receivableModal');
    recalculateAll();
    renderAll();
}

function editReceivable(id) {
    const r = loadData(DB.receivables).find(x => x.id === id);
    if (!r) return;
    document.getElementById('receivableId').value = r.id;
    document.getElementById('receivableName').value = r.name;
    document.getElementById('receivablePhone').value = r.phone;
    document.getElementById('receivableAmount').value = r.amount;
    document.getElementById('receivableDesc').value = r.description || '';
    document.getElementById('receivableDate').value = r.date;
    document.getElementById('receivableDue').value = r.dueDate;
    document.getElementById('receivableWallet').value = r.walletId || '';
    document.getElementById('receivableModalTitle').textContent = 'Edit Piutang';
    openModal('receivableModal');
}

async function deleteReceivable(id) {
    if (!await showConfirm('❌ Hapus piutang ini?')) return;
    saveData(DB.receivables, loadData(DB.receivables).filter(r => r.id !== id));
    addActivity('🗑️ Menghapus piutang');
    recalculateAll();
    renderAll();
}

function payReceivable(id) {
    const receivables = loadData(DB.receivables);
    const rec = receivables.find(r => r.id === id);
    if (!rec) return;
    
    const wallets = loadData(DB.wallets);
    let walletHtml = '<select id="receivablePaymentWallet" class="form-select">';
    walletHtml += '<option value="">Pilih Dompet</option>';
    wallets.forEach(w => {
        walletHtml += `<option value="${w.id}">${w.icon} ${w.name}</option>`;
    });
    walletHtml += '</select>';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <span class="modal-title">💰 Terima Piutang</span>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Nama Peminjam</label>
                    <input type="text" class="form-input" value="${rec.name}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Nominal</label>
                    <input type="text" class="form-input" value="${formatRupiah(rec.amount)}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Pilih Dompet Penerima</label>
                    ${walletHtml}
                </div>
                <button class="btn btn-primary" onclick="confirmPayReceivable('${id}', document.getElementById('receivablePaymentWallet').value); this.closest('.modal-overlay').remove();">✅ Terima</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmPayReceivable(receivableId, walletId) {
    if (!walletId) {
        alert('⚠️ Pilih dompet!');
        return;
    }
    
    const receivables = loadData(DB.receivables);
    const rec = receivables.find(r => r.id === receivableId);
    
    const transactions = loadData(DB.transactions);
    transactions.push({ 
        id: generateId(), 
        type: 'income', 
        date: new Date().toISOString().split('T'), 
        category: 'Pembayaran Piutang', 
        description: `Penerimaan piutang dari ${rec.name}`, 
        amount: rec.amount, 
        walletId: walletId, 
        createdAt: Date.now() 
    });
    
    rec.status = 'Lunas';
    rec.receivedAt = new Date().toISOString().split('T');
    rec.receivedWalletId = walletId;
    showConfetti();
    saveData(DB.transactions, transactions);
    saveData(DB.receivables, receivables);
    addActivity(`💳 Menerima piutang ${rec.name} ${formatRupiah(rec.amount)}`);
    recalculateAll();
    renderAll();
}

// ==================== AI ASSISTANT ====================

async function aiGenerate(prompt) {
    if (!CONFIG.GEMINI_API_KEY) {
        alert('⚠️ API Key Gemini belum diisi!\n\nBuka js/config.js dan isi GEMINI_API_KEY.\nDapatkan API Key gratis di https://aistudio.google.com/apikey');
        return null;
    }
    try {
        const res = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3 }
            })
        });
        if (!res.ok) {
            if (res.status === 429) throw new Error('Kuota AI habis atau belum punya API Key. Buat API Key gratis di https://aistudio.google.com/apikey lalu isi di Settings.');
            if (res.status === 403) throw new Error('API Key tidak valid. Cek lagi di Settings.');
            throw new Error('AI error: ' + res.status);
        }
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (err) {
        alert('❌ AI gagal: ' + err.message);
        return null;
    }
}

async function aiSuggestCategory() {
    const desc = document.getElementById('transactionDesc')?.value;
    if (!desc || desc.length < 3) {
        alert('Tulis keterangan transaksi dulu, lalu klik AI.');
        return;
    }
    const prompt = `Kategorikan transaksi ini: "${desc}"
Pilih salah satu kategori yang PALING SESUAI:
- Pemasukan: Penjualan, Jasa, Pendapatan Lain
- Pengeluaran: Pembelian, Operasional, Gaji, Pengeluaran Lain

Jawab hanya nama kategorinya saja, tanpa teks lain.`;
    
    const result = await aiGenerate(prompt);
    if (!result) return;
    
    const cat = result.trim();
    const select = document.getElementById('transactionCategory');
    if (select) {
        for (let opt of select.options) {
            if (opt.value.toLowerCase() === cat.toLowerCase()) {
                select.value = opt.value;
                break;
            }
        }
    }
    alert(`✅ AI menyarankan kategori: ${cat}`);
}
