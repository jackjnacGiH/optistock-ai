import React, { useState } from 'react';
import { Package, AlertTriangle, CheckCircle2, Printer } from 'lucide-react';
import clsx from 'clsx';
import BarcodePrintModal from './BarcodePrintModal';
import { useLanguage } from '../i18n/LanguageContext';

const InventoryCard = ({ product }) => {
    const [showPrintModal, setShowPrintModal] = useState(false);
    const { t } = useLanguage();

    if (!product) return null;

    // ป้องกัน error โดยกำหนดค่า default
    const stock = product.stock || product.Stock || 0;
    const minStock = product.minStock || product.Min_Stock || product.min_stock || 0;
    const name = product.name || product.Name || 'ไม่ระบุชื่อ';
    const barcode = product.barcode || product.Barcode || '';
    const unit = product.unit || product.Unit || 'ชิ้น';
    const price = product.price || product.Price || 0;
    const imageUrl = product.imageUrl || product.Image_URL || product.image_url || 'https://placehold.co/600x400/png?text=No+Image';
    const category = product.category || product.Category || '-';
    const shelf = product.shelf || product.Shelf || '';
    const row = product.row || product.Row || '';

    const isLowStock = stock <= minStock;

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header Branding instead of Image */}
                <div className="w-full bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Package className="w-24 h-24 text-white transform rotate-12 translate-x-4 -translate-y-4" />
                    </div>

                    <div className="z-10 text-center">
                        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-tight">
                            OptiStock AI
                        </h2>
                        <p className="text-slate-400 text-xs font-medium tracking-wide uppercase mt-1">Intelligent Inventory</p>
                    </div>

                    <div className="absolute top-3 right-3 z-20">
                        {isLowStock ? (
                            <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-200 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-200 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm">
                                <CheckCircle2 className="w-3 h-3" /> Good Status
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 font-mono tracking-wide mb-1">{barcode}</p>
                            <h3 className="font-semibold text-lg text-slate-800 leading-tight">{name}</h3>
                            {category && category !== '-' && (
                                <p className="text-xs text-slate-400 mt-1">{category}</p>
                            )}
                            {(shelf || row) && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {row && (
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-base md:text-lg border border-blue-100">
                                            {t('inventory.row')}: {row}
                                        </span>
                                    )}
                                    {shelf && (
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-base md:text-lg border border-indigo-100">
                                            {t('inventory.shelf')}: {shelf}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowPrintModal(true)}
                            className="ml-2 p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                            title="Print Barcode"
                        >
                            <Printer className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>

                    <div className="flex items-end justify-between pt-2 border-t border-slate-50 mt-2">
                        <div>
                            <p className="text-xs text-slate-400">Current Stock</p>
                            <p className={clsx("text-2xl font-bold", isLowStock ? "text-red-600" : "text-slate-800")}>
                                {stock} <span className="text-sm font-normal text-slate-500">{unit}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">Min. Level</p>
                            <p className="text-sm font-medium text-slate-600">{minStock}</p>
                        </div>
                    </div>
                </div>
            </div>

            {showPrintModal && (
                <BarcodePrintModal
                    isOpen={showPrintModal}
                    product={{
                        ...product,
                        barcode: barcode,
                        name: name,
                        price: price,
                        unit: unit,
                        stock: stock
                    }}
                    barcode={barcode}
                    onClose={() => setShowPrintModal(false)}
                />
            )}
        </>
    );
};

export default InventoryCard;
