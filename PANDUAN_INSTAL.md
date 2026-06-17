# PANDUAN INSTALASI MUGHIS BANK di HP

## 📱 iPhone (Safari)

### Langkah-langkah:
1. Buka **Safari** (tidak bisa dari Chrome/brave di iPhone)
2. Kunjungi URL aplikasi MUGHIS BANK (dari Cloudflare Pages)
3. Ketuk ikon **Share** (kotak dengan panah ke atas) di tengah bawah layar
4. Gulir ke bawah, ketuk **Add to Home Screen** (Tambahkan ke Layar Utama)
5. Nama akan otomatis terisi "MUGHIS BANK" — ketuk **Add** (kanan atas)
6. Aplikasi muncul di Home Screen dengan icon logo MUGHIS BANK
7. Buka dari Home Screen — akan terbuka seperti aplikasi native (tanpa address bar Safari)

### Catatan:
- Pastikan tidak dalam mode **Private Browsing** (fitur Add to Home Screen tidak muncul)
- Wifi/data tetap diperlukan saat pertama kali buka (karena ini web app)
- Update aplikasi cukup refresh halaman atau buka dari Home Screen (selalu ambil versi terbaru)

---

## 🤖 Android (Chrome)

### Langkah-langkah:
1. Buka **Chrome**
2. Kunjungi URL aplikasi MUGHIS BANK (dari Cloudflare Pages)
3. Akan muncul pop-up **"Tambahkan MUGHIS BANK ke Layar Utama?"** — ketuk **Tambahkan**
4. Atau jika tidak muncul: ketuk menu **⋮** (3 titik kanan atas) → **Add to Home Screen**
5. Nama akan terisi otomatis — ketuk **Add**
6. Aplikasi muncul di Home Screen

### Catatan:
- Di beberapa HP ada langkah tambahan: setelah ketuk Add, geser icon ke halaman utama
- Buka dari Home Screen — berjalan seperti aplikasi native (tanpa URL bar)
- Update: cukup buka aplikasi, konten terbaru akan termuat

---

## 🔄 Update Aplikasi

Karena ini PWA (Progressive Web App), update dilakukan otomatis:
1. **Developer** push perubahan ke GitHub → Cloudflare Pages auto-deploy
2. **User** cukup buka aplikasi dari Home Screen — konten terbaru termuat
3. Jika masih tampak lama, lakukan **Swipe down refresh** di halaman utama

---

## ❓ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tidak muncul "Add to Home Screen" di iPhone | Pastikan pakai Safari, bukan Chrome/brave. Matikan Private Browsing |
| Icon aplikasi buram/kotak putih | Hapus dari Home Screen, instal ulang |
| Data hilang setelah update | Data disimpan di localStorage HP — tidak akan hilang. Tapi backup Telegram dianjurkan |
| Aplikasi lambat | Hapus cache Safari: Settings → Safari → Hapus Riwayat dan Data Website |
| Tidak bisa login setelah instal | Tidak ada password — langsung masuk. Jika muncul layar putih, refresh halaman |
