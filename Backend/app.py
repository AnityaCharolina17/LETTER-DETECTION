import os
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model

app = Flask(__name__)
# Mengizinkan semua origin agar Frontend bisa akses tanpa error CORS
CORS(app) 

# Muat Model (Pastikan pathnya sesuai dengan lokasi file .h5 kamu)
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'model_alfanumerik (1).h5')
# Daftar kelas (Sesuaikan dengan dataset training kamu, misal 0-9 dan A-Z)
CLASSES = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

try:
    model = load_model(MODEL_PATH, compile=False)
    print("Model terload! Input shape:", model.input_shape)
except Exception as e:
    print("Gagal meload model:", e)
    model = None

def preprocess_image(image_bytes, target_shape):
    # Ubah bytes menjadi array gambar opencv
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Ubah ke grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Threshold & Binarisasi (Background hitam, tulisan putih)
    _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)
    
    # Cari letak tulisan (Bounding Box) agar gambar fokus pada huruf
    coords = cv2.findNonZero(thresh)
    if coords is not None:
        x, y, w, h = cv2.boundingRect(coords)
        # Potong pas di tulisannya saja
        cropped = thresh[y:y+h, x:x+w]
        
        # Beri ruang kosong (padding) dan ubah proporsi jadi persegi (1:1) sama rata
        max_dim = max(w, h)
        pad = int(max_dim * 0.25) # Beri jarak aman sekitar 25% dari ukuran tulisan
        size = max_dim + pad * 2
        
        square = np.zeros((size, size), dtype=np.uint8)
        start_y = (size - h) // 2
        start_x = (size - w) // 2
        square[start_y:start_y+h, start_x:start_x+w] = cropped
        
        thresh = square # Gunakan kotak persegi tersebut
    
    # Dapatkan ukuran gambar dari shape model, default (28, 28)
    target_w, target_h = (28, 28)
    if target_shape and len(target_shape) >= 3 and target_shape[1] is not None:
        target_w, target_h = target_shape[1], target_shape[2]
        
    # Resize (Interpolation INTER_AREA bagus untuk mengecilkan ukuran)
    resized = cv2.resize(thresh, (target_w, target_h), interpolation=cv2.INTER_AREA)
    
    # === TAMBAHAN JIKA MODEL ANDA MODEL EMNIST ===
    # Terkadang dataset EMNIST itu posisinya miring 90 derajat secara default (rotated/flipped),
    # hapus komentar (uncomment) DUA baris di bawah INI JIKA hurufnya selalu salah tebak.
    # resized = cv2.flip(resized, 0)
    # resized = cv2.rotate(resized, cv2.ROTATE_90_CLOCKWISE)

    # Normalisasi (0-1) kalau diminta model
    normalized = resized.astype('float32') / 255.0
    
    # Reshape menyesuaikan input model
    if target_shape and len(target_shape) == 4 and target_shape[-1] == 3:
        # Jika model butuh input 3 channel (RGB)
        rgb_img = cv2.cvtColor(resized, cv2.COLOR_GRAY2RGB)
        normalized = rgb_img.astype('float32') / 255.0
        return np.expand_dims(normalized, axis=0)

    # Tambahkan dimensi batch dan channel (1, W, H, 1)
    return np.expand_dims(normalized, axis=(0, -1))

@app.route('/api/detect', methods=['POST'])
def detect_image():
    if model is None:
        return jsonify({"error": "Model tidak terload di server"}), 500

    if 'image' not in request.files:
        return jsonify({"error": "Tidak ada gambar yang diunggah"}), 400
        
    file = request.files['image']
    mode = request.form.get('type', 'all')  # Ambil parameter tipe (huruf atau angka)
    
    try:
        image_bytes = file.read()
        processed_img = preprocess_image(image_bytes, model.input_shape)
        
        predictions = model.predict(processed_img)[0]
        
        # === Kondisional Mode Huruf & Angka ===
        # Di dataset kita: Index 0-9 adalah Angka, 10-35 adalah Huruf
        if mode == 'letter':
            # Jika mode huruf, kita "matikan" kemungkinan terpilihnya index angka (ubah probabilitas jadi 0)
            predictions[0:10] = 0
            # Jika semua prediksi sekarang jadi 0, pastikan tidak error (walau sangat jarang)
            if np.sum(predictions) > 0:
                predictions = predictions / np.sum(predictions) # Normalisasi ulang
        elif mode == 'number':
            # Jika mode angka, kita "matikan" kemungkinan terpilihnya index huruf
            predictions[10:] = 0
            if np.sum(predictions) > 0:
                predictions = predictions / np.sum(predictions)
                
        predicted_index = np.argmax(predictions)
        confidence = float(predictions[predicted_index])
        
        # Konversi index menjadi karakter
        if predicted_index < len(CLASSES):
            predicted_label = CLASSES[predicted_index]
        else:
            predicted_label = str(predicted_index)
            
        response = {
            "prediction": predicted_label,
            "confidence": round(confidence * 100, 2)
        }
        
        return jsonify(response), 200
    except Exception as e:
        print("Error processing:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
    