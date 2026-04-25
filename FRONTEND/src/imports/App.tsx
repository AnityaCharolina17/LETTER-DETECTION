import { useRef, useState, useEffect } from 'react';
import { Eraser, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import { API_DETECT } from './apiConstants';

type Mode = 'pencil' | 'eraser';
type DetectionType = 'letter' | 'word';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<Mode>('pencil');
  const [pencilSize, setPencilSize] = useState(8);
  const [eraserSize, setEraserSize] = useState(20);
  const [detectionType, setDetectionType] = useState<DetectionType>('letter');
  const [detectedResult, setDetectedResult] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [detectedLetters, setDetectedLetters] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 500;
    canvas.height = 400;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'pencil') {
      ctx.lineWidth = pencilSize;
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.lineWidth = eraserSize;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (mode === 'pencil' && canvasRef.current) {
      simulateDetection();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setDetectedResult('');
    setConfidence(0);
    setDetectedLetters([]);
  };

  const simulateDetection = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append('image', blob, 'drawing.png');

      try {
        const response = await fetch(API_DETECT, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Gagal menghubungkan ke API');
        }

        const data = await response.json();
        const detected = String(data.prediction);
        const conf = Math.floor(data.confidence * 100);

        setDetectedResult(detected);
        setConfidence(conf);
        
        if (detectionType === 'letter') {
          setDetectedLetters((prev) => [...prev, detected]);
        }
      } catch (error) {
        console.error('Error saat deteksi:', error);
      }
    });
  };

  const clearDetectedLetters = () => {
    setDetectedLetters([]);
  };

  return (
    <div className="size-full bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Pendeteksi Huruf & Kata
        </h1>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-3 grid-rows-2 gap-4 h-[calc(100vh-140px)]">
        {/* A & B & D & E - Canvas (2 columns, 2 rows) */}
        <div className="col-span-2 row-span-2 bg-white rounded-xl shadow-lg border-2 border-blue-300 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-blue-900">✏️ Kanvas Gambar</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${mode === 'pencil' ? 'bg-blue-600' : 'bg-orange-500'}`}></div>
              <span className="text-sm font-bold text-gray-700">
                {mode === 'pencil' ? '🖊️ Pensil' : '🧹 Hapus'}
              </span>
            </div>
          </div>

          <div className="border-4 border-blue-300 rounded-xl overflow-hidden bg-white shadow-inner h-[calc(100%-50px)]">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="cursor-crosshair w-full h-full"
            />
          </div>
        </div>

        {/* C - Tools Panel (top right) */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-blue-300 p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-blue-900 mb-3">🎨 Kontrol</h3>

          {/* Mode Selection */}
          <div className="mb-3">
            <label className="block text-xs font-bold mb-2 text-gray-700">Pilih Alat</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('pencil')}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all text-xs font-bold ${
                  mode === 'pencil'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                }`}
              >
                <Pencil size={20} />
                <span>Pensil</span>
              </button>
              <button
                onClick={() => setMode('eraser')}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all text-xs font-bold ${
                  mode === 'eraser'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-orange-100'
                }`}
              >
                <Eraser size={20} />
                <span>Hapus</span>
              </button>
            </div>
          </div>

          {/* Pencil Size */}
          <div className="mb-3">
            <label className="block text-xs font-bold mb-1 text-gray-700">
              Ukuran Pensil: <span className="text-blue-600">{pencilSize}px</span>
            </label>
            <input
              type="range"
              min="2"
              max="30"
              value={pencilSize}
              onChange={(e) => setPencilSize(Number(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg cursor-pointer accent-blue-600"
            />
          </div>

          {/* Eraser Size */}
          <div className="mb-3">
            <label className="block text-xs font-bold mb-1 text-gray-700">
              Ukuran Hapus: <span className="text-orange-600">{eraserSize}px</span>
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={eraserSize}
              onChange={(e) => setEraserSize(Number(e.target.value))}
              className="w-full h-2 bg-orange-200 rounded-lg cursor-pointer accent-orange-600"
            />
          </div>

          {/* Detection Type */}
          <div className="mb-3">
            <label className="block text-xs font-bold mb-2 text-gray-700">Tipe Deteksi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDetectionType('letter')}
                className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  detectionType === 'letter'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-cyan-100'
                }`}
              >
                Huruf
              </button>
              <button
                onClick={() => setDetectionType('word')}
                className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  detectionType === 'word'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-cyan-100'
                }`}
              >
                Kata
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={clearCanvas}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-xs"
            >
              <Trash2 size={16} />
              <span>Hapus Semua</span>
            </button>
            <button
              onClick={simulateDetection}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs"
            >
              <RotateCcw size={16} />
              <span>Deteksi Ulang</span>
            </button>
          </div>
        </div>

        {/* F - Result Panel (bottom right) */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-blue-300 p-3 overflow-hidden">
          <h3 className="text-xs font-bold text-blue-900 mb-2">📊 Hasil Deteksi</h3>

          {detectedResult ? (
            <div>
              <div className="text-center p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg mb-2">
                <p className="text-xs font-bold text-gray-700 mb-1">
                  {detectionType === 'letter' ? '🔤 Huruf:' : '📝 Kata:'}
                </p>
                <div className="text-3xl font-bold text-blue-700 mb-1">{detectedResult}</div>
                <div className="text-xs">
                  <span className="font-bold text-gray-700">Akurasi: </span>
                  <span className="font-bold text-blue-600">{confidence}%</span>
                </div>
              </div>

              {/* Letter History */}
              {detectionType === 'letter' && detectedLetters.length > 0 && (
                <div className="p-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-700">Riwayat:</span>
                    <button
                      onClick={clearDetectedLetters}
                      className="text-xs px-2 py-1 bg-red-400 hover:bg-red-500 text-white rounded"
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {detectedLetters.slice(-5).map((letter, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-white text-blue-700 rounded text-xs font-bold"
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs bg-white p-1 rounded">
                    <span className="text-gray-700">Kata: </span>
                    <span className="font-bold text-blue-700">{detectedLetters.join('')}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-gray-500 py-4">
              Belum ada hasil deteksi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}