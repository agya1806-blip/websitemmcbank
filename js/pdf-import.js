let pdfParsedTransactions = [];
let pdfFileName = '';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function handlePDFImport(input) {
    const file = input.files[0];
    if (!file) return;
    pdfFileName = file.name.replace(/\.pdf$/i, '');
    document.getElementById('pdfImportStatus').style.display = 'block';
    document.getElementById('pdfImportResults').style.display = 'none';
    document.getElementById('pdfImportStatus').innerHTML = '<div class="spinner" style="margin:0 auto 8px"></div><span style="font-size:13px;color:var(--text-secondary)">Memproses PDF...</span>';
    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const pdf = await pdfjsLib.getDocument({ data }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map(item => item.str).join(' ') + '\n';
            }
            pdfParsedTransactions = parseBankPDF(fullText);
            if (pdfParsedTransactions.length === 0) {
                document.getElementById('pdfImportStatus').innerHTML = '<span style="color:var(--danger)">⚠️ Tidak dapat membaca transaksi. Format PDF tidak dikenali.\nCoba export CSV dari mobile banking.</span>';
                return;
            }
            document.getElementById('pdfImportStatus').style.display = 'none';
            renderPDFPreview();
        } catch (err) {
            document.getElementById('pdfImportStatus').innerHTML = `<span style="color:var(--danger)">❌ Gagal membaca PDF: ${err.message}</span>`;
        }
    };
    reader.readAsArrayBuffer(file);
}

function parseBankPDF(text) {
    const transactions = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const skipWords = ['tahun', 'halaman', 'page', 'saldo', 'mutasi', 'rekening', 'periode',
        'cabang', 'currency', 'acount', 'no.', 'npwp', 'alamat', 'bank', 'laporan',
        'tgl', 'tanggal', 'keterangan', 'debet', 'kredit', 'jumlah', 'cab', 'cbg',
        'berita', 'kode', 'ref', 'paraf', 'admin', 'suku', 'bunga', 'total'];

    function isHeaderLine(l) {
        const lower = l.toLowerCase();
        const score = skipWords.filter(w => lower.includes(w)).length;
        return score >= 3 || (score >= 2 && l.length < 60) || /^[a-z\s]{3,30}$/i.test(l.trim());
    }

    function parseAmount(s) {
        if (!s) return null;
        let cleaned = s.replace(/^[+\s]+/, '').replace(/[Rp$\s]/g, '').replace(/,/g, '').trim();
        if (!cleaned || cleaned === '-' || cleaned === '0') return null;
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : Math.abs(num);
    }

    function isDateToken(t) {
        return /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(t) || /^\d{1,2}\s+(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)\s+\d{4}$/i.test(t);
    }

    for (let ln = 0; ln < lines.length; ln++) {
        const line = lines[ln];
        if (line.length < 15) continue;
        if (isHeaderLine(line)) {
            if (/saldo\s+(awal|akhir)/i.test(line)) {
                const amtMatch = line.match(/[\d,.]+/);
                if (amtMatch) continue;
            }
            continue;
        }

        // Tokenize by 2+ spaces (column-based PDFs)
        const tokens = line.split(/\s{2,}/).map(t => t.trim()).filter(t => t.length > 0);
        const words = line.split(/\s+/);

        let date = null;
        let desc = '';
        let debitVal = null;
        let creditVal = null;
        let amount = null;
        let type = 'expense';

        // Strategy 1: Column-based (tokens separated by 2+ spaces)
        if (tokens.length >= 3) {
            const dateCandidates = tokens.filter(t => isDateToken(t));
            if (dateCandidates.length > 0) {
                date = parseDate(dateCandidates[0]);
                if (date) {
                    const dateIdx = tokens.indexOf(dateCandidates[0]);
                    const afterDate = tokens.slice(dateIdx + 1).filter(t => !isDateToken(t));
                    // Find amounts in remaining tokens
                    const amountTokens = afterDate.map(t => ({ raw: t, val: parseAmount(t) })).filter(t => t.val !== null && t.val > 0);

                    if (amountTokens.length === 1) {
                        amount = amountTokens[0].val;
                        type = 'expense';
                        const descTokens = afterDate.slice(0, afterDate.indexOf(amountTokens[0]));
                        desc = descTokens.join(' ');
                    } else if (amountTokens.length >= 2) {
                        // Debit & credit columns (or debit & saldo)
                        const firstAmt = amountTokens[0];
                        const secondAmt = amountTokens[1];
                        const firstRaw = firstAmt.raw.replace(/[Rp$\s]/g, '');
                        const secondRaw = secondAmt.raw.replace(/[Rp$\s]/g, '');
                        // Heuristic: if first has negative sign or is debit
                        if (firstAmt.raw.includes('-') || firstAmt.raw.includes('DB')) {
                            debitVal = firstAmt.val;
                            creditVal = secondAmt.val;
                        } else {
                            creditVal = firstAmt.val;
                            debitVal = secondAmt.val;
                        }
                        // Usually debit is expense, credit is income
                        if (debitVal && creditVal) {
                            // Both present — treat as income if credit >= debit
                            type = creditVal >= debitVal ? 'income' : 'expense';
                            amount = type === 'income' ? creditVal : debitVal;
                        } else if (creditVal) {
                            amount = creditVal;
                            type = 'income';
                        } else if (debitVal) {
                            amount = debitVal;
                            type = 'expense';
                        }
                        const descStart = dateIdx + 1;
                        const descEnd = descStart + afterDate.indexOf(firstAmt);
                        desc = tokens.slice(descStart, descStart + descEnd).join(' ');
                    }

                    if (desc.length < 2) {
                        // Use raw text between date and first number
                        const dateEnd = line.indexOf(dateCandidates[0]) + dateCandidates[0].length;
                        const firstNumIdx = line.search(/[\d,.]+(?!.*[\d,.])/);
                        desc = line.substring(dateEnd, firstNumIdx).replace(/\s+/g, ' ').trim();
                    }
                }
            }
        }

        // Strategy 2: Simple line-based regex (fallback)
        if (!date) {
            const dateMatch = line.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/);
            if (!dateMatch) continue;
            date = parseDate(dateMatch[1]);
            if (!date) continue;

            const numbers = line.match(/[+-]?[\d,.]+/g);
            if (!numbers || numbers.length === 0) continue;

            // Find the last number as amount
            const lastNum = numbers[numbers.length - 1].replace(/,/g, '');
            const amt = parseFloat(lastNum);
            if (isNaN(amt) || amt <= 0) continue;

            // Check for negative sign or DB indicator
            const hasDB = /DB|DEBET|DEBIT|KELUAR|KURANG|-\s*[\d]/i.test(line);
            const hasCR = /CR|KREDIT|MASUK|TAMBAH|\+[\d]/i.test(line);

            if (line.includes('-') && numbers.some(n => n.startsWith('-'))) {
                type = 'expense';
            } else if (hasDB && !hasCR) {
                type = 'expense';
            } else if (hasCR && !hasDB) {
                type = 'income';
            } else if (line.toLowerCase().includes('biaya') || line.toLowerCase().includes('admin')) {
                type = 'expense';
            } else if (line.toLowerCase().includes('transfer masuk') || line.toLowerCase().includes('dari ')) {
                type = 'income';
            } else {
                // Use column-based deduction: check if the second-to-last token is a smaller number (likely debit)
                if (numbers.length >= 2) {
                    const maybeDebit = parseFloat(numbers[numbers.length - 2].replace(/,/g, ''));
                    if (!isNaN(maybeDebit) && maybeDebit > 0 && maybeDebit < amt) {
                        type = 'income';
                    } else if (!isNaN(maybeDebit) && maybeDebit > 0) {
                        type = 'expense';
                    }
                }
            }
            amount = amt;

            const descStart = dateMatch.index + dateMatch[0].length;
            const lastNumIdx = line.lastIndexOf(numbers[numbers.length - 1]);
            let rawDesc = line.substring(descStart, lastNumIdx).trim();
            // Remove leading/trailing non-alpha chars
            rawDesc = rawDesc.replace(/^[\s|:;.\-,\/]+/, '').replace(/[\s|:;.\-,\/]+$/, '').trim();
            desc = rawDesc.replace(/\s+/g, ' ');
        }

        if (!date || !amount || amount <= 0) continue;
        if (desc.length < 2) continue;

        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        transactions.push({
            id: `pdf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            date: dateKey,
            description: desc.substring(0, 120),
            amount: amount,
            type: type,
            category: type === 'income' ? 'Pemasukan PDF' : 'Pengeluaran PDF',
            walletId: '',
            cabang: '',
            isModalKeluar: false,
            createdAt: Date.now()
        });
    }

    // Deduplicate by date+amount+desc similarity
    const seen = new Set();
    return transactions.filter(t => {
        const key = `${t.date}|${t.amount}|${t.description.substring(0, 30)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function parseDate(str) {
    str = str.replace(/\s+/g, ' ').trim();
    // DD/MM/YYYY or DD-MM-YYYY
    let m = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (m) {
        const d = parseInt(m[1]), mo = parseInt(m[2]) - 1, y = parseInt(m[3]);
        if (mo >= 0 && mo <= 11 && d >= 1 && d <= 31) return new Date(y, mo, d);
    }
    // DD/MM/YY
    m = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2})$/);
    if (m) {
        const d = parseInt(m[1]), mo = parseInt(m[2]) - 1, y = 2000 + parseInt(m[3]);
        if (mo >= 0 && mo <= 11 && d >= 1 && d <= 31) return new Date(y, mo, d);
    }
    // DD Mon YYYY
    const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
    m = str.match(/^(\d{1,2})\s+([a-z]{3,4})\s+(\d{4})$/i);
    if (m) {
        const mo = months.indexOf(m[2].toLowerCase().substring(0, 3));
        if (mo >= 0) return new Date(parseInt(m[3]), mo, parseInt(m[1]));
    }
    return null;
}

function renderPDFPreview() {
    document.getElementById('pdfImportResults').style.display = 'block';
    document.getElementById('pdfTotalTransaksi').textContent = `${pdfParsedTransactions.length} transaksi ditemukan dari ${pdfFileName}`;

    const walletSelect = document.getElementById('pdfTargetWallet');
    const wallets = loadData(DB.wallets) || [];
    walletSelect.innerHTML = wallets.map(w => `<option value="${w.id}">${w.icon} ${w.name}</option>`).join('');
    if (wallets.length > 0) walletSelect.value = wallets[0].id;

    const months = {};
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    pdfParsedTransactions.forEach(t => {
        const d = new Date(t.date + 'T00:00:00');
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!months[key]) months[key] = { year: d.getFullYear(), month: d.getMonth(), label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, income: 0, expense: 0, items: [] };
        months[key].items.push(t);
        if (t.type === 'income') months[key].income += t.amount;
        else months[key].expense += t.amount;
    });

    const sortedKeys = Object.keys(months).sort();
    const container = document.getElementById('pdfMonthContainer');
    container.innerHTML = sortedKeys.map(key => {
        const m = months[key];
        const itemsHtml = m.items.map(t =>
            `<div class="pdf-trx-item">
                <span class="pdf-trx-date">${t.date}</span>
                <span class="pdf-trx-desc">${escHtml(t.description)}</span>
                <span class="pdf-trx-amount ${t.type}">${t.type === 'income' ? '+' : '-'} Rp ${formatNumber(t.amount)}</span>
            </div>`
        ).join('');
        return `<div class="pdf-month-card">
            <div class="pdf-month-header">
                <span class="pdf-month-name">${m.label}</span>
                <div class="pdf-month-summary">
                    <span class="pdf-month-income">+Rp ${formatNumber(m.income)}</span>
                    <span class="pdf-month-expense">-Rp ${formatNumber(m.expense)}</span>
                </div>
            </div>
            ${itemsHtml || '<div class="pdf-month-empty">Tidak ada transaksi</div>'}
        </div>`;
    }).join('');
}

function saveAllPDFTransactions() {
    const walletId = document.getElementById('pdfTargetWallet').value;
    if (!walletId) {
        alert('Pilih dompet tujuan terlebih dahulu.');
        return;
    }
    const transactions = loadData(DB.transactions);
    let saved = 0;
    pdfParsedTransactions.forEach(t => {
        const exists = transactions.some(x => x.date === t.date && x.description === t.description && Math.abs(x.amount - t.amount) < 100);
        if (!exists) {
            transactions.push({ ...t, walletId, id: generateId() });
            saved++;
        }
    });
    saveData(DB.transactions, transactions);
    addActivity(`📄 Import ${pdfFileName} — ${saved} transaksi dari PDF`);
    alert(`✅ ${saved} transaksi berhasil disimpan.\n${pdfParsedTransactions.length - saved} transaksi dilewati (duplikat).`);
    recalculateAll();
    renderAll();
    pdfParsedTransactions = [];
    document.getElementById('pdfImportResults').style.display = 'none';
    document.getElementById('pdfFileInput').value = '';
}

function formatNumber(n) {
    return n.toLocaleString('id-ID');
}

function escHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}
