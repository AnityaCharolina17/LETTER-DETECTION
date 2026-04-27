# Aplikasi Pendeteksi Huruf & Angka (Alphanumeric Detection) 🤖✍️

Proyek ini adalah web aplikasi interaktif berbasis *Deep Learning* yang memungkinkan pengguna menggambar huruf (A-Z) maupun angka (0-9) di atas sebuah kanvas virtual, kemudian Artificial Intelligence akan mendeteksi tebakan karakter tersebut beserta hasil tingkat keyakinan (*confidence level*) secara *real-time*.

## 🏗️ Arsitektur Proyek

Proyek ini terbagi menjadi dua bagian utama:
1. **`Backend` (Python / Flask)**: Server API yang bertugas memuat model Machine Learning `.h5`, melakukan *image pre-processing* menggunakan OpenCV, dan mengembalikan hasil prediksi akurat.
2. **`FRONTEND` (React / Vite)**: Tampilan visual interaktif untuk pengguna menggambar di browser. Menggunakan React dan Tailwind CSS.

## ✨ Fitur Utama
- **Kanvas Interaktif:** Dukungan mode pensil dan penghapus lengkap dengan ukuran kuas dinamis.
- **Smart Pre-Processing:** Komputer secara otomatis mencari letak tinta tulisan, memberikan jarak *padding* yang aman, dan memusatkannya agar dibaca sempurna oleh AI.
- **Kondisional Mode:** Algoritma pemblokiran akurasi pintar. Jika *user* mengatur ke mode "Huruf", AI tidak akan mungkin tertipu menebaknya sebagai "Angka", begitu juga sebaliknya!

---

## 🚀 Cara Menjalankan Aplikasi Lokal (Local Setup)

Untuk menjalankan proyek ini di komputer Anda, Anda harus menyiapkan dua terminal (satu untuk Backend, satu untuk Frontend).

### 1. Menjalankan Backend (Server AI)
Pastikan Anda sudah menginstal Python di komputer. Buka terminal baru dan jalankan:
```bash
cd Backend
pip install flask flask-cors tensorflow opencv-python numpy
python app.py
```
*(Server Machine Learning akan berjalan di `http://127.0.0.1:5000`)*

### 2. Menjalankan Frontend (Tampilan UI)
Pastikan Anda sudah menginstal Node.js di komputer. Buka tab terminal baru lalu jalankan:
```bash
cd FRONTEND
npm install
npm run dev
```
*(Tampilan web akan berjalan di `http://localhost:5173` atau sesuai link dari Vite)*

---

## 🛠️ Stack Teknologi
- **TensorFlow & Keras:** Arsitektur dan file berformat `.h5/keras`.
- **OpenCV (`cv2`):** Untuk memproses ulang *(Resize, Thresholding, Bounding Box, Auto-Cropping)* gambar kanvas sebelum masuk ke Model AI.
- **Flask API:** Jembatan antara server Python dan Web.
- **React.js & Vite:** Ekosistem Frontend responsif.
- **Tailwind CSS:** Sistem *styling* *(desain)* yang cepat untuk memperindah respons web.
