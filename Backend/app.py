from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Mengizinkan semua origin agar Frontend bisa akses tanpa error CORS
CORS(app) 

@app.route('/api/detect', methods=['POST'])
def detect_image():
    # NANTI: Tangkap file gambar dari Frontend
    if 'image' not in request.files:
        return jsonify({"error": "Tidak ada gambar yang diunggah"}), 400
    file = request.files['image']
    hasil = model.predict(file)
    
    # SEKARANG: Kembalikan Dummy Response
    dummy_response = {
        "prediction": 5,
        "confidence": 0.98
    }
    
    return jsonify(dummy_response), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
    