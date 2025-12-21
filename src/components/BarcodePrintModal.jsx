import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, Minus, Plus, Copy, Check } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useLanguage } from '../i18n/LanguageContext';

const BarcodePrintModal = ({ isOpen, onClose, product, barcode }) => {
    const { t, language } = useLanguage();
    const barcodeRef = useRef(null);
    const [template, setTemplate] = useState('standard'); // standard, compact, large
    const [printSettings, setPrintSettings] = useState({
        width: 2,
        height: 60,
        fontSize: 14,
        margin: 10,
        labelWidth: 50,  // mm
        labelHeight: 30, // mm
        copies: 1
    });

    useEffect(() => {
        if (isOpen && barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, barcode, {
                    format: "CODE128",
                    width: printSettings.width,
                    height: printSettings.height,
                    displayValue: true,
                    fontSize: printSettings.fontSize,
                    margin: printSettings.margin,
                    background: "#ffffff",
                    lineColor: "#000000",
                    textPosition: "bottom",
                    font: "monospace"
                });
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }
    }, [isOpen, barcode, printSettings, template]);

    // Robust Mobile Printing Function
    const handleNativePrint = () => {
        // 1. Add class to body to indicate printing state
        document.body.classList.add('is-printing');

        // 2. Wait for a moment for styles to apply
        setTimeout(() => {
            window.print();

            // 3. Keep the print view for a moment (for mobile browsers), then restore
            setTimeout(() => {
                document.body.classList.remove('is-printing');
            }, 500);
        }, 100);
    };

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:static">

            {/* Print Styles Injection */}
            <style>{`
                @media print {
                    /* Hide everything by default */
                    body > * { display: none !important; }
                    
                    /* Show only the print container */
                    body > .print-container-wrapper { 
                        display: block !important; 
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    /* Ensure the specific barcode area is visible */
                    .printable-content {
                        display: flex !important;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        width: 100%;
                        height: 100%;
                        page-break-inside: avoid;
                    }
                    
                    /* Page Size Setup */
                    @page {
                        size: ${printSettings.labelWidth}mm ${printSettings.labelHeight}mm;
                        margin: 0;
                    }
                }
            `}</style>

            {/* Modal Container (Hidden during print except inner part via wrapper logic) */}
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:w-full print:max-w-none print:h-auto print:overflow-visible">

                {/* Header (No Print) */}
                <div className="flex justify-between items-center p-4 border-b no-print print:hidden">
                    <h2 className="text-xl font-bold text-slate-800">
                        {language === 'th' ? 'พิมพ์บาร์โค้ด' : 'Print Barcode'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Preview Area (This gets printed) */}
                    {/* We move this wrapper to body root dynamically during print? No, css handles it. */}
                    {/* Special Wrapper class for CSS targeting */}
                    <div className={document.body.classList.contains('is-printing') ? "print-container-wrapper" : ""}>
                        <div className="flex justify-center mb-6 printable-content">
                            <div
                                style={{
                                    width: `${printSettings.labelWidth}mm`,
                                    height: `${printSettings.labelHeight}mm`,
                                    border: '1px dashed #ccc'
                                }}
                                className="bg-white flex items-center justify-center p-2 rounded-lg print:border-none"
                            >
                                <div className="text-center w-full h-full flex flex-col items-center justify-center overflow-hidden">
                                    <svg ref={barcodeRef} className="max-w-full max-h-full"></svg>
                                    <div className="text-[10px] font-bold mt-1 leading-tight truncate w-full px-1 no-print">
                                        {product.name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings (No Print) */}
                    <div className="space-y-4 print:hidden">
                        {/* Size Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {language === 'th' ? 'ความกว้าง (mm)' : 'Width (mm)'}
                                </label>
                                <input
                                    type="number"
                                    value={printSettings.labelWidth}
                                    onChange={(e) => setPrintSettings({ ...printSettings, labelWidth: Number(e.target.value) })}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {language === 'th' ? 'ความสูง (mm)' : 'Height (mm)'}
                                </label>
                                <input
                                    type="number"
                                    value={printSettings.labelHeight}
                                    onChange={(e) => setPrintSettings({ ...printSettings, labelHeight: Number(e.target.value) })}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions (No Print) */}
                    <div className="flex gap-3 pt-4 border-t print:hidden">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
                        >
                            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleNativePrint}
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-95"
                        >
                            <Printer className="w-5 h-5" />
                            {language === 'th' ? 'พิมพ์ทันที' : 'Print Now'}
                        </button>
                    </div>

                </div>
            </div>

            {/* Javascript Wrapper Logic for Print Isolation */}
            <script dangerouslySetInnerHTML={{
                __html: `
                // Helper ensures print logic
            `}} />
        </div>
    );
};

export default BarcodePrintModal;
