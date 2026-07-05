// ==================== MUGHIS BANK - CORE APP V2 ====================

const APP_NAME = 'MUGHIS BANK';
const JSONBIN_API = 'https://api.jsonbin.io/v3/b';
const JSONBIN_KEY = CONFIG.JSONBIN_KEY;

// Firebase Config (Opsional untuk integrasi lebih lanjut)
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDemoKey",
    authDomain: "mughis-bank.firebaseapp.com",
    projectId: "mughis-bank",
    storageBucket: "mughis-bank.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

const DB = {
    wallets: 'mughis_wallets',
    transactions: 'mughis_transactions',
    customers: 'mughis_customers',
    products: 'mughis_products',
    debts: 'mughis_debts',
    receivables: 'mughis_receivables',
    purchases: 'mughis_purchases',
    settings: 'mughis_settings',
    activities: 'mughis_activities',
    users: 'mughis_users',
    pesan: 'mughis_pesan'
};

const defaultWallets = [
    { id: 'wb1', name: 'SeaBank', icon: '🏦', balance: 0, createdAt: Date.now() },
    { id: 'wb2', name: 'BSI', icon: '🏦', balance: 0, createdAt: Date.now() },
    { id: 'wb3', name: 'DANA', icon: '📱', balance: 0, createdAt: Date.now() },
    { id: 'wb4', name: 'ShopeePay', icon: '📱', balance: 0, createdAt: Date.now() },
    { id: 'wb5', name: 'Kas Tunai', icon: '💵', balance: 0, createdAt: Date.now() }
];

const defaultSettings = {
    businessName: 'Mughis Group',
    whatsapp: '085217706587',
    address: 'Samalanga, Bireuen, Aceh',
    logo: '',
    signature: '',
    theme: 'dark',
    cloudBinId: '',
    services: [
        'Jual Laptop Baru & Bekas',
        'Penerbit & Percetakan',
        'Desain Grafis & Logo',
        'Jasa Bordir & Sablon'
    ],
    paymentMethods: [
        { name: 'SeaBank', accountName: 'Muhammad Aghisna', accountNumber: '901007430064' },
        { name: 'BSI', accountName: 'Muhammad Aghisna', accountNumber: '7197202798' },
        { name: 'DANA', accountName: '', accountNumber: '' }
    ],
    invoiceTypes: [
        { id: 'print', label: 'Percetakan Buku', icon: 'auto_stories', builtIn: true },
        { id: 'laptop', label: 'Laptop Bekas', icon: 'laptop', builtIn: true },
        { id: 'handphone', label: 'Jual Handphone', icon: 'phone_android', builtIn: true },
        { id: 'tiktok', label: 'Affiliate TikTok', icon: 'smart_display', builtIn: true },
        { id: 'umum', label: 'Umum', icon: 'shopping_cart', builtIn: true }
    ]
};

function getIncomeCategories() {
    const s = loadData(DB.settings) || {};
    const defaults = ['Penjualan', 'Jasa', 'Pendapatan Lain', 'Transfer Masuk'];
    const custom = (s && !Array.isArray(s) && s.customIncomeCategories) || [];
    return [...defaults, ...custom.filter(c => !defaults.includes(c))];
}

function getExpenseCategories() {
    const s = loadData(DB.settings) || {};
    const defaults = ['Pembelian', 'Operasional', 'Gaji', 'Pengeluaran Lain', 'Transfer Keluar', 'Modal Produksi', 'Modal Operasional', 'Modal Marketing', 'Modal Gaji', 'Modal Transportasi', 'Modal Lainnya'];
    const custom = (s && !Array.isArray(s) && s.customExpenseCategories) || [];
    return [...defaults, ...custom.filter(c => !defaults.includes(c))];
}

function getModalCategories() {
    return getExpenseCategories().filter(c => c.startsWith('Modal'));
}

let currentUser = { userId: 'guest', email: 'local@user', name: 'User' };
let currentTransactionType = 'income';
let currentInvoiceId = null;
let invoiceItems = [];

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    if (!container) { originalAlert(message); return; }
    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' ' + type : '');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('out'), 2500);
    setTimeout(() => toast.remove(), 3000);
}

const originalAlert = window.alert;
window.alert = function(msg) {
    if (msg && (msg.includes('⚠️') || msg.includes('❌') || msg.includes('Gagal') || msg.includes('gagal') || msg.includes('tidak bisa') || msg.includes('tidak valid') || msg.includes('harus') || msg.includes('wajib') || msg.includes('belum') || msg.includes('Tidak ada') || msg.includes('Minimal') || msg.includes('Bawaan'))) {
        showToast(msg, 'error');
    } else if (msg && (msg.includes('✅') || msg.includes('berhasil') || msg.includes('disimpan') || msg.includes('tersimpan'))) {
        showToast(msg, 'success');
    } else if (msg && (msg.includes('⚠️') && (msg.includes('Ini akan') || msg.includes('Yakin') || msg.includes('menimpa') || msg.includes('hapus')))) {
        originalAlert(msg);
    } else {
        showToast(msg);
    }
};

// ==================== CONFIRM BOTTOM SHEET ====================
let _confirmResolve = null;

function showConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('confirmOverlay');
        const titleEl = document.getElementById('confirmTitle');
        const descEl = document.getElementById('confirmDesc');
        const iconEl = document.getElementById('confirmIcon');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        if (!overlay) { resolve(originalConfirm(message)); return; }

        let icon = '⚠️';
        let iconClass = 'warning';
        let okText = 'Ya, Lanjutkan';
        let okClass = 'btn-primary';
        if (message.includes('❌') || message.includes('Hapus') || message.includes('hapus') || message.includes('reset') || message.includes('Reset')) {
            icon = '🗑️'; iconClass = 'danger'; okText = 'Ya, Hapus'; okClass = 'btn-danger';
        } else if (message.includes('logout') || message.includes('Logout')) {
            icon = '🚪'; iconClass = 'warning'; okText = 'Ya, Logout'; okClass = 'btn-danger';
        } else if (message.includes('timpa') || message.includes('Timpa') || message.includes('menimpa') || message.includes('Menimpa')) {
            icon = '⚠️'; iconClass = 'warning'; okText = 'Ya, Timpa'; okClass = 'btn-primary';
        }

        let title = 'Konfirmasi';
        let desc = message;
        if (message.length > 80) {
            const parts = message.split('\n');
            title = parts[0].replace(/[⚠️❌✅]/g, '').trim();
            desc = parts.slice(1).join('\n') || message;
        }

        iconEl.textContent = icon;
        iconEl.className = 'confirm-sheet-icon ' + iconClass;
        titleEl.textContent = title;
        descEl.textContent = desc;
        okBtn.textContent = okText;
        okBtn.className = 'btn ' + okClass;

        _confirmResolve = resolve;
        overlay.classList.add('active');
    });
}

function confirmResponse(result) {
    const overlay = document.getElementById('confirmOverlay');
    if (overlay) overlay.classList.remove('active');
    if (_confirmResolve) {
        _confirmResolve(result);
        _confirmResolve = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('confirmOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) confirmResponse(false);
        });
    }
});

const originalConfirm = window.confirm;
window.confirm = function(msg) {
    showConfirm(msg);
    return true;
};

// ==================== SKELETON LOADING ====================
function showSkeleton(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.style.display = 'none';
    let skel = document.getElementById(containerId + '-skeleton');
    if (!skel) {
        skel = document.createElement('div');
        skel.className = 'skeleton-container';
        skel.id = containerId + '-skeleton';
        container.parentNode.insertBefore(skel, container.nextSibling);
    }
    skel.innerHTML = '';
    for (let i = 0; i < (count || 3); i++) {
        skel.innerHTML += `
            <div class="skeleton-card">
                <div class="skeleton-row">
                    <div class="skeleton-line h40"></div>
                    <div><div class="skeleton-line w60 h16"></div><div class="skeleton-line w80 h12" style="margin-top:6px"></div></div>
                </div>
            </div>`;
    }
    skel.classList.add('active');
}

function hideSkeleton(containerId) {
    const skel = document.getElementById(containerId + '-skeleton');
    if (skel) { skel.classList.remove('active'); skel.innerHTML = ''; }
    const container = document.getElementById(containerId);
    if (container) container.style.display = '';
}

// ==================== PAGE TRANSITIONS ====================
// Handled inline in showPage() below

// ==================== RIPPLE EFFECT ====================
function initRipple() {
    document.querySelectorAll('.btn, .nav-item, .kategori-card, .menu-item, .stat-card, .wallet-card').forEach(el => {
        if (el.classList.contains('ripple-btn')) return;
        el.classList.add('ripple-btn');
        el.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            this.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });
}

// ==================== CONFETTI ====================
function showConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    const colors = ['#C9A87A', '#775B5B', '#D4B88E', '#C9A87A', '#7A9B9B', '#5E4646'];
    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 6 + Math.random() * 8;
        const left = Math.random() * 100;
        const dur = 2 + Math.random() * 2;
        const delay = Math.random() * 0.5;
        const shape = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.cssText = `
            left: ${left}%; width: ${size}px; height: ${size}px;
            background: ${color}; border-radius: ${shape};
            animation-duration: ${dur}s; animation-delay: ${delay}s;`;
        container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 4000);
}

// ==================== PULL TO REFRESH ====================
let _ptrEnabled = false;
function enablePullToRefresh(containerId) {
    const container = document.getElementById(containerId);
    if (!container || _ptrEnabled) return;
    _ptrEnabled = true;
    let startY = 0, pulling = false;
    container.addEventListener('touchstart', e => {
        if (container.scrollTop <= 0) { startY = e.touches[0].clientY; pulling = true; }
    }, { passive: true });
    container.addEventListener('touchmove', e => {
        if (!pulling) return;
        const diff = e.touches[0].clientY - startY;
        if (diff > 60) { pulling = false; refreshData(); }
    }, { passive: true });
}

function refreshData() {
    const el = document.querySelector('.ptr-indicator');
    if (el) {
        el.classList.add('visible');
        el.innerHTML = '<span class="ptr-spinner"></span> Memperbarui...';
    }
    setTimeout(() => {
        renderAll();
        if (el) { el.classList.remove('visible'); el.innerHTML = ''; }
        showToast('✅ Data diperbarui', 'success');
    }, 600);
}

// ==================== ORIGINAL ALERT FALLBACK ====================
// Keep original functions for cases where toast can't be used
function showAlertError(msg) { showToast(msg, 'error'); }
function showAlertSuccess(msg) { showToast(msg, 'success'); }

// ==================== SETTINGS ACCORDION ====================
function toggleSettingsGroup(el) {
    const header = el.classList.contains('settings-group-header') ? el : el.closest('.settings-group-header');
    if (!header) return;
    const body = header.nextElementSibling;
    if (!body || !body.classList.contains('settings-group-body')) return;
    body.classList.toggle('open');
    header.classList.toggle('open');
}

// ==================== BALANCE TOGGLE ====================

let balanceHidden = true;

// ==================== HELPERS: Payment Methods, Services, Invoice Types ====================

function getPaymentMethods() {
    return loadData(DB.settings).paymentMethods || defaultSettings.paymentMethods;
}

function savePaymentMethods(methods) {
    const s = loadData(DB.settings);
    s.paymentMethods = methods;
    saveData(DB.settings, s);
}

function getServices() {
    return loadData(DB.settings).services || defaultSettings.services;
}

function saveServices(list) {
    const s = loadData(DB.settings);
    s.services = list;
    saveData(DB.settings, s);
}

function getInvoiceTypes() {
    return loadData(DB.settings).invoiceTypes || defaultSettings.invoiceTypes;
}

function saveInvoiceTypes(list) {
    const s = loadData(DB.settings);
    s.invoiceTypes = list;
    saveData(DB.settings, s);
}

function toggleBalance() {
    balanceHidden = !balanceHidden;
    const eye = document.querySelector('#balanceEye .m-icon');
    if (eye) eye.textContent = balanceHidden ? 'visibility_off' : 'visibility';
    renderAll();
}

function getDisplayBalance(value) {
    if (balanceHidden) return 'Rp •••••••';
    return formatRupiah(value);
}

// ==================== PIN LOCK ====================

let pinTemp = '';

function showPinLock() {
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('pinLockPage').style.display = 'flex';
    pinTemp = '';
    updatePinDots();
    document.getElementById('pinError').textContent = '';
}

function hidePinLock() {
    document.getElementById('pinLockPage').style.display = 'none';
}

function pinInput(val) {
    if (val === 'cancel') { hidePinLock(); document.getElementById('mainApp').style.display = 'block'; init(); return; }
    if (val === 'back') { pinTemp = pinTemp.slice(0, -1); updatePinDots(); return; }
    if (pinTemp.length >= 6) return;
    pinTemp += val;
    updatePinDots();
    if (pinTemp.length === 6) {
        const settings = loadData(DB.settings) || {};
        if (settings.pinHash === simpleHash(pinTemp)) {
            hidePinLock();
            document.getElementById('mainApp').style.display = 'block';
            init();
        } else {
            document.getElementById('pinError').textContent = 'PIN salah! Coba lagi.';
            pinTemp = '';
            updatePinDots();
        }
    }
}

function updatePinDots() {
    for (let i = 0; i < 6; i++) {
        const dot = document.getElementById('pinDot' + i);
        if (dot) dot.textContent = i < pinTemp.length ? '●' : '○';
    }
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); hash = ((hash << 5) - hash) + c; hash |= 0; }
    return 'h' + Math.abs(hash).toString(36);
}

function savePin() {
    const pin = document.getElementById('settingPin').value;
    if (pin && pin.length !== 6) { alert('PIN harus 6 digit!'); return; }
    if (pin && !/^\d{6}$/.test(pin)) { alert('PIN hanya boleh angka 0-9!'); return; }
    const settings = loadData(DB.settings) || {};
    if (pin) {
        settings.pinHash = simpleHash(pin);
        alert('✅ PIN berhasil disimpan!');
    } else {
        delete settings.pinHash;
        alert('PIN dihapus.');
    }
    saveData(DB.settings, settings);
    document.getElementById('settingPin').value = '';
}

async function removePin() {
    if (!await showConfirm('Hapus PIN keamanan?')) return;
    const settings = loadData(DB.settings) || {};
    delete settings.pinHash;
    saveData(DB.settings, settings);
    document.getElementById('settingPin').value = '';
    alert('PIN dihapus.');
}

// ==================== APP STARTUP ====================

function startApp() {
    document.getElementById('mainApp').style.display = 'block';
    const settings = loadData(DB.settings) || {};
    if (settings.pinHash) {
        showPinLock();
    } else {
        init();
    }
}

// ==================== MULTI-USER DATA STORAGE ====================

function getStorageKey(key) {
    if (key === DB.users) return key;
    return `${key}_${currentUser?.userId || 'guest'}`;
}

function saveData(key, data) {
    const storageKey = getStorageKey(key);
    localStorage.setItem(storageKey, JSON.stringify(data));
    scheduleAutoSync();
}

function loadData(key) {
    const storageKey = getStorageKey(key);
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
}

// ==================== DATA FUNCTIONS ====================

function init() {
    const walletKey = getStorageKey(DB.wallets);
    if (!localStorage.getItem(walletKey)) {
        localStorage.setItem(walletKey, JSON.stringify(defaultWallets));
    }
    const settingsKey = getStorageKey(DB.settings);
    if (!localStorage.getItem(settingsKey)) {
        localStorage.setItem(settingsKey, JSON.stringify(defaultSettings));
    }

    const today = new Date().toISOString().split('T');
    document.getElementById('transactionDate').value = today;
    document.getElementById('debtDate').value = today;
    document.getElementById('debtDue').value = today;
    document.getElementById('receivableDate').value = today;
    document.getElementById('receivableDue').value = today;

    const settings = loadData(DB.settings);
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
    if (settings.theme === 'dark') {
        const toggleEl = document.getElementById('darkModeToggle');
        if (toggleEl) toggleEl.classList.add('active');
    }

    document.getElementById('settingEmail').value = currentUser.email;
    document.getElementById('settingUserName').value = currentUser.name;
    document.getElementById('settingBusinessName').value = settings.businessName;
    document.getElementById('settingWhatsApp').value = settings.whatsapp;
    document.getElementById('settingAddress').value = settings.address;
    
    // Load logo
    const savedLogo = localStorage.getItem('mughis_logo_dataurl');
    if (savedLogo) {
        document.getElementById('logoPreview').src = savedLogo;
        const hl = document.getElementById('headerLogo');
        if (hl) hl.src = savedLogo;
    }

    // Load AI key
    const savedAiKey = localStorage.getItem(`mughis_ai_key_${currentUser?.userId || 'guest'}`);
    if (savedAiKey) CONFIG.GEMINI_API_KEY = savedAiKey;
    const aiKeyInput = document.getElementById('settingAiKey');
    if (aiKeyInput) aiKeyInput.value = savedAiKey || '';

    loadTelegramConfig();
    recalculateAll();
    renderAll();
    renderCabangSettings();
    renderShortcutSettings();
    renderPurchases();

    setTimeout(initRipple, 500);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    
    // PWA Install Prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        const btn = document.getElementById('pwaInstallBtn');
        if (btn) btn.style.display = 'flex';
    });
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        const btn = document.getElementById('pwaInstallBtn');
        if (btn) btn.style.display = 'none';
    });

    updateSyncStatus();
    checkCloudDataAvailable();
    setTimeout(checkDueDates, 1000);
    setInterval(checkDueDates, 3600000);
}

function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatRupiah(num) {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function addActivity(desc) {
    const activities = loadData(DB.activities);
    activities.unshift({ id: generateId(), description: desc, timestamp: Date.now() });
    if (activities.length > 100) activities.pop();
    saveData(DB.activities, activities);
}

// ==================== CLOUD SYNC ====================

let syncTimeout = null;

function scheduleAutoSync() {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
        const settings = loadData(DB.settings);
        if (settings.cloudBinId) {
            syncToCloud(true);
        }
    }, 5000);
}

function updateSyncStatus() {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    const token = getTelegramToken();
    const chatId = getTelegramChatId();
    if (token && chatId) {
        el.innerHTML = '📡 Telegram: ✅ Terkonfigurasi';
    } else {
        el.innerHTML = '📡 Telegram: Backup tersimpan lokal';
    }
}

async function syncToCloud(silent = false) {
    const settings = loadData(DB.settings);
    
    const allData = {};
    Object.values(DB).forEach(key => { 
        allData[key] = loadData(key); 
    });
    allData._userId = currentUser.userId;
    allData._userEmail = currentUser.email;
    allData._syncAt = Date.now();

    try {
        let response;
        if (settings.cloudBinId) {
            response = await fetch(`${JSONBIN_API}/${settings.cloudBinId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-Master-Key': JSONBIN_KEY 
                },
                body: JSON.stringify(allData)
            });
        } else {
            response = await fetch(JSONBIN_API, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-Master-Key': JSONBIN_KEY, 
                    'X-Bin-Name': `mughis-${currentUser.userId}`, 
                    'X-Bin-Private': 'true' 
                },
                body: JSON.stringify(allData)
            });
        }

        if (response.ok) {
            const result = await response.json();
            if (!settings.cloudBinId && result.metadata?.id) {
                settings.cloudBinId = result.metadata.id;
                saveData(DB.settings, settings);
            }
            localStorage.setItem(`mughis_last_sync_${currentUser?.userId || 'guest'}`, Date.now().toString());
            if (!silent) {
                alert(`✅ Data berhasil disinkronkan ke cloud!\nBin ID: ${settings.cloudBinId}`);
            }
            updateSyncStatus();
        } else {
            throw new Error('Sync gagal: ' + response.status);
        }
    } catch (err) {
        if (!silent) {
            alert('⚠️ Sync cloud gagal. Pastikan koneksi internet aktif.\nData tetap tersimpan lokal.\n\nError: ' + err.message);
        }
    }
}

async function restoreFromCloud() {
    const settings = loadData(DB.settings);
    if (!settings.cloudBinId) {
        alert('⚠️ Belum pernah sync ke cloud. Sync dulu sebelum restore!');
        return;
    }
    
    if (!await showConfirm('⚠️ Ini akan MENIMPA semua data lokal kamu dengan data dari cloud.\nLanjutkan?')) return;
    
    try {
        const response = await fetch(`${JSONBIN_API}/${settings.cloudBinId}/latest`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json', 
                'X-Master-Key': JSONBIN_KEY 
            }
        });
        
        if (!response.ok) throw new Error('Restore gagal: ' + response.status);
        
        const result = await response.json();
        const cloudData = result.record || result;
        
        let restored = 0;
        Object.entries(cloudData).forEach(([key, value]) => { 
            if (Object.values(DB).includes(key) && Array.isArray(value)) {
                const storageKey = getStorageKey(key);
                localStorage.setItem(storageKey, JSON.stringify(value));
                restored++;
            }
        });
        
        alert(`✅ Data berhasil direstore dari cloud! (${restored} kategori)`);
        addActivity('☁️ Restore data dari cloud');
        localStorage.setItem(`mughis_last_sync_${currentUser?.userId || 'guest'}`, Date.now().toString());
        updateSyncStatus();
        recalculateAll();
        renderAll();
    } catch (err) {
        alert('⚠️ Restore cloud gagal: ' + err.message + '\nCek koneksi internet.');
    }
}

// ==================== TELEGRAM BACKUP ====================

function saveTelegramConfig() {
    const token = document.getElementById('settingTelegramToken').value.trim();
    const chatId = document.getElementById('settingTelegramChatId').value.trim();
    if (!token || !chatId) {
        alert('⚠️ Isi Bot Token dan Chat ID Telegram!');
        return;
    }
    localStorage.setItem('mughis_telegram_token', token);
    localStorage.setItem('mughis_telegram_chatid', chatId);
    alert('✅ Konfigurasi Telegram tersimpan!');
    addActivity('📡 Mengatur backup Telegram');
}

function getTelegramToken() {
    return localStorage.getItem('mughis_telegram_token') || '';
}

function getTelegramChatId() {
    return localStorage.getItem('mughis_telegram_chatid') || '';
}

async function syncToTelegram() {
    const token = getTelegramToken();
    const chatId = getTelegramChatId();
    if (!token || !chatId) {
        alert('⚠️ Konfigurasi Telegram belum diisi. Buka Settings → Backup Telegram.');
        return;
    }

    try {
        const allData = {};
        Object.values(DB).forEach(key => { allData[key] = loadData(key); });
        allData._backupAt = new Date().toISOString();
        allData._version = '2.2.0';

        const jsonStr = JSON.stringify(allData, null, 2);
        // Kirim sebagai file
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('document', blob, `mughis-backup-${new Date().toISOString().split('T')[0]}.json`);
        formData.append('caption', `📦 Backup MUGHIS BANK - ${new Date().toLocaleDateString('id-ID')}`);

        const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Gagal kirim: ' + res.status);

        document.getElementById('syncStatus').innerHTML = '📡 Telegram: Backup ' + new Date().toLocaleString('id-ID');
        addActivity('📡 Backup data ke Telegram');
        alert('✅ Data berhasil di-backup ke Telegram!');
    } catch (err) {
        alert('❌ Gagal backup ke Telegram: ' + err.message + '\nCek Token & Chat ID.');
    }
}

async function restoreFromTelegram() {
    const token = getTelegramToken();
    const chatId = getTelegramChatId();
    if (!token || !chatId) {
        alert('⚠️ Konfigurasi Telegram belum diisi.');
        return;
    }

    if (!await showConfirm('⚠️ Ini akan MENIMPA semua data lokal dengan data backup Telegram terbaru.\nLanjutkan?')) return;

    try {
        // Ambil daftar file backup terbaru
        const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        if (!res.ok) throw new Error('Gagal ambil data: ' + res.status);
        const data = await res.json();

        // Cari dokumen terbaru yang dikirim ke chat ini
        let latestFile = null;
        let latestDate = 0;
        (data.result || []).forEach(update => {
            const doc = update.message?.document;
            if (doc && doc.file_name && doc.file_name.startsWith('mughis-backup-')) {
                if (update.message.date > latestDate) {
                    latestFile = doc;
                    latestDate = update.message.date;
                }
            }
        });

        if (!latestFile) {
            alert('❌ Tidak ada file backup di Telegram. Backup dulu sebelum restore!');
            return;
        }

        // Dapatkan file path
        const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${latestFile.file_id}`);
        const fileData = await fileRes.json();
        if (!fileData.ok) throw new Error('Gagal dapatkan file');

        const filePath = fileData.result.file_path;
        const downloadRes = await fetch(`https://api.telegram.org/bot${token}/${filePath}`);
        const cloudData = await downloadRes.json();

        let restored = 0;
        Object.entries(cloudData).forEach(([key, value]) => {
            if (Object.values(DB).includes(key) && Array.isArray(value)) {
                const storageKey = getStorageKey(key);
                localStorage.setItem(storageKey, JSON.stringify(value));
                restored++;
            }
        });

        alert(`✅ Data berhasil direstore dari Telegram! (${restored} kategori)`);
        addActivity('📡 Restore data dari Telegram');
        recalculateAll();
        renderAll();
    } catch (err) {
        alert('❌ Gagal restore: ' + err.message);
    }
}

function loadTelegramConfig() {
    const token = getTelegramToken();
    const chatId = getTelegramChatId();
    const tokenInput = document.getElementById('settingTelegramToken');
    const chatInput = document.getElementById('settingTelegramChatId');
    if (tokenInput && token) tokenInput.value = token;
    if (chatInput && chatId) chatInput.value = chatId;
    if (token && chatId) {
        document.getElementById('syncStatus').innerHTML = '📡 Telegram: ✅ Terkonfigurasi';
    }
}

// Cek apakah ada data cloud untuk user ini
async function checkCloudDataAvailable() {
    const settings = loadData(DB.settings);
    const el = document.getElementById('restoreBtn');
    if (!settings.cloudBinId) {
        if (el) el.style.display = 'none';
        return;
    }
    try {
        const response = await fetch(`${JSONBIN_API}/${settings.cloudBinId}/latest`, {
            method: 'GET',
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        if (response.ok && el) el.style.display = 'block';
    } catch {
        if (el) el.style.display = 'none';
    }
}

// ==================== GOOGLE DRIVE SYNC ====================

let driveTokenClient = null;
let driveAccessToken = null;

function getDriveFileId() {
    return localStorage.getItem(`mughis_drive_fileid_${currentUser?.userId || 'guest'}`);
}

function setDriveFileId(id) {
    localStorage.setItem(`mughis_drive_fileid_${currentUser?.userId || 'guest'}`, id);
}

function isDriveConnected() {
    return !!localStorage.getItem(`mughis_drive_token_${currentUser?.userId || 'guest'}`);
}

function initDriveTokenClient() {
    try {
        driveTokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.DRIVE_CLIENT_ID,
            scope: CONFIG.DRIVE_SCOPE,
            callback: (response) => {
                if (response.access_token) {
                    driveAccessToken = response.access_token;
                    localStorage.setItem(`mughis_drive_token_${currentUser?.userId || 'guest'}`, JSON.stringify({
                        token: response.access_token,
                        expiresAt: Date.now() + (response.expires_in || 3600) * 1000
                    }));
                    updateDriveStatus();
                    alert('✅ Google Drive berhasil dihubungkan!');
                    // Auto sync setelah connect
                    syncToDrive(true);
                }
            },
            error_callback: (err) => {
                alert('❌ Gagal connect Google Drive: ' + (err.message || err.type || 'Unknown error'));
            }
        });
    } catch (e) {
        console.error('Drive init error:', e);
    }
}

function connectDrive() {
    if (!CONFIG.DRIVE_CLIENT_ID || CONFIG.DRIVE_CLIENT_ID.startsWith('YOUR_')) {
        alert('⚠️ Google Drive Client ID belum diisi!\n\nBuka file js/config.js dan isi DRIVE_CLIENT_ID dengan Client ID dari Google Cloud Console.\n\nAtau gunakan Push ke Cloud (JSONBin) untuk sementara.');
        return;
    }
    if (!driveTokenClient) initDriveTokenClient();
    if (driveTokenClient) {
        driveTokenClient.requestAccessToken({ prompt: 'consent' });
    }
}

async function disconnectDrive() {
    if (!await showConfirm('Putuskan koneksi Google Drive?')) return;
    localStorage.removeItem(`mughis_drive_token_${currentUser?.userId || 'guest'}`);
    localStorage.removeItem(`mughis_drive_fileid_${currentUser?.userId || 'guest'}`);
    driveAccessToken = null;
    updateDriveStatus();
    alert('✅ Google Drive diputuskan.');
}

async function syncToDrive(silent = false) {
    const tokenData = JSON.parse(localStorage.getItem(`mughis_drive_token_${currentUser?.userId || 'guest'}`) || 'null');
    if (!tokenData || !tokenData.token) {
        if (!silent) alert('⚠️ Google Drive belum terhubung. Klik "Hubungkan Google Drive" dulu.');
        return;
    }
    
    // Cek kadaluarsa
    if (Date.now() > tokenData.expiresAt) {
        if (!silent) alert('⏰ Token Google Drive kadaluarsa. Klik "Hubungkan Google Drive" lagi.');
        return;
    }
    
    driveAccessToken = tokenData.token;
    
    try {
        const allData = {};
        Object.values(DB).forEach(key => { allData[key] = loadData(key); });
        allData._appVersion = '2.1.0';
        allData._userId = currentUser?.userId;
        allData._syncAt = new Date().toISOString();
        
        const jsonStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        
        const fileId = getDriveFileId();
        let response;
        
        if (fileId) {
            // Update existing file
            response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${driveAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: jsonStr
            });
            if (!response.ok) throw new Error('Update gagal: ' + response.status);
        } else {
            // Cari file existing dulu
            const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='mughis-bank-data.json' and 'appDataFolder' in parents&spaces=appDataFolder`, {
                headers: { 'Authorization': `Bearer ${driveAccessToken}` }
            });
            const searchData = await searchRes.json();
            const existingFile = searchData.files?.[0];
            
            if (existingFile) {
                setDriveFileId(existingFile.id);
                response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${driveAccessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: jsonStr
                });
                if (!response.ok) throw new Error('Update gagal: ' + response.status);
            } else {
                // Buat file baru di AppData
                const form = new FormData();
                const metadata = new Blob([JSON.stringify({ name: 'mughis-bank-data.json', parents: ['appDataFolder'] })], { type: 'application/json' });
                form.append('metadata', metadata);
                form.append('file', blob, 'mughis-bank-data.json');
                
                response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${driveAccessToken}` },
                    body: form
                });
                if (!response.ok) throw new Error('Create gagal: ' + response.status);
                const result = await response.json();
                setDriveFileId(result.id);
            }
        }
        
        localStorage.setItem(`mughis_last_drive_sync_${currentUser?.userId || 'guest'}`, Date.now().toString());
        if (!silent) alert('✅ Data berhasil disimpan ke Google Drive!');
        updateDriveStatus();
        addActivity('☁️ Sync ke Google Drive');
    } catch (err) {
        if (!silent) alert('❌ Gagal sync ke Google Drive: ' + err.message);
    }
}

async function restoreFromDrive(silent = false) {
    const tokenData = JSON.parse(localStorage.getItem(`mughis_drive_token_${currentUser?.userId || 'guest'}`) || 'null');
    if (!tokenData || !tokenData.token) {
        if (!silent) alert('⚠️ Google Drive belum terhubung.');
        return;
    }
    if (Date.now() > tokenData.expiresAt) {
        if (!silent) alert('⏰ Token kadaluarsa. Hubungkan ulang.');
        return;
    }
    
    if (!silent && !await showConfirm('⚠️ Timpa data lokal dengan data dari Google Drive?')) return;
    
    driveAccessToken = tokenData.token;
    const fileId = getDriveFileId();
    if (!fileId) {
        if (!silent) alert('Belum ada file di Google Drive. Sync dulu sebelum restore.');
        return;
    }
    
    try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': `Bearer ${driveAccessToken}` }
        });
        if (!response.ok) throw new Error('Download gagal: ' + response.status);
        
        const cloudData = await response.json();
        let restored = 0;
        Object.entries(cloudData).forEach(([key, value]) => { 
            if (Object.values(DB).includes(key) && Array.isArray(value)) {
                const storageKey = getStorageKey(key);
                localStorage.setItem(storageKey, JSON.stringify(value));
                restored++;
            }
        });
        
        alert(`✅ Berhasil restore ${restored} kategori dari Google Drive!`);
        addActivity('☁️ Restore dari Google Drive');
        recalculateAll();
        renderAll();
    } catch (err) {
        if (!silent) alert('❌ Gagal restore: ' + err.message);
    }
}

function updateDriveStatus() {
    const el = document.getElementById('driveStatus');
    if (!el) return;
    const connected = isDriveConnected();
    const lastSync = localStorage.getItem(`mughis_last_drive_sync_${currentUser?.userId || 'guest'}`);
    
    const connectBtn = document.getElementById('driveConnectBtn');
    const syncBtn = document.getElementById('driveSyncBtn');
    const restoreBtn = document.getElementById('driveRestoreBtn');
    const disconnectBtn = document.getElementById('driveDisconnectBtn');
    
    if (connected) {
        el.innerHTML = `✅ Google Drive: Terhubung${lastSync ? ' (sync ' + new Date(parseInt(lastSync)).toLocaleString('id-ID') + ')' : ''}`;
        if (connectBtn) connectBtn.style.display = 'none';
        if (syncBtn) syncBtn.style.display = 'block';
        if (restoreBtn) restoreBtn.style.display = 'block';
        if (disconnectBtn) disconnectBtn.style.display = 'block';
    } else {
        el.innerHTML = `⬜ Google Drive: Belum terhubung`;
        if (connectBtn) connectBtn.style.display = 'block';
        if (syncBtn) syncBtn.style.display = 'none';
        if (restoreBtn) restoreBtn.style.display = 'none';
        if (disconnectBtn) disconnectBtn.style.display = 'none';
    }
}

// ==================== RECALCULATION ====================

function recalculateWalletBalance() {
    const wallets = loadData(DB.wallets);
    const transactions = loadData(DB.transactions);
    const debts = loadData(DB.debts);
    const receivables = loadData(DB.receivables);
    
    wallets.forEach(w => {
        let balance = 0;
        
        // Transaksi biasa
        transactions.forEach(t => {
            if (t.walletId === w.id) {
                if (t.type === 'income' || t.type === 'transfer_in') balance += parseFloat(t.amount);
                else if (t.type === 'expense' || t.type === 'transfer_out') balance -= parseFloat(t.amount);
            }
        });
        
        // Hutang menambah saldo (uang masuk dari pemberi hutang)
        debts.forEach(d => {
            if (d.walletId === w.id && d.status !== 'Lunas') {
                balance += parseFloat(d.amount);
            }
        });
        
        // Piutang mengurangi saldo (uang keluar ke peminjam)
        receivables.forEach(r => {
            if (r.walletId === w.id && r.status !== 'Lunas') {
                balance -= parseFloat(r.amount);
            }
        });
        
        w.balance = balance;
    });
    
    saveData(DB.wallets, wallets);
    return wallets;
}

function recalculateDashboard() {
    const transactions = loadData(DB.transactions);
    const debts = loadData(DB.debts);
    const receivables = loadData(DB.receivables);
    const wallets = recalculateWalletBalance();
    const pesanList = typeof getPesanData === 'function' ? getPesanData() : [];
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    // ---- KEUANGAN (dari transaksi biasa) ----
    let financeIncome = 0, financeExpense = 0;
    let monthFinanceIncome = 0, monthFinanceExpense = 0;
    
    // ---- PESANAN ----
    let invoiceIncome = 0, totalModalOut = 0;
    let monthInvoiceIncome = 0, monthModalOut = 0;
    let pesanPaidCount = 0, pesanUnpaidCount = 0, pesanDPCount = 0;
    
    // ---- HUTANG & PIUTANG ----
    let debtPaid = 0, receivablePaid = 0;
    
    // Proses transaksi keuangan (skip income pesan, tapi tetap hitung modal keluar)
    transactions.forEach(t => {
        if ((t.pesanId || t.invoiceId) && !t.isModalKeluar) return;
        const amt = parseFloat(t.amount) || 0;
        const tDate = new Date(t.date);
        const isMonth = tDate.getMonth() === thisMonth && tDate.getFullYear() === thisYear;
        
        if (t.type === 'income') {
            financeIncome += amt;
            if (isMonth) monthFinanceIncome += amt;
        } else if (t.type === 'expense') {
            if (t.isModalKeluar) {
                totalModalOut += amt;
                if (isMonth) monthModalOut += amt;
            } else {
                financeExpense += amt;
                if (isMonth) monthFinanceExpense += amt;
            }
        }
    });
    
    // Proses pesanan (pendapatan)
    pesanList.forEach(p => {
        const pDate = new Date(p.date);
        const pTotal = parseFloat(p.total || 0);
        const isMonth = pDate.getMonth() === thisMonth && pDate.getFullYear() === thisYear;
        if (p.status === 'Lunas') {
            invoiceIncome += pTotal;
            if (isMonth) monthInvoiceIncome += pTotal;
            pesanPaidCount++;
        } else if (p.status === 'DP') {
            const dp = parseFloat(p.dp || 0);
            invoiceIncome += dp;
            if (isMonth) monthInvoiceIncome += dp;
            pesanDPCount++;
            pesanUnpaidCount++;
        } else {
            pesanUnpaidCount++;
        }
    });

    // Proses hutang (yang sudah lunas = pengeluaran)
    debts.forEach(d => {
        if (d.status === 'Lunas') {
            debtPaid += parseFloat(d.amount) || 0;
        }
    });
    // Proses piutang (yang sudah lunas = pemasukan)
    receivables.forEach(r => {
        if (r.status === 'Lunas') {
            receivablePaid += parseFloat(r.amount) || 0;
        }
    });
    
    // Total hutang/piutang yang belum lunas
    const totalDebt = debts.filter(d => d.status !== 'Lunas').reduce((s, d) => s + parseFloat(d.amount), 0);
    const totalReceivable = receivables.filter(r => r.status !== 'Lunas').reduce((s, r) => s + parseFloat(r.amount), 0);
    
    return {
        totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
        
        // Keuangan
        financeIncome,
        financeExpense,
        financeNet: financeIncome - financeExpense,
        monthFinanceIncome,
        monthFinanceExpense,
        
        // Pesanan
        invoiceIncome,
        totalModalOut,
        invoiceNet: invoiceIncome - totalModalOut,
        monthInvoiceIncome,
        monthModalOut,
        monthInvoiceNet: monthInvoiceIncome - monthModalOut,
        
        // Hutang & Piutang
        debtPaid,
        receivablePaid,
        debtNet: receivablePaid - debtPaid,
        totalDebt,
        totalReceivable,
        totalDebtReceivable: totalDebt + totalReceivable,
        
        // Ringkasan Pesanan
        paidInvoiceCount: pesanPaidCount,
        unpaidInvoiceCount: pesanUnpaidCount,
        invoiceDPCount: pesanDPCount
    };
}

function recalculateAll() {
    recalculateWalletBalance();
    recalculateDashboard();
}

// ==================== RENDER FUNCTIONS ====================

function renderAll() {
    const stats = recalculateDashboard();
    
    // Balance with eye toggle
    const totalEl = document.getElementById('totalBalance');
    if (totalEl) {
        if (balanceHidden) totalEl.textContent = 'Rp •••••••';
        else totalEl.textContent = formatRupiah(stats.totalBalance);
    }
    // Greeting name
    const greetEl = document.getElementById('headerGreetingName');
    if (greetEl) {
        const s = loadData(DB.settings) || {};
        greetEl.textContent = s.userName || s.businessName?.split(' ')[0] || 'Aghis';
    }
    
    // Executive KPI Dashboard
    const fillKPI = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = getDisplayBalance(val); };
    fillKPI('dashInvoiceIncome', stats.invoiceIncome);
    fillKPI('dashTotalExpense', stats.financeExpense);
    fillKPI('dashModalOut', stats.totalModalOut);
    fillKPI('dashNetProfit', stats.invoiceNet);
    fillKPI('dashTotalBalance', stats.totalBalance);
    document.getElementById('dashInvoiceActive') && (document.getElementById('dashInvoiceActive').textContent = stats.unpaidInvoiceCount + stats.paidInvoiceCount);
    document.getElementById('dashInvoiceDP') && (document.getElementById('dashInvoiceDP').textContent = stats.invoiceDPCount || 0);
    document.getElementById('dashInvoiceLunas') && (document.getElementById('dashInvoiceLunas').textContent = stats.paidInvoiceCount);
    const elFNet = document.getElementById('dashFinanceNet');
    if (elFNet) { elFNet.textContent = getDisplayBalance(stats.financeNet); elFNet.style.color = stats.financeNet >= 0 ? 'var(--success)' : 'var(--danger)'; }
    
    // Keuangan
    const elFI = document.getElementById('dashFinanceIncome');
    if (elFI) elFI.textContent = getDisplayBalance(stats.financeIncome);
    const elFE = document.getElementById('dashFinanceExpense');
    
    // Invoice summary
    document.getElementById('dashInvoiceIncome') && (document.getElementById('dashInvoiceIncome').textContent = getDisplayBalance(stats.invoiceIncome));
    document.getElementById('dashModalOut') && (document.getElementById('dashModalOut').textContent = getDisplayBalance(stats.totalModalOut));
    const elIN = document.getElementById('dashInvoiceNet');
    if (elIN) { elIN.textContent = getDisplayBalance(stats.invoiceNet); elIN.style.color = stats.invoiceNet >= 0 ? 'var(--success)' : 'var(--danger)'; }
    
    // Bulan Ini
    const fillMonth = (id, val, isCurrency = true) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (isCurrency) el.textContent = getDisplayBalance(val);
        else el.textContent = val;
    };
    fillMonth('monthInvoiceIncome', stats.monthInvoiceIncome);
    fillMonth('monthModalOut', stats.monthModalOut);
    const elMP = document.getElementById('monthProfit');
    if (elMP) { elMP.textContent = getDisplayBalance(stats.monthInvoiceNet); elMP.style.color = stats.monthInvoiceNet >= 0 ? 'var(--success)' : 'var(--danger)'; }
    fillMonth('monthFinanceIncome', stats.monthFinanceIncome);
    fillMonth('monthFinanceExpense', stats.monthFinanceExpense);
    
    renderInsights(stats);
    renderChart();
    renderActivities();
    renderWallets();
    renderTransactions();
    renderCustomers();
    renderProducts();
    renderDebts();
    renderReceivables();
    if (typeof renderPesan === 'function') renderPesan();
    if (typeof renderRecentPesan === 'function') renderRecentPesan();
    renderReports();
    updateWalletSelects();
    renderCabangFilter();
    renderQuickMenu();
    renderDashChart();
}

function renderInsights(stats) {
    const container = document.getElementById('businessInsights');
    if (!container) return;
    
    const insights = [];
    const pesanData = typeof getPesanData === 'function' ? getPesanData() : [];
    const transactions = loadData(DB.transactions);
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    // Last month comparison
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    
    let lastMonthExpense = 0;
    transactions.forEach(t => {
        const td = new Date(t.date);
        if (td.getMonth() === lastMonth && td.getFullYear() === lastMonthYear && t.type === 'expense') {
            lastMonthExpense += parseFloat(t.amount) || 0;
        }
    });
    
    if (lastMonthExpense > 0 && stats.monthFinanceExpense > 0) {
        const change = ((stats.monthFinanceExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(0);
        if (change > 0) {
            insights.push(`Pengeluaran bulan ini meningkat ${change}% dibanding bulan lalu.`);
        } else if (change < 0) {
            insights.push(`Pengeluaran bulan ini turun ${Math.abs(change)}% dibanding bulan lalu.`);
        }
    }
    
    // Top pesan type
    const typeCount = {};
    pesanData.forEach(p => {
        if (p.status === 'Lunas') {
            typeCount[p.type] = (typeCount[p.type] || 0) + parseFloat(p.total || 0);
        }
    });
    const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
    if (topType) {
        const typeLabel = { print: 'Percetakan', laptop: 'Laptop', handphone: 'Handphone', tiktok: 'TikTok', umum: 'Umum' };
        insights.push(`${typeLabel[topType[0]] || topType[0]} menjadi sumber pemasukan terbesar.`);
    }
    
    // Consecutive profit growth
    const monthlyProfits = [];
    for (let m = 5; m >= 0; m--) {
        let month = thisMonth - m;
        let year = thisYear;
        if (month < 0) { month += 12; year -= 1; }
        let inc = 0, exp = 0;
        transactions.forEach(t => {
            const td = new Date(t.date);
            if (td.getMonth() === month && td.getFullYear() === year) {
                const amt = parseFloat(t.amount) || 0;
                if (t.type === 'income') inc += amt;
                else if (t.type === 'expense') exp += amt;
            }
        });
        monthlyProfits.push(inc - exp);
    }
    
    let growthCount = 0;
    for (let i = monthlyProfits.length - 1; i > 0; i--) {
        if (monthlyProfits[i] > monthlyProfits[i-1]) growthCount++;
        else break;
    }
    if (growthCount >= 2) {
        insights.push(`Laba bersih meningkat selama ${growthCount} bulan berturut-turut.`);
    }
    
    // Health check
    if (stats.invoiceNet > 0 && stats.totalBalance > 0) {
        insights.push(`Performa bisnis dalam kondisi sehat.`);
    } else if (stats.invoiceNet <= 0) {
        insights.push(`Evaluasi pengeluaran diperlukan. Laba bersih belum positif.`);
    }
    
    if (insights.length === 0) {
        insights.push('Belum cukup data untuk analisis. Tambah transaksi dan pesanan untuk insight.');
    }
    
    const icons = ['lightbulb', 'trending_up', 'bar_chart', 'health_and_safety', 'analytics'];
    container.innerHTML = insights.slice(0, 4).map((text, i) => `
        <div class="insight-item">
            <span class="m-icon">${icons[i % icons.length]}</span>
            <span>${text}</span>
        </div>
    `).join('');
}

function renderChart() {
    const transactions = loadData(DB.transactions);
    const days = [], incomeData = [], expenseData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T');
        days.push(d.toLocaleDateString('id-ID', { weekday: 'short' }));
        let inc = 0, exp = 0;
        transactions.forEach(t => {
            if (t.date === dateStr) {
                if (t.type === 'income') inc += parseFloat(t.amount);
                else if (t.type === 'expense') exp += parseFloat(t.amount);
            }
        });
        incomeData.push(inc);
        expenseData.push(exp);
    }

    window._chartIncome = incomeData;
    window._chartExpense = expenseData;
    window._chartDays = days;

    const ctx = document.getElementById('financeChartCanvas');
    if (!ctx) return;
    if (window._financeChart) { window._financeChart.destroy(); }
    
    window._financeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                { label: 'Pemasukan', data: incomeData, backgroundColor: 'rgba(201,168,122,0.8)', borderRadius: 4, barPercentage: 0.4 },
                { label: 'Pengeluaran', data: expenseData, backgroundColor: 'rgba(119,91,91,0.8)', borderRadius: 4, barPercentage: 0.4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } },
            scales: {
                y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
}

function switchChart(type) {
    document.querySelectorAll('.chart-tabs .tab').forEach(t => t.classList.remove('active'));
    const tabMap = { incomeExpense: 'chartTabIE', pie: 'chartTabPie', monthly: 'chartTabMonthly' };
    const btn = document.getElementById(tabMap[type]);
    if (btn) btn.classList.add('active');

    const ctx = document.getElementById('financeChartCanvas');
    if (!ctx) return;
    if (window._financeChart) { window._financeChart.destroy(); }

    const transactions = loadData(DB.transactions);
    const pesanData = typeof getPesanData === 'function' ? getPesanData() : [];
    const now = new Date();

    if (type === 'incomeExpense') {
        renderChart();
        return;
    }

    if (type === 'pie') {
        const catIncome = {}, catExpense = {};
        transactions.forEach(t => {
            const amt = parseFloat(t.amount);
            if (t.type === 'income') catIncome[t.category] = (catIncome[t.category] || 0) + amt;
            else if (t.type === 'expense' && !t.isModalKeluar) catExpense[t.category] = (catExpense[t.category] || 0) + amt;
        });
        const labels = [...Object.keys(catIncome), ...Object.keys(catExpense)];
        const data = [...Object.values(catIncome), ...Object.values(catExpense)];
        const palette = ['#C9A87A','#775B5B','#D4B88E','#9B7E7E','#B8945E','#5E4646','#E2C9A0','#EDE4E1'];
        const colors = labels.map((_, i) => palette[i % palette.length]);
        
        window._financeChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, padding: 6, font: { size: 10 } } }
                }
            }
        });
        return;
    }

    if (type === 'monthly') {
        const monthlyData = {};
        for (let m = 5; m >= 0; m--) {
            const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
            const key = d.toLocaleDateString('id-ID', { month: 'short' });
            monthlyData[key] = { income: 0, expense: 0, profit: 0 };
        }
        transactions.forEach(t => {
            const d = new Date(t.date);
            const key = d.toLocaleDateString('id-ID', { month: 'short' });
            if (monthlyData[key]) {
                const amt = parseFloat(t.amount);
                if (t.type === 'income') monthlyData[key].income += amt;
                else if (t.type === 'expense') monthlyData[key].expense += amt;
            }
        });
        pesanData.forEach(p => {
            const d = new Date(p.date);
            const key = d.toLocaleDateString('id-ID', { month: 'short' });
            if (monthlyData[key]) {
                if (p.status === 'Lunas') monthlyData[key].profit += parseFloat(p.total || 0);
                else if (p.status === 'DP') monthlyData[key].profit += parseFloat(p.dp || 0);
            }
        });
        const labels = Object.keys(monthlyData);
        const incomeArr = labels.map(k => monthlyData[k].income);
        const expenseArr = labels.map(k => monthlyData[k].expense);
        const profitArr = labels.map(k => monthlyData[k].profit);

        window._financeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Pemasukan', data: incomeArr, borderColor: '#C9A87A', backgroundColor: 'rgba(201,168,122,0.1)', tension: 0.3, pointRadius: 3, fill: true },
                    { label: 'Pengeluaran', data: expenseArr, borderColor: '#775B5B', backgroundColor: 'rgba(119,91,91,0.1)', tension: 0.3, pointRadius: 3, fill: true },
                    { label: 'Laba Pesanan', data: profitArr, borderColor: '#C9A87A', backgroundColor: 'rgba(201,168,122,0.05)', tension: 0.3, pointRadius: 3, fill: true, borderDash: [5,3] }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 6, font: { size: 10 } } } },
                scales: { y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } }
            }
        });
    }
}

function renderActivities() {
    const activities = loadData(DB.activities).slice(0, 10);
    const container = document.getElementById('recentActivity');
    if (activities.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Belum ada aktivitas</p></div>';
        return;
    }
    container.innerHTML = activities.map(a => `
        <div class="list-item" onclick="showActivityDetail('${a.id}')">
            <div class="list-icon" style="background:var(--surface-2)">📝</div>
            <div class="list-content">
                <div class="list-title">${a.description}</div>
                <div class="list-subtitle">${formatDateTime(a.timestamp)}</div>
            </div>
        </div>`).join('');
}

function showActivityDetail(activityId) {
    const activities = loadData(DB.activities);
    const activity = activities.find(a => a.id === activityId || a.time == activityId);
    if (!activity) return;
    
    const icon = activity.icon || '📝';
    const desc = activity.desc || activity.text || activity.description || '-';
    const ts = activity.time || activity.timestamp || Date.now();
    const d = new Date(ts);
    const fullDate = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const fullTime = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    
    const detail = `
        <div style="padding: 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">${icon}</div>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${desc}</div>
            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
                ${fullDate}<br>${fullTime}
            </div>
            <button class="btn btn-outline" onclick="closeModal('activityDetailModal')" style="margin-top: 16px;">Tutup</button>
        </div>
    `;
    
    document.getElementById('activityDetailContent').innerHTML = detail;
    openModal('activityDetailModal');
}

// ==================== DASHBOARD CHART ====================

let dashChart = null;
let dashChartType = 'bar';

function renderDashChart() {
    const ctx = document.getElementById('dashChartCanvas');
    if (!ctx) return;
    if (dashChart) dashChart.destroy();

    const transactions = loadData(DB.transactions);
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let income = 0, expense = 0;
    const catIncome = {}, catExpense = {};

    transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() !== month || d.getFullYear() !== year) return;
        const amt = parseFloat(t.amount) || 0;
        if (t.type === 'income') {
            income += amt;
            catIncome[t.category || 'Lainnya'] = (catIncome[t.category || 'Lainnya'] || 0) + amt;
        } else if (t.type === 'expense' && !t.isModalKeluar) {
            expense += amt;
            catExpense[t.category || 'Lainnya'] = (catExpense[t.category || 'Lainnya'] || 0) + amt;
        }
    });

    if (dashChartType === 'pie') {
        // Pie: income vs expense
        const palette = ['#C9A87A', '#775B5B'];
        dashChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pemasukan', 'Pengeluaran'],
                datasets: [{ data: [income, expense], backgroundColor: palette, borderWidth: 0 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8, font: { size: 10 } } }
                }
            }
        });
        document.getElementById('dashChartPieBtn')?.classList.add('active');
        document.getElementById('dashChartBarBtn')?.classList.remove('active');
    } else {
        // Bar: income vs expense by category
        const allCats = [...new Set([...Object.keys(catIncome), ...Object.keys(catExpense)])];
        const incData = allCats.map(c => catIncome[c] || 0);
        const expData = allCats.map(c => catExpense[c] || 0);
        dashChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: allCats,
                datasets: [
                    { label: 'Pemasukan', data: incData, backgroundColor: 'rgba(201,168,122,0.7)', borderRadius: 3 },
                    { label: 'Pengeluaran', data: expData, backgroundColor: 'rgba(119,91,91,0.7)', borderRadius: 3 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 9 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 8 }, maxRotation: 45 } }
                }
            }
        });
        document.getElementById('dashChartBarBtn')?.classList.add('active');
        document.getElementById('dashChartPieBtn')?.classList.remove('active');
    }
}

function switchDashChart(type) {
    dashChartType = type;
    renderDashChart();
}

function renderWallets() {
    const wallets = loadData(DB.wallets);
    document.getElementById('walletList').innerHTML = wallets.map(w => `
        <div class="wallet-card">
            <div class="wallet-name">${w.icon} ${w.name}</div>
            <div class="wallet-balance">${formatRupiah(w.balance)}</div>
            <div class="wallet-actions">
                <button class="wallet-btn" onclick="openTransferModal('${w.id}')">↔️ Transfer</button>
                <button class="wallet-btn" onclick="editWallet('${w.id}')">✏️ Edit</button>
                <button class="wallet-btn" onclick="deleteWallet('${w.id}')">🗑️ Hapus</button>
            </div>
        </div>`).join('');
}

function renderTransactions() {
    const transactions = loadData(DB.transactions).sort((a, b) => new Date(b.date) - new Date(a.date));
    const wallets = loadData(DB.wallets);
    const walletMap = Object.fromEntries(wallets.map(w => [w.id, w]));
    
    // Apply cabang filter
    const cabangFilter = document.getElementById('cabangFilter');
    const activeCabang = cabangFilter ? cabangFilter.value : '';
    const filtered = activeCabang ? transactions.filter(t => t.cabang === activeCabang) : transactions;
    
    const incomeList = filtered.filter(t => t.type === 'income');
    const expenseList = filtered.filter(t => t.type === 'expense' && !t.isModalKeluar);
    const modalList = filtered.filter(t => t.type === 'expense' && t.isModalKeluar);
    const transferList = filtered.filter(t => t.type === 'transfer_in' || t.type === 'transfer_out');
    
    const renderList = (list, containerId) => {
        const container = document.getElementById(containerId);
        if (list.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Belum ada transaksi</p></div>';
            return;
        }
        container.innerHTML = list.map(t => {
            const isIncome = t.type === 'income' || t.type === 'transfer_in';
            const isExpense = t.type === 'expense' || t.type === 'transfer_out';
            return `
            <div class="card">
                <div class="list-item" style="padding-top:0">
                    <div class="list-icon" style="background:${isIncome?'rgba(201,168,122,0.15)':'rgba(119,91,91,0.12)'}">${isIncome?'📥':'📤'}</div>
                    <div class="list-content">
                        <div class="list-title">${t.description}</div>
                        <div class="list-subtitle">${formatDate(t.date)} • ${t.category} • ${walletMap[t.walletId]?.name||'-'}${t.cabang ? ' • <span class="cabang-tag">' + t.cabang + '</span>' : ''}</div>
                    </div>
                    <div class="list-amount ${t.type}">${isIncome?'+':'-'} ${formatRupiah(t.amount)}</div>
                </div>
                <div style="display:flex;gap:8px;padding:0 0 12px;margin-top:8px">
                    <button class="btn btn-outline" style="padding:6px;font-size:12px;flex:1" onclick="editTransaction('${t.id}')">Edit</button>
                    <button class="btn btn-danger" style="padding:6px;font-size:12px;flex:1" onclick="deleteTransaction('${t.id}')">Hapus</button>
                </div>
            </div>`;
        }).join('');
    };
    renderList(incomeList, 'incomeList');
    renderList(expenseList, 'expenseList');
    renderList(modalList, 'modalList');
    renderList(transferList, 'transferList');
}

function renderCustomers() {
    const search = document.getElementById('customerSearch')?.value.toLowerCase() || '';
    const sortBy = document.getElementById('customerSort')?.value || 'name';
    let customers = loadData(DB.customers)
        .filter(c => !search || c.name.toLowerCase().includes(search) || c.phone.includes(search));
    if (sortBy === 'name') customers.sort((a, b) => a.name.localeCompare(b.name));
    else customers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const container = document.getElementById('customerList');
    if (customers.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><p>Belum ada pelanggan</p></div>';
        return;
    }
    const pesanList = typeof getPesanData === 'function' ? getPesanData() : [];
    container.innerHTML = customers.map(c => {
        const custPesan = pesanList.filter(p => p.customerId === c.id);
        const totalPesan = custPesan.length;
        const totalSpent = custPesan.reduce((s, p) => s + parseFloat(p.total || 0), 0);
        return `
        <div class="card">
            <div class="list-item" style="padding-top:0">
                <div class="list-icon" style="background:rgba(201,168,122,0.15)">👤</div>
                <div class="list-content">
                    <div class="list-title">${c.name}</div>
                    <div class="list-subtitle">${c.phone||'-'} • ${c.address||'-'}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:13px;font-weight:700">${totalPesan} psn</div>
                    <div style="font-size:11px;color:var(--text-secondary)">${formatRupiah(totalSpent)}</div>
                </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px">
                <button class="btn btn-outline" style="padding:6px;font-size:12px;flex:1" onclick="viewCustomerPesan('${c.id}')">📄 Pesanan</button>
                <button class="btn btn-outline" style="padding:6px;font-size:12px;flex:1" onclick="editCustomer('${c.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:6px;font-size:12px;flex:1" onclick="deleteCustomer('${c.id}')">Hapus</button>
            </div>
        </div>`; }).join('');
}

function viewCustomerPesan(customerId) {
    const customer = loadData(DB.customers).find(c => c.id === customerId);
    if (!customer) return;
    const searchEl = document.getElementById('pesanSearch');
    if (searchEl) searchEl.value = customer.name;
    showPage('pesan');
    if (typeof renderPesan === 'function') renderPesan();
}

function renderProducts() {
    const type = document.getElementById('productType')?.value || 'service';
    const products = loadData(DB.products).filter(p => p.type === type || !p.type);
    const container = document.getElementById('productList');
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>Belum ada data</p></div>';
        return;
    }
    container.innerHTML = products.map(p => `
        <div class="card">
            <div class="list-item" style="padding-top:0">
                <div class="list-icon" style="background:#f3e8ff">📦</div>
                <div class="list-content">
                    <div class="list-title">${p.name} ${p.stock !== undefined && p.stock !== null ? `<span class="badge badge-success">Stok: ${p.stock}</span>` : ''}</div>
                    <div class="list-subtitle">${p.category} • ${formatRupiah(p.price)}</div>
                </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
                ${p.stock !== undefined && p.stock !== null ? `
                <button class="btn btn-outline" style="padding:6px 10px;font-size:14px;flex:0" onclick="adjustStock('${p.id}', 1)">+</button>
                <button class="btn btn-outline" style="padding:6px 10px;font-size:14px;flex:0" onclick="adjustStock('${p.id}', -1)" ${p.stock <= 0 ? 'disabled' : ''}>-</button>
                <span style="font-size:13px;font-weight:600;padding:6px 8px">Stok: ${p.stock}</span>
                ` : ''}
                <button class="btn btn-outline" style="padding:6px;font-size:12px;flex:1" onclick="editProduct('${p.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:6px;font-size:12px;flex:1" onclick="deleteProduct('${p.id}')">Hapus</button>
            </div>
        </div>`).join('');
}

function renderDebts() {
    const debts = loadData(DB.debts).sort((a, b) => new Date(b.date) - new Date(a.date));
    const container = document.getElementById('debtList');
    if (debts.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">💳</div><p>Belum ada hutang</p></div>';
        return;
    }
    container.innerHTML = debts.map(d => `
        <div class="card">
            <div class="list-item" style="padding-top:0">
                <div class="list-icon" style="background:#fef3c7">💳</div>
                <div class="list-content">
                    <div class="list-title">${d.name}</div>
                    <div class="list-subtitle">${formatDate(d.date)} • Jatuh tempo: ${formatDate(d.dueDate)}</div>
                </div>
                <div class="list-amount expense">${formatRupiah(d.amount)}</div>
            </div>
            <div style="margin:8px 0"><span class="badge ${d.status==='Lunas'?'badge-success':'badge-danger'}">${d.status}</span></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${d.status!=='Lunas'?`<button class="btn btn-success" style="padding:6px;font-size:12px;flex:1" onclick="payDebt('${d.id}')">💰 Bayar</button>`:''}
                ${d.phone?`<button class="btn btn-outline" style="padding:6px;font-size:12px;background:#25D366;color:white;border-color:#25D366;flex:1" onclick="sendWADebt('${d.id}')">📱 WA</button>`:''}
                <button class="btn btn-outline" style="padding:6px;font-size:12px;flex:1" onclick="editDebt('${d.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:6px;font-size:12px;flex:1" onclick="deleteDebt('${d.id}')">Hapus</button>
            </div>
        </div>`).join('');
}

function renderReceivables() {
    const receivables = loadData(DB.receivables).sort((a, b) => new Date(b.date) - new Date(a.date));
    const container = document.getElementById('receivableList');
    if (receivables.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">💰</div><p>Belum ada piutang</p></div>';
        return;
    }
    container.innerHTML = receivables.map(r => `
        <div class="card">
            <div class="list-item" style="padding-top:0">
                <div class="list-icon" style="background:#dbeafe">💰</div>
                <div class="list-content">
                    <div class="list-title">${r.name}</div>
                    <div class="list-subtitle">${formatDate(r.date)} • Jatuh tempo: ${formatDate(r.dueDate)}</div>
                </div>
                <div class="list-amount income">${formatRupiah(r.amount)}</div>
            </div>
            <div style="margin:8px 0"><span class="badge ${r.status==='Lunas'?'badge-success':'badge-warning'}">${r.status}</span></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${r.status!=='Lunas'?`<button class="btn btn-success" style="padding:6px;font-size:12px;flex:1" onclick="payReceivable('${r.id}')">✅ Terima</button>`:''}
                ${r.phone?`<button class="btn btn-outline" style="padding:6px;font-size:12px;background:#25D366;color:white;border-color:#25D366;flex:1" onclick="sendWAReceivable('${r.id}')">📱 WA</button>`:''}
                <button class="btn btn-outline" style="padding:6px;font-size:12px;flex:1" onclick="editReceivable('${r.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:6px;font-size:12px;flex:1" onclick="deleteReceivable('${r.id}')">Hapus</button>
            </div>
        </div>`).join('');
}

function renderReports() {
    const transactions = loadData(DB.transactions);
    const pesanList = typeof getPesanData === 'function' ? getPesanData() : [];
    const debts = loadData(DB.debts);
    const receivables = loadData(DB.receivables);
    const wallets = loadData(DB.wallets);
    const now = new Date();
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    const tab = window.reportTab || 'monthly';

    const walletMap = {};
    wallets.forEach(w => { walletMap[w.id] = w.name; });

    const targetYear = parseInt(document.getElementById('reportYear')?.value || now.getFullYear());
    const startM = parseInt(document.getElementById('reportMonthStart')?.value ?? now.getMonth());
    const endM = parseInt(document.getElementById('reportMonthEnd')?.value ?? now.getMonth());

    // Filter by tab
    let filtered = transactions.filter(t => {
        const d = new Date(t.date);
        if (tab === 'daily') {
            const todayStr = now.toISOString().split('T')[0];
            return t.date === todayStr;
        } else if (tab === 'weekly') {
            const weekAgo = new Date(now - 7*86400000);
            return d >= weekAgo && d <= now;
        } else {
            return d.getFullYear() === targetYear && d.getMonth() >= startM && d.getMonth() <= endM;
        }
    });

    // Apply wallet/category filters
    const walletFilter = document.getElementById('reportWalletFilter')?.value || '';
    const catFilter = document.getElementById('reportCategoryFilter')?.value || '';
    let f = walletFilter ? filtered.filter(t => t.walletId === walletFilter) : filtered;
    if (catFilter) f = f.filter(t => t.category === catFilter);

    // Populate filter dropdowns
    const walletFilterEl = document.getElementById('reportWalletFilter');
    if (walletFilterEl) {
        const cv = walletFilterEl.value;
        walletFilterEl.innerHTML = '<option value="">Semua Dompet</option>' + wallets.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
        walletFilterEl.value = cv;
    }
    const catFilterEl = document.getElementById('reportCategoryFilter');
    if (catFilterEl) {
        const allCats = [...new Set(transactions.map(t => t.category).filter(Boolean))].sort();
        const cv = catFilterEl.value;
        catFilterEl.innerHTML = '<option value="">Semua Kategori</option>' + allCats.map(c => `<option value="${c}">${c}</option>`).join('');
        catFilterEl.value = cv;
    }

    // Totals
    let income = 0, expense = 0, modalOut = 0;
    f.forEach(t => {
        const a = parseFloat(t.amount);
        if (t.type === 'income') income += a;
        else if (t.type === 'expense' && !t.isModalKeluar) expense += a;
        else if (t.type === 'expense' && t.isModalKeluar) modalOut += a;
    });

    let invoiceIncome = 0;
    pesanList.forEach(p => {
        const d = new Date(p.date);
        const match = tab === 'daily'
            ? p.date === now.toISOString().split('T')[0]
            : tab === 'weekly'
                ? d >= new Date(now - 7*86400000) && d <= now
                : d.getFullYear() === targetYear && d.getMonth() >= startM && d.getMonth() <= endM;
        if (match) {
            if (p.status === 'Lunas') invoiceIncome += parseFloat(p.total || 0);
            else if (p.status === 'DP') invoiceIncome += parseFloat(p.dp || 0);
        }
    });

    const netProfit = invoiceIncome - modalOut;

    // Previous period
    let prevIncome = 0, prevExpense = 0;
    if (tab !== 'daily' && tab !== 'weekly') {
        const prevStart = new Date(targetYear - 1, startM, 1);
        const prevEnd = new Date(targetYear - 1, endM + 1, 0);
        transactions.forEach(t => {
            const td = new Date(t.date);
            if (td >= prevStart && td <= prevEnd) {
                const a = parseFloat(t.amount);
                if (t.type === 'income') prevIncome += a;
                else if (t.type === 'expense' && !t.isModalKeluar) prevExpense += a;
            }
        });
    }

    // Category breakdown with CSS bars
    const catTotals = {};
    f.forEach(t => { const cat = t.category || 'Lainnya'; const a = parseFloat(t.amount); if (!catTotals[cat]) catTotals[cat] = 0; catTotals[cat] += a; });
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const maxCatTotal = sortedCats.length > 0 ? Math.max(...sortedCats.map(([,v]) => Math.abs(v))) : 1;
    const catColors = ['#C9A87A','#E6A817','#5B8C5A','#E87A7A','#7AA9C9','#A87AC9','#E8A87A','#7AC9A8','#C97A7A','#7A7AC9'];

    // Debt & Receivable
    const totalDebt = debts.filter(d => d.status !== 'Lunas').reduce((s, d) => s + parseFloat(d.amount), 0);
    const totalReceivable = receivables.filter(r => r.status !== 'Lunas').reduce((s, r) => s + parseFloat(r.amount), 0);

    // Period label
    let periodLabel;
    if (tab === 'daily') periodLabel = 'Harian — ' + formatDate(now.toISOString().split('T')[0]);
    else if (tab === 'weekly') periodLabel = 'Mingguan — ' + formatDate(new Date(now - 7*86400000).toISOString().split('T')[0]) + ' sd ' + formatDate(now.toISOString().split('T')[0]);
    else periodLabel = monthNames[startM] + (startM !== endM ? ' – ' + monthNames[endM] : '') + ' ' + targetYear;
    const diff = income - expense;
    const prevDiff = prevIncome - prevExpense;

    document.getElementById('reportContent').innerHTML = `
        <div class="report-card" style="padding:14px 16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <div style="font-weight:700;font-size:14px;color:var(--primary)">${periodLabel}</div>
                <span style="font-size:11px;color:var(--text-secondary);background:var(--surface-2);padding:3px 10px;border-radius:6px">${f.length} transaksi</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
                <div style="background:var(--success-light);border-radius:10px;padding:10px;text-align:center">
                    <div style="font-size:10px;color:var(--text-secondary);font-weight:600">Pemasukan</div>
                    <div style="font-weight:700;font-size:15px;color:var(--success);margin-top:2px">${formatRupiah(income)}</div>
                </div>
                <div style="background:var(--danger-light);border-radius:10px;padding:10px;text-align:center">
                    <div style="font-size:10px;color:var(--text-secondary);font-weight:600">Pengeluaran</div>
                    <div style="font-weight:700;font-size:15px;color:var(--danger);margin-top:2px">${formatRupiah(expense)}</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
                <div style="border-radius:10px;padding:8px 10px;border:1px solid var(--border-light);text-align:center">
                    <div style="font-size:10px;color:var(--text-secondary);font-weight:600">Selisih</div>
                    <div style="font-weight:700;font-size:13px;color:${diff>=0?'var(--success)':'var(--danger)'};margin-top:2px">${formatRupiah(diff)}</div>
                </div>
                <div style="border-radius:10px;padding:8px 10px;border:1px solid var(--border-light);text-align:center">
                    <div style="font-size:10px;color:var(--text-secondary);font-weight:600">Laba Bersih</div>
                    <div style="font-weight:700;font-size:13px;color:${netProfit>=0?'var(--success)':'var(--danger)'};margin-top:2px">${formatRupiah(netProfit)}</div>
                </div>
            </div>

            ${sortedCats.length > 0 ? `
            <div style="border-top:1px solid var(--border-light);padding-top:8px;margin-bottom:10px">
                <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:6px">Breakdown Kategori</div>
                ${sortedCats.map(([cat, total], i) => {
                    const pct = maxCatTotal > 0 ? (Math.abs(total) / maxCatTotal) * 100 : 0;
                    const barColor = catColors[i % catColors.length];
                    const isPos = total >= 0;
                    return `
                    <div style="margin-bottom:5px">
                        <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px">
                            <span style="font-weight:600;color:var(--text)">${cat}</span>
                            <span style="font-weight:700;color:${isPos?'var(--success)':'var(--danger)'}">${formatRupiah(total)}</span>
                        </div>
                        <div style="height:4px;background:var(--surface-3);border-radius:4px;overflow:hidden">
                            <div style="height:100%;width:${pct}%;background:${barColor};border-radius:4px;transition:width 0.4s ease"></div>
                        </div>
                    </div>`;
                }).join('')}
            </div>` : ''}

            <details style="margin-bottom:0;border-top:1px solid var(--border-light);padding-top:8px">
                <summary style="font-size:12px;font-weight:600;color:var(--text-secondary);cursor:pointer;padding:4px 0">Detail lengkap</summary>
                <div style="margin-top:8px">
                    <div class="report-item" style="padding:8px 0"><span class="report-label">Pemasukan Pesanan</span><span class="report-value positive">${formatRupiah(invoiceIncome)}</span></div>
                    <div class="report-item" style="padding:8px 0"><span class="report-label">Modal Keluar</span><span class="report-value negative">${formatRupiah(modalOut)}</span></div>
                    ${tab !== 'daily' && tab !== 'weekly' ? `
                    <div class="report-item" style="padding:8px 0"><span class="report-label">Periode Lalu (Pemasukan)</span><span class="report-value positive">${formatRupiah(prevIncome)}</span></div>
                    <div class="report-item" style="padding:8px 0"><span class="report-label">Periode Lalu (Pengeluaran)</span><span class="report-value negative">${formatRupiah(prevExpense)}</span></div>
                    <div class="report-item" style="padding:8px 0"><span class="report-label">Selisih Periode Lalu</span><span class="report-value ${prevDiff>=0?'positive':'negative'}">${formatRupiah(prevDiff)}</span></div>` : ''}
                    <div class="report-item" style="padding:8px 0"><span class="report-label">Total Hutang</span><span class="report-value negative">${formatRupiah(totalDebt)}</span></div>
                    <div class="report-item" style="padding:8px 0"><span class="report-label">Total Piutang</span><span class="report-value positive">${formatRupiah(totalReceivable)}</span></div>
                </div>
            </details>

            ${f.length > 0 ? `
            <details style="border-top:1px solid var(--border-light);padding-top:8px;margin-top:8px">
                <summary style="font-size:12px;font-weight:600;color:var(--text-secondary);cursor:pointer;padding:4px 0">Transaksi (${f.length})</summary>
                <div style="max-height:300px;overflow-y:auto;margin-top:6px">
                    ${f.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 100).map(t => {
                        const wName = walletMap[t.walletId] || 'Dompet';
                        return `
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-light);font-size:12px">
                            <div style="flex:1;min-width:0">
                                <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.description}</div>
                                <div style="color:var(--text-secondary);font-size:10px">${formatDate(t.date)} • ${t.category} • ${wName}</div>
                            </div>
                            <div style="font-weight:700;color:${t.type==='income'?'var(--success)':'var(--danger)'};white-space:nowrap;margin-left:8px">${t.type==='income'?'+':'-'} ${formatRupiah(t.amount)}</div>
                        </div>`;
                    }).join('')}
                </div>
            </details>` : ''}
        </div>`;
}

// ==================== EXPORT PDF ====================

function exportReportPDF(startDate, endDate) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    const lm = 15;
    const cw = pw - lm * 2;

    const stats = recalculateDashboard();
    const tab = (startDate && endDate) ? 'custom' : (window.reportTab || 'monthly');
    const now = new Date();
    const settings = loadData(DB.settings) || {};
    const businessName = settings.businessName || 'MUGHIS BANK';
    const mn = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const allTx = loadData(DB.transactions);

    let periodLabel, year, month, startM, endM;
    if (tab === 'custom') {
        periodLabel = formatDate(startDate.toISOString().split('T')[0]) + ' – ' + formatDate(endDate.toISOString().split('T')[0]);
        year = null; month = null;
    } else if (tab === 'daily') {
        const ds = now.toISOString().split('T')[0];
        periodLabel = 'Harian - ' + formatDate(ds);
        year = now.getFullYear(); month = now.getMonth();
    } else if (tab === 'weekly') {
        periodLabel = 'Mingguan - ' + now.toLocaleDateString('id-ID', { dateStyle: 'long' });
        year = now.getFullYear(); month = now.getMonth();
    } else if (tab === 'monthly') {
        periodLabel = mn[now.getMonth()] + ' ' + now.getFullYear();
        year = now.getFullYear(); month = now.getMonth();
    } else {
        startM = parseInt(document.getElementById('reportMonthStart')?.value || '0');
        endM = parseInt(document.getElementById('reportMonthEnd')?.value || '11');
        periodLabel = 'Tahunan ' + now.getFullYear() + ' (' + mn[startM] + ' – ' + mn[endM] + ')';
        year = now.getFullYear(); month = null;
    }

    let y = 20;
    const maxY = 278;
    const fs = 8; // base font size

    function np(h) {
        if (y + (h || 8) > maxY) { doc.addPage(); y = 20; }
    }

    // === HEADER ===
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(businessName, pw / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('LAPORAN ' + periodLabel.toUpperCase(), pw / 2, y, { align: 'center' });
    y += 8;

    // === KPI ===
    np(30);
    doc.setFontSize(fs); doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN KEUANGAN', lm, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const kpiRows = [
        ['Pemasukan Pesanan', formatRupiah(stats.invoiceIncome)],
        ['Total Pengeluaran', formatRupiah(stats.financeExpense)],
        ['Modal Keluar', formatRupiah(stats.totalModalOut)],
        ['Laba Bersih', formatRupiah(stats.invoiceNet)],
        ['Saldo Kas', formatRupiah(stats.totalBalance)],
    ];
    kpiRows.forEach(r => {
        doc.text(r[0], lm + 3, y);
        doc.text(r[1], lm + cw - 3, y, { align: 'right' });
        y += 4.5;
    });
    y += 4;

    // === FILTER ===
    const nowStr = now.toISOString().split('T')[0];
    let filtered = allTx.filter(t => {
        if (!t.date) return false;
        const d = new Date(t.date);
        if (isNaN(d.getTime())) return false;
        const ds = typeof t.date === 'string' ? t.date : '';
        if (tab === 'daily') return ds === nowStr;
        if (tab === 'weekly') return d >= new Date(now - 7 * 24 * 60 * 60 * 1000);
        if (tab === 'monthly') return d.getMonth() === month && d.getFullYear() === year;
        if (tab === 'custom') return d >= startDate && d <= endDate;
        return d.getFullYear() === year && d.getMonth() >= startM && d.getMonth() <= endM;
    });

    if (filtered.length === 0) {
        np(20);
        doc.setFontSize(11);
        doc.text('Tidak ada transaksi untuk periode ini.', pw / 2, y, { align: 'center' });
        doc.save('Laporan_' + tab + '_' + nowStr + '.pdf');
        return;
    }

    filtered.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

    // === GROUP BY MONTH ===
    const groups = {};
    filtered.forEach(t => {
        if (!t.date) return;
        const d = new Date(t.date);
        if (isNaN(d.getTime())) return;
        const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        if (!groups[key]) groups[key] = { label: mn[d.getMonth()] + ' ' + d.getFullYear(), items: [], inc: 0, exp: 0 };
        groups[key].items.push(t);
        if (t.type === 'income') groups[key].inc += t.amount;
        else groups[key].exp += t.amount;
    });

    const monthKeys = Object.keys(groups).sort();

    // === TABLE HEADER ===
    np(16);
    doc.setFontSize(fs); doc.setFont('helvetica', 'bold');
    doc.text('NO', lm, y);
    doc.text('TANGGAL', lm + 10, y);
    doc.text('KETERANGAN', lm + 35, y);
    doc.text('JENIS', lm + cw - 42, y);
    doc.text('NOMINAL', lm + cw, y, { align: 'right' });
    y += 5;
    doc.setDrawColor(180, 180, 180);
    doc.line(lm, y, lm + cw, y);
    y += 3;

    let no = 1;
    monthKeys.forEach((key, mi) => {
        const g = groups[key];
        np(20);

        // Month separator
        if (mi > 0) {
            doc.setDrawColor(200, 200, 200);
            doc.line(lm, y, lm + cw, y);
            y += 3;
        }

        // Month header
        doc.setFontSize(fs + 1); doc.setFont('helvetica', 'bold');
        doc.text(g.label, lm, y);
        doc.setFontSize(fs); doc.setFont('helvetica', 'normal');
        doc.text('Pemasukan: ' + formatRupiah(g.inc) + '  Pengeluaran: ' + formatRupiah(g.exp), lm + cw, y, { align: 'right' });
        y += 5;

        // Transactions
        g.items.forEach(t => {
            np(8);
            const ds = formatDate(t.date);
            const desc = t.description || '-';
            const jenis = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
            const amtStr = formatRupiah(t.amount);

            doc.setFontSize(fs - 0.5); doc.setFont('courier', 'normal');
            doc.text(String(no), lm, y);
            doc.text(ds, lm + 10, y);
            // Truncate description if too long
            const displayDesc = desc.length > 55 ? desc.substring(0, 55) + '..' : desc;
            doc.text(displayDesc, lm + 35, y);
            doc.text(jenis, lm + cw - 42, y);
            doc.setFont('courier', 'bold');
            doc.text(amtStr, lm + cw, y, { align: 'right' });
            y += 4.5;
            no++;
        });
    });

    // === SUMMARY ===
    np(22);
    y += 2;
    doc.setDrawColor(180, 180, 180);
    doc.line(lm, y, lm + cw, y);
    y += 4;
    const totInc = filtered.reduce((s, t) => s + (t.type === 'income' ? t.amount : 0), 0);
    const totExp = filtered.reduce((s, t) => s + (t.type === 'expense' ? t.amount : 0), 0);
    doc.setFontSize(fs); doc.setFont('helvetica', 'bold');
    doc.text('TOTAL Pemasukan: ' + formatRupiah(totInc), lm, y);
    doc.text('TOTAL Pengeluaran: ' + formatRupiah(totExp), lm + cw / 2, y);
    y += 5;
    doc.text('Total Transaksi: ' + filtered.length + ' item', lm, y);
    y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('Dicetak: ' + new Date().toLocaleString('id-ID'), lm, y);

    // Footer on each page
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('MUGHIS BANK | ' + periodLabel + ' | Hal ' + i + '/' + pages, pw / 2, 292, { align: 'center' });
    }

    doc.save('Laporan_' + tab + '_' + nowStr + '.pdf');
}

// ==================== PURCHASE ORDER (NOTA) ====================

function openPurchaseModal() {
    document.getElementById('purchaseId').value = '';
    document.getElementById('purchaseSupplier').value = '';
    document.getElementById('purchaseDate').value = new Date().toISOString().split('T');
    document.getElementById('purchaseDesc').value = '';
    document.getElementById('purchaseAmount').value = '';
    document.getElementById('purchaseNote').value = '';
    document.getElementById('purchaseModalTitle').textContent = 'Nota Pembelian Baru';
    updateWalletSelectsFor('purchaseWallet');
    openModal('purchaseModal');
}

function savePurchase() {
    const id = document.getElementById('purchaseId').value;
    const supplier = document.getElementById('purchaseSupplier').value.trim();
    const date = document.getElementById('purchaseDate').value;
    const desc = document.getElementById('purchaseDesc').value.trim();
    const amount = parseFloat(document.getElementById('purchaseAmount').value) || 0;
    const note = document.getElementById('purchaseNote').value.trim();
    const wallet = document.getElementById('purchaseWallet').value;

    if (!supplier || !amount) { alert('Nama supplier dan nominal harus diisi!'); return; }

    const purchases = loadData(DB.purchases);
    const cabang = getActiveCabang();

    if (id) {
        const idx = purchases.findIndex(p => p.id === id);
        if (idx >= 0) purchases[idx] = { ...purchases[idx], supplier, date, desc, amount, note, wallet };
    } else {
        purchases.unshift({ id: generateId(), supplier, date, desc, amount, note, wallet, cabang, createdAt: new Date().toISOString() });
    }
    saveData(DB.purchases, purchases);

    // Create expense transaction
    const transactions = loadData(DB.transactions);
    transactions.unshift({
        id: generateId(), type: 'expense', category: 'Pembelian', description: `Nota: ${supplier} - ${desc || 'Pembelian'}`,
        amount, date, wallet, cabang, isModalKeluar: false, createdAt: new Date().toISOString()
    });
    saveData(DB.transactions, transactions);

    addActivity(`Nota pembelian dari ${supplier}: ${formatRupiah(amount)}`);
    closeModal('purchaseModal');
    renderPurchases();
    recalculateAll();
    renderAll();
    alert('Nota pembelian disimpan!');
}

function renderPurchases() {
    const purchases = loadData(DB.purchases);
    const container = document.getElementById('purchaseList');
    if (purchases.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>Belum ada nota pembelian</p></div>';
        return;
    }
    container.innerHTML = purchases.map(p => `
        <div class="purchase-card" onclick="showPurchaseDetail('${p.id}')">
            <div class="card-title">${p.supplier}</div>
            <div class="card-sub">${formatDate(p.date)}${p.desc ? ' • ' + p.desc : ''}</div>
            <div class="card-amount">- ${formatRupiah(p.amount)}</div>
        </div>
    `).join('');
}

function showPurchaseDetail(id) {
    const purchases = loadData(DB.purchases);
    const p = purchases.find(x => x.id === id);
    if (!p) return;
    const detail = `
        <div style="padding:16px">
            <div style="font-size:20px;font-weight:700;margin-bottom:4px">${p.supplier}</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">${formatDate(p.date)}</div>
            ${p.desc ? `<div style="font-size:14px;margin-bottom:8px">${p.desc}</div>` : ''}
            <div style="font-size:18px;font-weight:700;color:var(--danger);margin-bottom:8px">- ${formatRupiah(p.amount)}</div>
            ${p.note ? `<div style="font-size:12px;color:var(--text-secondary)">Catatan: ${p.note}</div>` : ''}
            <div style="display:flex;gap:8px;margin-top:16px">
                <button class="btn btn-danger" onclick="showConfirm('Hapus nota ini?').then(ok=>{if(ok)deletePurchase('${p.id}')})" style="flex:1">🗑️ Hapus</button>
            </div>
        </div>
    `;
    document.getElementById('purchaseDetailContent').innerHTML = detail;
    openModal('purchaseDetailModal');
}

function deletePurchase(id) {
    let purchases = loadData(DB.purchases);
    purchases = purchases.filter(p => p.id !== id);
    saveData(DB.purchases, purchases);
    closeModal('purchaseDetailModal');
    renderPurchases();
    recalculateAll();
    renderAll();
}

// ==================== CABANG (Multi-Cabang) ====================

function getCabang() {
    const settings = loadData(DB.settings) || {};
    return settings.cabang || [];
}

function getActiveCabang() {
    const settings = loadData(DB.settings) || {};
    return settings.activeCabang || '';
}

function setActiveCabang(cabang) {
    const settings = loadData(DB.settings) || {};
    settings.activeCabang = cabang;
    saveData(DB.settings, settings);
}

function renderCabangSettings() {
    const cabang = getCabang();
    const container = document.getElementById('cabangList');
    if (!container) return;
    if (cabang.length === 0) {
        container.innerHTML = '<div style="font-size:13px;color:var(--text-secondary);padding:8px 0">Belum ada cabang. Tambahkan cabang baru.</div>';
        return;
    }
    container.innerHTML = cabang.map((c, i) => `
        <div class="cabang-list-item">
            <span>🏬 ${c}</span>
            <button class="btn btn-danger" onclick="removeCabang(${i})" style="width:auto;padding:4px 10px;font-size:12px">✕</button>
        </div>
    `).join('');
}

function addCabang() {
    const input = document.getElementById('cabangInput');
    const name = input.value.trim();
    if (!name) { alert('Masukkan nama cabang!'); return; }
    const cabang = getCabang();
    if (cabang.includes(name)) { alert('Cabang sudah ada!'); return; }
    cabang.push(name);
    const settings = loadData(DB.settings) || {};
    settings.cabang = cabang;
    saveData(DB.settings, settings);
    input.value = '';
    renderCabangSettings();
}

async function removeCabang(index) {
    if (!await showConfirm('Hapus cabang ini?')) return;
    const cabang = getCabang();
    cabang.splice(index, 1);
    const settings = loadData(DB.settings) || {};
    settings.cabang = cabang;
    saveData(DB.settings, settings);
    renderCabangSettings();
}

function saveCabang() {
    renderCabangSettings();
    alert('✅ Cabang disimpan! Gunakan filter cabang di halaman Keuangan.');
}

// Add cabang filter to finance page
function renderCabangFilter() {
    const cabang = getCabang();
    const container = document.getElementById('cabangFilterContainer');
    if (!container) return;
    if (cabang.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = `
        <select class="form-select" id="cabangFilter" onchange="applyCabangFilter()" style="font-size:12px;margin-bottom:8px">
            <option value="">🏢 Semua Cabang</option>
            ${cabang.map(c => `<option value="${c}">🏬 ${c}</option>`).join('')}
        </select>
    `;
}

function applyCabangFilter() {
    renderTransactions();
}

// ==================== SHORTCUT CEPAT KUSTOM ====================

function getShortcuts() {
    const settings = loadData(DB.settings) || {};
    const defaults = [
        { id: 'finance', icon: 'account_balance', label: 'Keuangan' },
        { id: 'wallet', icon: 'credit_card', label: 'Dompet' },
        { id: 'pesan', icon: 'note', label: 'Pesanan' },
        { id: 'customer', icon: 'people', label: 'Pelanggan' },
        { id: 'products', icon: 'inventory_2', label: 'Produk' },
        { id: 'debt', icon: 'account_balance_wallet', label: 'Hutang' },
        { id: 'receivable', icon: 'currency_exchange', label: 'Piutang' },
        { id: 'reports', icon: 'bar_chart', label: 'Laporan' },
        { id: 'purchase', icon: 'shopping_cart', label: 'Nota' }
    ];
    return settings.shortcuts || defaults;
}

function saveShortcutsList(list) {
    const settings = loadData(DB.settings) || {};
    settings.shortcuts = list;
    saveData(DB.settings, settings);
}

function renderShortcutSettings() {
    const container = document.getElementById('shortcutList');
    if (!container) return;
    const shortcuts = getShortcuts();
    container.innerHTML = shortcuts.map((s, i) => `
        <div class="cabang-list-item">
            <div style="display:flex;align-items:center;gap:8px">
                <span class="m-icon" style="font-size:18px">${s.icon}</span>
                <span>${s.label}</span>
            </div>
            <div style="display:flex;gap:4px">
                <button class="btn btn-outline" onclick="moveShortcut(${i}, -1)" style="width:auto;padding:4px 8px;font-size:12px" ${i === 0 ? 'disabled' : ''}>▲</button>
                <button class="btn btn-outline" onclick="moveShortcut(${i}, 1)" style="width:auto;padding:4px 8px;font-size:12px" ${i === shortcuts.length - 1 ? 'disabled' : ''}>▼</button>
                <button class="btn btn-danger" onclick="removeShortcut(${i})" style="width:auto;padding:4px 8px;font-size:12px" ${shortcuts.length <= 4 ? 'disabled' : ''}>✕</button>
            </div>
        </div>
    `).join('');
}

function moveShortcut(index, dir) {
    const shortcuts = getShortcuts();
    const target = index + dir;
    if (target < 0 || target >= shortcuts.length) return;
    [shortcuts[index], shortcuts[target]] = [shortcuts[target], shortcuts[index]];
    saveShortcutsList(shortcuts);
    renderShortcutSettings();
}

function removeShortcut(index) {
    const shortcuts = getShortcuts();
    if (shortcuts.length <= 4) { alert('Minimal 4 shortcut!'); return; }
    shortcuts.splice(index, 1);
    saveShortcutsList(shortcuts);
    renderShortcutSettings();
}

function saveShortcuts() {
    renderShortcutSettings();
    alert('✅ Shortcut disimpan!');
}

// Override renderQuickMenu to use custom shortcuts
function renderQuickMenu() {
    const shortcuts = getShortcuts();
    const container = document.querySelector('.menu-grid');
    if (!container) return;
    const allPages = {
        finance: { icon: 'account_balance', label: 'Keuangan' },
        wallet: { icon: 'credit_card', label: 'Dompet' },
        pesan: { icon: 'note', label: 'Pesanan' },
        customer: { icon: 'people', label: 'Pelanggan' },
        products: { icon: 'inventory_2', label: 'Produk' },
        debt: { icon: 'account_balance_wallet', label: 'Hutang' },
        receivable: { icon: 'currency_exchange', label: 'Piutang' },
        reports: { icon: 'bar_chart', label: 'Laporan' },
        purchase: { icon: 'shopping_cart', label: 'Nota' }
    };
    container.innerHTML = shortcuts.map(s => {
        const page = allPages[s.id] || s;
        return `<div class="menu-item" onclick="showPage('${s.id}')"><div class="menu-icon"><span class="m-icon" style="font-size:24px;color:white">${page.icon}</span></div><div class="menu-label">${page.label}</div></div>`;
    }).join('');
}

// ==================== CATALOG PRODUK SHAREABLE ====================

function openProductCatalog() {
    const products = loadData(DB.products);
    const container = document.getElementById('productCatalogContent');
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>Belum ada produk</p></div>';
        openModal('productCatalogModal');
        return;
    }
    container.innerHTML = products.map(p => `
        <div class="catalog-item">
            <div class="catalog-img">${p.type === 'product' ? '📦' : '🔧'}</div>
            <div class="catalog-info">
                <div class="catalog-name">${p.name}</div>
                <div class="catalog-price">${formatRupiah(p.price)}</div>
                <div class="catalog-category">${p.category || ''}${p.stock !== undefined ? ' • Stok: ' + p.stock : ''}</div>
            </div>
        </div>
    `).join('');
    openModal('productCatalogModal');
}

function shareCatalog() {
    const products = loadData(DB.products);
    const settings = loadData(DB.settings) || {};
    const businessName = settings.businessName || 'MUGHIS BANK';
    if (products.length === 0) { alert('Belum ada produk!'); return; }

    let text = `🏪 *KATALOG PRODUK - ${businessName}*\n`;
    text += '━'.repeat(20) + '\n\n';

    const grouped = {};
    products.forEach(p => {
        const cat = p.category || 'Umum';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(p);
    });

    Object.keys(grouped).forEach(cat => {
        text += `*${cat}*\n`;
        grouped[cat].forEach(p => {
            text += `• ${p.name} - ${formatRupiah(p.price)}`;
            if (p.stock !== undefined) text += ` (Stok: ${p.stock})`;
            text += '\n';
        });
        text += '\n';
    });

    text += '━'.repeat(20) + '\n';
    text += `📱 ${businessName}\n`;
    if (settings.whatsApp) text += `WA: ${settings.whatsApp}`;

    const waNumber = settings.whatsApp ? settings.whatsApp.replace(/[^0-9]/g, '') : '';
    const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    closeModal('productCatalogModal');
}

// ==================== UPDATE WALLET SELECTS ====================

function updateWalletSelectsFor(selectId) {
    const wallets = loadData(DB.wallets);
    const el = document.getElementById(selectId);
    if (!el) return;
    el.innerHTML = wallets.map(w => `<option value="${w.id}">${w.icon} ${w.name}</option>`).join('');
}

function updateWalletSelects() {
    const wallets = loadData(DB.wallets);
    const options = wallets.map(w => `<option value="${w.id}">${w.icon} ${w.name}</option>`).join('');
    ['transactionWallet', 'invoiceWallet', 'transferFrom', 'transferTo', 'debtWallet', 'receivableWallet'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const current = el.value;
            el.innerHTML = (id === 'transferFrom' || id === 'transferTo') ? `<option value="">Pilih Dompet</option>${options}` : options;
            if (current) el.value = current;
        }
    });
}

// ==================== DATE RANGE EXPORT ====================

let exportDatePicker = null;

function openExportDatePicker() {
    const modal = document.getElementById('exportDateModal');
    openModal('exportDateModal');

    if (!exportDatePicker) {
        exportDatePicker = flatpickr('#exportDateRangePicker', {
            mode: 'range',
            dateFormat: 'Y-m-d',
            locale: { rangeSeparator: ' hingga ' },
            defaultDate: [new Date(new Date().getFullYear(), 0, 1), new Date()],
            maxDate: new Date()
        });
    }
}

function doExportPDF() {
    if (!exportDatePicker) return;
    const dates = exportDatePicker.selectedDates;
    if (dates.length !== 2) {
        alert('Pilih tanggal mulai dan selesai.');
        return;
    }
    closeModal('exportDateModal');
    exportReportPDF(dates[0], dates[1]);
}

function getWalletName(walletId, cabang) {
    const wallets = loadData(DB.wallets);
    const w = wallets.find(w => w.id === walletId);
    return w ? (w.icon || '') + ' ' + w.name + (cabang ? ' (' + cabang + ')' : '') : '-';
}

function exportExcel() {
    const transactions = loadData(DB.transactions);
    if (!transactions || transactions.length === 0) {
        alert('Tidak ada transaksi untuk diexport.');
        return;
    }

    const incomeData = transactions.filter(t => t.type === 'income');
    const expenseData = transactions.filter(t => t.type === 'expense');

    const wb = XLSX.utils.book_new();

    function txToArray(txList, title) {
        const header = ['Tanggal', 'Kategori', 'Keterangan', 'Tipe', 'Nominal', 'Dompet'];
        const rows = txList.map(t => {
            const walletName = getWalletName(t.walletId, t.cabang);
            return [t.date, t.category, t.description, title, t.amount, walletName];
        });
        return [header, ...rows];
    }

    const incomeRows = txToArray(incomeData, 'Pemasukan');
    const expenseRows = txToArray(expenseData, 'Pengeluaran');

    const wsIncome = XLSX.utils.aoa_to_sheet(incomeRows);
    const wsExpense = XLSX.utils.aoa_to_sheet(expenseRows);

    XLSX.utils.book_append_sheet(wb, wsIncome, 'Pemasukan');
    XLSX.utils.book_append_sheet(wb, wsExpense, 'Pengeluaran');

    const settings = loadData(DB.settings) || {};
    const businessName = settings.businessName || 'MUGHIS BANK';
    const filename = `${businessName}_Laporan_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(wb, filename);
    addActivity(`📊 Export Excel: ${filename}`);
}

// ==================== ACTIVITY PAGE ====================

function formatTime(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

window.activityFilter = 'all';

function switchActivityFilter(type) {
    window.activityFilter = type;
    document.querySelectorAll('#activityFilterTabs .tab').forEach(t => t.classList.remove('active'));
    const btn = document.querySelector(`#activityFilterTabs .tab[onclick*="'${type}'"]`);
    if (btn) btn.classList.add('active');
    renderFullActivity();
}

function renderFullActivity() {
    const container = document.getElementById('activityFullList');
    if (!container) return;

    const filter = window.activityFilter || 'all';
    const searchText = (document.getElementById('activitySearch')?.value || '').toLowerCase().trim();

    let activities = loadData(DB.activities) || [];

    // Filter by type
    if (filter !== 'all') {
        activities = activities.filter(a => {
            const icon = a.icon || '';
            const desc = (a.description || a.desc || a.text || '').toLowerCase();
            if (filter === 'finance') {
                return ['📥', '📤', '💰', '🏦'].some(i => icon.includes(i)) ||
                    ['pemasukan', 'pengeluaran', 'transfer', 'transaksi'].some(k => desc.includes(k));
            }
            if (filter === 'pesan') {
                return ['📄', '✏️'].some(i => icon.includes(i)) ||
                    ['pesan', 'invoice'].some(k => desc.includes(k));
            }
            if (filter === 'other') {
                const isFinance = ['📥', '📤', '💰', '🏦'].some(i => icon.includes(i)) ||
                    ['pemasukan', 'pengeluaran', 'transfer', 'transaksi'].some(k => desc.includes(k));
                const isPesan = ['📄', '✏️'].some(i => icon.includes(i)) ||
                    ['pesan', 'invoice'].some(k => desc.includes(k));
                return !isFinance && !isPesan;
            }
            return true;
        });
    }

    // Filter by search text
    if (searchText) {
        activities = activities.filter(a => (a.description || a.desc || a.text || '').toLowerCase().includes(searchText));
    }

    if (activities.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:40px 0;text-align:center"><div class="empty-icon" style="font-size:40px;opacity:0.3">📋</div><p style="color:var(--text-secondary);margin-top:8px">Belum ada aktivitas</p></div>';
        return;
    }

    // Sort by time descending (newest first), max 200
    const sorted = [...activities].sort((a, b) => (b.time || 0) - (a.time || 0)).slice(0, 200);

    // Group by day
    const DAY_MS = 86400000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today - DAY_MS);

    const groups = {};
    sorted.forEach(a => {
        const d = new Date(a.time || Date.now());
        d.setHours(0, 0, 0, 0);
        const key = d.getTime();
        if (!groups[key]) groups[key] = { date: d, items: [] };
        groups[key].items.push(a);
    });

    const sortedGroups = Object.values(groups).sort((a, b) => b.date - a.date);

    let html = '';
    sortedGroups.forEach(g => {
        const diff = Math.round((today - g.date) / DAY_MS);
        let label;
        if (diff === 0) label = 'Hari Ini';
        else if (diff === 1) label = 'Kemarin';
        else label = g.date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        html += `<div style="margin-bottom:4px">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 16px 4px">
                <span style="font-size:12px;font-weight:700;color:var(--primary)">${label}</span>
                <span class="badge badge-gold" style="font-size:10px">${g.items.length}</span>
            </div>`;

        g.items.forEach(a => {
            const safeTime = a.time || Date.now();
            const icon = a.icon || '📌';
            const desc = a.description || a.desc || a.text || '-';
            const timeStr = formatTime(a.time);
            html += `<div class="list-item" onclick="showActivityDetail('${a.id || safeTime}')">
                <div class="list-icon">${icon}</div>
                <div class="list-content">
                    <div class="list-title" style="white-space:normal;word-break:break-word;overflow:visible">${desc}</div>
                    <div class="list-subtitle">${timeStr}</div>
                </div>
            </div>`;
        });

        html += '</div>';
    });

    container.innerHTML = html;
}

// ==================== PROFILE PAGE ====================

function loadProfile() {
    const settings = loadData(DB.settings) || {};
    const fields = {
        profileBusinessName: settings.businessName || '',
        profileUserName: settings.userName || '',
        profileWhatsApp: settings.whatsapp || '',
        profileAddress: settings.address || '',
    };
    Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    });
    // Load logo
    const savedLogo = localStorage.getItem('mughis_logo_dataurl');
    const logoEl = document.getElementById('profileLogoPreview');
    if (logoEl) logoEl.src = savedLogo || 'icons/icon-192.png';
    // Sync dark toggle
    const dt = document.getElementById('profileDarkToggle');
    if (dt) {
        const isDark = localStorage.getItem('mughis_theme') === 'dark';
        dt.classList.toggle('active', isDark);
    }
}

function handleProfileLogo(input) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const dataUrl = e.target.result;
        localStorage.setItem('mughis_logo_dataurl', dataUrl);
        const preview = document.getElementById('profileLogoPreview');
        if (preview) preview.src = dataUrl;
        const headerLogo = document.getElementById('headerLogo');
        if (headerLogo) headerLogo.src = dataUrl;
        showToast('Logo diperbarui');
    };
    reader.readAsDataURL(file);
}

function removeProfileLogo() {
    localStorage.removeItem('mughis_logo_dataurl');
    const preview = document.getElementById('profileLogoPreview');
    if (preview) preview.src = 'icons/icon-192.png';
    const headerLogo = document.getElementById('headerLogo');
    if (headerLogo) headerLogo.src = 'icons/icon-192.png';
    showToast('Logo dihapus');
}

function saveProfileBusiness() {
    const els = {
        businessName: 'profileBusinessName',
        whatsapp: 'profileWhatsApp',
        address: 'profileAddress',
    };
    const settings = loadData(DB.settings) || {};
    Object.entries(els).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) settings[key] = el.value.trim();
    });
    settings.businessName = settings.businessName || 'Mughis Group';
    saveData(DB.settings, settings);
    renderAll();
    showToast('Profil usaha disimpan');
}

function saveProfileUser() {
    const el = document.getElementById('profileUserName');
    if (!el) return;
    const settings = loadData(DB.settings) || {};
    settings.userName = el.value.trim() || '';
    saveData(DB.settings, settings);
    renderAll();
    showToast('Nama pengguna disimpan');
}

// ==================== CALENDAR ====================

let calendarDate = new Date();

function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const mn = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    document.getElementById('calendarMonthLabel').textContent = mn[month] + ' ' + year;

    const allTx = loadData(DB.transactions) || [];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Build day data
    const dayData = {};
    for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        dayData[d] = { income: 0, expense: 0, count: 0, dateStr: ds, tx: [] };
    }
    allTx.forEach(t => {
        if (!t.date) return;
        const d = new Date(t.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
            const day = d.getDate();
            if (dayData[day]) {
                const amt = Math.abs(parseFloat(t.amount) || 0);
                if (t.type === 'income') dayData[day].income += amt;
                else dayData[day].expense += amt;
                dayData[day].count++;
                dayData[day].tx.push(t);
            }
        }
    });

    // Selected day
    const selDay = document.getElementById('calendarGrid')?.dataset?.selDay;
    const selEl = document.getElementById('calendarDetail');

    let html = '<table style="width:100%;border-collapse:collapse">';
    html += '<tr style="font-size:10px;color:var(--text-secondary);font-weight:600">';
    ['Min','Sen','Sel','Rab','Kam','Jum','Sab'].forEach(d => {
        html += `<td style="padding:4px 0;text-align:center;width:14.28%">${d}</td>`;
    });
    html += '</tr><tr>';

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) html += '<td></td>';

    for (let d = 1; d <= daysInMonth; d++) {
        if ((d + firstDay - 1) % 7 === 0 && d > 1) html += '</tr><tr>';
        const dd = dayData[d];
        const ds = dd?.dateStr || '';
        const isToday = ds === todayStr;
        const isSelected = selDay && parseInt(selDay) === d;
        html += `<td onclick="calendarSelectDay(${d})" style="text-align:center;padding:2px;cursor:pointer;border-radius:8px;${isSelected ? 'background:var(--gold);color:#fff' : isToday ? 'background:rgba(201,168,122,0.15)' : ''}">
            <div style="font-size:12px;font-weight:${isToday?'700':'400'}">${d}</div>`;
        if (dd && dd.count > 0) {
            html += `<div style="font-size:8px;line-height:1.2;margin-top:1px">`;
            if (dd.income > 0) html += `<span style="color:#4CAF50">▲${Math.round(dd.income/1000)}k</span>`;
            if (dd.expense > 0) html += `<span style="color:#f44336">${Math.round(dd.expense/1000)}k▼</span>`;
            html += `</div>`;
        }
        html += '</td>';
    }
    html += '</tr></table>';
    document.getElementById('calendarGrid').innerHTML = html;
    if (selEl) {
        if (selDay && dayData[parseInt(selDay)]) {
            showCalendarDetail(parseInt(selDay), dayData);
        } else {
            selEl.innerHTML = 'Pilih tanggal untuk melihat transaksi';
        }
    }
}

function calendarSelectDay(day) {
    document.getElementById('calendarGrid').dataset.selDay = day;
    renderCalendar();
}

function showCalendarDetail(day, dayData) {
    const dd = dayData[day];
    const selEl = document.getElementById('calendarDetail');
    if (!dd || dd.count === 0) {
        selEl.innerHTML = `<div style="color:var(--text-secondary);padding:8px 0">📭 Tidak ada transaksi tanggal ${dd?.dateStr || ''}</div>`;
        return;
    }
    const sorted = dd.tx.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    let html = `<div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px">${dd.count} transaksi · Pemasukan ${formatRupiah(dd.income)} · Pengeluaran ${formatRupiah(dd.expense)}</div>`;
    sorted.forEach(t => {
        const icon = t.type === 'income' ? '📥' : '📤';
        html += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-light);font-size:13px">
            <span>${icon} ${t.description || t.note || '-'}</span>
            <span style="font-weight:600;color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${t.type === 'income' ? '+' : '-'}${formatRupiah(Math.abs(parseFloat(t.amount) || 0))}</span>
        </div>`;
    });
    selEl.innerHTML = html;
}

function calendarPrevMonth() {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
}

function calendarNextMonth() {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
}

// ==================== DEBT / RECEIVABLE TABS ====================

function switchDebtTab(tab) {
    document.querySelectorAll('#page-debt .tab').forEach(t => t.classList.remove('active'));
    const btn = event?.target || document.querySelector(`#page-debt .tab[onclick*="'${tab}'"]`);
    if (btn) btn.classList.add('active');
    document.getElementById('debtList').style.display = tab === 'debt' ? 'block' : 'none';
    document.getElementById('receivableList').style.display = tab === 'receivable' ? 'block' : 'none';
    const fab = document.getElementById('debtFab');
    if (fab) {
        fab.onclick = tab === 'debt' ? openDebtModal : openReceivableModal;
    }
    if (tab === 'debt') renderDebts();
    else renderReceivables();
}

function showPage(pageName) {
    if (pageName === 'receivable') { showPage('debt'); setTimeout(()=>switchDebtTab('receivable'),100); return; }
    const current = document.querySelector('.page.active');
    const navOrder = ['dashboard','finance','pesan','customer','products','debt','receivable','calendar','activity','reports','chat','profile','about','purchase','settings'];
    const curIdx = current ? navOrder.indexOf(current.id.replace('page-','')) : -1;
    const nextIdx = navOrder.indexOf(pageName);
    const dir = nextIdx > curIdx ? 'slide-left' : 'slide-right';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active', 'slide-left', 'slide-right'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const page = document.getElementById('page-' + pageName);
    if (page) {
        page.classList.add(dir);
        requestAnimationFrame(() => page.classList.add('active'));
    }
    const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (navItem) navItem.classList.add('active');
    document.getElementById('mainHeader').style.display = (pageName === 'settings' || pageName === 'chat') ? 'none' : 'block';
    renderAll();
    window.scrollTo(0, 0);
    if (pageName === 'settings') { updateSyncStatus(); loadTelegramConfig(); updateSettingsUI(); }
    if (pageName === 'purchase') renderPurchases();
    if (pageName === 'activity') renderFullActivity();
    if (pageName === 'profile') loadProfile();
    if (pageName === 'calendar') renderCalendar();
}

function switchFinanceTab(type) {
    document.querySelectorAll('#page-finance .tab').forEach(t => t.classList.remove('active'));
    const btn = event?.target || document.querySelector(`#page-finance .tab[onclick*="'${type}'"]`);
    if (btn) btn.classList.add('active');
    document.getElementById('finance-income').style.display = type === 'income' ? 'block' : 'none';
    document.getElementById('finance-expense').style.display = type === 'expense' ? 'block' : 'none';
    document.getElementById('finance-modal').style.display = type === 'modal' ? 'block' : 'none';
    document.getElementById('finance-transfer').style.display = type === 'transfer' ? 'block' : 'none';
}

function switchProductTab(type) {
    document.getElementById('productType').value = type;
    document.querySelectorAll('#page-products .tab').forEach(t => t.classList.remove('active'));
    const btn = event?.target || document.querySelector(`#page-products .tab[onclick*="'${type}'"]`);
    if (btn) btn.classList.add('active');
    renderProducts();
}

function switchReportTab(tab) {
    window.reportTab = tab;
    document.querySelectorAll('#page-reports .tab').forEach(t => t.classList.remove('active'));
    const btn = event?.target || document.querySelector(`#page-reports .tab[onclick*="'${tab}'"]`);
    if (btn) btn.classList.add('active');

    const rangeEl = document.getElementById('reportMonthRange');
    const now = new Date();
    const mn = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const startEl = document.getElementById('reportMonthStart');
    const endEl = document.getElementById('reportMonthEnd');
    const yearEl = document.getElementById('reportYear');

    // Populate year dropdown
    const curYear = now.getFullYear();
    yearEl.innerHTML = '';
    for (let y = curYear - 5; y <= curYear + 2; y++) {
        const opt = document.createElement('option');
        opt.value = y; opt.textContent = y;
        if (y === curYear) opt.selected = true;
        yearEl.appendChild(opt);
    }

    const opts = mn.map((m, i) => `<option value="${i}">${m}</option>`).join('');
    startEl.innerHTML = opts;
    endEl.innerHTML = opts;

    if (tab === 'daily') {
        rangeEl.style.display = 'none';
        startEl.value = now.getMonth(); endEl.value = now.getMonth();
    } else if (tab === 'weekly') {
        rangeEl.style.display = 'none';
        const weekAgo = new Date(now - 7*86400000);
        startEl.value = weekAgo.getMonth(); endEl.value = now.getMonth();
    } else if (tab === 'monthly') {
        rangeEl.style.display = 'block';
        startEl.value = now.getMonth(); endEl.value = now.getMonth();
    } else {
        rangeEl.style.display = 'block';
        startEl.value = '0'; endEl.value = '11';
    }
    renderReports();
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// ==================== THEME & SETTINGS ====================

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    const el = document.getElementById('darkModeToggle');
    if (el) el.classList.toggle('active');
    document.querySelectorAll('.theme-toggle').forEach(t => t.classList.toggle('active'));
    // Update header toggle icon
    const headerToggle = document.getElementById('headerThemeToggle');
    if (headerToggle) {
        const icon = headerToggle.querySelector('.m-icon');
        if (icon) icon.textContent = next === 'dark' ? 'dark_mode' : 'light_mode';
    }
    const settings = loadData(DB.settings);
    settings.theme = next;
    saveData(DB.settings, settings);
}

function handleLogoUpload(input) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        // Resize to 192x192
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = 192; canvas.height = 192;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 192, 192);
            const resized = canvas.toDataURL('image/png');
            document.getElementById('logoPreview').src = resized;
            const hl = document.getElementById('headerLogo');
            if (hl) hl.src = resized;
            localStorage.setItem('mughis_logo_dataurl', resized);
            alert('✅ Logo berhasil diupload! Jangan lupa klik "Simpan Pengaturan" untuk menyimpan.');
        };
        img.src = dataUrl;
    };
    reader.readAsDataURL(file);
}

function removeLogo() {
    document.getElementById('logoPreview').src = 'icons/icon-192.png';
    localStorage.removeItem('mughis_logo_dataurl');
}

function getLogoUrl() {
    return localStorage.getItem('mughis_logo_dataurl') || 'icons/icon-192.png';
}

function saveSettings() {
    const settings = loadData(DB.settings);
    settings.businessName = document.getElementById('settingBusinessName').value || 'Mughis Group';
    settings.address = document.getElementById('settingAddress').value || 'Samalanga, Bireuen, Aceh';
    settings.whatsapp = document.getElementById('settingWhatsApp').value;
    settings.theme = document.documentElement.getAttribute('data-theme');
    saveData(DB.settings, settings);
    alert('✅ Pengaturan disimpan!');
    addActivity('Mengupdate pengaturan usaha');
}

function saveAiKey() {
    const key = document.getElementById('settingAiKey')?.value?.trim();
    if (!key) {
        alert('⚠️ Masukkan API Key Gemini.');
        return;
    }
    localStorage.setItem(`mughis_ai_key_${currentUser?.userId || 'guest'}`, key);
    CONFIG.GEMINI_API_KEY = key;
    alert('✅ API Key AI disimpan!');
}

// ==================== SETTINGS: Payment Methods, Services, Invoice Types UI ====================

function renderPaymentMethodsSettings() {
    const methods = getPaymentMethods();
    const container = document.getElementById('paymentMethodsList');
    if (!container) return;
    container.innerHTML = methods.map((m, i) => `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;padding:10px;background:var(--surface-2);border-radius:8px">
            <div style="flex:2"><input type="text" class="form-input" id="pm_name_${i}" value="${m.name}" placeholder="Nama bank/ewallet" style="font-size:13px;padding:8px"></div>
            <div style="flex:2"><input type="text" class="form-input" id="pm_account_${i}" value="${m.accountName||''}" placeholder="Atas nama" style="font-size:13px;padding:8px"></div>
            <div style="flex:2"><input type="text" class="form-input" id="pm_number_${i}" value="${m.accountNumber||''}" placeholder="No. rekening" style="font-size:13px;padding:8px"></div>
            <button class="btn btn-danger" style="padding:6px 10px;font-size:13px;flex:0" onclick="removePaymentMethod(${i})">✕</button>
        </div>
    `).join('');
}

function showAddPaymentMethod() {
    const methods = getPaymentMethods();
    methods.push({ name: '', accountName: '', accountNumber: '' });
    savePaymentMethods(methods);
    renderPaymentMethodsSettings();
}

function removePaymentMethod(index) {
    const methods = getPaymentMethods();
    methods.splice(index, 1);
    savePaymentMethods(methods);
    renderPaymentMethodsSettings();
}

function savePaymentMethodsFromUI() {
    const methods = getPaymentMethods();
    methods.forEach((m, i) => {
        m.name = document.getElementById(`pm_name_${i}`)?.value || m.name;
        m.accountName = document.getElementById(`pm_account_${i}`)?.value || '';
        m.accountNumber = document.getElementById(`pm_number_${i}`)?.value || '';
    });
    savePaymentMethods(methods);
    alert('✅ Metode pembayaran disimpan!');
}

function renderServicesSettings() {
    const services = getServices();
    const container = document.getElementById('servicesList');
    if (!container) return;
    container.innerHTML = services.map((s, i) => `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;padding:10px;background:var(--surface-2);border-radius:8px">
            <div style="flex:1"><input type="text" class="form-input" id="svc_${i}" value="${s}" placeholder="Nama layanan" style="font-size:13px;padding:8px"></div>
            <button class="btn btn-danger" style="padding:6px 10px;font-size:13px;flex:0" onclick="removeServiceItem(${i})">✕</button>
        </div>
    `).join('');
}

function addServiceItem() {
    const services = getServices();
    services.push('');
    saveServices(services);
    renderServicesSettings();
}

function removeServiceItem(index) {
    const services = getServices();
    services.splice(index, 1);
    saveServices(services);
    renderServicesSettings();
}

function saveServicesFromUI() {
    const services = getServices();
    services.forEach((s, i) => {
        services[i] = document.getElementById(`svc_${i}`)?.value || '';
    });
    saveServices(services.filter(s => s.trim()));
    renderServicesSettings();
    alert('✅ Layanan disimpan!');
}

function renderInvoiceTypesSettings() {
    const types = getInvoiceTypes();
    const container = document.getElementById('invoiceTypesList');
    if (!container) return;
    container.innerHTML = types.map((t, i) => `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;padding:10px;background:var(--surface-2);border-radius:8px">
            <div style="flex:1;min-width:0">
                <span class="m-icon" style="font-size:16px">${t.icon||'receipt'}</span>
                <input type="text" class="form-input" id="it_label_${i}" value="${t.label}" placeholder="Nama tipe" style="font-size:13px;padding:8px;display:inline;width:auto" ${t.builtIn?'readonly':''}>
                <input type="text" class="form-input" id="it_icon_${i}" value="${t.icon||'receipt'}" placeholder="icon" style="font-size:13px;padding:8px;display:inline;width:80px" ${t.builtIn?'readonly':''}>
                <span style="font-size:11px;color:var(--text-secondary);margin-left:4px">${t.builtIn?'(bawaan)':''}</span>
            </div>
            ${t.builtIn ? '' : `<button class="btn btn-danger" style="padding:6px 10px;font-size:13px;flex:0" onclick="removeInvoiceType(${i})">✕</button>`}
        </div>
    `).join('');
}

function showAddInvoiceType() {
    const types = getInvoiceTypes();
    types.push({ id: 'custom_' + Date.now(), label: 'Tipe Baru', icon: 'receipt', builtIn: false });
    saveInvoiceTypes(types);
    renderInvoiceTypesSettings();
}

async function removeInvoiceType(index) {
    const types = getInvoiceTypes();
    if (types[index]?.builtIn) { alert('⚠️ Tipe bawaan tidak bisa dihapus.'); return; }
    if (!await showConfirm(`Hapus tipe "${types[index]?.label}"?`)) return;
    types.splice(index, 1);
    saveInvoiceTypes(types);
    renderInvoiceTypesSettings();
}

function saveInvoiceTypesFromUI() {
    const types = getInvoiceTypes();
    types.forEach((t, i) => {
        const label = document.getElementById(`it_label_${i}`)?.value;
        const icon = document.getElementById(`it_icon_${i}`)?.value;
        if (label) t.label = label;
        if (icon) t.icon = icon;
    });
    saveInvoiceTypes(types);
    renderInvoiceTypesSettings();
    alert('✅ Tipe invoice disimpan!');
}

function getCustomCategories(type) {
    const s = loadData(DB.settings) || {};
    if (Array.isArray(s)) return [];
    return type === 'income' ? (s.customIncomeCategories || []) : (s.customExpenseCategories || []);
}

function renderCustomCategoriesSettings() {
    const incomeCats = getCustomCategories('income');
    const expenseCats = getCustomCategories('expense');
    const incomeContainer = document.getElementById('customIncomeCatsList');
    const expenseContainer = document.getElementById('customExpenseCatsList');
    if (incomeContainer) {
        incomeContainer.innerHTML = incomeCats.map((c, i) =>
            `<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:8px;background:var(--surface-2);border-radius:8px">
                <input type="text" class="form-input" id="cc_income_${i}" value="${c}" placeholder="Nama kategori" style="font-size:13px;padding:8px;flex:1">
                <button class="btn btn-danger" style="padding:6px 10px;font-size:13px" onclick="removeCustomCategory('income',${i})">✕</button>
            </div>`
        ).join('');
    }
    if (expenseContainer) {
        expenseContainer.innerHTML = expenseCats.map((c, i) =>
            `<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:8px;background:var(--surface-2);border-radius:8px">
                <input type="text" class="form-input" id="cc_expense_${i}" value="${c}" placeholder="Nama kategori" style="font-size:13px;padding:8px;flex:1">
                <button class="btn btn-danger" style="padding:6px 10px;font-size:13px" onclick="removeCustomCategory('expense',${i})">✕</button>
            </div>`
        ).join('');
    }
}

function addCustomCategory(type) {
    const cats = getCustomCategories(type);
    cats.push('');
    const s = loadData(DB.settings) || {};
    if (Array.isArray(s)) s = {};
    if (type === 'income') {
        s.customIncomeCategories = cats;
    } else {
        s.customExpenseCategories = cats;
    }
    saveData(DB.settings, s);
    renderCustomCategoriesSettings();
}

function removeCustomCategory(type, index) {
    const cats = getCustomCategories(type);
    cats.splice(index, 1);
    const s = loadData(DB.settings) || {};
    if (Array.isArray(s)) s = {};
    if (type === 'income') {
        s.customIncomeCategories = cats;
    } else {
        s.customExpenseCategories = cats;
    }
    saveData(DB.settings, s);
    renderCustomCategoriesSettings();
}

function saveCustomCategories() {
    const s = loadData(DB.settings) || {};
    if (Array.isArray(s)) s = {};
    const incomeCats = (s.customIncomeCategories || []).map((_, i) => document.getElementById(`cc_income_${i}`)?.value || '').filter(Boolean);
    const expenseCats = (s.customExpenseCategories || []).map((_, i) => document.getElementById(`cc_expense_${i}`)?.value || '').filter(Boolean);
    s.customIncomeCategories = incomeCats;
    s.customExpenseCategories = expenseCats;
    saveData(DB.settings, s);
    renderCustomCategoriesSettings();
    alert('✅ Kategori kustom disimpan!');
}

function updateSettingsUI() {
    renderPaymentMethodsSettings();
    renderServicesSettings();
    renderInvoiceTypesSettings();
    renderCustomCategoriesSettings();
    renderCabangSettings();
    renderShortcutSettings();
}

const EXTRA_KEYS = {
    mughis_logo_dataurl: { key: 'mughis_logo_dataurl', perUser: false },
    mughis_telegram_token: { key: 'mughis_telegram_token', perUser: false },
    mughis_telegram_chatid: { key: 'mughis_telegram_chatid', perUser: false },
    mughis_ai_key: { key: 'mughis_ai_key', perUser: true },
    mughis_drive_token: { key: 'mughis_drive_token', perUser: true },
    mughis_drive_fileid: { key: 'mughis_drive_fileid', perUser: true },
    mughis_last_sync: { key: 'mughis_last_sync', perUser: true },
    mughis_last_drive_sync: { key: 'mughis_last_drive_sync', perUser: true }
};

function exportData() {
    const data = {};
    Object.values(DB).forEach(key => { data[key] = loadData(key); });
    Object.entries(EXTRA_KEYS).forEach(([cleanKey, cfg]) => {
        const storageKey = cfg.perUser
            ? `${cfg.key}_${currentUser?.userId || 'guest'}`
            : cfg.key;
        const val = localStorage.getItem(storageKey);
        if (val !== null) data[cleanKey] = val;
    });
    data._appVersion = '2.1.0';
    data._exportedBy = currentUser?.email || 'guest';
    data._exportedAt = new Date().toISOString();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mughis-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addActivity('📥 Export data');
    alert('✅ Data berhasil diexport! File JSON siap dibagikan.');
}

function importData(input) {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
        alert('❌ Harus file JSON!');
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const validKeys = Object.values(DB);
            const hasCurrentKeys = validKeys.some(k => data[k] !== undefined);
            const hasOldInvoice = 'mughis_invoices' in data;
            if (!hasCurrentKeys && !hasOldInvoice) {
                alert('❌ File ini bukan backup MUGHIS BANK yang valid!');
                input.value = '';
                return;
            }
            if (!await showConfirm('⚠️ Ini akan MENIMPA semua data akun kamu saat ini dengan data dari file backup.\nLanjutkan?')) {
                input.value = '';
                return;
            }
            let imported = 0;

            // Migrate old mughis_invoices → mughis_pesan
            if (Array.isArray(data['mughis_invoices']) && data['mughis_pesan'] === undefined) {
                const converted = data['mughis_invoices'].map(inv => ({
                    id: inv.id,
                    date: inv.date || inv.createdAt || new Date().toISOString(),
                    customerId: inv.customerId || '',
                    customerName: inv.customerName || '',
                    customerPhone: inv.customerPhone || '',
                    customerAddress: inv.customerAddress || '',
                    type: inv.type || 'umum',
                    items: Array.isArray(inv.items) ? inv.items.map(it => ({
                        id: it.id, name: it.name || '', qty: it.qty || 1,
                        price: it.price || 0, productId: it.productId || ''
                    })) : [],
                    total: inv.total || 0,
                    dp: inv.dp || 0,
                    dpAmount: inv.dpAmount || 0,
                    modalKeluar: inv.modalKeluar || 0,
                    remaining: inv.remaining !== undefined ? inv.remaining : (inv.total || 0) - (inv.dp || 0),
                    status: inv.status || 'Belum Dibayar',
                    walletId: inv.walletId || '',
                    note: inv.note || '',
                    specs: inv.specs || {}
                }));
                data[DB.pesan] = converted;
                imported++;
            }

            Object.entries(data).forEach(([key, value]) => { 
                if (validKeys.includes(key) && Array.isArray(value)) {
                    const storageKey = getStorageKey(key);
                    localStorage.setItem(storageKey, JSON.stringify(value));
                    imported++;
                }
            });
            Object.entries(EXTRA_KEYS).forEach(([cleanKey, cfg]) => {
                if (data[cleanKey] !== undefined) {
                    const storageKey = cfg.perUser
                        ? `${cfg.key}_${currentUser?.userId || 'guest'}`
                        : cfg.key;
                    localStorage.setItem(storageKey, data[cleanKey]);
                    imported++;
                }
            });
            alert(`✅ Berhasil import ${imported} kategori data!\nData akan muncul setelah halaman dimuat ulang.`);
            addActivity('📤 Import data');
            recalculateAll();
            renderAll();
        } catch (err) {
            alert('❌ File rusak atau tidak valid: ' + err.message);
        }
    };
    reader.readAsText(file);
    input.value = '';
}

async function resetData() {
    if (!await showConfirm('⚠️ Yakin reset SEMUA data? Ini tidak bisa dibatalkan!')) return;
    if (!await showConfirm('⚠️⚠️ Ini akan menghapus SEMUA data Anda. Lanjutkan?')) return;
    Object.values(DB).forEach(key => {
        const storageKey = getStorageKey(key);
        localStorage.removeItem(storageKey);
    });
    const walletKey = getStorageKey(DB.wallets);
    localStorage.setItem(walletKey, JSON.stringify(defaultWallets));
    const settingsKey = getStorageKey(DB.settings);
    localStorage.setItem(settingsKey, JSON.stringify(defaultSettings));
    addActivity('Reset semua data');
    recalculateAll();
    renderAll();
    alert('✅ Data direset!');
}

// ==================== SEND WA HUTANG PIUTANG ====================

function sendWADebt(id) {
    const debt = loadData(DB.debts).find(d => d.id === id);
    if (!debt || !debt.phone) return;
    const settings = loadData(DB.settings);
    
    let text = `*${settings.businessName}*\n`;
    text += `${settings.address}\n\n`;
    text += `Halo *${debt.name}*,\n\n`;
    text += `Kami mengingatkan bahwa Anda telah meminjam uang kepada kami dengan detail berikut:\n\n`;
    text += `📅 Tanggal Peminjaman: ${formatDate(debt.date)}\n`;
    text += `⏰ Jatuh Tempo Pembayaran: ${formatDate(debt.dueDate)}\n`;
    text += `💰 Jumlah Hutang: *${formatRupiah(debt.amount)}*\n`;
    if (debt.description) text += `📝 Keterangan: ${debt.description}\n`;
    text += `\nStatus Pembayaran: *${debt.status}*\n\n`;
    text += `Mohon untuk segera melakukan pembayaran sesuai dengan tanggal jatuh tempo yang telah disepakati.\n`;
    text += `Terima kasih atas perhatian Anda! 🙏\n\n`;
    text += `Hubungi kami: ${settings.whatsapp}`;
    
    const phone = debt.phone.replace(/\D/g, '').replace(/^0/, '62');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
}

function sendWAReceivable(id) {
    const rec = loadData(DB.receivables).find(r => r.id === id);
    if (!rec || !rec.phone) return;
    const settings = loadData(DB.settings);
    
    let text = `*${settings.businessName}*\n`;
    text += `${settings.address}\n\n`;
    text += `Halo *${rec.name}*,\n\n`;
    text += `Kami mengingatkan bahwa Anda masih memiliki utang kepada kami yang belum diselesaikan. Berikut detailnya:\n\n`;
    text += `📅 Tanggal Pemberian Pinjaman: ${formatDate(rec.date)}\n`;
    text += `⏰ Jatuh Tempo Pembayaran: ${formatDate(rec.dueDate)}\n`;
    text += `💰 Jumlah Piutang: *${formatRupiah(rec.amount)}*\n`;
    if (rec.description) text += `📝 Keterangan: ${rec.description}\n`;
    text += `\nStatus Pembayaran: *${rec.status}*\n\n`;
    text += `Mohon segera melakukan pembayaran agar utang Anda dapat diselesaikan. Jika ada kendala, silakan hubungi kami.\n`;
    text += `Terima kasih! 🙏\n\n`;
    text += `Hubungi kami: ${settings.whatsapp}`;
    
    const phone = rec.phone.replace(/\D/g, '').replace(/^0/, '62');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
}

// ==================== INVOICE DETAIL & SLIP FOTO ====================

function importContactsFromFile(input) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const customers = loadData(DB.customers);
        let imported = 0;

        if (file.name.endsWith('.vcf')) {
            const vcards = text.split('BEGIN:VCARD');
            vcards.forEach(v => {
                const nameMatch = v.match(/FN[^:]*:(.+)/);
                const telMatch = v.match(/TEL[^:]*:([+\d\s\-()]+)/);
                const name = nameMatch ? nameMatch[1].trim() : '';
                const phone = telMatch ? telMatch[1].trim().replace(/[\s\-]/g, '') : '';
                if (name && phone) {
                    if (!customers.some(c => c.phone === phone)) {
                        customers.push({ id: generateId(), name, phone, address: '', note: '', createdAt: Date.now() });
                        imported++;
                    }
                }
            });
        } else if (file.name.endsWith('.csv')) {
            const lines = text.split('\n');
            const headers = lines[0].toLowerCase().split(',');
            const nameIdx = headers.findIndex(h => h.includes('nama') || h.includes('name'));
            const phoneIdx = headers.findIndex(h => h.includes('tel') || h.includes('hp') || h.includes('phone') || h.includes('nomor'));
            if (nameIdx === -1) { alert('❌ Format CSV tidak dikenal. Pastikan ada kolom "Nama" dan "No HP" atau "Telepon".'); return; }
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',');
                const name = cols[nameIdx]?.trim() || '';
                const phone = (cols[phoneIdx]?.trim() || '').replace(/[\s\-]/g, '');
                if (name && phone && !customers.some(c => c.phone === phone)) {
                    customers.push({ id: generateId(), name, phone, address: '', note: '', createdAt: Date.now() });
                    imported++;
                }
            }
        }

        saveData(DB.customers, customers);
        renderCustomers();
        input.value = '';
        alert(`✅ ${imported} kontak berhasil diimport!\n${customers.length} total pelanggan.`);
    };
    reader.readAsText(file);
}

// ==================== PWA INSTALL ====================

function installApp() {
    if (!window.deferredPrompt) return;
    window.deferredPrompt.prompt();
    window.deferredPrompt.userChoice.then(() => { window.deferredPrompt = null; });
}

// ==================== MULTI-BAHASA ====================

const LANG = {
    id: {
        welcome: 'Selamat datang',
        dashboard: 'Beranda',
        activity: 'Aktivitas',
        reports: 'Laporan',
        profile: 'Profil',
        finance: 'Keuangan',
        orders: 'Pesanan',
        products: 'Produk',
        debt: 'Hutang',
        wallet: 'Dompet',
        calendar: 'Kalender',
        settings: 'Pengaturan',
        about: 'Tentang',
        chat: 'AI Chat',
        income: 'Pemasukan',
        expense: 'Pengeluaran',
        totalBalance: 'Total Saldo',
        exportPDF: 'Export PDF',
        exportExcel: 'Export Excel',
        save: 'Simpan',
        cancel: 'Batal',
        delete: 'Hapus',
        edit: 'Edit',
        search: 'Cari',
    },
    en: {
        welcome: 'Welcome',
        dashboard: 'Dashboard',
        activity: 'Activity',
        reports: 'Reports',
        profile: 'Profile',
        finance: 'Finance',
        orders: 'Orders',
        products: 'Products',
        debt: 'Debt',
        wallet: 'Wallet',
        calendar: 'Calendar',
        settings: 'Settings',
        about: 'About',
        chat: 'AI Chat',
        income: 'Income',
        expense: 'Expense',
        totalBalance: 'Total Balance',
        exportPDF: 'Export PDF',
        exportExcel: 'Export Excel',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        search: 'Search',
    }
};

function getLang() {
    const s = loadData(DB.settings) || {};
    return s.language || 'id';
}

function t(key) {
    const lang = getLang();
    return LANG[lang]?.[key] || LANG.id[key] || key;
}

function toggleLanguage() {
    const s = loadData(DB.settings) || {};
    s.language = s.language === 'en' ? 'id' : 'en';
    saveData(DB.settings, s);
    location.reload();
}

// ==================== NOTIFIKASI JATUH TEMPO ====================
function checkDueDates() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission();
        return;
    }
    if (Notification.permission !== 'granted') return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const debts = loadData(DB.debts);
    const receivables = loadData(DB.receivables);
    const dueItems = [];

    debts.forEach(d => {
        if (d.status === 'Lunas' || !d.dueDate) return;
        const due = new Date(d.dueDate);
        due.setHours(0, 0, 0, 0);
        if (due <= today) {
            dueItems.push({ type: 'Hutang', name: d.name, amount: d.amount, dueDate: d.dueDate, overdue: due < today });
        }
    });

    receivables.forEach(r => {
        if (r.status === 'Lunas' || !r.dueDate) return;
        const due = new Date(r.dueDate);
        due.setHours(0, 0, 0, 0);
        if (due <= today) {
            dueItems.push({ type: 'Piutang', name: r.name, amount: r.amount, dueDate: r.dueDate, overdue: due < today });
        }
    });

    dueItems.forEach(item => {
        const prefix = item.overdue ? '🔴' : '⚠️';
        const msg = prefix + ' ' + item.type + ' ke ' + item.name + ' sebesar Rp ' + (item.amount || 0).toLocaleString('id-ID') + (item.overdue ? ' sudah lewat jatuh tempo!' : ' jatuh tempo hari ini!');
        try {
            new Notification('MUGHIS BANK - Pengingat', { body: msg, icon: '/icons/icon-192.png' });
        } catch (e) {}
    });
}

// Start app on page load
startApp();
