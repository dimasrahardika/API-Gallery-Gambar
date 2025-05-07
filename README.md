# API GaleriGambar

API GaleriGambar adalah sebuah RESTful API untuk layanan manajemen gambar dengan autentikasi JWT. Aplikasi ini memungkinkan pengguna untuk melihat, mengunggah, dan menghapus gambar, dengan fitur tambahan termasuk pembuatan thumbnail otomatis dan manajemen pengguna.

## Fitur Utama

- Autentikasi menggunakan JSON Web Token (JWT)
- Manajemen pengguna (registrasi, login)
- Upload gambar dengan pembatasan tipe file dan ukuran
- Pembuatan thumbnail otomatis
- Metadata gambar (judul, deskripsi, tag)
- Penyimpanan file terorganisir
- Frontend sederhana untuk interaksi dengan API
- Proteksi endpoint untuk operasi sensitif (POST, DELETE)
- Dukungan untuk akses API melalui berbagai client (browser, Postman)

## Teknologi yang Digunakan

- **Backend**:
  - Node.js
  - Express
  - Sequelize (ORM)
  - JSON Web Token (jsonwebtoken)
  - bcryptjs untuk enkripsi password
  - multer untuk upload file

- **Frontend**:
  - HTML, CSS
  - JavaScript (vanilla)
  - Fetch API untuk komunikasi dengan backend

- **Database**:
  - MySQL/MariaDB

## Struktur Proyek

```
API_GaleriGambar/
├── src/
│   ├── config/         # Konfigurasi database
│   ├── controllers/    # Controller untuk operasi API
│   ├── middlewares/    # Middleware (auth, upload, error handler)
│   ├── models/         # Model Sequelize
│   ├── routes/         # Definisi routing API
│   ├── services/       # Service layer
│   ├── utils/          # Utilitas dan helper
│   ├── app.js          # Konfigurasi aplikasi Express
│   └── server.js       # Entry point aplikasi
├── uploads/            # Folder penyimpanan gambar
│   ├── images/         # Gambar asli
│   └── thumbnails/     # Thumbnail gambar
├── login.html          # Halaman login
├── register.html       # Halaman register
├── upload-form.html    # Form upload gambar
├── view-images.html    # Galeri gambar
├── package.json        # Dependensi NPM
└── README.md           # Dokumentasi proyek
```

## Cara Instalasi

1. **Clone repository**:
   ```bash
   git clone https://github.com/dimasrahardika/API-Gallery-Gambar.git
   cd API_GaleriGambar
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi database**:
   - Buat database baru di MySQL/MariaDB
   - Sesuaikan konfigurasi di `src/config/database.js`

4. **Sinkronisasi database**:
   ```bash
   node src/utils/dbSync.js
   ```

5. **Jalankan server**:
   ```bash
   npm start
   ```

## Penggunaan API

### Endpoint Autentikasi

- **Register**: `POST /api/v1/auth/register`
  ```json
  {
    "username": "usertest",
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **Login**: `POST /api/v1/auth/login`
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **Get Profile**: `GET /api/v1/auth/me` (membutuhkan token)

### Endpoint Gambar

- **Get All Images**: `GET /api/v1/images`
- **Get Image by ID**: `GET /api/v1/images/:id`
- **Upload Image**: `POST /api/v1/images` (membutuhkan token)
  - Form data dengan key: `image`, `title`, `description`, `tags`
- **Delete Image**: `DELETE /api/v1/images/:id` (membutuhkan token)

### Penggunaan Token JWT

Untuk endpoint yang terproteksi, tambahkan header:
```
Authorization: Bearer [token]
```

## Penggunaan via Browser

1. Akses `register.html` untuk membuat akun baru
2. Login melalui `login.html` untuk mendapatkan akses token
3. Lihat galeri gambar melalui `view-images.html`
4. Upload gambar baru melalui `upload-form.html` (hanya untuk user yang sudah login)

## Penggunaan via Postman

1. Register user baru dengan mengirim POST request ke `/api/v1/auth/register`
2. Login dengan mengirim POST request ke `/api/v1/auth/login`
3. Salin token dari respons login
4. Gunakan token tersebut di header Authorization untuk mengakses endpoint terproteksi

## Kontribusi

Silakan buat pull request untuk kontribusi pada proyek ini.

## Lisensi

[Specify your license here]
