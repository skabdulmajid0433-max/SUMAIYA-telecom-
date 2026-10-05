import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Barcode as BarcodeIcon, AlertCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcodeOrSku: string) => void;
  title?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Product Barcode'
}) => {
  const { products } = useShop();
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setManualCode('');
      setCameraError(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera not supported on this device/browser');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. You can enter or select the barcode/SKU below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    onScan(code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarcodeIcon className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-sm sm:text-base text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative bg-black h-56 sm:h-64 flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Scan targeting frame overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-32 border-2 border-red-500 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/80 animate-pulse shadow-sm" />
                </div>
              </div>
              <div className="absolute bottom-2 text-[11px] text-white/90 bg-black/60 px-3 py-1 rounded-full">
                Align barcode within red box
              </div>
            </>
          ) : (
            <div className="text-center p-6 text-slate-400 space-y-2">
              <Camera className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              {cameraError ? (
                <p className="text-xs text-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 mr-1 inline" /> {cameraError}
                </p>
              ) : (
                <p className="text-xs">Starting camera feed...</p>
              )}
            </div>
          )}
        </div>

        {/* Manual Barcode / SKU entry */}
        <div className="p-4 bg-slate-850 space-y-4">
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="text-xs font-medium text-slate-300">
              Or Enter Barcode / SKU manually:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. 890123456701 or LCD-SAM-A15"
                className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Quick select test items */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Quick Barcodes from Inventory
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onScan(p.barcode || p.sku);
                    onClose();
                  }}
                  className="w-full text-left p-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-xs flex justify-between items-center transition"
                >
                  <span className="truncate max-w-[220px] text-slate-200">{p.name}</span>
                  <span className="font-mono text-[10px] text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded">
                    {p.barcode || p.sku}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
