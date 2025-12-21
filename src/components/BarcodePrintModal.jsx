import React, { useRef, useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useLanguage } from '../i18n/LanguageContext';

const BarcodePrintModal = ({ isOpen, onClose, product, barcode }) => {
    const { t, language } = useLanguage();
    const barcodeRef = useRef(null);
    const [printSettings, setPrintSettings] = useState({
        fontSize: 14,
        margin: 10,
        labelWidth: 50,  // mm
        labelHeight: 30, // mm
    });

    useEffect(() => {
        if (isOpen && barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, barcode, {
                    format: "CODE128",
                    width: 2,
                    height: 50,
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
    }, [isOpen, barcode, printSettings]);

    const handleNativePrint = () => {
        window.print();
    };

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

            {/* CSS for Printing Only */}
            <style>{`
                @media print {
                    /* Hide everything */
                    body * {
                        visibility: hidden;
                    }
                    /* Show only the barcode area */
                    #printable-barcode-area, #printable-barcode-area * {
                        visibility: visible;
                    }
                    /* Position it specifically */
                    #printable-barcode-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: white;
                    }
                    /* Page Setup */
                    @page {
                        size: ${printSettings.labelWidth}mm ${printSettings.labelHeight}mm;
                        margin: 0;
                    }
                    /* Hide Modal UI during print */
                    .no-print-ui {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto no-print-ui">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">
                        {language === 'th' ? 'พิมพ์บาร์โค้ด' : 'Print Barcode'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Preview Area (with ID for printing) */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex justify-center items-center min-h-[200px]">

                        {/* THE PRINTABLE PART */}
                        <div id="printable-barcode-area" className="bg-white shadow-md">
                            <div
                                style={{
                                    width: `${printSettings.labelWidth}mm`,
                                    height: `${printSettings.labelHeight}mm`,
                                    border: '1px solid #eee',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '5px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <svg ref={barcodeRef} className="max-w-full max-h-[80%]"></svg>
                                <div className="text-[10px] font-bold mt-1 text-center w-full truncate leading-none">
                                    {product.name}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Simple Settings */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {language === 'th' ? 'ความกว้าง (mm)' : 'Width'}
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
                                {language === 'th' ? 'ความสูง (mm)' : 'Height'}
                            </label>
                            <input
                                type="number"
                                value={printSettings.labelHeight}
                                onChange={(e) => setPrintSettings({ ...printSettings, labelHeight: Number(e.target.value) })}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
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
        </div>
    );
};

export default BarcodePrintModal;
