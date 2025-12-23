import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, ArrowLeft, Package, ScanLine } from 'lucide-react';
import Scanner from '../components/ScannerNew';
import InventoryCard from '../components/InventoryCard';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const ProductSearch = () => {
    const [view, setView] = useState('SEARCH'); // SEARCH, SCANNER, RESULT, LOADING
    const [searchQuery, setSearchQuery] = useState('');
    const [inventoryList, setInventoryList] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const searchRef = useRef(null);
    const { t, language } = useLanguage();

    // Fetch Inventory on Mount
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await api.getInventory();
                let inventory = [];
                if (Array.isArray(response)) inventory = response;
                else if (response && Array.isArray(response.data)) inventory = response.data;
                setInventoryList(inventory);
            } catch (error) {
                console.error("Failed to load inventory:", error);
            }
        };
        fetchInventory();

        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter Suggestions
    useEffect(() => {
        if (!searchQuery.trim() || inventoryList.length === 0) {
            setSuggestions([]);
            return;
        }
        const term = searchQuery.toLowerCase();
        const matches = inventoryList.filter(item => {
            const barcode = String(item.barcode || '').toLowerCase();
            const name = String(item.name || '').toLowerCase();
            return barcode.includes(term) || name.includes(term);
        }).slice(0, 10);
        setSuggestions(matches);
        setShowSuggestions(true);
    }, [searchQuery, inventoryList]);

    const handleSearch = (term) => {
        if (!term) return;

        const searchTerm = String(term).trim().toLowerCase();

        // Loose comparison for better matching
        const found = inventoryList.find(i =>
            String(i.barcode || '').trim().toLowerCase() === searchTerm ||
            String(i.name || '').trim().toLowerCase() === searchTerm
        );

        if (found) {
            setSelectedProduct(found);
            setView('RESULT');
            setSearchQuery('');
            setShowSuggestions(false);
        } else {
            // Fallback: Try partial match on Name only if exact match fails
            const partialFound = inventoryList.find(i =>
                String(i.name || '').toLowerCase().includes(searchTerm)
            );

            if (partialFound) {
                // Autoselect if partial match found (simple version) or ask user
                // For now, let's just select it to be user friendly
                setSelectedProduct(partialFound);
                setView('RESULT');
                setSearchQuery('');
                setShowSuggestions(false);
            } else {
                alert(t('scan.productNotFound'));
            }
        }
    };

    const handleScanSuccess = (code) => {
        setView('LOADING');
        const scannedCode = String(code).trim();

        setTimeout(() => {
            // Strategy 1: Exact String Match (Case Insensitive)
            let found = inventoryList.find(i =>
                String(i.barcode || '').trim().toLowerCase() === scannedCode.toLowerCase()
            );

            // Strategy 2: Numeric Match (Handles leading zeros e.g., "00123" vs "123")
            if (!found && !isNaN(scannedCode)) {
                try {
                    const scannedNum = Number(scannedCode);
                    found = inventoryList.find(i => {
                        const itemBarcode = i.barcode;
                        // Skip text barcodes
                        if (!itemBarcode || isNaN(itemBarcode)) return false;
                        return Number(itemBarcode) === scannedNum;
                    });
                } catch (e) {
                    console.warn("Numeric comparison failed", e);
                }
            }

            // Strategy 3: Partial Match (if still not found)
            if (!found) {
                found = inventoryList.find(i => {
                    const barcode = String(i.barcode || '').toLowerCase();
                    const search = scannedCode.toLowerCase();
                    return barcode.includes(search) || search.includes(barcode);
                });

                // If found with partial match, ask for confirmation
                if (found) {
                    const confirm = window.confirm(
                        language === 'th'
                            ? `ไม่พบบาร์โค้ดที่ตรงกันทุกตัว\n\nพบสินค้าที่คล้ายกัน:\n${found.name}\nบาร์โค้ด: ${found.barcode}\n\nต้องการใช้สินค้านี้หรือไม่?`
                            : `Exact match not found\n\nSimilar product found:\n${found.name}\nBarcode: ${found.barcode}\n\nUse this product?`
                    );
                    if (!confirm) {
                        found = null;
                    }
                }
            }

            if (found) {
                setSelectedProduct(found);
                setView('RESULT');
            } else {
                alert(`${t('scan.productNotFound')}: ${scannedCode}`);
                setView('SEARCH');
            }
        }, 800);
    };

    const handleReset = () => {
        setView('SEARCH');
        setSelectedProduct(null);
        setSearchQuery('');
    };

    // --- RENDER ---

    if (view === 'LOADING') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-slate-500">{t('scan.loading')}</p>
            </div>
        );
    }

    if (view === 'SCANNER') {
        return (
            <div className="max-w-xl mx-auto space-y-4">
                <button onClick={() => setView('SEARCH')} className="flex items-center text-slate-500 hover:text-slate-800 font-medium">
                    <ArrowLeft className="w-5 h-5 mr-1" /> {language === 'th' ? 'กลับไปค้นหา' : 'Back to Search'}
                </button>
                <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">{language === 'th' ? 'สแกนสินค้า' : 'Scan Product'}</h2>
                </div>
                <Scanner onScanSuccess={handleScanSuccess} autoStart={true} />
            </div>
        );
    }

    if (view === 'RESULT' && selectedProduct) {
        return (
            <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <button onClick={handleReset} className="flex items-center text-slate-500 hover:text-slate-800 font-medium">
                    <ArrowLeft className="w-5 h-5 mr-1" /> {language === 'th' ? 'ค้นหาใหม่' : 'New Search'}
                </button>

                <InventoryCard product={selectedProduct} />

                {/* Read-Only Details */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        {language === 'th' ? 'รายละเอียดเพิ่มเติม' : 'Product Details'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-400">{language === 'th' ? 'หมวดหมู่' : 'Category'}</p>
                            <p className="font-semibold text-slate-700">{selectedProduct.category || '-'}</p>
                        </div>
                        <div>
                            <p className="text-slate-400">{language === 'th' ? 'ราคาต่อหน่วย' : 'Unit Price'}</p>
                            <p className="font-semibold text-slate-700">{selectedProduct.price?.toLocaleString()} ฿</p>
                        </div>
                        <div>
                            <p className="text-slate-400">{language === 'th' ? 'อัปเดตล่าสุด' : 'Last Updated'}</p>
                            <p className="font-semibold text-slate-700">
                                {selectedProduct.lastUpdated ? new Date(selectedProduct.lastUpdated).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US') : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default: SEARCH View
    return (
        <div className="max-w-xl mx-auto space-y-8 py-8">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-2">
                    <Search className="w-8 h-8" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    {language === 'th' ? 'ค้นหาสินค้า' : 'Find Product'}
                </h1>
                <p className="text-slate-500">
                    {language === 'th' ? 'ดูข้อมูลสต็อกและรายละเอียดสินค้า' : 'Check stock and product details'}
                </p>
            </div>

            <div className="space-y-4">
                {/* Search Box */}
                <div ref={searchRef} className="relative">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder={language === 'th' ? "พิมพ์ชื่อ หรือ รหัสสินค้า..." : "Type Name or Barcode..."}
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setShowSuggestions(true)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                            {suggestions.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSearch(item.barcode)}
                                    className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-800 group-hover:text-blue-700">{item.name}</p>
                                        <p className="text-xs text-slate-400 font-mono">#{item.barcode}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-bold ${parseInt(item.stock) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {item.stock} {item.unit}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative flex justify-center text-xs uppercase my-6">
                    <span className="bg-slate-50 px-2 text-slate-400">{language === 'th' ? 'หรือ' : 'OR'}</span>
                </div>

                {/* Scan Button */}
                <button
                    onClick={() => setView('SCANNER')}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                    <ScanLine className="w-6 h-6" />
                    {language === 'th' ? 'สแกนบาร์โค้ด' : 'Scan Barcode'}
                </button>
            </div>
        </div>
    );
};

export default ProductSearch;
