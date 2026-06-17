// ==================== TRANSACTION MODULE ====================

function openTransactionModal() {
    document.getElementById('transactionId').value = '';
    document.getElementById('transactionType').value = currentTransactionType;
    document.getElementById('transactionModalTitle').textContent = 'Tambah Transaksi';
    document.getElementById('transactionDate').value = new Date().toISOString().split('T');
    document.getElementById('transactionDesc').value = '';
    document.getElementById('transactionAmount').value = '';
    updateCategoryOptions();
    openModal('transactionModal');
}

function setTransactionType(type) {
    currentTransactionType = type;
    document.getElementById('transactionType').value = type;
    document.querySelectorAll('#transactionModal .tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
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

    if (!date || !desc || amount <= 0 || !walletId) {
        alert('⚠️ Lengkapi semua field!');
        return;
    }

    const transactions = loadData(DB.transactions);
    const isModal = modalCategories.includes(category);
    if (id) {
        const idx = transactions.findIndex(t => t.id === id);
        if (idx >= 0) transactions[idx] = { ...transactions[idx], date, category, description: desc, amount, walletId, isModalKeluar: modalCategories.includes(category) };
    } else {
        transactions.push({ id: generateId(), type, date, category, description: desc, amount, walletId, isModalKeluar: isModal, createdAt: Date.now() });
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
    updateCategoryOptions();
    document.getElementById('transactionCategory').value = t.category;
    document.getElementById('transactionModalTitle').textContent = 'Edit Transaksi';
    openModal('transactionModal');
}

function deleteTransaction(id) {
    if (!confirm('❌ Hapus transaksi ini?')) return;
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

function deleteWallet(id) {
    const transactions = loadData(DB.transactions);
    if (transactions.some(t => t.walletId === id)) {
        alert('⚠️ Dompet ini memiliki transaksi. Hapus transaksi terlebih dahulu!');
        return;
    }
    if (!confirm('❌ Hapus dompet ini?')) return;
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

function deleteCustomer(id) {
    if (loadData(DB.invoices).some(i => i.customerId === id)) {
        alert('⚠️ Pelanggan ini memiliki invoice. Hapus invoice terlebih dahulu!');
        return;
    }
    if (!confirm('❌ Hapus pelanggan ini?')) return;
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

function deleteProduct(id) {
    if (!confirm('❌ Hapus item ini?')) return;
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

function deleteDebt(id) {
    if (!confirm('❌ Hapus hutang ini?')) return;
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

function deleteReceivable(id) {
    if (!confirm('❌ Hapus piutang ini?')) return;
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
    
    saveData(DB.transactions, transactions);
    saveData(DB.receivables, receivables);
    addActivity(`💳 Menerima piutang ${rec.name} ${formatRupiah(rec.amount)}`);
    recalculateAll();
    renderAll();
}

// ==================== INVOICE MODULE ====================

function openInvoiceTypeModal() {
    const types = getInvoiceTypes();
    const container = document.getElementById('invoiceTypeButtons');
    if (container) {
        container.innerHTML = types.map(t => `
            <button class="btn btn-primary" onclick="openInvoiceModal('${t.id}')" style="margin-bottom:10px">
                <span class="m-icon" style="font-size:20px;margin-right:4px">${t.icon||'receipt'}</span> ${t.label||t.id}
            </button>
        `).join('');
    }
    openModal('invoiceTypeModal');
}

function openInvoiceModal(type) {
    closeModal('invoiceTypeModal');
    document.getElementById('invoiceId').value = '';
    document.getElementById('invoiceType').value = type;
    document.getElementById('invoiceModalTitle').textContent = 'Invoice Baru';
    document.getElementById('invoiceCustomer').value = '';
    document.getElementById('invoiceCustomerName').value = '';
    document.getElementById('invoiceCustomerPhone').value = '';
    document.getElementById('invoiceCustomerAddress').value = '';
    document.getElementById('invoiceNote').value = '';
    document.getElementById('invoiceTotal').value = '0';
    document.getElementById('invoiceDP').value = '0';
    document.getElementById('invoiceRemaining').value = '0';
    document.getElementById('invoiceStatus').value = 'DP';
    
    document.getElementById('printSpecs').style.display = 'none';
    document.getElementById('laptopSpecs').style.display = 'none';
    document.getElementById('umumSpecs').style.display = 'none';
    document.getElementById('handphoneSpecs').style.display = 'none';
    document.getElementById('tiktokSpecs').style.display = 'none';
    document.getElementById('customSpecs').style.display = 'none';
    
    if (type === 'print') document.getElementById('printSpecs').style.display = 'block';
    else if (type === 'laptop') document.getElementById('laptopSpecs').style.display = 'block';
    else if (type === 'handphone') document.getElementById('handphoneSpecs').style.display = 'block';
    else if (type === 'tiktok') document.getElementById('tiktokSpecs').style.display = 'block';
    else if (type === 'umum') {
        document.getElementById('umumSpecs').style.display = 'block';
        // Load ALL products for umum dropdown
        const products = loadData(DB.products);
        const select = document.getElementById('umumProductSelect');
        const stockProducts = products.filter(p => p.stock !== undefined && p.stock !== null);
        if (stockProducts.length > 0) {
            select.innerHTML = '<option value="">Pilih produk (stok akan berkurang)...</option>' + stockProducts.map(p => `<option value="${p.id}" data-name="${p.name}" data-price="${p.price}" data-stock="${p.stock||0}">${p.name} (stok: ${p.stock||0}) - ${formatRupiah(p.price)}</option>`).join('');
        } else {
            select.innerHTML = '<option value="">Belum ada produk dengan stok</option>';
        }
    } else {
        // Custom type - show generic specs
        document.getElementById('customSpecs').style.display = 'block';
        document.getElementById('customSpecsNote').value = '';
    }
    
    const customers = loadData(DB.customers);
    document.getElementById('invoiceCustomer').innerHTML = '<option value="">Pilih Pelanggan</option>' + customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    invoiceItems = [];
    renderInvoiceItems();
    openModal('invoiceModal');
}

function fillUmumProduct() {
    const select = document.getElementById('umumProductSelect');
    const option = select.options[select.selectedIndex];
    if (!option || !option.value) return;
    const name = option.dataset.name;
    const price = option.dataset.price;
    // Auto-fill item
    const existing = invoiceItems.find(i => i.productId === option.value);
    if (existing) {
        existing.qty += 1;
    } else {
        invoiceItems.push({ id: generateId(), productId: option.value, name: name, qty: 1, price: parseFloat(price) });
    }
    renderInvoiceItems();
}

function fillCustomerData() {
    const customerId = document.getElementById('invoiceCustomer').value;
    if (!customerId) return;
    const customer = loadData(DB.customers).find(c => c.id === customerId);
    if (customer) {
        document.getElementById('invoiceCustomerName').value = customer.name;
        document.getElementById('invoiceCustomerPhone').value = customer.phone || '';
        document.getElementById('invoiceCustomerAddress').value = customer.address || '';
    }
}

function addInvoiceItem() {
    invoiceItems.push({ id: generateId(), name: '', qty: 1, price: 0 });
    renderInvoiceItems();
}

function removeInvoiceItem(itemId) {
    invoiceItems = invoiceItems.filter(i => i.id !== itemId);
    renderInvoiceItems();
}

function updateInvoiceItem(id, field, value) {
    const item = invoiceItems.find(i => i.id === id);
    if (item) {
        item[field] = field === 'name' ? value : parseFloat(value) || 0;
        renderInvoiceItems();
    }
}

function renderInvoiceItems() {
    const container = document.getElementById('invoiceItems');
    if (invoiceItems.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px">Belum ada item. Klik "Tambah Item".</p>';
    } else {
        container.innerHTML = invoiceItems.map(item => `
            <div style="display:grid;grid-template-columns:1fr 60px 100px 100px 40px;gap:8px;margin-bottom:8px;align-items:center">
                <input type="text" class="form-input" placeholder="Nama item" value="${item.name}" onchange="updateInvoiceItem('${item.id}','name',this.value)" style="font-size:13px;padding:8px">
                <input type="number" class="form-input" placeholder="Qty" value="${item.qty}" onchange="updateInvoiceItem('${item.id}','qty',this.value)" style="font-size:13px;padding:8px">
                <input type="number" class="form-input" placeholder="Harga" value="${item.price}" onchange="updateInvoiceItem('${item.id}','price',this.value)" style="font-size:13px;padding:8px">
                <div style="font-size:13px;font-weight:600">${formatRupiah(item.qty * item.price)}</div>
                <button onclick="removeInvoiceItem('${item.id}')" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--danger)">🗑️</button>
            </div>`).join('');
    }
    calculateInvoiceTotal();
}

function calculateInvoiceTotal() {
    const total = invoiceItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const dp = parseFloat(document.getElementById('invoiceDP').value) || 0;
    document.getElementById('invoiceTotal').value = total;
    document.getElementById('invoiceRemaining').value = total - dp;
    updateDPProgress();
}

function updateInvoiceRemaining() {
    calculateInvoiceTotal();
}

function updateDPProgress() {
    const total = parseFloat(document.getElementById('invoiceTotal').value) || 0;
    const dp = parseFloat(document.getElementById('invoiceDP').value) || 0;
    const container = document.getElementById('dpProgressContainer');
    const fill = document.getElementById('dpProgressFill');
    const label = document.getElementById('dpProgressLabel');
    if (!container) return;
    if (total > 0 && dp > 0 && dp < total) {
        container.style.display = 'block';
        const percent = Math.round((dp / total) * 100);
        if (fill) fill.style.width = percent + '%';
        if (label) label.textContent = 'DP ' + percent + '%';
    } else if (total > 0 && dp >= total) {
        container.style.display = 'block';
        if (fill) fill.style.width = '100%';
        if (label) label.textContent = 'Lunas 100%';
    } else {
        container.style.display = 'none';
    }
}

function saveInvoice() {
    const id = document.getElementById('invoiceId').value;
    const type = document.getElementById('invoiceType').value;
    const customerId = document.getElementById('invoiceCustomer').value;
    const customerName = document.getElementById('invoiceCustomerName').value;
    const customerPhone = document.getElementById('invoiceCustomerPhone').value;
    const customerAddress = document.getElementById('invoiceCustomerAddress').value;
    const total = parseFloat(document.getElementById('invoiceTotal').value) || 0;
    const dp = parseFloat(document.getElementById('invoiceDP').value) || 0;
    const status = document.getElementById('invoiceStatus').value;
    const walletId = document.getElementById('invoiceWallet').value;
    
    if (!customerName || total <= 0) {
        alert('⚠️ Nama pelanggan dan total invoice wajib diisi!');
        return;
    }
    if (!walletId && (status === 'Lunas' || status === 'DP')) {
        alert('⚠️ Pilih dompet tujuan untuk transaksi ini!');
        return;
    }
    
    const invoices = loadData(DB.invoices);
    const transactions = loadData(DB.transactions);
    let now = Date.now();
    
    let invoiceData = {
        type, customerId, customerName, customerPhone, customerAddress,
        total, dp, modalKeluar: 0, remaining: total - dp, status, walletId,
        items: JSON.parse(JSON.stringify(invoiceItems)),
        note: document.getElementById('invoiceNote').value,
        date: new Date().toISOString(),
        createdAt: now
    };
    
    if (type === 'print') {
        invoiceData.specs = {
            bookSize: document.getElementById('printBookSize').value,
            binding: document.getElementById('printBinding').value,
            finalSize: document.getElementById('printFinalSize').value,
            paperType: document.getElementById('printPaperType').value,
            coverType: document.getElementById('printCoverType').value,
            laminating: document.getElementById('printLaminating').value,
            wrapping: document.getElementById('printWrapping').value
        };
    } else if (type === 'laptop') {
        invoiceData.specs = {
            laptopName: document.getElementById('laptopName').value,
            processor: document.getElementById('laptopProcessor').value,
            ram: document.getElementById('laptopRam').value,
            storage: document.getElementById('laptopStorage').value,
            screen: document.getElementById('laptopScreen').value,
            condition: document.getElementById('laptopCondition').value,
            warranty: document.getElementById('laptopWarranty').value
        };
    } else if (type === 'umum') {
        const prodSelect = document.getElementById('umumProductSelect');
        invoiceData.specs = {
            productId: prodSelect?.value || '',
            productName: prodSelect?.options[prodSelect.selectedIndex]?.text || '',
            umumType: document.getElementById('umumType').value,
            umumDesc: document.getElementById('umumDesc').value
        };
    } else if (type === 'handphone') {
        invoiceData.specs = {
            hpName: document.getElementById('hpName').value,
            hpStorage: document.getElementById('hpStorage').value,
            hpColor: document.getElementById('hpColor').value,
            hpCondition: document.getElementById('hpCondition').value,
            hpWarranty: document.getElementById('hpWarranty').value
        };
    } else if (type === 'tiktok') {
        invoiceData.specs = {
            tiktokProduct: document.getElementById('tiktokProduct').value,
            tiktokPlatform: document.getElementById('tiktokPlatform').value,
            tiktokPrice: parseFloat(document.getElementById('tiktokPrice').value) || 0
        };
    } else {
        invoiceData.specs = {
            note: document.getElementById('customSpecsNote').value || ''
        };
    }
    
    let inv;
    if (id) {
        const idx = invoices.findIndex(i => i.id === id);
        if (idx >= 0) {
            const oldInvoice = invoices[idx];
            // Hapus semua transaksi lama milik invoice ini berdasarkan invoiceId (lebih akurat)
            const filteredTrans = transactions.filter(t => t.invoiceId !== oldInvoice.id);
            invoices[idx] = { ...oldInvoice, ...invoiceData, id: oldInvoice.id, number: oldInvoice.number, transactionIds: [] };
            saveData(DB.transactions, filteredTrans);
            transactions.splice(0, transactions.length, ...filteredTrans);
            inv = invoices[idx];
        }
    } else {
        invoiceData.id = generateId();
        invoiceData.number = generateInvoiceNumber();
        invoiceData.transactionIds = [];
        invoices.push(invoiceData);
        inv = invoiceData;
    }
    
    inv.transactionIds = inv.transactionIds || [];
    
    // Fungsi bikin transaksi income
    function addInvoiceTrans(category, desc, amount, type) {
        const trans = { 
            id: generateId(), 
            type: type || 'income', 
            date: inv.date, 
            category, 
            description: desc, 
            amount, 
            walletId: walletId, 
            invoiceId: inv.id, 
            isModalKeluar: type === 'expense',
            createdAt: now++
        };
        transactions.push(trans);
        inv.transactionIds.push(trans.id);
    }
    
    // DP
    if ((status === 'DP' || status === 'Lunas') && dp > 0) {
        addInvoiceTrans('DP Invoice', `DP Invoice ${inv.number} - ${customerName}`, dp);
    }
    // Pelunasan (hanya jika Lunas dan remaining > 0)
    if (status === 'Lunas' && inv.remaining > 0) {
        addInvoiceTrans('Pelunasan Invoice', `Pelunasan Invoice ${inv.number} - ${customerName}`, inv.remaining);
    }
    
    // Kurangi stok produk untuk invoice tipe umum yang pilih produk
    if (type === 'umum') {
        const prodSelect = document.getElementById('umumProductSelect');
        if (prodSelect && prodSelect.value) {
            const products = loadData(DB.products);
            const prod = products.find(p => p.id === prodSelect.value);
            if (prod && prod.stock > 0) {
                const totalQty = invoiceItems.filter(i => i.productId === prodSelect.value).reduce((s, i) => s + i.qty, 0);
                prod.stock = Math.max(0, prod.stock - totalQty);
                saveData(DB.products, products);
            }
        }
    }
    
    saveData(DB.invoices, invoices);
    saveData(DB.transactions, transactions);
    addActivity(id ? `✏️ Mengupdate invoice ${inv.number}` : `📄 Membuat invoice baru ${inv.number}`);
    closeModal('invoiceModal');
    recalculateAll();
    renderAll();
}

// ==================== PAY INVOICE (LUNAKAN) ====================

function payInvoice(id) {
    const invoices = loadData(DB.invoices);
    const inv = invoices.find(i => i.id === id);
    if (!inv || inv.status === 'Lunas') return;
    
    const wallets = loadData(DB.wallets);
    let walletHtml = '<select id="invoicePaymentWallet" class="form-select">';
    walletHtml += '<option value="">Pilih Dompet</option>';
    wallets.forEach(w => {
        walletHtml += `<option value="${w.id}" data-balance="${w.balance}">${w.icon} ${w.name} (${formatRupiah(w.balance)})</option>`;
    });
    walletHtml += '</select>';
    
    const remaining = inv.remaining;
    let statusOpts = '';
    if (remaining > 0) {
        statusOpts = `
            <div class="form-group">
                <label class="form-label">Nominal Pembayaran</label>
                <select class="form-select" id="invoicePayType">
                    <option value="full">Bayar Lunas (Rp ${remaining.toLocaleString('id-ID')})</option>
                    <option value="dp">Bayar DP (sebagian)</option>
                </select>
            </div>
            <div class="form-group" id="invoicePayDPGroup" style="display:none">
                <label class="form-label">Jumlah DP (Rp)</label>
                <input type="number" class="form-input" id="invoicePayDPAmount" value="${remaining}" max="${remaining}">
            </div>`;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <span class="modal-title">💰 Bayar Invoice</span>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Invoice</label>
                    <input type="text" class="form-input" value="${inv.number} - ${inv.customerName}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Sisa Pembayaran</label>
                    <input type="text" class="form-input" value="${formatRupiah(remaining)}" readonly>
                </div>
                ${statusOpts}
                <div class="form-group">
                    <label class="form-label">Dompet Penerima</label>
                    ${walletHtml}
                </div>
                <button class="btn btn-primary" onclick="confirmPayInvoice('${id}'); this.closest('.modal-overlay').remove();">✅ Konfirmasi Pembayaran</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Event listener untuk toggle DP
    setTimeout(() => {
        const payType = document.getElementById('invoicePayType');
        const dpGroup = document.getElementById('invoicePayDPGroup');
        if (payType && dpGroup) {
            payType.addEventListener('change', function() {
                dpGroup.style.display = this.value === 'dp' ? 'block' : 'none';
            });
        }
    }, 100);
}

function confirmPayInvoice(invoiceId) {
    const walletId = document.getElementById('invoicePaymentWallet')?.value;
    if (!walletId) {
        alert('⚠️ Pilih dompet penerima!');
        return;
    }
    
    const invoices = loadData(DB.invoices);
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    
    const transactions = loadData(DB.transactions);
    const now = Date.now();
    
    // Hapus transaksi lama milik invoice ini
    const filteredTrans = transactions.filter(t => t.invoiceId !== inv.id);
    
    const payType = document.getElementById('invoicePayType')?.value || 'full';
    let dpAmount = parseFloat(document.getElementById('invoicePayDPAmount')?.value) || inv.remaining;
    
    inv.transactionIds = inv.transactionIds || [];
    
    if (payType === 'full') {
        if (inv.dp > 0) {
            const pelunasanTrans = { 
                id: generateId(), type: 'income', date: new Date().toISOString().split('T')[0],
                category: 'Pelunasan Invoice', 
                description: `Pelunasan Invoice ${inv.number} - ${inv.customerName}`,
                amount: inv.remaining, walletId, invoiceId: inv.id, createdAt: now
            };
            filteredTrans.push(pelunasanTrans);
            inv.transactionIds.push(pelunasanTrans.id);
        } else {
            const lunasTrans = { 
                id: generateId(), type: 'income', date: new Date().toISOString().split('T')[0],
                category: 'Pelunasan Invoice', 
                description: `Pembayaran Lunas Invoice ${inv.number} - ${inv.customerName}`,
                amount: inv.total, walletId, invoiceId: inv.id, createdAt: now
            };
            filteredTrans.push(lunasTrans);
            inv.transactionIds.push(lunasTrans.id);
        }
        inv.status = 'Lunas';
        inv.dp = inv.total;
        inv.remaining = 0;
    } else {
        if (dpAmount <= 0 || dpAmount > inv.remaining) {
            alert('⚠️ Jumlah DP tidak valid!');
            return;
        }
        const dpTrans = { 
            id: generateId(), type: 'income', date: new Date().toISOString().split('T')[0],
            category: 'DP Invoice', 
            description: `DP Invoice ${inv.number} - ${inv.customerName}`,
            amount: dpAmount, walletId, invoiceId: inv.id, createdAt: now
        };
        filteredTrans.push(dpTrans);
        inv.transactionIds.push(dpTrans.id);
        inv.dp = (inv.dp || 0) + dpAmount;
        inv.remaining = inv.total - inv.dp;
        inv.status = inv.remaining <= 0 ? 'Lunas' : 'DP';
    }
    
    saveData(DB.transactions, filteredTrans);
    saveData(DB.invoices, invoices);
    addActivity(`💰 Pembayaran invoice ${inv.number} - ${inv.status}`);
    recalculateAll();
    renderAll();
    alert(`✅ Pembayaran berhasil! Invoice ${inv.number} sekarang: ${inv.status}`);
}

function payInvoiceFromDetail() {
    closeModal('invoiceDetailModal');
    if (currentInvoiceId) {
        payInvoice(currentInvoiceId);
    }
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

async function aiFillInvoice() {
    const customerName = document.getElementById('invoiceCustomerName').value || 'pelanggan';
    const type = document.getElementById('invoiceType').value;
    let specs = '';
    if (type === 'print') {
        specs = `${document.getElementById('printBookSize').value || 'A4'}, ${document.getElementById('printBinding').value || 'Lem Panas'}`;
    } else if (type === 'laptop') {
        specs = `${document.getElementById('laptopName').value || 'Laptop'}, ${document.getElementById('laptopProcessor').value || ''}`;
    } else {
        specs = document.getElementById('umumType').value || 'Umum';
    }
    
    const prompt = `Buat daftar item untuk invoice percetakan/penjualan dengan data:
- Pelanggan: ${customerName}
- Tipe: ${type} (${specs})
- Buat 3-5 item yang relevan dengan format: nama_item|jumlah|harga_per_item(pakai angka wajar Indonesia)
Contoh format output (setiap baris):
Buku Tahunan SD|50|45000
Stiker Label|100|5000
        
Hanya kirim item-itemnya saja, tanpa angka awal, tanpa teks lain.`;
    
    const result = await aiGenerate(prompt);
    if (!result) return;
    
    const lines = result.trim().split('\n').filter(l => l.includes('|'));
    if (lines.length === 0) {
        alert('AI tidak menghasilkan item. Coba lagi.');
        return;
    }
    
    // Hapus item default dan tambah hasil AI
    invoiceItems = [];
    lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length >= 3) {
            invoiceItems.push({
                id: generateId(),
                name: parts[0].trim(),
                qty: parseInt(parts[1]) || 1,
                price: parseInt(parts[2].replace(/\D/g, '')) || 0
            });
        }
    });
    
    renderInvoiceItems();
    alert(`✅ AI berhasil membuat ${invoiceItems.length} item!`);
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
