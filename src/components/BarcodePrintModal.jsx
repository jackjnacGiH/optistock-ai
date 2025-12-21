import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, RotateCw, ArrowRightLeft } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useLanguage } from '../i18n/LanguageContext';

const BarcodePrintModal = ({ isOpen, onClose, product, barcode }) => {
    const { t, language } = useLanguage();

    // Create refs
    const previewBarcodeRef = useRef(null);
    const printBarcodeRef = useRef(null);

    // State
    const [printSettings, setPrintSettings] = useState({
        margin: 0,
        labelWidth: 50,  // mm
        labelHeight: 30, // mm
    });

    // Rotation State: False = Normal, True = Rotated 90 degrees
    const [isRotated, setIsRotated] = useState(false);

    // Helpers
    const generateBarcode = (ref) => {
        if (ref.current) {
            try {
                // Clear previous logic if any (JsBarcode appends sometimes)
                // Actually JsBarcode modifies the SVG node directly.
                JsBarcode(ref.current, barcode, {
                    format: "CODE128",
                    width: 1.8,             // Width of bars
                    height: 40,             // Height of bars
                    displayValue: true,
                    fontSize: 12,
                    margin: 0,
                    background: "rgba(0,0,0,0)", // Transparent
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
            generateBarcode(previewBarcodeRef);
            setTimeout(() => {
                generateBarcode(printBarcodeRef);
            }, 100);
        }
    }, [isOpen, barcode, printSettings, isRotated]);

    const handleNativePrint = () => {
        window.print();
    };

    const toggleRotation = () => {
        setIsRotated(!isRotated);
    };

    const swapDimensions = () => {
        setPrintSettings(prev => ({
            ...prev,
            labelWidth: prev.labelHeight,
            labelHeight: prev.labelWidth
        }));
    };

    if (!isOpen || !product) return null;

    // Dynamically calculate Print Page Size based on rotation
    // If Rotated: We might need to Swap Width/Height in @page CSS to match printer feed?
    // Usually: If printer label is 50x30, we must send 50x30. 
    // If content needs rotation, we rotate content INSIDE the 50x30 box.

    const viewWidth = isRotated ? printSettings.labelHeight : printSettings.labelWidth;
    const viewHeight = isRotated ? printSettings.labelWidth : printSettings.labelHeight;

    const printContent = (
        <div id="print-portal-root">
            <style>{`
                @media print {
                    body > *:not(#print-portal-root) {
                        display: none !important;
                    }
                    body {
                        background: white;
                        margin: 0;
                        padding: 0;
                        visibility: visible;
                    }
                    #print-portal-root {
                        display: flex !important;
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: white;
                        z-index: 99999;
                        align-items: flex-start; /* Important: Start from top-left logic */
                        justify-content: flex-start;
                    }
                    
                    @page {
                        /* 
                           Always use the Settings measurements for Page Size.
                           The content inside determines orientation visually.
                        */
                        size: ${printSettings.labelWidth}mm ${printSettings.labelHeight}mm;
                        margin: 0;
                    }

                    /* 
                       Common Xprinter Issue: Browser adds header/footer margins.
                       We try to suppress them.
                    */
                }
                
                @media screen {
                    #print-portal-root { display: none; }
                }
            `}</style>

            {/* 
                THE PRINT CONTAINER 
                Matches the Label Size exactly.
            */}
            <div style={{
                width: `${printSettings.labelWidth}mm`,
                height: `${printSettings.labelHeight}mm`,
                position: 'relative',
                overflow: 'hidden',
                border: 'none',
                // Debug border: '1px dotted #ccc'
            }}>
                {/* 
                    CONTENT WRAPPER
                    Handles Rotation.
                    If Rotated:
                    - Pivot center? No, usually easier to pivot top-left and translate.
                    - Or grid center.
                */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2mm',
                    boxSizing: 'border-box',
                    transform: isRotated ? 'rotate(90deg)' : 'none',
                    // If rotated, we might need to adjust width/height to fit the NEW orientation?
                    // Actually, if we rotate 90deg inside a rectangular box, it might clip if not square.
                    // Better approach for labels: 
                    // If isRotated is TRUE, we assume the user wants the content sideways properly.
                    // We swap width/height logic for the inner content.
                }}>
                    {/* SVG Container */}
                    <div style={{
                        flex: 1,
                        width: isRotated ? `${printSettings.labelHeight}mm` : '100%',  // Swap constraint if rotated
                        height: isRotated ? `${printSettings.labelWidth}mm` : 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        <svg ref={printBarcodeRef} style={{ maxWidth: '100%', maxHeight: '100%' }}></svg>
                    </div>

                    {/* Text Container */}
                    <div style={{
                        width: isRotated ? `${printSettings.labelHeight}mm` : '100%',
                        textAlign: 'center',
                        lineHeight: '1',
                        marginTop: '2px'
                    }}>
                        <div style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
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

                        {/* Preview Section */}
                        <div className="flex flex-col items-center justify-center mb-6">
                            <p className="text-sm text-slate-500 mb-2">
                                {language === 'th' ? 'ตัวอย่าง (Preview)' : 'Preview'}
                            </p>

                            {/* Visual Box */}
                            <div className="bg-white border-2 border-dashed border-slate-300 shadow-sm flex items-center justify-center transition-all duration-300 relative"
                                style={{
                                    width: `${printSettings.labelWidth}mm`,
                                    height: `${printSettings.labelHeight}mm`,
                                }}
                            >
                                {/* Inner Content that Rotates */}
                                <div className="w-full h-full flex flex-col items-center justify-center p-1 transition-transform duration-300"
                                    style={{
                                        transform: isRotated ? 'rotate(90deg)' : 'none',
                                    }}
                                >
                                    <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                                        <svg ref={previewBarcodeRef} className="max-w-full max-h-full"></svg>
                                    </div>
                                    <div className="w-full text-center text-[10px] font-bold mt-1 line-clamp-2 leading-tight">
                                        {product.name}
                                    </div>
                                </div>
                            </div>

                            {/* Rotate Helper Hint */}
                            <p className="text-xs text-slate-400 mt-2">
                                * หากพิมพ์ออกมาแล้วกลับด้าน ให้ลองกดปุ่มหมุนด้านล่าง
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="space-y-4">
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

                            {/* Orientation Tools */}
                            <div className="flex gap-2">
                                <button
                                    onClick={toggleRotation}
                                    className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${isRotated
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <RotateCw className="w-4 h-4" />
                                    {isRotated ? 'หมุนกลับ (0°)' : 'หมุน 90°'}
                                </button>
                                <button
                                    onClick={swapDimensions}
                                    className="flex-1 py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <ArrowRightLeft className="w-4 h-4" />
                                    สลับ กว้าง/สูง
                                </button>
                            </div>
                        </div>

                    </div>

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
