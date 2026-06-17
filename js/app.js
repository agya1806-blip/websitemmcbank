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
    users: 'mughis_users'
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
    theme: 'light',
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

function removePin() {
    if (!confirm('Hapus PIN keamanan?')) return;
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

function logout() {
    if (!confirm('Yakin ingin logout?')) return;
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
    document.documentElement.setAttribute('data-theme', settings.theme || 'light');
    if (settings.theme === 'dark') {
        document.getElementById('darkModeToggle').classList.add('active');
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

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    updateSyncStatus();
    checkCloudDataAvailable();
}

function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateInvoiceNumber() {
    const date = new Date();
    const dateStr = date.getFullYear() + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
    const invoices = loadData(DB.invoices);
    const todayInvoices = invoices.filter(i => i.number && i.number.includes(dateStr));
    const seq = String(todayInvoices.length + 1).padStart(3, '0');
    return `MG-${dateStr}-${seq}`;
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
    
    if (!confirm('⚠️ Ini akan MENIMPA semua data lokal kamu dengan data dari cloud.\nLanjutkan?')) return;
    
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

    if (!confirm('⚠️ Ini akan MENIMPA semua data lokal dengan data backup Telegram terbaru.\nLanjutkan?')) return;

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

function disconnectDrive() {
    if (!confirm('Putuskan koneksi Google Drive?')) return;
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
    
    if (!silent && !confirm('⚠️ Timpa data lokal dengan data dari Google Drive?')) return;
    
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
    const invoices = loadData(DB.invoices);
    const wallets = recalculateWalletBalance();
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    // ---- KEUANGAN (dari transaksi biasa) ----
    let financeIncome = 0, financeExpense = 0;
    let monthFinanceIncome = 0, monthFinanceExpense = 0;
    
    // ---- INVOICE ----
    let invoiceIncome = 0, totalModalOut = 0;
    let monthInvoiceIncome = 0, monthModalOut = 0;
    
    // ---- HUTANG & PIUTANG ----
    let debtPaid = 0, receivablePaid = 0;
    
    // ---- RINGKASAN INVOICE ----
    let totalInvoiceNominal = 0, paidInvoiceNominal = 0, unpaidInvoiceNominal = 0;
    let paidInvoiceCount = 0, unpaidInvoiceCount = 0;
    
    // Proses transaksi keuangan (skip income invoice, tapi tetap hitung modal keluar)
    transactions.forEach(t => {
        if (t.invoiceId && !t.isModalKeluar) return;
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
    
    // Proses invoice
    invoices.forEach(inv => {
        const invDate = new Date(inv.date);
        const invTotal = parseFloat(inv.total || 0);
        const isMonth = invDate.getMonth() === thisMonth && invDate.getFullYear() === thisYear;
        totalInvoiceNominal += invTotal;
        
        if (inv.status === 'Lunas') {
            paidInvoiceNominal += invTotal;
            paidInvoiceCount++;
            invoiceIncome += invTotal;
            if (isMonth) monthInvoiceIncome += invTotal;
        } else if (inv.status === 'DP') {
            const dp = parseFloat(inv.dp || 0);
            paidInvoiceNominal += dp;
            paidInvoiceCount++;
            invoiceIncome += dp;
            if (isMonth) monthInvoiceIncome += dp;
            unpaidInvoiceNominal += parseFloat(inv.remaining || 0);
            unpaidInvoiceCount++;
        } else {
            unpaidInvoiceNominal += invTotal;
            unpaidInvoiceCount++;
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
        
        // Invoice
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
        
        // Ringkasan Invoice
        paidInvoiceCount,
        unpaidInvoiceCount,
        invoiceDPCount: unpaidInvoiceCount,
        totalInvoiceNominal,
        paidInvoiceNominal,
        unpaidInvoiceNominal
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
    renderInvoices();
    renderRecentInvoices();
    renderReports();
    updateWalletSelects();
    renderCabangFilter();
    renderQuickMenu();
}

function renderInsights(stats) {
    const container = document.getElementById('businessInsights');
    if (!container) return;
    
    const insights = [];
    const invoices = loadData(DB.invoices);
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
    
    // Top invoice type
    const typeCount = {};
    invoices.forEach(inv => {
        if (inv.status === 'Lunas') {
            typeCount[inv.type] = (typeCount[inv.type] || 0) + parseFloat(inv.total || 0);
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
                if (t.type === 'income' && !t.invoiceId) inc += amt;
                else if (t.type === 'expense') exp += amt;
            }
        });
        invoices.forEach(inv => {
            const id = new Date(inv.date);
            if (id.getMonth() === month && id.getFullYear() === year && inv.status === 'Lunas') {
                inc += parseFloat(inv.total) || 0;
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
        insights.push('Belum cukup data untuk analisis. Tambah transaksi dan invoice untuk insight.');
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
                { label: 'Pemasukan', data: incomeData, backgroundColor: 'rgba(45,138,78,0.8)', borderRadius: 4, barPercentage: 0.4 },
                { label: 'Pengeluaran', data: expenseData, backgroundColor: 'rgba(192,57,43,0.8)', borderRadius: 4, barPercentage: 0.4 }
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
    const invoices = loadData(DB.invoices);
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
        const colors = labels.map((_, i) => `hsla(${i * 45}, 70%, 55%, 0.8)`);
        
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
        invoices.forEach(inv => {
            const d = new Date(inv.date);
            const key = d.toLocaleDateString('id-ID', { month: 'short' });
            if (monthlyData[key]) {
                if (inv.status === 'Lunas') monthlyData[key].profit += parseFloat(inv.total || 0);
                else if (inv.status === 'DP') monthlyData[key].profit += parseFloat(inv.dp || 0);
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
                    { label: 'Pemasukan', data: incomeArr, borderColor: '#2d8a4e', backgroundColor: 'rgba(45,138,78,0.1)', tension: 0.3, pointRadius: 3, fill: true },
                    { label: 'Pengeluaran', data: expenseArr, borderColor: '#c0392b', backgroundColor: 'rgba(192,57,43,0.1)', tension: 0.3, pointRadius: 3, fill: true },
                    { label: 'Laba Invoice', data: profitArr, borderColor: '#c9953c', backgroundColor: 'rgba(201,149,60,0.1)', tension: 0.3, pointRadius: 3, fill: true }
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
                    <div class="list-icon" style="background:${isIncome?'#d1fae5':'#fee2e2'}">${isIncome?'📥':'📤'}</div>
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
    const invoices = loadData(DB.invoices);
    container.innerHTML = customers.map(c => {
        const custInvoices = invoices.filter(i => i.customerId === c.id);
        const totalInv = custInvoices.length;
        const totalSpent = custInvoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
        return `
        <div class="card">
            <div class="list-item" style="padding-top:0">
                <div class="list-icon" style="background:#dbeafe">👤</div>
                <div class="list-content">
                    <div class="list-title">${c.name}</div>
                    <div class="list-subtitle">${c.phone||'-'} • ${c.address||'-'}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:13px;font-weight:700">${totalInv} inv</div>
                    <div style="font-size:11px;color:var(--text-secondary)">${formatRupiah(totalSpent)}</div>
                </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px">
                <button class="btn btn-outline" style="padding:6px;font-size:12px;flex:1" onclick="viewCustomerInvoices('${c.id}')">📄 Invoice</button>
                <button class="btn btn-outline" style="padding:6px;font-size:12px;flex:1" onclick="editCustomer('${c.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:6px;font-size:12px;flex:1" onclick="deleteCustomer('${c.id}')">Hapus</button>
            </div>
        </div>`; }).join('');
}

function viewCustomerInvoices(customerId) {
    const customer = loadData(DB.customers).find(c => c.id === customerId);
    if (!customer) return;
    document.getElementById('invoiceSearch').value = customer.name;
    showPage('invoice');
    renderInvoices();
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

function renderRecentInvoices() {
    const container = document.getElementById('recentInvoices');
    if (!container) return;
    const invoices = loadData(DB.invoices).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
    const types = getInvoiceTypes();
    const typeLabel = {};
    types.forEach(t => { typeLabel[t.id] = t.label; });
    if (invoices.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text-secondary);font-size:13px">Belum ada invoice</div>';
        return;
    }
    container.innerHTML = invoices.map(inv => `
        <div class="list-item" style="cursor:pointer;padding:8px 0" onclick="showInvoiceDetail('${inv.id}')">
            <div class="list-content">
                <div class="list-title">${inv.number} — ${formatRupiah(inv.total)}</div>
                <div class="list-subtitle">${inv.customerName} • ${typeLabel[inv.type]||inv.type} • ${formatDate(inv.date)}</div>
            </div>
            <span class="badge ${inv.status==='Lunas'?'badge-success':inv.status==='DP'?'badge-warning':'badge-danger'}" style="font-size:11px">${inv.status}</span>
        </div>
    `).join('');
}

function renderInvoices() {
    const tab = window.invoiceTab || 'all';
    const search = document.getElementById('invoiceSearch')?.value?.toLowerCase() || '';
    let invoices = loadData(DB.invoices);
    if (tab === 'paid') invoices = invoices.filter(i => i.status === 'Lunas');
    else if (tab === 'dp') invoices = invoices.filter(i => i.status === 'DP');
    if (search) invoices = invoices.filter(i => 
        (i.number || '').toLowerCase().includes(search) ||
        (i.customerName || '').toLowerCase().includes(search) ||
        (i.type || '').toLowerCase().includes(search)
    );
    
    const sortBy = document.getElementById('invoiceSort')?.value || 'date';
    if (sortBy === 'date') invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sortBy === 'amount') invoices.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
    else if (sortBy === 'status') invoices.sort((a, b) => a.status.localeCompare(b.status));
    
    const container = document.getElementById('invoiceList');
    if (invoices.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📄</div><p>Belum ada invoice</p></div>';
        return;
    }
    
    const invTypes = getInvoiceTypes();
    const typeIcon = {}; const typeLabel = {};
    invTypes.forEach(t => { typeIcon[t.id] = t.icon || 'description'; typeLabel[t.id] = t.label; });
    
    container.innerHTML = invoices.map(inv => {
        const dpPercent = inv.total > 0 ? Math.min(100, Math.round((parseFloat(inv.dp||0) / inv.total) * 100)) : 0;
        return `
        <div class="card">
            <div class="list-item" style="padding-top:0;cursor:pointer" onclick="showInvoiceDetail('${inv.id}')">
                <div class="list-icon" style="background:#e0e7ff;font-size:20px"><span class="m-icon">${typeIcon[inv.type] || 'description'}</span></div>
                <div class="list-content">
                    <div class="list-title">${inv.number}</div>
                    <div class="list-subtitle">${inv.customerName} • ${formatDate(inv.date)} • ${typeLabel[inv.type] || inv.type}${inv.cabang ? ' • <span class="cabang-tag">' + inv.cabang + '</span>' : ''}</div>
                </div>
                <div style="text-align:right">
                    <div class="list-amount">${formatRupiah(inv.total)}</div>
                    <span class="badge ${inv.status==='Lunas'?'badge-success':'badge-warning'}">${inv.status}</span>
                </div>
            </div>
            ${inv.status === 'DP' ? `
            <div style="margin:8px 0 4px">
                <div class="progress-bar-track" style="height:6px">
                    <div class="progress-bar-fill" style="width:${dpPercent}%"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-secondary);margin-top:2px">
                    <span>DP ${dpPercent}%</span>
                    <span>Rp ${formatRupiah(inv.dp||0)} / ${formatRupiah(inv.total)}</span>
                </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px">
                <button class="btn btn-success" style="padding:6px;font-size:12px;flex:1" onclick="payInvoice('${inv.id}')">💰 Bayar</button>
                <button class="btn btn-outline" style="padding:6px;font-size:12px;flex:1" onclick="event.stopPropagation();showInvoiceDetail('${inv.id}')">📄 Detail</button>
            </div>` : ''}
        </div>`;
    }).join('');
}

function renderReports() {
    const tab = window.reportTab || 'daily';
    const transactions = loadData(DB.transactions);
    const invoices = loadData(DB.invoices);
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
    
    // Hitung invoice dalam periode
    let filteredInvoices = invoices;
    if (tab === 'daily') {
        const today = now.toISOString().split('T');
        filteredInvoices = invoices.filter(i => i.date === today);
    } else if (tab === 'weekly') {
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        filteredInvoices = invoices.filter(i => new Date(i.date) >= weekAgo);
    } else if (tab === 'monthly') {
        filteredInvoices = invoices.filter(i => {
            const d = new Date(i.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
    } else {
        filteredInvoices = invoices.filter(i => {
            const d = new Date(i.date);
            return d.getFullYear() === now.getFullYear();
        });
    }
    
    filteredInvoices.forEach(inv => {
        if (inv.status === 'Lunas') {
            invoiceIncome += parseFloat(inv.total || 0);
        } else if (inv.status === 'DP') {
            invoiceIncome += parseFloat(inv.dp || 0);
        }
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
                <div style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px">Invoice & Modal</div>
                <div class="report-item"><span class="report-label">Pemasukan Invoice</span><span class="report-value positive">${formatRupiah(invoiceIncome)}</span></div>
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
        ['Pemasukan Invoice', formatRupiah(stats.invoiceIncome)],
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
                <button class="btn btn-danger" onclick="if(confirm('Hapus nota ini?')){deletePurchase('${p.id}')}" style="flex:1">🗑️ Hapus</button>
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

function removeCabang(index) {
    if (!confirm('Hapus cabang ini?')) return;
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
        { id: 'invoice', icon: 'receipt', label: 'Invoice' },
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
        invoice: { icon: 'receipt', label: 'Invoice' },
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
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const page = document.getElementById('page-' + pageName);
    if (page) page.classList.add('active');
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

function switchInvoiceTab(tab) {
    window.invoiceTab = tab;
    document.querySelectorAll('#page-invoice .tab').forEach(t => t.classList.remove('active'));
    const btn = event?.target || document.querySelector(`#page-invoice .tab[onclick*="'${tab}'"]`);
    if (btn) btn.classList.add('active');
    renderInvoices();
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
    document.getElementById('darkModeToggle').classList.toggle('active');
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

function removeInvoiceType(index) {
    const types = getInvoiceTypes();
    if (types[index]?.builtIn) { alert('⚠️ Tipe bawaan tidak bisa dihapus.'); return; }
    if (!confirm(`Hapus tipe "${types[index]?.label}"?`)) return;
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

function exportData() {
    const data = {};
    Object.values(DB).forEach(key => { data[key] = loadData(key); });
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
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            // Cek apakah ini file backup MUGHIS BANK
            const hasValidKeys = Object.values(DB).some(k => data[k] !== undefined);
            if (!hasValidKeys) {
                alert('❌ File ini bukan backup MUGHIS BANK yang valid!');
                input.value = '';
                return;
            }
            if (!confirm('⚠️ Ini akan MENIMPA semua data akun kamu saat ini dengan data dari file backup.\nLanjutkan?')) {
                input.value = '';
                return;
            }
            let imported = 0;
            Object.entries(data).forEach(([key, value]) => { 
                if (Object.values(DB).includes(key) && Array.isArray(value)) {
                    const storageKey = getStorageKey(key);
                    localStorage.setItem(storageKey, JSON.stringify(value));
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

function resetData() {
    if (!confirm('⚠️ Yakin reset SEMUA data? Ini tidak bisa dibatalkan!')) return;
    if (!confirm('⚠️⚠️ Ini akan menghapus SEMUA data Anda. Lanjutkan?')) return;
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

function showInvoiceDetail(id) {
    currentInvoiceId = id;
    const inv = loadData(DB.invoices).find(i => i.id === id);
    if (!inv) return;
    const settings = loadData(DB.settings);
    
    const types = getInvoiceTypes();
    const typeLabel = {};
    types.forEach(t => { typeLabel[t.id] = t.label; });
    
    const services = getServices();
    const payMethods = getPaymentMethods();
    
    let specsHtml = '';
    if (inv.type === 'print') {
        specsHtml = `<div class="invoice-section"><div class="invoice-section-title">Spesifikasi Buku</div>
            <p><strong>Ukuran:</strong> ${inv.specs?.bookSize||'-'} | <strong>Jilid:</strong> ${inv.specs?.binding||'-'}</p>
            <p><strong>Ukuran Jadi:</strong> ${inv.specs?.finalSize||'-'} | <strong>Kertas Isi:</strong> ${inv.specs?.paperType||'-'}</p>
            <p><strong>Cover:</strong> ${inv.specs?.coverType||'-'} | <strong>Laminating:</strong> ${inv.specs?.laminating||'-'}</p>
            <p><strong>Wrapping:</strong> ${inv.specs?.wrapping||'-'}</p>
        </div>`;
    } else if (inv.type === 'laptop') {
        specsHtml = `<div class="invoice-section"><div class="invoice-section-title">Spesifikasi Laptop</div>
            <p><strong>${inv.specs?.laptopName||'-'}</strong></p>
            <p>${inv.specs?.processor||'-'} | RAM: ${inv.specs?.ram||'-'} | Storage: ${inv.specs?.storage||'-'}</p>
            <p>Layar: ${inv.specs?.screen||'-'} | ${inv.specs?.condition||'-'} | Garansi: ${inv.specs?.warranty||'-'}</p>
        </div>`;
    } else if (inv.type === 'handphone') {
        specsHtml = `<div class="invoice-section"><div class="invoice-section-title">Spesifikasi Handphone</div>
            <p><strong>${inv.specs?.hpName||'-'}</strong> | Storage: ${inv.specs?.hpStorage||'-'} | ${inv.specs?.hpColor||'-'}</p>
            <p>Kondisi: ${inv.specs?.hpCondition||'-'} | Garansi: ${inv.specs?.hpWarranty||'-'}</p>
        </div>`;
    } else if (inv.type === 'tiktok') {
        specsHtml = `<div class="invoice-section"><div class="invoice-section-title">Affiliate TikTok</div>
            <p><strong>Produk:</strong> ${inv.specs?.tiktokProduct||'-'} | <strong>Platform:</strong> ${inv.specs?.tiktokPlatform||'-'}</p>
            <p><strong>Harga:</strong> ${formatRupiah(inv.specs?.tiktokPrice||0)}</p>
        </div>`;
    } else if (inv.type === 'umum') {
        specsHtml = `<div class="invoice-section"><div class="invoice-section-title">Keterangan</div>
            <p><strong>Jenis:</strong> ${inv.specs?.umumType||'-'}</p>
            <p>${inv.specs?.umumDesc||'-'}</p>
        </div>`;
    } else if (inv.specs?.note) {
        specsHtml = `<div class="invoice-section"><div class="invoice-section-title">Keterangan</div>
            <p>${inv.specs.note}</p>
        </div>`;
    }
    
    const itemsHtml = inv.items?.map((item, i) => `
        <tr>
            <td style="text-align:center">${i+1}</td>
            <td>${item.name}</td>
            <td style="text-align:center">${item.qty}</td>
            <td style="text-align:right">${formatRupiah(item.price)}</td>
            <td style="text-align:right">${formatRupiah(item.qty*item.price)}</td>
        </tr>
    `).join('') || '';
    
    const invoiceHtml = `
        <div class="invoice-preview" id="printArea" style="background:white;color:#0f172a;padding:24px">
            <div class="invoice-header">
                <div class="invoice-logo" style="background:linear-gradient(145deg,#0d3b66,#1a5276,#c9953c);font-size:0;overflow:hidden">
                    <img src="${getLogoUrl()}" style="width:100%;height:100%;object-fit:cover" alt="MG">
                </div>
                <div class="invoice-title">${settings.businessName}</div>
                <div class="invoice-meta" style="font-size:11px;line-height:1.6">
                    ${settings.address}<br>WA: ${settings.whatsapp}<br>
                    <span style="font-size:10px;color:#6b7280">
                        ${services.map(s => `• ${s}`).join('<br>')}
                    </span>
                </div>
            </div>
            <div class="invoice-section">
                <div class="invoice-section-title">INVOICE</div>
                <p><strong>${inv.number}</strong> | ${formatDate(inv.date)} | ${typeLabel[inv.type]||inv.type}</p>
            </div>
            <div class="invoice-section">
                <div class="invoice-section-title">Pelanggan</div>
                <p><strong>${inv.customerName}</strong><br>${inv.customerPhone||'-'}<br>${inv.customerAddress||'-'}</p>
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
                <div class="invoice-total-row"><span>Total</span><span>${formatRupiah(inv.total)}</span></div>
                <div class="invoice-total-row"><span>DP Dibayar</span><span>${formatRupiah(inv.dp)}</span></div>
                <div class="invoice-total-row final"><span>Sisa</span><span>${formatRupiah(inv.remaining)}</span></div>
            </div>
            ${inv.status === 'DP' ? `
            <div style="margin-top:12px">
                <div class="progress-bar-track" style="height:8px">
                    <div class="progress-bar-fill" style="width:${inv.total > 0 ? Math.round((inv.dp||0)/inv.total*100) : 0}%"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);margin-top:4px">
                    <span>DP ${inv.total > 0 ? Math.round((inv.dp||0)/inv.total*100) : 0}%</span>
                    <span>${formatRupiah(inv.dp||0)} / ${formatRupiah(inv.total)}</span>
                </div>
            </div>` : ''}
            <div style="margin-top:12px;text-align:center">
                <span class="badge ${inv.status==='Lunas'?'badge-success':'badge-warning'}" style="font-size:13px;padding:6px 16px">${inv.status}${inv.status==='DP' ? ` (${inv.total > 0 ? Math.round((inv.dp||0)/inv.total*100) : 0}%)` : ''}</span>
            </div>
            ${inv.note ? `<div style="margin-top:12px;padding:10px;background:#f8fafc;border-radius:8px;font-size:12px"><strong>Catatan:</strong> ${inv.note}</div>` : ''}
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
    
    document.getElementById('invoiceDetailContent').innerHTML = invoiceHtml;
    
    const payBtn = document.getElementById('invoicePayBtn');
    if (payBtn) {
        payBtn.style.display = inv.status === 'Lunas' ? 'none' : 'block';
    }
    
    openModal('invoiceDetailModal');
}

async function shareInvoiceAsImage() {
    const printArea = document.getElementById('printArea');
    if (!printArea) return;
    
    const btn = event?.target || document.querySelector('#invoiceDetailModal .btn-primary');
    if (!btn) return;
    const orig = btn.textContent;
    
    try {
        btn.textContent = '⏳ Membuat gambar...';
        btn.disabled = true;
        
        // Clone ke area A4 agar lebih lebar dan teks panjang muat
        const captureArea = document.getElementById('slipCaptureArea');
        captureArea.innerHTML = '';
        const clone = printArea.cloneNode(true);
        clone.style.width = '750px';
        clone.style.padding = '40px';
        clone.style.margin = '0';
        clone.style.border = 'none';
        clone.style.fontSize = '14px';
        clone.style.lineHeight = '1.6';
        captureArea.appendChild(clone);
        
        // Tunggu render
        await new Promise(r => setTimeout(r, 300));
        
        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: 750,
            windowWidth: 800
        });
        
        captureArea.innerHTML = '';
        btn.textContent = orig;
        btn.disabled = false;
        
        canvas.toBlob(async (blob) => {
            const inv = loadData(DB.invoices).find(i => i.id === currentInvoiceId);
            const fileName = `${inv?.number || 'invoice'}-slip.png`;
            const file = new File([blob], fileName, { type: 'image/png' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `Invoice ${inv?.number}`,
                        text: `Slip Invoice ${loadData(DB.settings).businessName}`
                    });
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

function sendWhatsAppInvoice() {
    const inv = loadData(DB.invoices).find(i => i.id === currentInvoiceId);
    if (!inv) return;
    const settings = loadData(DB.settings);
    
    const types = getInvoiceTypes();
    const typeLabel = {};
    types.forEach(t => { typeLabel[t.id] = t.label; });
    const services = getServices();
    const payMethods = getPaymentMethods();
    
    let text = `*${settings.businessName}*\n`;
    text += `${settings.address}\n`;
    services.forEach(s => { text += `• ${s}\n`; });
    text += `\n*Invoice: ${inv.number}*\n`;
    text += `Tanggal: ${formatDate(inv.date)}\n`;
    text += `Jenis: ${typeLabel[inv.type] || inv.type}\n\n`;
    text += `*Pelanggan:*\n${inv.customerName}\n${inv.customerPhone||'-'}\n${inv.customerAddress||'-'}\n\n`;
    
    if (inv.type === 'print') {
        text += `*Spesifikasi Buku:*\n`;
        text += `Ukuran: ${inv.specs?.bookSize||'-'}\nJilid: ${inv.specs?.binding||'-'}\n`;
        text += `Kertas Isi: ${inv.specs?.paperType||'-'}\nCover: ${inv.specs?.coverType||'-'}\n\n`;
    } else if (inv.type === 'laptop') {
        text += `*Spesifikasi Laptop:*\n`;
        text += `${inv.specs?.laptopName||'-'}\n${inv.specs?.processor||'-'}\nRAM: ${inv.specs?.ram||'-'}\n`;
        text += `Storage: ${inv.specs?.storage||'-'}\nKondisi: ${inv.specs?.condition||'-'}\n\n`;
    } else if (inv.type === 'handphone') {
        text += `*Spesifikasi Handphone:*\n`;
        text += `${inv.specs?.hpName||'-'}\nStorage: ${inv.specs?.hpStorage||'-'}\nWarna: ${inv.specs?.hpColor||'-'}\n`;
        text += `Kondisi: ${inv.specs?.hpCondition||'-'}\nGaransi: ${inv.specs?.hpWarranty||'-'}\n\n`;
    } else if (inv.type === 'tiktok') {
        text += `*Affiliate TikTok:*\n`;
        text += `Produk: ${inv.specs?.tiktokProduct||'-'}\nPlatform: ${inv.specs?.tiktokPlatform||'-'}\n`;
        text += `Harga: ${formatRupiah(inv.specs?.tiktokPrice||0)}\n\n`;
    } else if (inv.type === 'umum') {
        text += `*Keterangan:*\n`;
        text += `Jenis: ${inv.specs?.umumType||'-'}\n${inv.specs?.umumDesc||'-'}\n\n`;
    } else if (inv.specs?.note) {
        text += `*Keterangan:*\n${inv.specs.note}\n\n`;
    }
    
    text += `*Daftar Item:*\n`;
    inv.items?.forEach((item, i) => {
        text += `${i+1}. ${item.name} x${item.qty} = ${formatRupiah(item.qty*item.price)}\n`;
    });
    text += `\n*Total: ${formatRupiah(inv.total)}*\n`;
    text += `DP: ${formatRupiah(inv.dp)}\n`;
    text += `Sisa: ${formatRupiah(inv.remaining)}\n`;
    text += `Status: *${inv.status}*\n\n`;
    text += `*Pembayaran:*\n`;
    payMethods.forEach(m => {
        const num = m.name === 'DANA' && !m.accountNumber ? settings.whatsapp : m.accountNumber;
        text += `${m.name}: ${num || '-'}\n`;
    });
    text += `\n`;
    if (inv.note) text += `Catatan: ${inv.note}\n\n`;
    text += `Terima kasih! 🙏`;
    
    const phone = (inv.customerPhone||settings.whatsapp).replace(/\D/g, '').replace(/^0/, '62');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
}

function editCurrentInvoice() {
    closeModal('invoiceDetailModal');
    const inv = loadData(DB.invoices).find(i => i.id === currentInvoiceId);
    if (!inv) return;
    
    document.getElementById('invoiceId').value = inv.id;
    document.getElementById('invoiceType').value = inv.type;
    document.getElementById('invoiceModalTitle').textContent = 'Edit Invoice';
    document.getElementById('invoiceCustomerName').value = inv.customerName;
    document.getElementById('invoiceCustomerPhone').value = inv.customerPhone || '';
    document.getElementById('invoiceCustomerAddress').value = inv.customerAddress || '';
    document.getElementById('invoiceNote').value = inv.note || '';
    document.getElementById('invoiceTotal').value = inv.total;
    document.getElementById('invoiceDP').value = inv.dp;
    document.getElementById('invoiceRemaining').value = inv.remaining;
    document.getElementById('invoiceStatus').value = inv.status;
    document.getElementById('invoiceWallet').value = inv.walletId || '';
    
    document.getElementById('printSpecs').style.display = 'none';
    document.getElementById('laptopSpecs').style.display = 'none';
    document.getElementById('umumSpecs').style.display = 'none';
    document.getElementById('handphoneSpecs').style.display = 'none';
    document.getElementById('tiktokSpecs').style.display = 'none';
    document.getElementById('customSpecs').style.display = 'none';
    
    if (inv.type === 'print') document.getElementById('printSpecs').style.display = 'block';
    else if (inv.type === 'laptop') document.getElementById('laptopSpecs').style.display = 'block';
    else if (inv.type === 'handphone') document.getElementById('handphoneSpecs').style.display = 'block';
    else if (inv.type === 'tiktok') document.getElementById('tiktokSpecs').style.display = 'block';
    else if (inv.type === 'umum') document.getElementById('umumSpecs').style.display = 'block';
    else document.getElementById('customSpecs').style.display = 'block';
    
    if (inv.type === 'print') {
        document.getElementById('printBookSize').value = inv.specs?.bookSize || '';
        document.getElementById('printBinding').value = inv.specs?.binding || 'Lem Panas';
        document.getElementById('printFinalSize').value = inv.specs?.finalSize || '';
        document.getElementById('printPaperType').value = inv.specs?.paperType || '';
        document.getElementById('printCoverType').value = inv.specs?.coverType || '';
        document.getElementById('printLaminating').value = inv.specs?.laminating || 'Tidak';
        document.getElementById('printWrapping').value = inv.specs?.wrapping || 'Tidak';
    } else if (inv.type === 'laptop') {
        document.getElementById('laptopName').value = inv.specs?.laptopName || '';
        document.getElementById('laptopProcessor').value = inv.specs?.processor || '';
        document.getElementById('laptopRam').value = inv.specs?.ram || '';
        document.getElementById('laptopStorage').value = inv.specs?.storage || '';
        document.getElementById('laptopScreen').value = inv.specs?.screen || '';
        document.getElementById('laptopCondition').value = inv.specs?.condition || 'Like New';
        document.getElementById('laptopWarranty').value = inv.specs?.warranty || '';
    } else if (inv.type === 'handphone') {
        document.getElementById('hpName').value = inv.specs?.hpName || '';
        document.getElementById('hpStorage').value = inv.specs?.hpStorage || '';
        document.getElementById('hpColor').value = inv.specs?.hpColor || '';
        document.getElementById('hpCondition').value = inv.specs?.hpCondition || 'Baru';
        document.getElementById('hpWarranty').value = inv.specs?.hpWarranty || '';
    } else if (inv.type === 'tiktok') {
        document.getElementById('tiktokProduct').value = inv.specs?.tiktokProduct || '';
        document.getElementById('tiktokPlatform').value = inv.specs?.tiktokPlatform || 'TikTok Shop';
        document.getElementById('tiktokPrice').value = inv.specs?.tiktokPrice || 0;
    } else if (inv.type === 'umum') {
        document.getElementById('umumType').value = inv.specs?.umumType || '';
        document.getElementById('umumDesc').value = inv.specs?.umumDesc || '';
    } else {
        document.getElementById('customSpecsNote').value = inv.specs?.note || '';
    }
    
    invoiceItems = inv.items ? JSON.parse(JSON.stringify(inv.items)) : [];
    renderInvoiceItems();
    openModal('invoiceModal');
}

function deleteInvoice() {
    if (!currentInvoiceId) return;
    if (!confirm('⚠️ Yakin hapus invoice ini? Data tidak bisa dikembalikan!')) return;
    if (!confirm('⚠️⚠️ Invoice dan semua transaksinya akan dihapus permanen. Lanjutkan?')) return;
    
    let invoices = loadData(DB.invoices);
    let transactions = loadData(DB.transactions);
    const inv = invoices.find(i => i.id === currentInvoiceId);
    if (!inv) return;
    
    // Hapus transaksi terkait invoice
    transactions = transactions.filter(t => t.invoiceId !== inv.id);
    
    // Hapus invoice
    invoices = invoices.filter(i => i.id !== inv.id);
    
    saveData(DB.invoices, invoices);
    saveData(DB.transactions, transactions);
    addActivity(`🗑️ Menghapus invoice ${inv.number}`);
    closeModal('invoiceDetailModal');
    recalculateAll();
    renderAll();
    alert('✅ Invoice berhasil dihapus!');
}

// ==================== INIT & EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', () => {
    if (checkCurrentUser()) {
        init();
    } else {
        initGoogleSignIn();
    }
});

window.addEventListener('beforeunload', () => {
    syncToCloud(true);
});
