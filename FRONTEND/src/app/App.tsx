import { useRef, useState, useEffect } from 'react';
import { Eraser, RotateCcw, Pencil, Trash2 } from 'lucide-react';

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

  const getCanvasPoint = (canvas: HTMLCanvasElement, e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvas.getBoundingClientRect();

    // Convert from displayed CSS pixels to canvas pixel coordinates.
    const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
    const y = ((e.clientY - rect.top) * canvas.height) / rect.height;

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasPoint(canvas, e);

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

    const { x, y } = getCanvasPoint(canvas, e);

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

  const simulateDetection = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to Blob (PNG format)
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append('image', blob, 'canvas.png');
      // Kirim juga tipe deteksi yang sedang dipilih (Huruf atau Angka)
      formData.append('type', detectionType === 'letter' ? 'letter' : 'number');
      
      try {
        const response = await fetch('http://127.0.0.1:5000/api/detect', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Gagal menghubungi server');
        }

        const data = await response.json();
        
        // Data dari backend: { prediction: "A", confidence: 98.5 }
        setDetectedResult(data.prediction);
        setConfidence(data.confidence);
        
        if (detectionType === 'letter') {
          setDetectedLetters((prev) => [...prev, data.prediction]);
        }
      } catch (error) {
        console.error("Error detecting image:", error);
        setDetectedResult('Error');
        setConfidence(0);
      }
    }, 'image/png');
  };

  const clearDetectedLetters = () => {
    setDetectedLetters([]);
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 py-3 pl-3 pr-1 md:py-4 md:pl-4 md:pr-2">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Pendeteksi Huruf & Angka
          </h1>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 flex-1 min-h-0">
        {/* Canvas Panel */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-blue-300 p-3 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-blue-900">✏️ Kanvas Gambar</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${mode === 'pencil' ? 'bg-blue-600' : 'bg-orange-500'}`}></div>
              <span className="text-sm font-bold text-gray-700">
                {mode === 'pencil' ? '🖊️ Pensil' : '🧹 Hapus'}
              </span>
            </div>
          </div>

          <div className="border-4 border-blue-300 rounded-xl overflow-hidden bg-white shadow-inner h-[calc(100%-52px)]">
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

        {/* Right Side: Control + Detection */}
        <div className="grid grid-rows-[3fr_2fr] gap-3 min-h-0 w-full">
          {/* Control Panel */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-300 p-3 overflow-hidden min-h-0">
            <h3 className="text-lg font-bold text-blue-900 mb-1.5">🎨 Kontrol</h3>

            {/* Mode Selection */}
            <div className="mb-2">
              <label className="block text-sm font-bold mb-1 text-gray-700">Pilih Alat</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('pencil')}
                  className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all text-sm font-bold ${
                    mode === 'pencil'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                  }`}
                >
                  <Pencil size={18} />
                  <span>Pensil</span>
                </button>
                <button
                  onClick={() => setMode('eraser')}
                  className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all text-sm font-bold ${
                    mode === 'eraser'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-orange-100'
                  }`}
                >
                  <Eraser size={18} />
                  <span>Hapus</span>
                </button>
              </div>
            </div>

            {/* Pencil Size */}
            <div className="mb-2">
              <label className="block text-sm font-bold mb-1 text-gray-700">
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
            <div className="mb-2">
              <label className="block text-sm font-bold mb-1 text-gray-700">
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
            <div className="mb-2">
              <label className="block text-sm font-bold mb-1 text-gray-700">Tipe Deteksi</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDetectionType('letter')}
                  className={`px-2 py-1.5 rounded-lg text-sm font-bold ${
                    detectionType === 'letter'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-cyan-100'
                  }`}
                >
                  Huruf
                </button>
                <button
                  onClick={() => setDetectionType('word')}
                  className={`px-2 py-1.5 rounded-lg text-sm font-bold ${
                    detectionType === 'word'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-cyan-100'
                  }`}
                >
                  Angka
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={clearCanvas}
                className="inline-flex min-w-[170px] items-center justify-center gap-2 px-4 py-1.5 mt-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm"
              >
                <Trash2 size={16} />
                <span>Hapus Semua</span>
              </button>
              <button
                onClick={simulateDetection}
                className="inline-flex min-w-[170px] items-center justify-center gap-2 px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm"
              >
                <RotateCcw size={16} />
                <span>Deteksi Ulang</span>
              </button>
            </div>
          </div>

          {/* Detection Result Panel */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-300 p-3 overflow-y-auto">
            <h3 className="text-lg font-bold text-blue-900 mb-2">📊 Hasil Deteksi</h3>

            {detectedResult ? (
              <div>
                <div className="text-center p-2.5 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg mb-2.5">
                  <p className="text-sm font-bold text-gray-700 mb-1">
                    {detectionType === 'letter' ? '🔤 Huruf:' : '� Angka:'}
                  </p>
                  <div className="text-4xl font-bold text-blue-700 mb-1">{detectedResult}</div>
                  <div className="text-sm">
                    <span className="font-bold text-gray-700">Akurasi: </span>
                    <span className="font-bold text-blue-600">{confidence}%</span>
                  </div>
                </div>

                {/* Letter History */}
                {detectionType === 'letter' && detectedLetters.length > 0 && (
                  <div className="p-2.5 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-700">Riwayat:</span>
                      <button
                        onClick={clearDetectedLetters}
                        className="text-sm px-2 py-1 bg-red-400 hover:bg-red-500 text-white rounded"
                      >
                        Hapus
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {detectedLetters.slice(-5).map((letter, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-white text-blue-700 rounded text-sm font-bold"
                        >
                          {letter}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm bg-white p-2 rounded">
                      <span className="text-gray-700">Kata: </span>
                      <span className="font-bold text-blue-700">{detectedLetters.join('')}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 py-4">
                Belum ada hasil deteksi
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}