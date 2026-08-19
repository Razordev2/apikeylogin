# 🔑 API Key Admin Panel (Next.js & Vercel Ready)

Website Panel Admin modern & responsif untuk membuat User, mengelola API Key, mengatur durasi kadaluarsa (Day Expired), menambah hari aktif (+Hari / Tambahin Day), dan memvalidasi keabsahan API Key secara publik melalui endpoint API.

---

## ✨ Fitur Utama

- 🛡️ **Admin Panel Security**: Autentikasi Login Admin menggunakan PIN / Password Admin (Default: `admin123`).
- 👤 **Create User + Key**: Form pembuatan user baru dengan pembuatan string API Key unik (`sk_live_...`) & durasi aktif dalam jumlah hari.
- ➕ **Tambahin Day (Perpanjang Masa Aktif)**: Fitur langsung (+Hari / Extend Days) untuk menambah jumlah hari aktif pada key yang sudah ada (misal +7, +15, +30, +90 hari).
- 🔄 **Regenerate & Revoke**: Fitur mereset string key baru dan mencabut (revoke) atau mengaktifkan kembali akses API key.
- 🔍 **Pencarian & Filter**: Filter berdasarkan status key (*Aktif*, *Expired*, *Revoked*) dan pencarian nama user/alias.
- ⚡ **Public API Validator Endpoint (`GET /api/validate?key=...`)**: Endpoint publik serverless untuk aplikasi/script klien memverifikasi keaktifan API Key.
- 🧪 **Interactive API Tester**: Fitur uji coba validitas API Key langsung di dalam Dashboard Admin.
- 💻 **Integrasi Code Snippets**: Contoh kodingan penggunaan API di Node.js, Python, cURL, PHP.
- 🚀 **Vercel Deploy Ready**: Didesain khusus untuk langsung di-deploy di Vercel dalam 1 klik.

---

## 🛠️ Cara Menjalankan Secara Lokal (Local Development)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```

3. Buka browser dan akses:
   [http://localhost:3000](http://localhost:3000)

4. Login Admin bawaan:
   - **Password**: `admin123`

---

## 🌐 Cara Deploy ke Vercel (Deployment)

### Metode 1: Menggunakan Vercel CLI

1. Pastikan Vercel CLI terinstall:
   ```bash
   npm i -g vercel
   ```

2. Jalankan perintah deploy di folder ini:
   ```bash
   vercel
   ```

3. Untuk deploy ke production:
   ```bash
   vercel --prod
   ```

### Metode 2: Menggunakan GitHub + Dashboard Vercel

1. Push / Upload repository ini ke account **GitHub** Anda.
2. Buka dashboard [Vercel](https://vercel.com).
3. Klik **"Add New"** -> **"Project"**.
4. Import repository GitHub Anda.
5. (Opsional) Tambahkan Environment Variable:
   - Key: `ADMIN_PASSWORD`
   - Value: *[Password admin pilihan Anda]*
6. Klik **Deploy**. Selesai!

---

## 📡 Dokumentasi Endpoint Validasi API Klien

Aplikasi klien/script Anda dapat memeriksa status keabsahan API Key dengan melakukan request `GET` atau `POST`:

### Request URL
```http
GET https://domain-anda.vercel.app/api/validate?key=YOUR_API_KEY
```

atau menggunakan Header `x-api-key`:
```http
GET https://domain-anda.vercel.app/api/validate
Header: x-api-key: YOUR_API_KEY
```

### Respon JSON (Jika Valid & Aktif)
```json
{
  "valid": true,
  "user": "alex_developer",
  "alias": "Production Mobile App",
  "status": "active",
  "daysRemaining": 25,
  "expiresAt": "2026-09-13T13:14:39.000Z",
  "message": "API Key valid & aktif"
}
```

### Respon JSON (Jika Expired)
```json
{
  "valid": false,
  "user": "budi_santoso",
  "status": "expired",
  "expiresAt": "2026-08-09T13:14:39.000Z",
  "daysRemaining": 0,
  "message": "API Key telah masa kadaluarsa (Expired). Silakan hubungi admin untuk perpanjang hari."
}
```

---

## 📂 Struktur Project

```
├── app/
│   ├── api/
│   │   ├── auth/route.js       # API Login Admin
│   │   ├── keys/route.js       # API CRUD Key & Tambahin Day
│   │   └── validate/route.js   # API Public Validator Endpoint
│   ├── globals.css             # System Styling & Dark Theme Glassmorphism
│   ├── layout.js               # Root Layout & Metadata
│   └── page.js                 # UI Utama Admin Dashboard & Modals
├── data/
│   └── keys.json               # Local Persistent Data Store
├── lib/
│   └── db.js                   # Logic Manajemen Key & Expiration Calculation
├── .env.example
├── next.config.js
├── package.json
├── vercel.json
└── README.md
```
