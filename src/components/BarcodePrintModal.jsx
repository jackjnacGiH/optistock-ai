import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Maximize2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useLanguage } from '../i18n/LanguageContext';

const BarcodePrintModal = ({ isOpen, onClose, product, barcode }) => {
    const { t, language } = useLanguage();
    const previewBarcodeRef = useRef(null);
    const [barcodeDataUrl, setBarcodeDataUrl] = useState(null);

    const [printSettings, setPrintSettings] = useState({
        labelWidth: 50,  // mm
        labelHeight: 30, // mm
        quantity: 1,     // Quantity control
        autoFit: true,   // Auto-fit to page
        textScale: 100   // Text scale percentage (50-200%)
    });

    // Calculate scale factors for barcode
    const baseSize = Math.min(printSettings.labelWidth, printSettings.labelHeight);
    const scaleFactor = printSettings.autoFit ? (baseSize / 30) : 1; // 30mm is the base reference
    const userScale = printSettings.textScale / 100;
    const finalScale = scaleFactor * userScale;

    // Barcode dimensions based on scale - keep text more compact
    const barcodeWidth = Math.max(1, Math.min(3.5, 2 * scaleFactor));
    const barcodeHeight = Math.max(30, Math.min(120, 50 * scaleFactor));
    // Larger barcode text font size for product code visibility
    const barcodeFontSize = Math.max(16, Math.min(32, 18 * Math.sqrt(finalScale)));
    const barcodeTextMargin = Math.max(2, Math.min(6, 3 * scaleFactor));

    // Generate Barcode Data URL for printing - HIGH RESOLUTION for sharp printing
    useEffect(() => {
        if (isOpen && product) {
            try {
                // Use HIGH DPI for sharp barcode (3x resolution)
                const dpiMultiplier = 3;
                const canvas = document.createElement('canvas');

                // First generate to get dimensions
                const tempCanvas = document.createElement('canvas');
                JsBarcode(tempCanvas, barcode, {
                    format: "CODE128",
                    width: barcodeWidth,
                    height: barcodeHeight,
                    displayValue: true,
                    fontSize: barcodeFontSize,
                    margin: 0,
                    textMargin: barcodeTextMargin,
                    background: "#ffffff",
                    lineColor: "#000000",
                    textPosition: "bottom",
                    font: "'Roboto Mono', 'SF Mono', 'Monaco', 'Consolas', monospace",
                    fontOptions: "bold"
                });

                // Create high-res canvas
                canvas.width = tempCanvas.width * dpiMultiplier;
                canvas.height = tempCanvas.height * dpiMultiplier;
                const ctx = canvas.getContext('2d');

                // Disable smoothing for crisp lines
                ctx.imageSmoothingEnabled = false;
                ctx.webkitImageSmoothingEnabled = false;
                ctx.mozImageSmoothingEnabled = false;
                ctx.msImageSmoothingEnabled = false;

                // Scale and draw with sharp rendering
                ctx.scale(dpiMultiplier, dpiMultiplier);

                // Generate barcode directly on high-res canvas
                JsBarcode(canvas, barcode, {
                    format: "CODE128",
                    width: barcodeWidth * dpiMultiplier,
                    height: barcodeHeight * dpiMultiplier,
                    displayValue: true,
                    fontSize: barcodeFontSize * dpiMultiplier,
                    margin: 0,
                    textMargin: barcodeTextMargin * dpiMultiplier,
                    background: "#ffffff",
                    lineColor: "#000000",
                    textPosition: "bottom",
                    font: "'Roboto Mono', 'SF Mono', 'Monaco', 'Consolas', monospace",
                    fontOptions: "bold"
                });

                // Export as high-quality PNG
                setBarcodeDataUrl(canvas.toDataURL('image/png', 1.0));
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }
    }, [isOpen, barcode, barcodeWidth, barcodeHeight, barcodeFontSize, barcodeTextMargin]);

    // Preview generation - also uses scaled dimensions
    useEffect(() => {
        if (isOpen && previewBarcodeRef.current) {
            try {
                JsBarcode(previewBarcodeRef.current, barcode, {
                    format: "CODE128",
                    width: Math.max(1, barcodeWidth * 0.8),
                    height: Math.max(25, barcodeHeight * 0.8),
                    displayValue: true,
                    fontSize: Math.max(10, barcodeFontSize * 0.85),
                    margin: 0,
                    textMargin: Math.max(2, barcodeTextMargin * 0.8),
                    background: "rgba(0,0,0,0)",
                    lineColor: "#000000",
                    textPosition: "bottom",
                    font: "'Roboto Mono', 'SF Mono', 'Monaco', 'Consolas', monospace",
                    fontOptions: "bold"
                });
            } catch (e) { }
        }
    }, [isOpen, barcode, barcodeWidth, barcodeHeight, barcodeFontSize, barcodeTextMargin]);

    const handleNativePrint = () => {
        window.print();
    };

    if (!isOpen || !product) return null;

    const isLandscape = printSettings.labelWidth > printSettings.labelHeight;
    const orientationKeyword = isLandscape ? 'landscape' : 'portrait';

    // Calculate copies per page layout
    const copies = Math.max(1, printSettings.quantity);
    const labelsToPrint = Array.from({ length: copies });

    // Calculate grid layout - how many columns and rows
    const cols = copies <= 1 ? 1 : copies <= 2 ? 2 : copies <= 4 ? 2 : copies <= 6 ? 3 : 4;
    const rows = Math.ceil(copies / cols);

    // Size of each label in the grid
    const labelWidthInGrid = (printSettings.labelWidth - 2) / cols;
    const labelHeightInGrid = (printSettings.labelHeight - 2) / rows;

    // Scale for individual labels in grid
    const gridScaleFactor = Math.min(labelWidthInGrid, labelHeightInGrid) / 30;
    const gridFinalScale = gridScaleFactor * userScale;

    // Calculate font sizes - larger base size for clarity
    const textLength = product?.name?.length || 10;
    const maxLines = textLength > 20 ? 2 : 1; // Allow 2 lines for long text
    const gridMaxLines = 2; // Always allow 2 lines in grid for full text display
    const textLengthFactor = Math.max(0.5, Math.min(1, 30 / textLength)); // Scale down for longer text
    const productNameFontSize = Math.max(8, Math.min(28, 12 * finalScale * textLengthFactor));
    const gridProductNameFontSize = Math.max(6, Math.min(14, 7 * gridFinalScale * textLengthFactor));

    const printContent = (
        <div id="print-portal-root">
            <style>{`
                @media print {
                    /* HIGH-DPI PRINT QUALITY */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        text-rendering: geometricPrecision !important;
                        -webkit-font-smoothing: antialiased !important;
                    }

                    /* STRICT RESET */
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Hide everything else */
                    body > *:not(#print-portal-root) {
                        display: none !important;
                    }

                    /* PAGE CONFIGURATION */
                    @page {
                        size: ${printSettings.labelWidth}mm ${printSettings.labelHeight}mm ${orientationKeyword};
                        margin: 0mm; 
                    }

                    #print-portal-root {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        z-index: 99999;
                        background: white;
                    }

                    /* SINGLE PAGE CONTAINER */
                    .print-page {
                        width: ${printSettings.labelWidth}mm;
                        height: ${printSettings.labelHeight}mm;
                        display: grid;
                        grid-template-columns: repeat(${cols}, 1fr);
                        grid-template-rows: repeat(${rows}, 1fr);
                        gap: ${copies > 1 ? '2mm' : '0'};
                        box-sizing: border-box;
                        padding: ${copies > 1 ? '1mm' : '1mm'};
                        overflow: hidden;
                    }

                    /* INDIVIDUAL LABEL IN GRID */
                    .print-label-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        box-sizing: border-box;
                        padding: ${copies > 1 ? '1mm' : '0.5mm'};
                        border: ${copies > 1 ? '1px solid #e2e8f0' : 'none'};
                        border-radius: ${copies > 1 ? '2px' : '0'};
                    }

                    /* Auto-fit barcode image - CRISP RENDERING */
                    .print-barcode-img {
                        max-width: 100% !important;
                        max-height: ${copies > 1 ? '70%' : '80%'} !important;
                        width: auto !important;
                        height: auto !important;
                        object-fit: contain !important;
                        image-rendering: -webkit-optimize-contrast !important;
                        image-rendering: crisp-edges !important;
                        image-rendering: pixelated !important;
                        -ms-interpolation-mode: nearest-neighbor !important;
                    }

                    /* Auto-fit product name */
                    .print-product-name {
                        font-size: ${copies > 1 ? gridProductNameFontSize : productNameFontSize}px !important;
                        max-width: 100% !important;
                        word-wrap: break-word !important;
                        overflow-wrap: break-word !important;
                        text-align: center !important;
                        line-height: 1.1 !important;
                    }
                }
                
                @media screen {
                    #print-portal-root { display: none; }
                }
            `}</style>

            {/* SINGLE PAGE WITH GRID OF LABELS */}
            <div className="print-page">
                {labelsToPrint.map((_, index) => (
                    <div key={index} className="print-label-item">
                        {/* Barcode area - reduced height to give text more space */}
                        <div style={{
                            flexGrow: 1,
                            flexShrink: 0,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'visible',
                            minHeight: copies > 1 ? '50%' : '55%'
                        }}>
                            {barcodeDataUrl && (
                                <img
                                    src={barcodeDataUrl}
                                    className="print-barcode-img"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain'
                                    }}
                                    alt="barcode"
                                />
                            )}
                        </div>
                        {/* Product name - uses remaining space only */}
                        <div
                            className="print-product-name"
                            style={{
                                textAlign: 'center',
                                fontSize: copies > 1 ? `${gridProductNameFontSize}px` : `${productNameFontSize}px`,
                                fontWeight: 'bold',
                                width: '100%',
                                lineHeight: '1.15',
                                marginTop: '0.5mm',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'normal',
                                display: '-webkit-box',
                                WebkitLineClamp: copies > 1 ? gridMaxLines : maxLines,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                flexShrink: 1,
                            }}
                        >
                            {product.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <>
            {createPortal(printContent, document.body)}

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                    <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-800">
                            {language === 'th' ? 'ตั้งค่าการพิมพ์' : 'Print Settings'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-col items-center justify-center mb-6">
                            <div className="bg-white border-2 border-dashed border-slate-300 shadow-sm overflow-hidden"
                                style={{
                                    width: `${Math.min(printSettings.labelWidth, 200)}mm`,
                                    height: `${Math.min(printSettings.labelHeight, 150)}mm`,
                                    maxWidth: '100%',
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                                    gap: copies > 1 ? '2mm' : '0',
                                    padding: '2mm',
                                    boxSizing: 'border-box',
                                }}
                            >
                                {labelsToPrint.map((_, index) => (
                                    <div key={index}
                                        className="flex flex-col items-center justify-center overflow-hidden"
                                        style={{
                                            border: copies > 1 ? '1px solid #e2e8f0' : 'none',
                                            borderRadius: copies > 1 ? '2px' : '0',
                                            padding: copies > 1 ? '1mm' : '0.5mm',
                                            boxSizing: 'border-box',
                                        }}
                                    >
                                        {/* Barcode area - reduced height for more text space */}
                                        <div style={{
                                            flexGrow: 1,
                                            flexShrink: 0,
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'visible',
                                            minHeight: copies > 1 ? '50%' : '55%'
                                        }}>
                                            {index === 0 ? (
                                                <svg ref={previewBarcodeRef} style={{ maxWidth: '100%', maxHeight: '100%' }}></svg>
                                            ) : barcodeDataUrl ? (
                                                <img src={barcodeDataUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="barcode" />
                                            ) : null}
                                        </div>
                                        {/* Product name - uses remaining space */}
                                        <div className="w-full text-center font-bold leading-tight"
                                            style={{
                                                fontSize: copies > 1 ? `${Math.max(6, gridProductNameFontSize)}px` : `${productNameFontSize}px`,
                                                marginTop: '0.5mm',
                                                wordWrap: 'break-word',
                                                overflowWrap: 'break-word',
                                                lineHeight: '1.15',
                                                display: '-webkit-box',
                                                WebkitLineClamp: copies > 1 ? gridMaxLines : maxLines,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                flexShrink: 1,
                                            }}>
                                            {product.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Quantity Control */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {language === 'th' ? 'จำนวนดวง (Copies)' : 'Quantity'}
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPrintSettings(s => ({ ...s, quantity: Math.max(1, s.quantity - 1) }))}
                                        className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={printSettings.quantity}
                                        onChange={(e) => setPrintSettings({ ...printSettings, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                        className="flex-1 border rounded-lg px-3 py-2 text-center text-xl font-bold text-blue-600"
                                    />
                                    <button
                                        onClick={() => setPrintSettings(s => ({ ...s, quantity: s.quantity + 1 }))}
                                        className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Paper Size Presets */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {language === 'th' ? 'ขนาดกระดาษ' : 'Paper Size'}
                                </label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2 text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    onChange={(e) => {
                                        const [w, h] = e.target.value.split('x').map(Number);
                                        if (w && h) {
                                            setPrintSettings(s => ({ ...s, labelWidth: w, labelHeight: h }));
                                        }
                                    }}
                                    value={`${printSettings.labelWidth}x${printSettings.labelHeight}`}
                                >
                                    <optgroup label={language === 'th' ? '📄 กระดาษสติ๊กเกอร์ขนาดเล็ก' : '📄 Small Sticker Labels'}>
                                        <option value="25x15">25 × 15 mm (Mini Label)</option>
                                        <option value="38x25">38 × 25 mm (Price Tag)</option>
                                        <option value="50x25">50 × 25 mm (Shelf Label)</option>
                                        <option value="50x30">50 × 30 mm (Standard)</option>
                                        <option value="60x40">60 × 40 mm (Medium)</option>
                                        <option value="70x40">70 × 40 mm (Wide)</option>
                                    </optgroup>
                                    <optgroup label={language === 'th' ? '🏷️ กระดาษสติ๊กเกอร์ขนาดใหญ่' : '🏷️ Large Sticker Labels'}>
                                        <option value="100x50">100 × 50 mm (Large)</option>
                                        <option value="100x70">100 × 70 mm (Shipping Label)</option>
                                        <option value="100x150">100 × 150 mm (4x6" Shipping)</option>
                                        <option value="152x102">152 × 102 mm (6x4" Photo)</option>
                                    </optgroup>
                                    <optgroup label={language === 'th' ? '📋 กระดาษมาตรฐาน' : '📋 Standard Paper'}>
                                        <option value="152x228">152 × 228 mm (6 × 9 inch)</option>
                                        <option value="148x210">148 × 210 mm (A5)</option>
                                        <option value="210x297">210 × 297 mm (A4)</option>
                                        <option value="216x279">216 × 279 mm (Letter)</option>
                                    </optgroup>
                                    <optgroup label={language === 'th' ? '⚙️ กำหนดเอง' : '⚙️ Custom'}>
                                        <option value={`${printSettings.labelWidth}x${printSettings.labelHeight}`}>
                                            {printSettings.labelWidth} × {printSettings.labelHeight} mm
                                        </option>
                                    </optgroup>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {language === 'th' ? 'กว้าง (mm)' : 'Width'}
                                    </label>
                                    <input
                                        type="number"
                                        value={printSettings.labelWidth}
                                        onChange={(e) => setPrintSettings({ ...printSettings, labelWidth: Number(e.target.value) })}
                                        className="w-full border rounded-lg px-3 py-2 text-center"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {language === 'th' ? 'สูง (mm)' : 'Height'}
                                    </label>
                                    <input
                                        type="number"
                                        value={printSettings.labelHeight}
                                        onChange={(e) => setPrintSettings({ ...printSettings, labelHeight: Number(e.target.value) })}
                                        className="w-full border rounded-lg px-3 py-2 text-center"
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Auto-fit Toggle */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Maximize2 className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium text-slate-700">
                                            {language === 'th' ? 'ปรับพอดีกระดาษ' : 'Auto-fit to Page'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setPrintSettings(s => ({ ...s, autoFit: !s.autoFit }))}
                                        className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${printSettings.autoFit ? 'bg-blue-600' : 'bg-slate-300'
                                            }`}
                                    >
                                        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${printSettings.autoFit ? 'translate-x-8' : 'translate-x-1'
                                            }`} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mb-3">
                                    {language === 'th'
                                        ? 'ปรับขนาดตัวอักษรและบาร์โค้ดให้พอดีกับขนาดกระดาษโดยอัตโนมัติ'
                                        : 'Automatically scale text and barcode to fit page size'}
                                </p>

                                {/* Text Scale Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-slate-600">
                                            {language === 'th' ? 'ขยายตัวอักษร' : 'Text Scale'}
                                        </label>
                                        <span className="text-sm font-bold text-blue-600 bg-white px-2 py-0.5 rounded">
                                            {printSettings.textScale}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="200"
                                        step="10"
                                        value={printSettings.textScale}
                                        onChange={(e) => setPrintSettings({ ...printSettings, textScale: Number(e.target.value) })}
                                        className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                                        <span>50%</span>
                                        <span>100%</span>
                                        <span>150%</span>
                                        <span>200%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t bg-slate-50 flex gap-3">
                        <div className="text-xs text-slate-500 w-full flex items-center">
                            * พิมพ์ {printSettings.quantity} ดวง
                        </div>
                        <button
                            onClick={handleNativePrint}
                            className="flex-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg whitespace-nowrap"
                        >
                            <Printer className="w-5 h-5" />
                            {language === 'th' ? 'พิมพ์ทันที' : 'Print Now'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BarcodePrintModal;
