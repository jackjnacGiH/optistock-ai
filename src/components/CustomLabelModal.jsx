import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Save, FolderOpen, Calendar, Plus, Trash2, Maximize2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const CustomLabelModal = ({ isOpen, onClose }) => {
    const { t, language } = useLanguage();

    // Form state
    const [formData, setFormData] = useState({
        companyName: 'J NAC (THAILAND) CO.,LTD.',
        productCode: '132-025-5000',
        date: new Date().toISOString().split('T')[0],
        quantity: 1,
        lotNumber: 1000000
    });

    // Print settings - matching BarcodePrintModal structure
    const [printSettings, setPrintSettings] = useState({
        labelWidth: 100,  // mm
        labelHeight: 70,  // mm
        copies: 1,        // For compatibility (will be calculated from rows * cols)
        rows: 1,          // Number of rows
        cols: 1,          // Number of columns
        autoFit: true,    // Auto-fit to page
        textScale: 100,   // Text scale percentage (50-200%)
        orientation: 'portrait' // portrait or landscape
    });

    // Font styles for each field
    const [fontStyles, setFontStyles] = useState({
        company: { size: 100, bold: true, italic: false },
        code: { size: 100, bold: true, italic: false },
        date: { size: 100, bold: false, italic: false },
        qty: { size: 100, bold: true, italic: false },
        lot: { size: 100, bold: false, italic: false }
    });

    // Helper to update font style for a specific field
    const updateFontStyle = (field, property, value) => {
        setFontStyles(prev => ({
            ...prev,
            [field]: { ...prev[field], [property]: value }
        }));
    };

    // Calculate actual dimensions based on orientation
    const actualWidth = printSettings.orientation === 'landscape'
        ? Math.max(printSettings.labelWidth, printSettings.labelHeight)
        : Math.min(printSettings.labelWidth, printSettings.labelHeight);
    const actualHeight = printSettings.orientation === 'landscape'
        ? Math.min(printSettings.labelWidth, printSettings.labelHeight)
        : Math.max(printSettings.labelWidth, printSettings.labelHeight);

    // Presets management
    const [presets, setPresets] = useState([]);
    const [presetName, setPresetName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // Calculate scale factors - matching BarcodePrintModal
    const baseSize = Math.min(printSettings.labelWidth, printSettings.labelHeight);
    const scaleFactor = printSettings.autoFit ? (baseSize / 30) : 1;
    const userScale = printSettings.textScale / 100;
    const finalScale = scaleFactor * userScale;

    // Grid calculation - use manual rows and cols
    const rows = printSettings.rows;
    const cols = printSettings.cols;
    const copies = rows * cols;

    // Calculate cell dimensions for font sizing
    const cellWidth = printSettings.labelWidth / cols;
    const cellHeight = printSettings.labelHeight / rows;

    // Print font sizes as percentage of cell height (matches preview exactly)
    const printCompanyFontSize = cellHeight * 0.10 * 3.78;   // mm to px (3.78 px per mm)
    const printCodeFontSize = cellHeight * 0.18 * 3.78;
    const printQtyFontSize = cellHeight * 0.22 * 3.78;       // Largest
    const printDetailFontSize = cellHeight * 0.09 * 3.78;

    // Load lot number and presets from localStorage on mount
    useEffect(() => {
        if (isOpen) {
            const savedLot = localStorage.getItem('customLabelLotNumber');
            const savedPresets = localStorage.getItem('customLabelPresets');

            if (savedLot) {
                setFormData(prev => ({ ...prev, lotNumber: parseInt(savedLot) }));
            }
            if (savedPresets) {
                setPresets(JSON.parse(savedPresets));
            }
        }
    }, [isOpen]);

    // Save lot number to localStorage
    const incrementLotNumber = () => {
        const newLot = formData.lotNumber + 1;
        localStorage.setItem('customLabelLotNumber', newLot.toString());
        setFormData(prev => ({ ...prev, lotNumber: newLot }));
    };

    // Save preset - includes all settings
    const savePreset = () => {
        if (!presetName.trim()) return;

        const newPreset = {
            id: Date.now(),
            name: presetName,
            companyName: formData.companyName,
            productCode: formData.productCode,
            quantity: formData.quantity,
            lotNumber: formData.lotNumber,
            // Save all print settings (paper size, rows, cols, etc.)
            printSettings,
            // Save font styles
            fontStyles
        };

        const updatedPresets = [...presets, newPreset];
        setPresets(updatedPresets);
        localStorage.setItem('customLabelPresets', JSON.stringify(updatedPresets));
        setPresetName('');
        setShowSaveDialog(false);
    };

    // Load preset - always uses current date
    const loadPreset = (preset) => {
        setFormData({
            companyName: preset.companyName,
            productCode: preset.productCode,
            date: new Date().toISOString().split('T')[0], // Always current date
            quantity: preset.quantity,
            lotNumber: preset.lotNumber
        });
        if (preset.printSettings) {
            setPrintSettings(preset.printSettings);
        }
        if (preset.fontStyles) {
            setFontStyles(preset.fontStyles);
        }
    };

    // Delete preset
    const deletePreset = (id) => {
        const updatedPresets = presets.filter(p => p.id !== id);
        setPresets(updatedPresets);
        localStorage.setItem('customLabelPresets', JSON.stringify(updatedPresets));
    };

    // Format date for display
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Handle print with delay for printer initialization
    const handlePrint = () => {
        incrementLotNumber();
        // Add delay for printer to initialize (prevents first line offset issues)
        setTimeout(() => {
            window.print();
        }, 500);
    };

    if (!isOpen) return null;

    const labelsToPrint = Array.from({ length: copies });

    // Print content - matching BarcodePrintModal structure
    const printContent = (
        <div id="custom-label-print-root">
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
                    body > *:not(#custom-label-print-root) {
                        display: none !important;
                    }

                    /* PAGE CONFIGURATION */
                    @page {
                        size: ${actualWidth}mm ${actualHeight}mm ${printSettings.orientation};
                        margin: 0mm;
                    }

                    #custom-label-print-root {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        z-index: 99999;
                        background: white;
                    }

                    /* SINGLE PAGE CONTAINER */
                    .custom-print-page {
                        width: ${printSettings.labelWidth}mm;
                        height: ${printSettings.labelHeight}mm;
                        max-height: ${printSettings.labelHeight}mm;
                        display: grid;
                        grid-template-columns: repeat(${cols}, 1fr);
                        grid-template-rows: repeat(${rows}, 1fr);
                        gap: 0;
                        box-sizing: border-box;
                        padding: 0;
                        margin: 0;
                        overflow: hidden;
                        page-break-inside: avoid;
                        page-break-after: avoid;
                    }

                    /* INDIVIDUAL LABEL IN GRID */
                    .custom-label-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        overflow: hidden;
                        box-sizing: border-box;
                        padding: 0.5mm;
                        border: none !important;
                        border-radius: 0;
                        font-family: 'Arial', sans-serif;
                    }

                    /* Company Name */
                    .label-company {
                        font-size: ${printCompanyFontSize * (fontStyles.company.size / 100)}px !important;
                        font-weight: ${fontStyles.company.bold ? 'bold' : 'normal'} !important;
                        font-style: ${fontStyles.company.italic ? 'italic' : 'normal'} !important;
                        margin-bottom: 0.3mm !important;
                        line-height: 1.1 !important;
                    }

                    /* Product Code */
                    .label-code {
                        font-size: ${printCodeFontSize * (fontStyles.code.size / 100)}px !important;
                        font-weight: ${fontStyles.code.bold ? 'bold' : 'normal'} !important;
                        font-style: ${fontStyles.code.italic ? 'italic' : 'normal'} !important;
                        margin-bottom: 0.3mm !important;
                        line-height: 1.05 !important;
                    }

                    /* Date */
                    .label-date {
                        font-size: ${printDetailFontSize * (fontStyles.date.size / 100)}px !important;
                        font-weight: ${fontStyles.date.bold ? 'bold' : 'normal'} !important;
                        font-style: ${fontStyles.date.italic ? 'italic' : 'normal'} !important;
                        margin-bottom: 0.2mm !important;
                        line-height: 1.1 !important;
                    }

                    /* Quantity - EXTRA LARGE */
                    .label-qty {
                        font-size: ${printQtyFontSize * (fontStyles.qty.size / 100)}px !important;
                        font-weight: ${fontStyles.qty.bold ? '900' : 'normal'} !important;
                        font-style: ${fontStyles.qty.italic ? 'italic' : 'normal'} !important;
                        margin-bottom: 0.2mm !important;
                        line-height: 1.05 !important;
                    }

                    /* Lot Number */
                    .label-lot {
                        font-size: ${printDetailFontSize * (fontStyles.lot.size / 100)}px !important;
                        font-weight: ${fontStyles.lot.bold ? 'bold' : 'normal'} !important;
                        font-style: ${fontStyles.lot.italic ? 'italic' : 'normal'} !important;
                        line-height: 1.1 !important;
                        margin-bottom: 0 !important;
                    }
                }
                
                @media screen {
                    #custom-label-print-root { display: none; }
                }
            `}</style>

            <div className="custom-print-page">
                {labelsToPrint.map((_, index) => (
                    <div key={index} className="custom-label-item">
                        <div className="label-company">{formData.companyName}</div>
                        <div className="label-code">{formData.productCode}</div>
                        <div className="label-date">Date. {formatDate(formData.date)}</div>
                        <div className="label-qty">{formData.quantity} Pcs.</div>
                        <div className="label-lot">Lot. {formData.lotNumber.toString().padStart(10, '0')}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <>
            {createPortal(printContent, document.body)}

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
                        <h2 className="text-xl font-bold text-white">
                            {language === 'th' ? '🏷️ พิมพ์ฉลากกำหนดเอง' : '🏷️ Custom Label Print'}
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left: Preview - matching BarcodePrintModal layout */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-700 border-b pb-2">
                                    {language === 'th' ? '👁️ ตัวอย่าง' : '👁️ Preview'}
                                </h3>

                                {/* Preview container - WYSIWYG scales with paper size */}
                                <div className="border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 flex items-center justify-center overflow-hidden"
                                    style={{ height: '320px', width: '100%', padding: '16px' }}
                                >
                                    {/* Calculate preview scale to fit container while maintaining aspect ratio */}
                                    {(() => {
                                        // Container inner dimensions (accounting for padding)
                                        const containerWidth = 350;
                                        const containerHeight = 288;

                                        // Paper dimensions in mm
                                        const paperWidth = printSettings.labelWidth;
                                        const paperHeight = printSettings.labelHeight;

                                        // Convert mm to px for display (using 3.78 px/mm ratio)
                                        const paperWidthPx = paperWidth * 3.78;
                                        const paperHeightPx = paperHeight * 3.78;

                                        // Calculate scale to fit container (ALWAYS fit, no max limit)
                                        const scaleX = containerWidth / paperWidthPx;
                                        const scaleY = containerHeight / paperHeightPx;
                                        const previewScale = Math.min(scaleX, scaleY);

                                        // Calculate cell dimensions
                                        const cellWidth = paperWidth / cols;
                                        const cellHeight = paperHeight / rows;

                                        // Font sizes as percentage of cell height for perfect balance
                                        const companyFs = cellHeight * 0.10;
                                        const codeFs = cellHeight * 0.18;
                                        const qtyFs = cellHeight * 0.22;
                                        const detailFs = cellHeight * 0.09;

                                        return (
                                            <div
                                                className="bg-white shadow-lg border-2 border-slate-400"
                                                style={{
                                                    width: `${paperWidthPx}px`,
                                                    height: `${paperHeightPx}px`,
                                                    transform: `scale(${previewScale})`,
                                                    transformOrigin: 'center center',
                                                    display: 'grid',
                                                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                                                    gap: '0',
                                                    padding: '0',
                                                    boxSizing: 'border-box',
                                                }}
                                            >
                                                {labelsToPrint.map((_, index) => (
                                                    <div key={index}
                                                        className="flex flex-col items-center justify-center text-center overflow-hidden"
                                                        style={{
                                                            border: copies > 1 ? '0.15mm solid #94a3b8' : 'none',
                                                            padding: '0.8mm',
                                                            fontFamily: 'Arial, sans-serif',
                                                            boxSizing: 'border-box',
                                                        }}
                                                    >
                                                        {/* Company */}
                                                        <div style={{
                                                            fontWeight: fontStyles.company.bold ? 'bold' : 'normal',
                                                            fontStyle: fontStyles.company.italic ? 'italic' : 'normal',
                                                            fontSize: `${companyFs * (fontStyles.company.size / 100)}mm`,
                                                            lineHeight: '1.15',
                                                            marginBottom: '0.3mm',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: '100%'
                                                        }}>
                                                            {formData.companyName}
                                                        </div>
                                                        {/* Product Code */}
                                                        <div style={{
                                                            fontWeight: fontStyles.code.bold ? 'bold' : 'normal',
                                                            fontStyle: fontStyles.code.italic ? 'italic' : 'normal',
                                                            fontSize: `${codeFs * (fontStyles.code.size / 100)}mm`,
                                                            lineHeight: '1.1',
                                                            marginBottom: '0.3mm'
                                                        }}>
                                                            {formData.productCode}
                                                        </div>
                                                        {/* Date */}
                                                        <div style={{
                                                            fontWeight: fontStyles.date.bold ? 'bold' : 'normal',
                                                            fontStyle: fontStyles.date.italic ? 'italic' : 'normal',
                                                            fontSize: `${detailFs * (fontStyles.date.size / 100)}mm`,
                                                            marginBottom: '0.2mm'
                                                        }}>
                                                            Date. {formatDate(formData.date)}
                                                        </div>
                                                        {/* Quantity - LARGEST */}
                                                        <div style={{
                                                            fontWeight: fontStyles.qty.bold ? '900' : 'normal',
                                                            fontStyle: fontStyles.qty.italic ? 'italic' : 'normal',
                                                            fontSize: `${qtyFs * (fontStyles.qty.size / 100)}mm`,
                                                            lineHeight: '1.1',
                                                            marginBottom: '0.2mm'
                                                        }}>
                                                            {formData.quantity} Pcs.
                                                        </div>
                                                        {/* Lot */}
                                                        <div style={{
                                                            fontWeight: fontStyles.lot.bold ? 'bold' : 'normal',
                                                            fontStyle: fontStyles.lot.italic ? 'italic' : 'normal',
                                                            fontSize: `${detailFs * (fontStyles.lot.size / 100)}mm`
                                                        }}>
                                                            Lot. {formData.lotNumber.toString().padStart(10, '0')}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>

                                <hr className="border-slate-200" />

                                {/* Presets */}
                                <h3 className="font-bold text-slate-700 border-b pb-2">
                                    💾 {language === 'th' ? 'รูปแบบที่บันทึก' : 'Saved Presets'}
                                </h3>

                                {/* Save Preset */}
                                {showSaveDialog ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={presetName}
                                            onChange={(e) => setPresetName(e.target.value)}
                                            placeholder={language === 'th' ? 'ชื่อรูปแบบ...' : 'Preset name...'}
                                            className="flex-1 border rounded-lg px-3 py-2"
                                        />
                                        <button
                                            onClick={savePreset}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            <Save className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setShowSaveDialog(false)}
                                            className="px-4 py-2 bg-slate-300 rounded-lg hover:bg-slate-400"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowSaveDialog(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {language === 'th' ? 'บันทึกรูปแบบใหม่' : 'Save New Preset'}
                                    </button>
                                )}

                                {/* Presets List */}
                                <div className="space-y-2 max-h-[150px] overflow-auto">
                                    {presets.length === 0 ? (
                                        <p className="text-slate-500 text-center py-3 text-sm">
                                            {language === 'th' ? 'ยังไม่มีรูปแบบที่บันทึก' : 'No presets saved'}
                                        </p>
                                    ) : (
                                        presets.map(preset => (
                                            <div key={preset.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                                <button
                                                    onClick={() => loadPreset(preset)}
                                                    className="flex-1 text-left font-medium text-slate-700 hover:text-blue-600"
                                                >
                                                    <FolderOpen className="w-4 h-4 inline mr-2" />
                                                    {preset.name}
                                                </button>
                                                <button
                                                    onClick={() => deletePreset(preset.id)}
                                                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right: Settings - matching BarcodePrintModal */}
                            <div className="space-y-4">
                                {/* Label Info */}
                                <h3 className="font-bold text-slate-700 border-b pb-2">
                                    {language === 'th' ? '📝 ข้อมูลฉลาก' : '📝 Label Info'}
                                </h3>

                                {/* Company Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {language === 'th' ? 'ชื่อบริษัท' : 'Company Name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>

                                {/* Product Code */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {language === 'th' ? 'รหัสสินค้า' : 'Product Code'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.productCode}
                                        onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Date Picker */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            <Calendar className="w-4 h-4 inline mr-1" />
                                            {language === 'th' ? 'วันที่' : 'Date'}
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            {language === 'th' ? 'จำนวน (Qty)' : 'Quantity'}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                                className="flex-1 border rounded-lg px-3 py-2"
                                                min="0"
                                            />
                                            <span className="text-slate-600 font-medium">Ea.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Lot Number */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {language === 'th' ? 'Lot Number (อัตโนมัติ)' : 'Lot Number (Auto)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lotNumber.toString().padStart(10, '0')}
                                        readOnly
                                        className="w-full border rounded-lg px-3 py-2 bg-slate-100 font-mono"
                                    />
                                </div>

                                <hr className="border-slate-100" />

                                {/* Grid Layout - Rows & Columns */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                                    <h4 className="font-medium text-slate-700 mb-3">
                                        {language === 'th' ? '📊 จำนวนดวงต่อหน้า' : '📊 Labels per Page'}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Rows */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                                {language === 'th' ? 'แถว (Rows)' : 'Rows'}
                                            </label>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setPrintSettings(s => ({ ...s, rows: Math.max(1, s.rows - 1) }))}
                                                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 text-lg font-bold"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    value={printSettings.rows}
                                                    onChange={(e) => setPrintSettings({ ...printSettings, rows: Math.max(1, parseInt(e.target.value) || 1) })}
                                                    className="flex-1 border rounded-lg px-2 py-1.5 text-center text-lg font-bold text-green-600"
                                                    min="1"
                                                    max="10"
                                                />
                                                <button
                                                    onClick={() => setPrintSettings(s => ({ ...s, rows: Math.min(10, s.rows + 1) }))}
                                                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 text-lg font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        {/* Columns */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                                {language === 'th' ? 'คอลัมน์ (Cols)' : 'Columns'}
                                            </label>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setPrintSettings(s => ({ ...s, cols: Math.max(1, s.cols - 1) }))}
                                                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 text-lg font-bold"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    value={printSettings.cols}
                                                    onChange={(e) => setPrintSettings({ ...printSettings, cols: Math.max(1, parseInt(e.target.value) || 1) })}
                                                    className="flex-1 border rounded-lg px-2 py-1.5 text-center text-lg font-bold text-green-600"
                                                    min="1"
                                                    max="10"
                                                />
                                                <button
                                                    onClick={() => setPrintSettings(s => ({ ...s, cols: Math.min(10, s.cols + 1) }))}
                                                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 text-lg font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-center">
                                        <span className="text-sm text-slate-500">
                                            {language === 'th' ? 'รวม' : 'Total'}:
                                        </span>
                                        <span className="text-lg font-bold text-green-700 ml-1">
                                            {rows * cols} {language === 'th' ? 'ดวง' : 'labels'}
                                        </span>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Paper Size Presets - matching BarcodePrintModal */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {language === 'th' ? 'ขนาดกระดาษ' : 'Paper Size'}
                                    </label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 text-slate-700 bg-white"
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
                                    </select>
                                </div>

                                {/* Width/Height inputs */}
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

                                {/* Orientation Toggle */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {language === 'th' ? 'แนวกระดาษ' : 'Orientation'}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setPrintSettings(s => ({ ...s, orientation: 'portrait' }))}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${printSettings.orientation === 'portrait'
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                }`}
                                        >
                                            <div className={`w-4 h-6 border-2 rounded-sm ${printSettings.orientation === 'portrait' ? 'border-blue-600 bg-blue-100' : 'border-slate-400'
                                                }`} />
                                            <span className="font-medium">
                                                {language === 'th' ? 'แนวตั้ง' : 'Portrait'}
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setPrintSettings(s => ({ ...s, orientation: 'landscape' }))}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${printSettings.orientation === 'landscape'
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                }`}
                                        >
                                            <div className={`w-6 h-4 border-2 rounded-sm ${printSettings.orientation === 'landscape' ? 'border-blue-600 bg-blue-100' : 'border-slate-400'
                                                }`} />
                                            <span className="font-medium">
                                                {language === 'th' ? 'แนวนอน' : 'Landscape'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Auto-fit Toggle - matching BarcodePrintModal */}
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
                                            className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${printSettings.autoFit ? 'bg-blue-600' : 'bg-slate-300'}`}
                                        >
                                            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${printSettings.autoFit ? 'translate-x-8' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">
                                        {language === 'th'
                                            ? 'ปรับขนาดตัวอักษรให้พอดีกับขนาดกระดาษโดยอัตโนมัติ'
                                            : 'Automatically scale text to fit page size'}
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

                                <hr className="border-slate-100" />

                                {/* Font Customization Section - At Bottom */}
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                                    <h4 className="font-medium text-slate-700 mb-3">
                                        🎨 {language === 'th' ? 'ปรับแต่งตัวอักษร' : 'Font Customization'}
                                    </h4>

                                    {/* Font style for each field */}
                                    {[
                                        { key: 'company', labelTh: 'ชื่อบริษัท', labelEn: 'Company' },
                                        { key: 'code', labelTh: 'รหัสสินค้า', labelEn: 'Product Code' },
                                        { key: 'date', labelTh: 'วันที่', labelEn: 'Date' },
                                        { key: 'qty', labelTh: 'จำนวน (Qty)', labelEn: 'Quantity' },
                                        { key: 'lot', labelTh: 'Lot Number', labelEn: 'Lot Number' }
                                    ].map(field => (
                                        <div key={field.key} className="mb-3 p-2 bg-white rounded-lg border border-slate-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-slate-700">
                                                    {language === 'th' ? field.labelTh : field.labelEn}
                                                </span>
                                                <div className="flex gap-1">
                                                    {/* Bold Toggle */}
                                                    <button
                                                        onClick={() => updateFontStyle(field.key, 'bold', !fontStyles[field.key].bold)}
                                                        className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-all ${fontStyles[field.key].bold
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                            }`}
                                                        title={language === 'th' ? 'ตัวหนา' : 'Bold'}
                                                    >
                                                        B
                                                    </button>
                                                    {/* Italic Toggle */}
                                                    <button
                                                        onClick={() => updateFontStyle(field.key, 'italic', !fontStyles[field.key].italic)}
                                                        className={`w-8 h-8 rounded flex items-center justify-center text-sm italic transition-all ${fontStyles[field.key].italic
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                            }`}
                                                        title={language === 'th' ? 'ตัวเอียง' : 'Italic'}
                                                    >
                                                        I
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Size Slider */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500 w-6">50%</span>
                                                <input
                                                    type="range"
                                                    min="50"
                                                    max="200"
                                                    step="10"
                                                    value={fontStyles[field.key].size}
                                                    onChange={(e) => updateFontStyle(field.key, 'size', Number(e.target.value))}
                                                    className="flex-1 h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                />
                                                <span className="text-xs font-bold text-purple-600 w-10 text-right">
                                                    {fontStyles[field.key].size}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
                        <span className="text-sm text-slate-500">
                            * {language === 'th' ? `พิมพ์ ${rows} × ${cols} = ${copies} ดวง` : `Print ${rows} × ${cols} = ${copies} labels`}
                        </span>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100"
                            >
                                {language === 'th' ? 'ปิด' : 'Close'}
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg"
                            >
                                <Printer className="w-5 h-5" />
                                {language === 'th' ? 'พิมพ์ทันที' : 'Print Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CustomLabelModal;
