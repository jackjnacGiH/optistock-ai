import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { useReactToPrint } from 'react-to-print';
import { Printer, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const BarcodePrintModal = ({ product, onClose }) => {
    const { t, language } = useLanguage();
    const barcodeRef = useRef(null);
    const printRef = useRef(null);
    const [printSettings, setPrintSettings] = React.useState({
        labelWidth: 50, // mm
        labelHeight: 30, // mm
        copies: 1,
        showPrice: true,
        fontSize: 12
    });

    // ป้องกัน error โดยกำหนดค่า default
    const barcode = product?.barcode || product?.Barcode || '';
    const name = product?.name || product?.Name || 'ไม่ระบุชื่อ';
    const price = product?.price || product?.Price || 0;
    const shelf = product?.shelf || product?.Shelf || '';
    const row = product?.row || product?.Row || '';

    // Generate barcode
    // Generate barcode
    useEffect(() => {
        if (barcodeRef.current && barcode) {
            try {
                JsBarcode(barcodeRef.current, String(barcode), {
                    format: 'CODE128',
                    width: 2,
                    height: 60,
                    displayValue: true,
                    fontSize: printSettings.fontSize,
                    margin: 5,
                    background: '#ffffff',
                    lineColor: '#000000'
                });
            } catch (error) {
                console.error('Error generating barcode:', error);
            }
        }
    }, [barcode, printSettings.fontSize]);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Barcode_${barcode}`,
        onAfterPrint: () => console.log('Print finished'),
        pageStyle: `
            @page {
                size: ${printSettings.labelWidth}mm ${printSettings.labelHeight}mm;
                margin: 0;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                /* Hide everything else */
                body > *:not(.print-container) {
                    display: none !important;
                }
            }
        `
    });

    // Mobile Print Fallback
    const manualPrint = () => {
        try {
            handlePrint();
        } catch (e) {
            console.error("Print failed, trying fallback", e);
            window.print();
        }
    };

    if (!product) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800">
                        {language === 'th' ? 'พิมพ์สติ๊กเกอร์บาร์โค้ด' : 'Print Barcode Label'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-4 md:p-6 space-y-6">
                    {/* Preview */}
                    <div className="bg-slate-50 rounded-xl p-4 border-2 border-dashed border-slate-300">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">
                            {language === 'th' ? 'ตัวอย่าง' : 'Preview'}
                        </h3>
                        <div
                            ref={printRef}
                            className="bg-white p-4 rounded-lg shadow-sm mx-auto"
                            style={{
                                width: `${printSettings.labelWidth}mm`,
                                minHeight: `${printSettings.labelHeight}mm`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <svg ref={barcodeRef}></svg>
                            <div className="text-center mt-2" style={{ fontSize: `${printSettings.fontSize}px` }}>
                                <p className="font-semibold text-slate-800 line-clamp-2">{name}</p>
                                {printSettings.showPrice && price > 0 && (
                                    <p className="text-slate-600 mt-1">
                                        ฿{Number(price).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700">
                            {language === 'th' ? 'ตั้งค่าการพิมพ์' : 'Print Settings'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Label Width */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    {language === 'th' ? 'ความกว้าง (mm)' : 'Width (mm)'}
                                </label>
                                <input
                                    type="number"
                                    value={printSettings.labelWidth}
                                    onChange={(e) => setPrintSettings({ ...printSettings, labelWidth: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    min="30"
                                    max="100"
                                />
                            </div>

                            {/* Label Height */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    {language === 'th' ? 'ความสูง (mm)' : 'Height (mm)'}
                                </label>
                                <input
                                    type="number"
                                    value={printSettings.labelHeight}
                                    onChange={(e) => setPrintSettings({ ...printSettings, labelHeight: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    min="20"
                                    max="100"
                                />
                            </div>

                            {/* Font Size */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    {language === 'th' ? 'ขนาดตัวอักษร' : 'Font Size'}
                                </label>
                                <input
                                    type="number"
                                    value={printSettings.fontSize}
                                    onChange={(e) => setPrintSettings({ ...printSettings, fontSize: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    min="8"
                                    max="20"
                                />
                            </div>

                            {/* Copies */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    {language === 'th' ? 'จำนวนที่พิมพ์' : 'Copies'}
                                </label>
                                <input
                                    type="number"
                                    value={printSettings.copies}
                                    onChange={(e) => setPrintSettings({ ...printSettings, copies: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    min="1"
                                    max="100"
                                />
                            </div>
                        </div>

                        {/* Show Price Toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="showPrice"
                                checked={printSettings.showPrice}
                                onChange={(e) => setPrintSettings({ ...printSettings, showPrice: e.target.checked })}
                                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                            />
                            <label htmlFor="showPrice" className="text-sm font-medium text-slate-700">
                                {language === 'th' ? 'แสดงราคา' : 'Show Price'}
                            </label>
                        </div>

                        {/* Preset Sizes */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {language === 'th' ? 'ขนาดสติ๊กเกอร์มาตรฐาน' : 'Standard Label Sizes'}
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <button
                                    onClick={() => setPrintSettings({ ...printSettings, labelWidth: 50, labelHeight: 30 })}
                                    className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    50×30mm
                                </button>
                                <button
                                    onClick={() => setPrintSettings({ ...printSettings, labelWidth: 40, labelHeight: 25 })}
                                    className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    40×25mm
                                </button>
                                <button
                                    onClick={() => setPrintSettings({ ...printSettings, labelWidth: 60, labelHeight: 40 })}
                                    className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    60×40mm
                                </button>
                                <button
                                    onClick={() => setPrintSettings({ ...printSettings, labelWidth: 70, labelHeight: 50 })}
                                    className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    70×50mm
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">
                            {language === 'th' ? 'ข้อมูลสินค้า' : 'Product Information'}
                        </h4>
                        <div className="space-y-1 text-sm text-blue-800">
                            <p><span className="font-medium">{language === 'th' ? 'บาร์โค้ด:' : 'Barcode:'}</span> {barcode}</p>
                            <p><span className="font-medium">{language === 'th' ? 'ชื่อ:' : 'Name:'}</span> {name}</p>
                            {price > 0 && <p><span className="font-medium">{language === 'th' ? 'ราคา:' : 'Price:'}</span> ฿{Number(price).toLocaleString()}</p>}
                            {(shelf || row) && (
                                <div className="flex gap-4 mt-2 pt-2 border-t border-blue-200/50">
                                    {shelf && <p><span className="font-medium">{language === 'th' ? 'ชั้น:' : 'Shelf:'}</span> {shelf}</p>}
                                    {row && <p><span className="font-medium">{language === 'th' ? 'แถว:' : 'Row:'}</span> {row}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                        >
                            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                        </button>
                        <button
                            onClick={manualPrint}
                            className="flex-1 px-4 py-3 bg-primary hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Printer className="w-5 h-5" />
                            {language === 'th' ? 'พิมพ์' : 'Print'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodePrintModal;
