import React, { useState } from 'react';
import { X, Printer, Barcode as BarcodeIcon, Copy, Check } from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const { settings, formatCurrency } = useShop();
  const [printCopies, setPrintCopies] = useState<number>(4);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !product) return null;

  const barcodeValue = product.barcode || product.sku;

  const handlePrint = () => {
    window.print();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(barcodeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate deterministic bar widths based on barcode chars
  const renderBarcodeSvg = () => {
    const chars = barcodeValue.split('');
    const bars: boolean[] = [];

    // Quiet zone
    bars.push(false, false, false, false);
    // Start guard
    bars.push(true, false, true);

    chars.forEach((c) => {
      const code = c.charCodeAt(0);
      // Produce 6 bars per character based on bits
      for (let i = 0; i < 6; i++) {
        bars.push(((code >> i) & 1) === 1);
      }
      bars.push(false);
    });

    // End guard
    bars.push(true, false, true, true);
    bars.push(false, false, false, false);

    return (
      <svg className="w-full h-12" viewBox={`0 0 ${bars.length * 2} 48`} preserveAspectRatio="none">
        {bars.map((isBar, idx) => (
          isBar && (
            <rect
              key={idx}
              x={idx * 2}
              y={0}
              width={2}
              height={44}
              fill="#000000"
            />
          )
        ))}
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarcodeIcon className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-base text-white">Print Product Barcode Labels</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Controls */}
          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
            <div>
              <span className="text-xs text-slate-400 block">Number of label stickers:</span>
              <div className="flex items-center space-x-2 mt-1">
                {[1, 2, 4, 8, 12].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPrintCopies(num)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                      printCopies === num
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={copyCode}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Printable Sheet Preview */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Thermal / A4 Sticker Label Preview ({printCopies} copies)
            </div>

            <div className="grid grid-cols-2 gap-3 printable-content">
              {Array.from({ length: printCopies }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white text-black p-2.5 rounded-lg border border-slate-300 shadow-sm flex flex-col justify-between"
                  style={{ minHeight: '125px' }}
                >
                  <div className="flex items-center justify-between border-b border-black pb-0.5">
                    <span className="font-extrabold text-[11px] tracking-tight uppercase">
                      {settings.shopName || 'Sumaiya telecom'}
                    </span>
                    <span className="text-[9px] font-mono font-bold">RACK: {product.rackLocation || 'A-01'}</span>
                  </div>

                  <div className="my-1">
                    <p className="text-[10px] font-bold leading-tight line-clamp-1">{product.name}</p>
                    <p className="text-[9px] text-gray-600 truncate">{product.compatibleModels}</p>
                  </div>

                  {/* Barcode graphic */}
                  <div className="my-0.5 px-1 bg-white">
                    {renderBarcodeSvg()}
                  </div>

                  <div className="flex items-center justify-between pt-0.5 border-t border-gray-300 text-[10px]">
                    <span className="font-mono font-bold text-[9px]">{barcodeValue}</span>
                    <span className="font-extrabold text-[12px] text-black">
                      {formatCurrency(product.sellingPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            Format: Standard 50x30mm or A4 sheet
          </span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-md shadow-blue-600/30"
            >
              <Printer className="w-4 h-4" />
              <span>Print Stickers</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
