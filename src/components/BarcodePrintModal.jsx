import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useLanguage } from '../i18n/LanguageContext';

const BarcodePrintModal = ({ isOpen, onClose, product, barcode }) => {
    const { t, language } = useLanguage();

    // Refs for TWO barcodes: one for preview, one for actual print
    const previewBarcodeRef = useRef(null);
    const printBarcodeRef = useRef(null);

    const [printSettings, setPrintSettings] = useState({
        margin: 5,
        labelWidth: 50,  // mm
        labelHeight: 30, // mm
    });

    // Generate Barcode Function
    const generateBarcode = (ref) => {
        if (ref.current) {
            try {
                JsBarcode(ref.current, barcode, {
                    format: "CODE128",
                    width: 1.5,
                    height: 40,
                    displayValue: true,
                    fontSize: 12,
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
    };

    useEffect(() => {
        if (isOpen) {
            // Generate for Preview
            generateBarcode(previewBarcodeRef);
            // Generate for Print (Portal)
            // Need a small timeout to ensure Portal DOM is ready
            setTimeout(() => {
                generateBarcode(printBarcodeRef);
            }, 100);
        }
    }, [isOpen, barcode, printSettings]);

    const handleNativePrint = () => {
        window.print();
    };

    if (!isOpen || !product) return null;

    // 1. THE PRINT CONTENT (Portal to Body)
    // This moves the print element OUTSIDE of the React Root, avoiding "hidden parent" issues.
    const printContent = (
        <div id="print-portal-root">
            <style>{`
                @media print {
                    /* Hide everything in the body by default */
                    body > *:not(#print-portal-root) {
                        display: none !important;
                    }
                    
                    /* Reset body */
                    body {
                        background: white;
                        margin: 0;
                        padding: 0;
                        visibility: visible;
                    }

                    /* Style the portal root to fill the page */
                    #print-portal-root {
                        display: flex !important;
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: white;
                        z-index: 99999;
                        align-items: center;
                        justify-content: center;
                    }

                    @page {
                        size: ${printSettings.labelWidth}mm ${printSettings.labelHeight}mm;
                        margin: 0;
                    }
                }
                
                /* Hide portal on screen */
                @media screen {
                    #print-portal-root {
                        display: none;
                    }
                }
            `}</style>

            <div style={{
                width: `${printSettings.labelWidth}mm`,
                height: `${printSettings.labelHeight}mm`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2mm',
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
                    <svg ref={printBarcodeRef} style={{ width: '100%', height: 'auto', maxHeight: '100%' }}></svg>
                </div>
                <div style={{
                    textAlign: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    width: '100%',
                    lineHeight: '1.1',
                    marginTop: '2px',
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {product.name}
                </div>
            </div>
        </div>
    );

    // 2. THE MODAL UI (Standard React)
    return (
        <>
            {/* Render Print Content via Portal */}
            {createPortal(printContent, document.body)}

            {/* Modal UI */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

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

                        {/* Real Preview */}
                        <div className="flex flex-col items-center justify-center mb-6">
                            <p className="text-sm text-slate-500 mb-2">
                                {language === 'th' ? 'ตัวอย่าง (ขนาดจริง)' : 'Actual Size Preview'}
                            </p>
                            <div className="bg-white border text-center border-slate-300 shadow-sm flex items-center justify-center"
                                style={{
                                    width: `${printSettings.labelWidth}mm`,
                                    height: `${printSettings.labelHeight}mm`,
                                }}
                            >
                                <div className="w-full h-full flex flex-col items-center justify-center p-1 overflow-hidden">
                                    <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                                        <svg ref={previewBarcodeRef} className="w-full h-auto max-h-full"></svg>
                                    </div>
                                    <div className="w-full text-center text-[10px] font-bold mt-1 line-clamp-2 leading-tight">
                                        {product.name}
                                    </div>
                                </div>
                            </div>
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

                    {/* Footer */}
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
        </>
    );
};

export default BarcodePrintModal;
