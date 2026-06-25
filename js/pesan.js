// ==================== PESAN (ORDER) MODULE ====================

const PESAN_DB = 'mughis_pesan';
let currentPesanTab = 'all';
let currentPesanType = null;
let pesanItems = [];
let currentPesanId = null;

function getPesanData() { return loadData(PESAN_DB); }
function savePesanData(data) { saveData(PESAN_DB, data); }

function generatePesanNumber() {
    const pesanan = getPesanData();
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateStr = `${y}${m}${d}`;
    const todayPesan = pesanan.filter(p => p.number && p.number.startsWith(`PSN-${dateStr}`));
    const seq = todayPesan.length + 1;
    return `PSN-${dateStr}-${String(seq).padStart(3, '0')}`;
}

// ===== CHIP SELECTOR SYSTEM =====
function selectChip(el, groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
}

function getChipValue(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return '';
    const active = group.querySelector('.chip.active');
    return active ? active.dataset.value : '';
}

function resetChipGroup(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
}

// ===== OPEN CATEGORY MODAL =====
function openPesanKategoriModal() {
    pesanItems = [];
    document.getElementById('pesanKategoriContent').innerHTML = `
        <div class="kategori-grid">
            <div class="kategori-card" onclick="closeModal('pesanKategoriModal');openPesanForm('print')">
                <span class="m-icon" style="font-size:32px;color:var(--primary)">auto_stories</span>
                <span>Percetakan</span>
            </div>
            <div class="kategori-card" onclick="closeModal('pesanKategoriModal');openPesanForm('laptop')">
                <span class="m-icon" style="font-size:32px;color:var(--primary)">laptop</span>
                <span>Laptop</span>
            </div>
            <div class="kategori-card" onclick="closeModal('pesanKategoriModal');openPesanForm('umum')">
                <span class="m-icon" style="font-size:32px;color:var(--primary)">shopping_cart</span>
                <span>Umum</span>
            </div>
            <div class="kategori-card" onclick="closeModal('pesanKategoriModal');openPesanForm('tiktok')">
                <span class="m-icon" style="font-size:32px;color:var(--primary)">smart_display</span>
                <span>Affiliate TikTok</span>
            </div>
        </div>`;
    openModal('pesanKategoriModal');
}

// ===== PESAN FORM =====
function openPesanForm(type, editData) {
    currentPesanType = type;
    const isEdit = editData ? true : false;

    document.getElementById('pesanId').value = editData ? editData.id : '';
    document.getElementById('pesanModalTitle').textContent = isEdit ? 'Edit Pesanan' : 'Pesanan Baru';

    // Customer fields
    document.getElementById('pesanCustomerSearch').value = editData ? editData.customerName : '';
    document.getElementById('pesanCustomerId').value = editData ? (editData.customerId || '') : '';
    document.getElementById('pesanCustomerName').value = editData ? editData.customerName : '';
    document.getElementById('pesanCustomerPhone').value = editData ? (editData.customerPhone || '') : '';
    document.getElementById('pesanCustomerAddress').value = editData ? (editData.customerAddress || '') : '';
    document.getElementById('pesanNote').value = editData ? (editData.note || '') : '';

    document.getElementById('pesanType').value = type;

    // Hide all spec sections
    ['printSpecsPesan', 'laptopSpecsPesan', 'umumSpecsPesan', 'tiktokSpecsPesan'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });

    document.getElementById(type + 'SpecsPesan').style.display = 'block';

    // Populate product dropdown for umum
    if (type === 'umum') {
        const sel = document.getElementById('psnUmumProductSelect');
        if (sel) {
            const products = (loadData(DB.products) || []).filter(p => p.stock > 0);
            sel.innerHTML = '<option value="">Pilih produk...</option>' +
                products.map(p => `<option value="${p.id}">${p.name} (stok: ${p.stock})</option>`).join('');
        }
    }

    // Reset chips
    document.querySelectorAll('#pesanForm .chip-group').forEach(g => {
        const def = g.querySelector('.chip.default');
        if (def) def.classList.add('active');
        else { const first = g.querySelector('.chip'); if (first) first.classList.add('active'); }
    });

    // Fill edit data
    if (editData) {
        const s = editData.specs || {};
        if (type === 'print') {
            setChipByValue('psnPrintBookSize', s.bookSize);
            setChipByValue('psnPrintBinding', s.binding);
            setChipByValue('psnPrintFinalSize', s.finalSize);
            setChipByValue('psnPrintPaperType', s.paperType);
            setChipByValue('psnPrintCoverType', s.coverType);
            setChipByValue('psnPrintLaminating', s.laminating);
            setChipByValue('psnPrintWrapping', s.wrapping);
        } else if (type === 'laptop') {
            setChipByValue('psnLaptopMerk', s.merk);
            setChipByValue('psnLaptopProcessor', s.processor);
            setChipByValue('psnLaptopRam', s.ram);
            setChipByValue('psnLaptopStorage', s.storage);
            setChipByValue('psnLaptopScreen', s.screen);
            setChipByValue('psnLaptopCondition', s.condition);
            setChipByValue('psnLaptopWarranty', s.warranty);
            if (s.laptopName) document.getElementById('psnLaptopManualName').value = s.laptopName;
        } else if (type === 'tiktok') {
            setChipByValue('psnTiktokPlatform', s.platform);
            setChipByValue('psnTiktokCategory', s.category);
            setChipByValue('psnTiktokKomisi', String(s.komisi));
            if (s.tiktokProduct) document.getElementById('psnTiktokManualProduct').value = s.tiktokProduct;
        } else if (type === 'umum') {
            setChipByValue('psnUmumType', s.umumType);
            if (s.umumItem) document.getElementById('psnUmumManualItem').value = s.umumItem;
            if (s.productId) {
                const sel = document.getElementById('psnUmumProductSelect');
                if (sel) { sel.value = s.productId; }
            }
        }
    }

    // Items
    pesanItems = editData && editData.items ? JSON.parse(JSON.stringify(editData.items)) : [];
    renderPesanItems();

    // Payment fields
    if (editData) {
        document.getElementById('pesanTotal').value = editData.total || 0;
        document.getElementById('pesanDP').value = editData.dp || 0;
        document.getElementById('pesanRemaining').value = editData.remaining || 0;
        document.getElementById('pesanStatus').value = editData.status || 'DP';
        document.getElementById('pesanWallet').value = editData.walletId || '';
    } else {
        document.getElementById('pesanTotal').value = 0;
        document.getElementById('pesanDP').value = 0;
        document.getElementById('pesanRemaining').value = 0;
        document.getElementById('pesanStatus').value = 'DP';
    }
    calculatePesanTotal();

    // Fill wallet select
    updatePesanWalletSelect();

    openModal('pesanModal');
}

function setChipByValue(groupId, val) {
    if (!val) return;
    const group = document.getElementById(groupId);
    if (!group) return;
    const chip = Array.from(group.querySelectorAll('.chip')).find(c => c.dataset.value === String(val));
    if (chip) {
        group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    }
}

function updatePesanWalletSelect() {
    const sel = document.getElementById('pesanWallet');
    if (!sel) return;
    const wallets = loadData(DB.wallets);
    sel.innerHTML = '<option value="">Pilih Dompet</option>' +
        wallets.map(w => `<option value="${w.id}">${w.icon||'💳'} ${w.name}</option>`).join('');
}

// ===== CUSTOMER SEARCH =====
function filterPesanCustomerDropdown() {
    const q = document.getElementById('pesanCustomerSearch').value.toLowerCase();
    const results = document.getElementById('pesanCustomerResults');
    const customers = loadData(DB.customers).filter(c =>
        c.name.toLowerCase().includes(q) || (c.phone || '').includes(q)
    );
    if (!q || customers.length === 0) { results.style.display = 'none'; return; }
    results.innerHTML = customers.map(c =>
        `<div class="customer-result-item" onclick="selectPesanCustomerResult('${c.id}','${c.name.replace(/'/g, "\\'")}','${(c.phone||'').replace(/'/g, "\\'")}','${(c.address||'').replace(/'/g, "\\'")}')">
            <strong>${c.name}</strong> ${c.phone ? '- ' + c.phone : ''}
        </div>`
    ).join('');
    results.style.display = 'block';
}

function selectPesanCustomerResult(id, name, phone, address) {
    document.getElementById('pesanCustomerId').value = id;
    document.getElementById('pesanCustomerSearch').value = name;
    document.getElementById('pesanCustomerName').value = name;
    document.getElementById('pesanCustomerPhone').value = phone;
    document.getElementById('pesanCustomerAddress').value = address;
    document.getElementById('pesanCustomerResults').style.display = 'none';
}

function clearPesanCustomerSearch() {
    document.getElementById('pesanCustomerId').value = '';
    document.getElementById('pesanCustomerSearch').value = '';
    document.getElementById('pesanCustomerName').value = '';
    document.getElementById('pesanCustomerPhone').value = '';
    document.getElementById('pesanCustomerAddress').value = '';
}

// ===== PRODUCT SELECT FOR UMUM =====
function fillPesanUmumProduct() {
    const sel = document.getElementById('psnUmumProductSelect');
    if (!sel || !sel.value) return;
    const products = loadData(DB.products);
    const prod = products.find(p => p.id === sel.value);
    if (!prod) return;
    document.getElementById('psnUmumManualItem').value = prod.name;
    // Add item row with product price
    const existing = pesanItems.find(i => i.productId === prod.id);
    if (existing) {
        existing.qty = (existing.qty || 0) + 1;
    } else {
        pesanItems.push({ id: generateId(), productId: prod.id, name: prod.name, qty: 1, price: prod.price || 0 });
    }
    renderPesanItems();
}

// ===== ITEMS =====
function addPesanItem() {
    pesanItems.push({ id: generateId(), name: '', qty: 1, price: 0 });
    renderPesanItems();
}

function removePesanItem(id) {
    pesanItems = pesanItems.filter(i => i.id !== id);
    renderPesanItems();
}

function updatePesanItem(id, field, value) {
    const item = pesanItems.find(i => i.id === id);
    if (item) {
        item[field] = field === 'name' ? value : parseFloat(value) || 0;
        if (field === 'qty' || field === 'price') calculatePesanTotal();
    }
}

function renderPesanItems() {
    const container = document.getElementById('pesanItems');
    if (!container) return;
    if (pesanItems.length === 0) {
        container.innerHTML = '<div style="color:var(--text-secondary);font-size:13px;padding:8px">Belum ada item. Tambah item di bawah.</div>';
        return;
    }
    container.innerHTML = pesanItems.map(item => `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
            <input type="text" class="form-input" style="flex:2;min-width:0;padding:8px;font-size:13px" value="${item.name}" placeholder="Nama item" onchange="updatePesanItem('${item.id}','name',this.value)">
            <input type="number" class="form-input" style="flex:0.5;min-width:0;padding:8px;font-size:13px;width:50px" value="${item.qty}" placeholder="Qty" onchange="updatePesanItem('${item.id}','qty',this.value)">
            <input type="number" class="form-input" style="flex:1;min-width:0;padding:8px;font-size:13px;width:80px" value="${item.price}" placeholder="Harga" onchange="updatePesanItem('${item.id}','price',this.value)">
            <button class="btn btn-danger" style="padding:6px 8px;font-size:12px;width:auto" onclick="removePesanItem('${item.id}')">✕</button>
        </div>
    `).join('');
}

function calculatePesanTotal() {
    const total = pesanItems.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0), 0);
    const dp = parseFloat(document.getElementById('pesanDP').value) || 0;
    document.getElementById('pesanTotal').value = total;
    document.getElementById('pesanRemaining').value = Math.max(0, total - dp);
    updatePesanDPProgress();
}

function updatePesanRemaining() {
    calculatePesanTotal();
}

function updatePesanDPProgress() {
    const total = parseFloat(document.getElementById('pesanTotal').value) || 0;
    const dp = parseFloat(document.getElementById('pesanDP').value) || 0;
    const container = document.getElementById('pesanDPProgress');
    if (!container) return;
    if (total > 0 && dp > 0 && dp < total) {
        container.style.display = 'block';
        const pct = Math.min(100, Math.round(dp / total * 100));
        document.getElementById('pesanDPFill').style.width = pct + '%';
        document.getElementById('pesanDPFillLabel').textContent = 'DP ' + pct + '%';
    } else {
        container.style.display = 'none';
    }
}

// ===== MANUAL PRICE INPUT =====
function showPesanManualInput(groupId, containerId) {
    document.getElementById(groupId).style.display = 'none';
    document.getElementById(containerId).style.display = 'block';
    const input = document.getElementById(containerId).querySelector('input');
    if (input) input.focus();
}

// ===== SAVE PESAN =====
function savePesan() {
    const id = document.getElementById('pesanId').value;
    const type = document.getElementById('pesanType').value;
    const customerName = document.getElementById('pesanCustomerName').value;
    const customerPhone = document.getElementById('pesanCustomerPhone').value;
    const customerAddress = document.getElementById('pesanCustomerAddress').value;
    const customerId = document.getElementById('pesanCustomerId').value;
    const total = parseFloat(document.getElementById('pesanTotal').value) || 0;
    const dp = parseFloat(document.getElementById('pesanDP').value) || 0;
    const status = document.getElementById('pesanStatus').value;
    const walletId = document.getElementById('pesanWallet').value;

    if (!customerName || total <= 0) {
        alert('⚠️ Nama pelanggan dan total pesanan wajib diisi!');
        return;
    }
    if (!walletId && (status === 'Lunas' || status === 'DP')) {
        alert('⚠️ Pilih dompet tujuan untuk transaksi ini!');
        return;
    }

    let specs = {};
    if (type === 'print') {
        specs = {
            bookSize: getChipValue('psnPrintBookSize') || document.getElementById('psnPrintManualSize').value,
            binding: getChipValue('psnPrintBinding'),
            finalSize: getChipValue('psnPrintFinalSize') || document.getElementById('psnPrintManualFinal').value,
            paperType: getChipValue('psnPrintPaperType'),
            coverType: getChipValue('psnPrintCoverType'),
            laminating: getChipValue('psnPrintLaminating'),
            wrapping: getChipValue('psnPrintWrapping')
        };
    } else if (type === 'laptop') {
        specs = {
            laptopName: document.getElementById('psnLaptopManualName').value || getChipValue('psnLaptopMerk'),
            merk: getChipValue('psnLaptopMerk'),
            processor: getChipValue('psnLaptopProcessor'),
            ram: getChipValue('psnLaptopRam'),
            storage: getChipValue('psnLaptopStorage'),
            screen: getChipValue('psnLaptopScreen'),
            condition: getChipValue('psnLaptopCondition'),
            warranty: getChipValue('psnLaptopWarranty')
        };
    } else if (type === 'tiktok') {
        specs = {
            tiktokProduct: document.getElementById('psnTiktokManualProduct').value || getChipValue('psnTiktokCategory'),
            platform: getChipValue('psnTiktokPlatform'),
            category: getChipValue('psnTiktokCategory'),
            komisi: getChipValue('psnTiktokKomisi')
        };
    } else if (type === 'umum') {
        const prodSelect = document.getElementById('psnUmumProductSelect');
        specs = {
            productId: prodSelect?.value || '',
            productName: prodSelect?.options[prodSelect.selectedIndex]?.text || '',
            umumItem: document.getElementById('psnUmumManualItem').value,
            umumType: getChipValue('psnUmumType')
        };
    }

    let allPesanan = getPesanData();
    let transactions = loadData(DB.transactions);
    const now = Date.now();

    let pesanData = {
        type, customerId, customerName, customerPhone, customerAddress,
        total, dp, modalKeluar: 0, remaining: total - dp, status, walletId,
        items: JSON.parse(JSON.stringify(pesanItems)),
        specs,
        note: document.getElementById('pesanNote').value,
        orderStatus: 'Baru',
    cabang: '',
        date: new Date().toISOString(),
        createdAt: now
    };

    let pesan;
    if (id) {
        const idx = allPesanan.findIndex(p => p.id === id);
        if (idx >= 0) {
            const old = allPesanan[idx];
            transactions = transactions.filter(t => t.pesanId !== old.id);
            allPesanan[idx] = { ...old, ...pesanData, id: old.id, number: old.number, transactionIds: [] };
            pesan = allPesanan[idx];
        }
    } else {
        pesanData.id = generateId();
        pesanData.number = generatePesanNumber();
        pesanData.transactionIds = [];
        allPesanan.push(pesanData);
        pesan = pesanData;
    }

    pesan.transactionIds = pesan.transactionIds || [];

    function addPesanTrans(category, desc, amount, transType) {
        const trans = {
            id: generateId(),
            type: transType || 'income',
            date: pesan.date,
            category,
            description: desc,
            amount,
            walletId,
            pesanId: pesan.id,
            isModalKeluar: transType === 'expense',
            createdAt: now++
        };
        transactions.push(trans);
        pesan.transactionIds.push(trans.id);
    }

    if ((status === 'DP' || status === 'Lunas') && dp > 0) {
        addPesanTrans('DP Pesanan', `DP ${pesan.number} - ${customerName}`, dp);
    }
    if (status === 'Lunas' && pesan.remaining > 0) {
        addPesanTrans('Pelunasan Pesanan', `Pelunasan ${pesan.number} - ${customerName}`, pesan.remaining);
    }

    // Kurangi stok produk untuk tipe umum
    if (type === 'umum') {
        const prodSelect = document.getElementById('psnUmumProductSelect');
        if (prodSelect && prodSelect.value) {
            const products = loadData(DB.products);
            const prod = products.find(p => p.id === prodSelect.value);
            if (prod && prod.stock > 0) {
                const totalQty = pesanItems.filter(i => i.productId === prodSelect.value).reduce((s, i) => s + i.qty, 0);
                prod.stock = Math.max(0, prod.stock - totalQty);
                saveData(DB.products, products);
            }
        }
    }

    savePesanData(allPesanan);
    saveData(DB.transactions, transactions);
    addActivity(id ? `✏️ Mengupdate pesanan ${pesan.number}` : `📄 Membuat pesanan baru ${pesan.number}`);
    closeModal('pesanModal');
    recalculateAll();
    renderAll();
}

// ===== RENDER PESAN =====
function switchPesanTab(tab) {
    currentPesanTab = tab;
    const tabs = document.querySelectorAll('#page-pesan .tab');
    tabs.forEach(t => t.classList.remove('active'));
    const btn = Array.from(tabs).find(t => t.getAttribute('onclick')?.includes(`'${tab}'`));
    if (btn) btn.classList.add('active');
    renderPesan();
}

function renderPesan() {
    const tab = currentPesanTab || 'all';
    const search = document.getElementById('pesanSearch')?.value?.toLowerCase() || '';
    let pesanan = getPesanData();

    if (tab === 'baru') pesanan = pesanan.filter(p => p.orderStatus === 'Baru');
    else if (tab === 'proses') pesanan = pesanan.filter(p => p.orderStatus === 'Diproses');
    else if (tab === 'selesai') pesanan = pesanan.filter(p => p.orderStatus === 'Selesai');
    else if (tab === 'batal') pesanan = pesanan.filter(p => p.orderStatus === 'Dibatalkan');

    if (search) pesanan = pesanan.filter(p =>
        (p.number || '').toLowerCase().includes(search) ||
        (p.customerName || '').toLowerCase().includes(search) ||
        (p.type || '').toLowerCase().includes(search)
    );

    const sortBy = document.getElementById('pesanSort')?.value || 'date';
    if (sortBy === 'date') pesanan.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sortBy === 'total') pesanan.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

    const container = document.getElementById('pesanList');
    if (!container) return;
    if (pesanan.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Belum ada pesanan</p></div>';
        return;
    }

    const typeIcon = { print: 'auto_stories', laptop: 'laptop', umum: 'shopping_cart', tiktok: 'smart_display' };
    const typeLabel = { print: 'Percetakan', laptop: 'Laptop', umum: 'Umum', tiktok: 'TikTok' };
    const orderBadge = { Baru: 'badge-info', Diproses: 'badge-warning', Selesai: 'badge-success', Dibatalkan: 'badge-danger' };

        container.innerHTML = pesanan.map(p => {
        const os = p.orderStatus || 'Baru';
        const dpPercent = p.total > 0 ? Math.min(100, Math.round((parseFloat(p.dp || 0) / p.total) * 100)) : 0;
        return `
        <div class="card">
            <div class="list-item" style="padding-top:0;cursor:pointer" onclick="showPesanDetail('${p.id}')">
                <div class="list-icon" style="background:#e0e7ff;font-size:20px"><span class="m-icon">${typeIcon[p.type] || 'description'}</span></div>
                <div class="list-content">
                    <div class="list-title">${p.number}</div>
                    <div class="list-subtitle">${p.customerName} • ${formatDate(p.date)} • ${typeLabel[p.type] || p.type}</div>
                </div>
                <div style="text-align:right">
                    <div class="list-amount">${formatRupiah(p.total)}</div>
                    <span class="badge ${orderBadge[os] || 'badge-info'}">${os}</span>
                </div>
            </div>
            ${p.status === 'DP' ? `
            <div style="margin:8px 0 4px">
                <div class="progress-bar-track" style="height:6px">
                    <div class="progress-bar-fill" style="width:${dpPercent}%"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-secondary);margin-top:2px">
                    <span>DP ${dpPercent}%</span>
                    <span>Rp ${formatRupiah(p.dp||0)} / ${formatRupiah(p.total)}</span>
                </div>
            </div>` : ''}
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                ${os === 'Baru' ? `<button class="btn btn-outline" style="padding:6px;font-size:12px;flex:1" onclick="updatePesanStatus('${p.id}','Diproses')">⚙️ Proses</button>` : ''}
                ${os === 'Diproses' ? `<button class="btn btn-success" style="padding:6px;font-size:12px;flex:1" onclick="updatePesanStatus('${p.id}','Selesai')">✅ Selesai</button>` : ''}
                ${os !== 'Dibatalkan' && os !== 'Selesai' ? `<button class="btn btn-danger" style="padding:6px;font-size:12px" onclick="updatePesanStatus('${p.id}','Dibatalkan')">❌ Batal</button>` : ''}
                ${p.status !== 'Lunas' ? `<button class="btn btn-success" style="padding:6px;font-size:12px;flex:1" onclick="payPesan('${p.id}')">💰 Bayar</button>` : ''}
                <button class="btn btn-outline" style="padding:6px;font-size:12px;flex:1" onclick="event.stopPropagation();showPesanDetail('${p.id}')">📄 Detail</button>
            </div>
        </div>`;
    }).join('');
}

function renderRecentPesan() {
    const container = document.getElementById('recentPesan');
    if (!container) return;
    const pesanan = getPesanData().sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
    const typeLabel = { print: 'Percetakan', laptop: 'Laptop', umum: 'Umum', tiktok: 'TikTok' };
    if (pesanan.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text-secondary);font-size:13px">Belum ada pesanan</div>';
        return;
    }
    container.innerHTML = pesanan.map(p => {
        const os = p.orderStatus || 'Baru';
        return `
        <div class="list-item" style="cursor:pointer;padding:8px 0" onclick="showPesanDetail('${p.id}')">
            <div class="list-content">
                <div class="list-title">${p.number} — ${formatRupiah(p.total)}</div>
                <div class="list-subtitle">${p.customerName} • ${typeLabel[p.type]||p.type} • ${formatDate(p.date)}</div>
            </div>
            <span class="badge ${os==='Selesai'?'badge-success':os==='Diproses'?'badge-warning':os==='Dibatalkan'?'badge-danger':'badge-info'}">${os}</span>
        </div>`;
    }).join('');
}

// ===== UPDATE ORDER STATUS =====
function updatePesanStatus(id, newStatus) {
    const pesanan = getPesanData();
    const p = pesanan.find(x => x.id === id);
    if (!p) return;
    const label = { Baru: 'Baru', Diproses: 'Diproses', Selesai: 'Selesai', Dibatalkan: 'Dibatalkan' };
    if (!confirm(`Ubah status pesanan ${p.number} menjadi "${label[newStatus] || newStatus}"?`)) return;
    p.orderStatus = newStatus;
    savePesanData(pesanan);
    addActivity(`📋 Status pesanan ${p.number} → ${label[newStatus] || newStatus}`);
    renderAll();
}

// ===== DETAIL PESAN =====
function showPesanDetail(id) {
    currentPesanId = id;
    const p = getPesanData().find(x => x.id === id);
    if (!p) return;
    const settings = loadData(DB.settings);
    const services = getServices();
    const payMethods = getPaymentMethods();
    const typeLabel = { print: 'Percetakan', laptop: 'Laptop', umum: 'Umum', tiktok: 'TikTok' };

    let specsHtml = '';
    if (p.type === 'print') {
        specsHtml = `<div class="invoice-section"><div class="invoice-section-title">Spesifikasi Buku</div>
            <p><strong>Ukuran:</strong> ${p.specs?.bookSize||'-'} | <strong>Jilid:</strong> ${p.specs?.binding||'-'}</p>
            <p><strong>Ukuran Jadi:</strong> ${p.specs?.finalSize||'-'} | <strong>Kertas Isi:</strong> ${p.specs?.paperType||'-'}</p>
            <p><strong>Cover:</strong> ${p.specs?.coverType||'-'} | <strong>Laminating:</strong> ${p.specs?.laminating||'-'} | <strong>Wrapping:</strong> ${p.specs?.wrapping||'-'}</p>
        </div>`;
    } else if (p.type === 'laptop') {
        specsHtml = `<div class="invoice-section"><div class="invoice-section-title">Spesifikasi Laptop</div>
            <p><strong>${p.specs?.laptopName||p.specs?.merk||'-'}</strong></p>
            <p>${p.specs?.processor||'-'} | RAM: ${p.specs?.ram||'-'} | Storage: ${p.specs?.storage||'-'}</p>
            <p>Layar: ${p.specs?.screen||'-'} | ${p.specs?.condition||'-'} | Garansi: ${p.specs?.warranty||'-'}</p>
        </div>`;
    } else if (p.type === 'tiktok') {
        specsHtml = `<div class="invoice-section"><div class="invoice-section-title">Affiliate TikTok</div>
            <p><strong>Produk:</strong> ${p.specs?.tiktokProduct||p.specs?.category||'-'} | <strong>Platform:</strong> ${p.specs?.platform||'-'}</p>
            <p><strong>Komisi:</strong> ${p.specs?.komisi||'-'}${p.specs?.komisi ? '%' : ''}</p>
        </div>`;
    } else if (p.type === 'umum') {
        specsHtml = `<div class="invoice-section"><div class="invoice-section-title">Keterangan</div>
            <p><strong>Item:</strong> ${p.specs?.umumItem||p.specs?.productName||'-'} | <strong>Tipe:</strong> ${p.specs?.umumType||'-'}</p>
        </div>`;
    }

    const itemsHtml = p.items?.map((item, i) => `
        <tr>
            <td style="text-align:center">${i+1}</td>
            <td>${item.name}</td>
            <td style="text-align:center">${item.qty}</td>
            <td style="text-align:right">${formatRupiah(item.price)}</td>
            <td style="text-align:right">${formatRupiah(item.qty*item.price)}</td>
        </tr>
    `).join('') || '';

    const os = p.orderStatus || 'Baru';
    const orderBadge = { Baru: 'badge-info', Diproses: 'badge-warning', Selesai: 'badge-success', Dibatalkan: 'badge-danger' };

    const html = `
        <div class="invoice-preview" id="printAreaPesan" style="background:white;color:#0f172a;padding:24px">
            <div class="invoice-header">
                <div class="invoice-logo" style="background:linear-gradient(145deg,#0d3b66,#1a5276,#c9953c);font-size:0;overflow:hidden">
                    <img src="${getLogoUrl()}" style="width:100%;height:100%;object-fit:cover" alt="MG">
                </div>
                <div class="invoice-title">${settings.businessName}</div>
                <div class="invoice-meta" style="font-size:11px;line-height:1.6">
                    ${settings.address}<br>WA: ${settings.whatsapp}<br>
                    <span style="font-size:10px;color:#6b7280">${services.map(s => `• ${s}`).join('<br>')}</span>
                </div>
            </div>
            <div class="invoice-section">
                <div class="invoice-section-title">PESANAN</div>
                <p><strong>${p.number}</strong> | ${formatDate(p.date)} | ${typeLabel[p.type]||p.type} | Status: <span class="badge ${orderBadge[os]||'badge-info'}">${os}</span></p>
            </div>
            <div class="invoice-section">
                <div class="invoice-section-title">Pelanggan</div>
                <p><strong>${p.customerName}</strong><br>${p.customerPhone||'-'}<br>${p.customerAddress||'-'}</p>
            </div>
            ${specsHtml}
            <div class="invoice-section">
                <div class="invoice-section-title">Daftar Item</div>
                <table class="invoice-table">
                    <thead><tr>
                        <th style="width:5%">No</th>
                        <th style="width:40%">Item</th>
                        <th style="width:15%;text-align:center">Qty</th>
                        <th style="width:20%;text-align:right">Harga</th>
                        <th style="width:20%;text-align:right">Jumlah</th>
                    </tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
            </div>
            <div class="invoice-total">
                <div class="invoice-total-row"><span>Total</span><span>${formatRupiah(p.total)}</span></div>
                <div class="invoice-total-row"><span>DP Dibayar</span><span>${formatRupiah(p.dp)}</span></div>
                <div class="invoice-total-row final"><span>Sisa</span><span>${formatRupiah(p.remaining)}</span></div>
            </div>
            ${p.status === 'DP' ? `
            <div style="margin-top:12px">
                <div class="progress-bar-track" style="height:8px">
                    <div class="progress-bar-fill" style="width:${p.total > 0 ? Math.round((p.dp||0)/p.total*100) : 0}%"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);margin-top:4px">
                    <span>DP ${p.total > 0 ? Math.round((p.dp||0)/p.total*100) : 0}%</span>
                    <span>${formatRupiah(p.dp||0)} / ${formatRupiah(p.total)}</span>
                </div>
            </div>` : ''}
            <div style="margin-top:12px;text-align:center">
                <span class="badge ${p.status==='Lunas'?'badge-success':'badge-warning'}" style="font-size:13px;padding:6px 16px">${p.status}${p.status==='DP' ? ` (${p.total > 0 ? Math.round((p.dp||0)/p.total*100) : 0}%)` : ''}</span>
            </div>
            ${p.note ? `<div style="margin-top:12px;padding:10px;background:#f8fafc;border-radius:8px;font-size:12px"><strong>Catatan:</strong> ${p.note}</div>` : ''}
            <div style="margin-top:16px;padding:12px;background:#f0f9ff;border-radius:8px;text-align:center;font-size:11px;color:#0f172a">
                <p style="font-weight:700;margin-bottom:6px">💳 Metode Pembayaran:</p>
                ${payMethods.map(m => {
                    const accName = m.accountName ? ` • ${m.accountName}` : '';
                    const accNum = m.accountNumber ? ` • ${m.accountNumber}` : '';
                    const waNum = m.name === 'DANA' && !m.accountNumber ? ` • ${settings.whatsapp}` : '';
                    return `<p>${m.name}${accName}${accNum}${waNum}</p>`;
                }).join('')}
                <p style="margin-top:8px;color:#64748b">Kirim bukti transfer via WhatsApp setelah pembayaran.</p>
            </div>
        </div>`;

    document.getElementById('pesanDetailContent').innerHTML = html;

    const payBtn = document.getElementById('pesanPayBtn');
    if (payBtn) payBtn.style.display = p.status === 'Lunas' ? 'none' : 'block';

    const statusActions = document.getElementById('pesanStatusActions');
    if (statusActions) {
        if (os === 'Baru') {
            statusActions.innerHTML = `<button class="btn btn-outline" style="margin-bottom:8px" onclick="closeModal('pesanDetailModal');updatePesanStatus('${p.id}','Diproses')">⚙️ Proses Pesanan</button>`;
        } else if (os === 'Diproses') {
            statusActions.innerHTML = `<button class="btn btn-success" style="margin-bottom:8px" onclick="closeModal('pesanDetailModal');updatePesanStatus('${p.id}','Selesai')">✅ Selesai</button>`;
        } else if (os === 'Dibatalkan') {
            statusActions.innerHTML = `<button class="btn btn-outline" style="margin-bottom:8px" onclick="closeModal('pesanDetailModal');updatePesanStatus('${p.id}','Baru')">🔄 Aktifkan Kembali</button>`;
        } else {
            statusActions.innerHTML = '';
        }
    }

    openModal('pesanDetailModal');
}

// ===== PAY PESAN =====
function payPesan(id) {
    const pesanan = getPesanData();
    const p = pesanan.find(x => x.id === id);
    if (!p || p.status === 'Lunas') return;

    const remaining = parseFloat(p.remaining) || 0;
    const amount = prompt(`Total sisa: ${formatRupiah(remaining)}\nMasukkan nominal pembayaran:`, remaining);
    if (!amount) return;
    const payAmt = parseFloat(amount);
    if (payAmt <= 0) { alert('Nominal harus lebih dari 0!'); return; }

    let transactions = loadData(DB.transactions);
    const trans = {
        id: generateId(),
        type: 'income',
        date: new Date().toISOString(),
        category: 'Pelunasan Pesanan',
        description: `Pelunasan ${p.number} - ${p.customerName}`,
        amount: payAmt,
        walletId: p.walletId || document.getElementById('pesanWallet')?.value || '',
        pesanId: p.id,
        createdAt: Date.now()
    };
    transactions.push(trans);

    if (payAmt >= remaining) {
        p.status = 'Lunas';
        p.dp = parseFloat(p.dp) + payAmt;
        p.remaining = 0;
    } else {
        p.dp = parseFloat(p.dp) + payAmt;
        p.remaining = Math.max(0, remaining - payAmt);
    }

    savePesanData(pesanan);
    saveData(DB.transactions, transactions);
    addActivity(`💰 Pembayaran ${p.number}: ${formatRupiah(payAmt)}`);
    recalculateAll();
    renderAll();
    alert('✅ Pembayaran berhasil dicatat!');
}

function payPesanFromDetail() {
    closeModal('pesanDetailModal');
    if (currentPesanId) payPesan(currentPesanId);
}

// ===== EDIT PESAN =====
function editPesan() {
    closeModal('pesanDetailModal');
    const p = getPesanData().find(x => x.id === currentPesanId);
    if (p) openPesanForm(p.type, p);
}

// ===== DELETE PESAN =====
function deletePesan() {
    if (!currentPesanId) return;
    if (!confirm('⚠️ Yakin hapus pesanan ini? Data tidak bisa dikembalikan!')) return;
    if (!confirm('⚠️⚠️ Pesanan dan semua transaksinya akan dihapus permanen. Lanjutkan?')) return;

    let pesanan = getPesanData();
    let transactions = loadData(DB.transactions);
    const p = pesanan.find(x => x.id === currentPesanId);
    if (!p) return;

    transactions = transactions.filter(t => t.pesanId !== p.id);
    pesanan = pesanan.filter(x => x.id !== currentPesanId);

    savePesanData(pesanan);
    saveData(DB.transactions, transactions);
    addActivity(`🗑️ Menghapus pesanan ${p.number}`);
    closeModal('pesanDetailModal');
    recalculateAll();
    renderAll();
}

// ===== SHARE AS IMAGE =====
async function sharePesanAsImage(btnEl) {
    const printArea = document.getElementById('printAreaPesan');
    if (!printArea) { alert('Tidak ada pesanan untuk di-share.'); return; }

    const btn = btnEl || event?.target || document.querySelector('#pesanDetailModal .btn-primary');
    if (!btn) return;
    const orig = btn.textContent;

    try {
        btn.textContent = '⏳ Membuat gambar...';
        btn.disabled = true;

        const captureArea = document.getElementById('pesanSlipCaptureArea');
        captureArea.innerHTML = '';
        const clone = printArea.cloneNode(true);
        clone.style.width = '750px';
        clone.style.padding = '40px';
        clone.style.margin = '0';
        clone.style.border = 'none';
        clone.style.fontSize = '14px';
        clone.style.lineHeight = '1.6';
        captureArea.appendChild(clone);

        await new Promise(r => setTimeout(r, 500));

        const canvas = await html2canvas(clone, {
            scale: 2, useCORS: true, allowTaint: true,
            backgroundColor: '#ffffff', logging: false,
            width: 750, windowWidth: 800
        });

        captureArea.innerHTML = '';
        btn.textContent = orig;
        btn.disabled = false;

        canvas.toBlob(async (blob) => {
            const p = getPesanData().find(x => x.id === currentPesanId);
            const fileName = `${p?.number || 'pesanan'}-slip.png`;
            const file = new File([blob], fileName, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], title: `Pesanan ${p?.number}`, text: `Slip Pesanan ${loadData(DB.settings).businessName}` });
                    return;
                } catch (shareErr) {
                    if (shareErr.name === 'AbortError') return;
                }
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            alert('📸 Slip berhasil diunduh sebagai foto!\nBuka galeri dan bagikan via WhatsApp atau media sosial.');
        }, 'image/png');

    } catch (err) {
        btn.textContent = orig;
        btn.disabled = false;
        alert('❌ Gagal membuat gambar: ' + err.message);
    }
}

// ===== SEND WHATSAPP =====
function sendWhatsAppPesan() {
    const p = getPesanData().find(x => x.id === currentPesanId);
    if (!p) return;
    const settings = loadData(DB.settings);
    const services = getServices();
    const payMethods = getPaymentMethods();
    const typeLabel = { print: 'Percetakan', laptop: 'Laptop', umum: 'Umum', tiktok: 'TikTok' };

    let text = `*${settings.businessName}*\n`;
    text += `${settings.address}\n`;
    services.forEach(s => { text += `• ${s}\n`; });
    text += `\n*Pesanan: ${p.number}*\n`;
    text += `Tanggal: ${formatDate(p.date)}\n`;
    text += `Jenis: ${typeLabel[p.type] || p.type}\n`;
    text += `Status: ${p.orderStatus}\n\n`;
    text += `*Pelanggan:*\n${p.customerName}\n${p.customerPhone||'-'}\n${p.customerAddress||'-'}\n\n`;

    if (p.type === 'print') {
        text += `*Spesifikasi Buku:*\n`;
        text += `Ukuran: ${p.specs?.bookSize||'-'}\nJilid: ${p.specs?.binding||'-'}\n`;
        text += `Kertas Isi: ${p.specs?.paperType||'-'}\nCover: ${p.specs?.coverType||'-'}\n\n`;
    } else if (p.type === 'laptop') {
        text += `*Spesifikasi Laptop:*\n`;
        text += `${p.specs?.laptopName||p.specs?.merk||'-'}\n${p.specs?.processor||'-'}\n`;
        text += `RAM: ${p.specs?.ram||'-'}\nStorage: ${p.specs?.storage||'-'}\n\n`;
    } else if (p.type === 'tiktok') {
        text += `*Affiliate TikTok:*\n`;
        text += `Produk: ${p.specs?.tiktokProduct||p.specs?.category||'-'}\nPlatform: ${p.specs?.platform||'-'}\n`;
        text += `Komisi: ${p.specs?.komisi||'-'}${p.specs?.komisi ? '%' : ''}\n\n`;
    } else if (p.type === 'umum') {
        text += `*Keterangan:*\n`;
        text += `Item: ${p.specs?.umumItem||p.specs?.productName||'-'}\nTipe: ${p.specs?.umumType||'-'}\n\n`;
    }

    text += `*Daftar Item:*\n`;
    p.items?.forEach((item, i) => {
        text += `${i+1}. ${item.name} x${item.qty} = ${formatRupiah(item.qty*item.price)}\n`;
    });
    text += `\n*Total: ${formatRupiah(p.total)}*\n`;
    text += `DP: ${formatRupiah(p.dp)}\n`;
    text += `Sisa: ${formatRupiah(p.remaining)}\n`;
    text += `Status: *${p.status}*\n\n`;
    text += `*Pembayaran:*\n`;
    payMethods.forEach(m => {
        const num = m.name === 'DANA' && !m.accountNumber ? settings.whatsapp : m.accountNumber;
        text += `${m.name}: ${num || '-'}\n`;
    });
    text += `\n`;
    if (p.note) text += `Catatan: ${p.note}\n\n`;
    text += `Terima kasih! 🙏`;

    const phone = (p.customerPhone || settings.whatsapp).replace(/\D/g, '').replace(/^0/, '62');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
}
