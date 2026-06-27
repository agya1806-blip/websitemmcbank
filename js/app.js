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
    invoices: 'mughis_invoices',
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

const incomeCategories = ['Penjualan', 'Jasa', 'Pendapatan Lain', 'Transfer Masuk'];
const expenseCategories = ['Pembelian', 'Operasional', 'Gaji', 'Pengeluaran Lain', 'Transfer Keluar', 'Modal Produksi', 'Modal Operasional', 'Modal Marketing', 'Modal Gaji', 'Modal Transportasi', 'Modal Lainnya'];
const modalCategories = ['Modal Produksi', 'Modal Operasional', 'Modal Marketing', 'Modal Gaji', 'Modal Transportasi', 'Modal Lainnya'];

let currentUser = null;
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
    document.getElementById('loginPage').classList.remove('active');
    const rp = document.getElementById('registerPage');
    if (rp) rp.classList.remove('active');
    document.getElementById('pinLockPage').style.display = 'flex';
    pinTemp = '';
    updatePinDots();
    document.getElementById('pinError').textContent = '';
}

function hidePinLock() {
    document.getElementById('pinLockPage').style.display = 'none';
}

function pinInput(val) {
    if (val === 'cancel') { hidePinLock(); logout(); return; }
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

// ==================== AUTHENTICATION ====================

function initGoogleSignIn() {
    const clientId = CONFIG.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com';
    if (clientId.startsWith('YOUR_')) return;
    google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleSignIn
    });
    google.accounts.id.renderButton(
        document.getElementById('googleLoginBtn'),
        { theme: 'outline', size: 'large', width: '100%' }
    );
}

function handleGoogleSignIn(response) {
    const token = response.credential;
    try {
        const base64Url = token.split('.');
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const userData = JSON.parse(jsonPayload);
        
        loginUser(userData.email, userData.name, userData.email);
    } catch (err) {
        alert('❌ Login Google gagal. Silakan coba lagi.');
    }
}

function loginWithPassword() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('⚠️ Email dan password wajib diisi!');
        return;
    }

    const users = loadData(DB.users) || [];
    const user = users.find(u => u.email === email);

    if (!user) {
        alert('❌ Email tidak terdaftar. Silakan daftar terlebih dahulu.');
        return;
    }

    // Simple password check (dalam production, gunakan hashing)
    if (user.password !== btoa(password)) {
        alert('❌ Password salah!');
        return;
    }

    loginUser(user.email, user.name, user.userId);
}

function showRegisterForm() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('registerPage').classList.add('active');
}

function backToLogin() {
    document.getElementById('registerPage').classList.remove('active');
    document.getElementById('loginPage').classList.add('active');
}

function registerAccount() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    if (!name || !email || !password || !passwordConfirm) {
        alert('⚠️ Semua field wajib diisi!');
        return;
    }

    if (password.length < 6) {
        alert('⚠️ Password minimal 6 karakter!');
        return;
    }

    if (password !== passwordConfirm) {
        alert('⚠️ Password tidak cocok!');
        return;
    }

    const users = loadData(DB.users) || [];
    if (users.some(u => u.email === email)) {
        alert('⚠️ Email sudah terdaftar!');
        return;
    }

    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    users.push({
        userId,
        name,
        email,
        password: btoa(password),
        createdAt: Date.now()
    });

    saveData(DB.users, users);
    alert('✅ Akun berhasil dibuat! Silakan login.');
    backToLogin();
    document.getElementById('loginEmail').value = email;
}

function loginUser(email, name, userId) {
    currentUser = {
        email,
        name,
        userId,
        loginTime: Date.now()
    };

    localStorage.setItem('mughis_current_user', JSON.stringify(currentUser));
    document.getElementById('loginPage').classList.remove('active');
    
    const settings = loadData(DB.settings) || {};
    if (settings.pinHash) {
        showPinLock();
    } else {
        document.getElementById('mainApp').style.display = 'block';
        init();
    }
}

async function logout() {
    if (!await showConfirm('Yakin ingin logout?')) return;
    currentUser = null;
    localStorage.removeItem('mughis_current_user');
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('registerPage').classList.remove('active');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    location.reload();
}

function checkCurrentUser() {
    const user = localStorage.getItem('mughis_current_user');
    if (user) {
        currentUser = JSON.parse(user);
        document.getElementById('loginPage').classList.remove('active');
        const settings = loadData(DB.settings) || {};
        if (settings.pinHash) {
            showPinLock();
        } else {
            document.getElementById('mainApp').style.display = 'block';
        }
        return true;
    }
    return false;
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

    updateSyncStatus();
    checkCloudDataAvailable();
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
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    const detail = `
        <div style="padding: 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${activity.description}</div>
            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
                ${formatDateTime(activity.timestamp)}
            </div>
            <button class="btn btn-outline" onclick="closeModal('activityDetailModal')" style="margin-top: 16px;">Tutup</button>
        </div>
    `;
    
    document.getElementById('activityDetailContent').innerHTML = detail;
    openModal('activityDetailModal');
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
    const tab = window.reportTab || 'daily';
    const transactions = loadData(DB.transactions);
    const pesanList = typeof getPesanData === 'function' ? getPesanData() : [];
    const debts = loadData(DB.debts);
    const receivables = loadData(DB.receivables);
    const now = new Date();
    
    let filtered = [];
    let periodLabel = '';
    
    if (tab === 'daily') {
        const today = now.toISOString().split('T');
        filtered = transactions.filter(t => t.date === today);
        periodLabel = `Laporan Harian - ${formatDate(today)}`;
    } else if (tab === 'weekly') {
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        filtered = transactions.filter(t => new Date(t.date) >= weekAgo);
        periodLabel = `Laporan Mingguan - ${formatDate(weekAgo.toISOString().split('T'))} hingga ${formatDate(now.toISOString().split('T'))}`;
    } else if (tab === 'monthly') {
        filtered = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        periodLabel = `Laporan Bulanan - ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    } else {
        filtered = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === now.getFullYear();
        });
        periodLabel = `Laporan Tahunan - ${now.getFullYear()}`;
    }
    
    let income = 0, expense = 0, invoiceIncome = 0, modalOut = 0;
    filtered.forEach(t => {
        const amt = parseFloat(t.amount);
        if (t.type === 'income') {
            income += amt;
        } else if (t.type === 'expense' && !t.isModalKeluar) {
            expense += amt;
        } else if (t.type === 'expense' && t.isModalKeluar) {
            modalOut += amt;
        }
    });
    
    // Hitung pendapatan dari pesanan dalam periode
    const pesanFilter = p => {
        if (tab === 'daily') return p.date === now.toISOString().split('T');
        if (tab === 'weekly') return new Date(p.date) >= new Date(now - 7 * 24 * 60 * 60 * 1000);
        if (tab === 'monthly') { const d = new Date(p.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }
        { const d = new Date(p.date); return d.getFullYear() === now.getFullYear(); }
    };
    pesanList.filter(pesanFilter).forEach(p => {
        if (p.status === 'Lunas') invoiceIncome += parseFloat(p.total || 0);
        else if (p.status === 'DP') invoiceIncome += parseFloat(p.dp || 0);
    });
    
    const totalDebt = debts.filter(d => d.status !== 'Lunas').reduce((s, d) => s + parseFloat(d.amount), 0);
    const totalReceivable = receivables.filter(r => r.status !== 'Lunas').reduce((s, r) => s + parseFloat(r.amount), 0);
    const netProfit = invoiceIncome - modalOut;
    
    let detailHtml = `
        <div class="report-card">
            <div style="font-size:16px;font-weight:700;margin-bottom:16px;color:var(--primary)">${periodLabel}</div>
            
            <div style="margin-bottom:20px">
                <div style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px">Ringkasan Transaksi</div>
                <div class="report-item"><span class="report-label">Total Pemasukan</span><span class="report-value positive">${formatRupiah(income)}</span></div>
                <div class="report-item"><span class="report-label">Total Pengeluaran</span><span class="report-value negative">${formatRupiah(expense)}</span></div>
                <div class="report-item"><span class="report-label">Selisih</span><span class="report-value ${income-expense>=0?'positive':'negative'}">${formatRupiah(income-expense)}</span></div>
            </div>
            
            <div style="margin-bottom:20px">
                <div style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px">Pesanan & Modal</div>
                <div class="report-item"><span class="report-label">Pemasukan Pesanan</span><span class="report-value positive">${formatRupiah(invoiceIncome)}</span></div>
                <div class="report-item"><span class="report-label">Modal Keluar</span><span class="report-value negative">${formatRupiah(modalOut)}</span></div>
                <div class="report-item"><span class="report-label">Laba Bersih</span><span class="report-value ${netProfit>=0?'positive':'negative'}">${formatRupiah(netProfit)}</span></div>
            </div>
            
            <div style="margin-bottom:20px">
                <div style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px">Hutang & Piutang</div>
                <div class="report-item"><span class="report-label">Total Hutang</span><span class="report-value negative">${formatRupiah(totalDebt)}</span></div>
                <div class="report-item"><span class="report-label">Total Piutang</span><span class="report-value positive">${formatRupiah(totalReceivable)}</span></div>
            </div>
            
            <div style="margin-bottom:20px">
                <div style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px">Detail Transaksi</div>
                ${filtered.length === 0 ? '<p style="text-align:center;color:var(--text-secondary);padding:20px">Tidak ada transaksi</p>' : `
                    <div style="max-height:300px;overflow-y:auto">
                        ${filtered.map(t => `
                            <div style="padding:8px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:13px">
                                <div>
                                    <div style="font-weight:600">${t.description}</div>
                                    <div style="color:var(--text-secondary);font-size:11px">${formatDate(t.date)} • ${t.category}</div>
                                </div>
                                <div style="text-align:right;font-weight:600;color:${t.type==='income'?'var(--success)':'var(--danger)'}">${t.type==='income'?'+':'-'} ${formatRupiah(t.amount)}</div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = detailHtml;
}

// ==================== EXPORT PDF ====================

function exportReportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const content = document.getElementById('reportContent');
    if (!content || !content.innerHTML || content.innerHTML.includes('Tidak ada transaksi')) {
        alert('Tidak ada data untuk di-export.');
        return;
    }
    
    // Collect report data
    const stats = recalculateDashboard();
    const tab = window.reportTab || 'monthly';
    const now = new Date();
    let periodLabel = '';
    if (tab === 'daily') periodLabel = `Laporan Harian - ${formatDate(now.toISOString().split('T'))}`;
    else if (tab === 'weekly') periodLabel = `Laporan Mingguan - ${now.toLocaleDateString('id-ID', { dateStyle: 'long' })}`;
    else if (tab === 'monthly') periodLabel = `Laporan Bulanan - ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    else periodLabel = `Laporan Tahunan - ${now.getFullYear()}`;

    const settings = loadData(DB.settings) || {};
    const businessName = settings.businessName || 'MUGHIS BANK';

    let y = 20;
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(businessName, pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.text(periodLabel, pageWidth / 2, y, { align: 'center' });
    y += 12;

    // KPI summary
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan Keuangan', 14, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const kpiItems = [
        ['Pemasukan Pesanan', formatRupiah(stats.invoiceIncome)],
        ['Total Pengeluaran', formatRupiah(stats.financeExpense)],
        ['Modal Keluar', formatRupiah(stats.totalModalOut)],
        ['Laba Bersih', formatRupiah(stats.invoiceNet)],
        ['Saldo Kas', formatRupiah(stats.totalBalance)]
    ];
    kpiItems.forEach(item => {
        doc.text(item[0], 20, y);
        doc.text(item[1], pageWidth - 20, y, { align: 'right' });
        y += 5;
    });
    y += 6;

    // Transactions
    const transactions = loadData(DB.transactions);
    const filtered = transactions.filter(t => {
        const d = new Date(t.date);
        if (tab === 'daily') return t.date === now.toISOString().split('T');
        if (tab === 'weekly') return new Date(t.date) >= new Date(now - 7 * 24 * 60 * 60 * 1000);
        if (tab === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return d.getFullYear() === now.getFullYear();
    });

    if (filtered.length > 0) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
        doc.text('Detail Transaksi', 14, y); y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        filtered.slice(0, 30).forEach(t => {
            if (y > 270) { doc.addPage(); y = 20; }
            const desc = t.description.length > 30 ? t.description.slice(0, 28) + '..' : t.description;
            doc.text(`${formatDate(t.date)} - ${desc}`, 18, y);
            doc.text(formatRupiah(t.amount), pageWidth - 18, y, { align: 'right' });
            y += 4.5;
        });
    }

    doc.save(`Laporan_${tab}_${now.toISOString().split('T')}.pdf`);
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

// ==================== NAVIGATION ====================

function showPage(pageName) {
    const current = document.querySelector('.page.active');
    const navOrder = ['dashboard','finance','pesan','customer','products','debt','receivable','reports','purchase','settings'];
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
    document.getElementById('mainHeader').style.display = pageName === 'settings' ? 'none' : 'block';
    renderAll();
    window.scrollTo(0, 0);
    if (pageName === 'settings') { updateSyncStatus(); loadTelegramConfig(); updateSettingsUI(); }
    if (pageName === 'purchase') renderPurchases();
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
    // Also update any other theme toggles
    document.querySelectorAll('.theme-toggle').forEach(t => t.classList.toggle('active'));
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

function updateSettingsUI() {
    renderPaymentMethodsSettings();
    renderServicesSettings();
    renderInvoiceTypesSettings();
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
