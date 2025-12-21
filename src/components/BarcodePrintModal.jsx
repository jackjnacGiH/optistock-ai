import React, { useRef, useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useLanguage } from '../i18n/LanguageContext';

const BarcodePrintModal = ({ isOpen, onClose, product, barcode }) => {
    const { t, language } = useLanguage();
    const barcodeRef = useRef(null);
    const [printSettings, setPrintSettings] = useState({
        margin: 5,
        labelWidth: 50,  // mm
        labelHeight: 30, // mm
    });

    useEffect(() => {
        if (isOpen && barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, barcode, {
                    format: "CODE128",
                    width: 1.5,
                    height: 35,
                    displayValue: true,
                    fontSize: 10,
                    margin: 0,
                    background: "#ffffff",
                    lineColor: "#000000",
                    textPosition: "bottom",
                    font: "monospace"
                });
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }
    }, [isOpen, barcode, printSettings]);

    const handleNativePrint = () => {
        window.print();
    };

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

            <style>{`
                @media print {
                    @page {
                        size: ${printSettings.labelWidth}mm ${printSettings.labelHeight}mmbox-sizing:border-box;
                        margin: 0;
                    }

                    body { 
                        visibility: hidden; 
                        background: white;
                    }

                    /* Important: Reset ALL positions and displays for body children */
                    body > * {
                        display: none !important;
                    }

                    /* Only show our print component */
                    #printable-overlay {
                        visibility: visible !important;
                        display: flex !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: ${printSettings.labelWidth}mm !important;
                        height: ${printSettings.labelHeight}mm !important;
                        z-index: 2147483647 !important;
                        background: white !important;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    #printable-content {
                        width: 100% !important;
                        height: 100% !important;
                        display: flex !important;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    /* Hide everything else inside modal */
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* 1. PRINTABLE CONTENT (Absolute overlay that becomes visible ONLY during print) */}
            <div id="printable-overlay" className="hidden print:flex fixed top-0 left-0 bg-white pointer-events-none">
                <div id="printable-content" className="w-full h-full flex flex-col items-center justify-center p-1">
                    <div className="flex-1 flex items-center justify-center overflow-hidden w-full">
                        <svg ref={barcodeRef} className="w-[95%] h-auto max-h-full object-contain"></svg>
                    </div>
                    <div className="w-full text-center leading-none mt-1">
                        <p className="text-[10px] font-bold text-black break-words whitespace-normal line-clamp-2 px-1">
                            {product.name}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. ON-SCREEN UI (Modal) */}
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] no-print">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">
                        {language === 'th' ? 'ตั้งค่าการพิมพ์' : 'Print Settings'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">

                    {/* Visual Preview */}
                    <div className="flex flex-col items-center justify-center mb-8">
                        <p className="text-sm text-slate-500 mb-2">
                            {language === 'th' ? 'ตัวอย่าง (ขนาดจริง)' : 'Preview (Actual Size)'}
                        </p>
                        <div className="bg-white border-2 border-dashed border-slate-300 shadow-sm flex items-center justify-center"
                            style={{
                                width: `${printSettings.labelWidth}mm`,
                                height: `${printSettings.labelHeight}mm`,
                            }}
                        >
                            <div className="w-full h-full flex flex-col items-center justify-center p-1 overflow-hidden">
                                {/* We duplicate the SVG rendering for preview roughly, but since ref can be used once, we rely on the cloned SVG logic or just basic layout simulation if ref is moved. 
                                   Actually, cleaner is to have ONE SVG. Let's make the 'printable-overlay' BE the preview too?
                                   No, because position fixed/absolute messes up modal layout.
                                   Let's use a trick: We clone the SVG content for preview using JS or just let user see layout box.
                                   BETTER: We just render a mock preview here, and the real print is the hidden div.
                                */}
                                <div className="flex-1 text-center flex items-center justify-center bg-slate-100 w-full text-xs text-slate-400">
                                    [Barcode Preview]
                                </div>
                                <div className="w-full text-center leading-none">
                                    <p className="text-[9px] font-bold text-slate-800 line-clamp-2 px-1">
                                        {product.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-2 py-1 rounded">
                            {language === 'th' ? '* บาร์โค้ดจริงจะแสดงเมื่อสั่งพิมพ์' : '* Actual barcode renders on print'}
                        </p>
                    </div>

                    {/* Settings */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {language === 'th' ? 'กว้าง (mm)' : 'Width'}
                            </label>
                            <input
                                type="number"
                                value={printSettings.labelWidth}
                                onChange={(e) => setPrintSettings({ ...printSettings, labelWidth: Number(e.target.value) })}
                                className="w-full border rounded-lg px-3 py-2 text-center font-mono"
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
                                className="w-full border rounded-lg px-3 py-2 text-center font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t bg-slate-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-slate-300 hover:bg-white text-slate-700 font-semibold rounded-xl transition-colors"
                    >
                        {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button
                        onClick={handleNativePrint}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Printer className="w-5 h-5" />
                        {language === 'th' ? 'พิมพ์ทันที' : 'Print Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BarcodePrintModal;
