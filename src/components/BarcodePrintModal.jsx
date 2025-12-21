import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Copy } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useLanguage } from '../i18n/LanguageContext';

const BarcodePrintModal = ({ isOpen, onClose, product, barcode }) => {
    const { t, language } = useLanguage();
    const previewBarcodeRef = useRef(null);
    const [barcodeDataUrl, setBarcodeDataUrl] = useState(null);

    const [printSettings, setPrintSettings] = useState({
        labelWidth: 50,  // mm
        labelHeight: 30, // mm
        quantity: 1      // New: Quantity control
    });

    // Generate Barcode Data URL once for efficiency
    useEffect(() => {
        if (isOpen && product) {
            try {
                // Create a temporary canvas to generate the barcode image
                const canvas = document.createElement('canvas');
                JsBarcode(canvas, barcode, {
                    format: "CODE128",
                    width: 2,
                    height: 50,
                    displayValue: true,
                    fontSize: 20, // High res for image
                    margin: 0,
                    background: "#ffffff",
                    lineColor: "#000000",
                    textPosition: "bottom",
                    font: "monospace"
                });
                setBarcodeDataUrl(canvas.toDataURL());
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }
    }, [isOpen, barcode]);

    // Preview generation (visual only)
    useEffect(() => {
        if (isOpen && previewBarcodeRef.current) {
            try {
                JsBarcode(previewBarcodeRef.current, barcode, {
                    format: "CODE128",
                    width: 1.5,
                    height: 40,
                    displayValue: true,
                    fontSize: 12,
                    margin: 0,
                    background: "rgba(0,0,0,0)",
                    lineColor: "#000000",
                    textPosition: "bottom",
                    font: "monospace"
                });
            } catch (e) { }
        }
    }, [isOpen, barcode]);

    const handleNativePrint = () => {
        window.print();
    };

    if (!isOpen || !product) return null;

    const isLandscape = printSettings.labelWidth > printSettings.labelHeight;
    const orientationKeyword = isLandscape ? 'landscape' : 'portrait';

    // RENDER MULTIPLE COPIES
    const labelsToPrint = Array.from({ length: Math.max(1, printSettings.quantity) });

    const printContent = (
        <div id="print-portal-root">
            <style>{`
                @media print {
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

                    /* LABEL CONTAINER */
                    .print-label-page {
                        width: ${printSettings.labelWidth}mm;
                        height: ${printSettings.labelHeight}mm;
                        page-break-after: always; /* FORCE RESET PER LABEL */
                        break-after: page;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        position: relative;
                        /* Border for debugging? No, keep clean */
                    }
                    
                    /* Last page usually doesn't need break, but for stickers it helps cut */
                    .print-label-page:last-child {
                        page-break-after: auto;
                    }
                }
                
                @media screen {
                    #print-portal-root { display: none; }
                }
            `}</style>

            {/* RENDER LOOP */}
            {labelsToPrint.map((_, index) => (
                <div key={index} className="print-label-page">
                    {/* Safe Margin Wrapper (Inside the page) */}
                    <div style={{
                        width: `${printSettings.labelWidth - 2}mm`, // -2mm safety
                        height: `${printSettings.labelHeight - 2}mm`, // -2mm safety
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {barcodeDataUrl && (
                                <img src={barcodeDataUrl} style={{ maxWidth: '100%', maxHeight: '100%' }} alt="barcode" />
                            )}
                        </div>
                        <div style={{
                            textAlign: 'center',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            width: '100%',
                            lineHeight: '1',
                            marginTop: '1px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {product.name}
                        </div>
                    </div>
                </div>
            ))}
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
                            <div className="bg-white border-2 border-dashed border-slate-300 shadow-sm flex items-center justify-center p-2"
                                style={{
                                    width: `${printSettings.labelWidth}mm`,
                                    height: `${printSettings.labelHeight}mm`,
                                }}
                            >
                                <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
                                    <svg ref={previewBarcodeRef} className="max-w-full max-h-full"></svg>
                                    <div className="w-full text-center text-[10px] font-bold mt-1 line-clamp-1">
                                        {product.name}
                                    </div>
                                </div>
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
