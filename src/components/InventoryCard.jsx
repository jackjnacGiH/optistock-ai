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
                <div className="aspect-video w-full bg-slate-100 relative">
                    <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.src = "https://placehold.co/600x400/png?text=No+Image"
                        }}
                    />
                    <div className="absolute top-2 right-2">
                        {isLowStock ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                <CheckCircle2 className="w-3 h-3" /> Good
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
                    product={{
                        ...product,
                        barcode,
                        name,
                        price,
                        unit,
                        stock
                    }}
                    onClose={() => setShowPrintModal(false)}
                />
            )}
        </>
    );
};

export default InventoryCard;
