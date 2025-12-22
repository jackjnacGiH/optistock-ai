import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, ArrowLeft, Loader2, X } from 'lucide-react';
import Scanner from '../components/Scanner';
import InventoryCard from '../components/InventoryCard';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const ScanPage = () => {
    const [view, setView] = useState('SCAN'); // SCAN, RESULT, LOADING
    const [scannedCode, setScannedCode] = useState('');
    const [product, setProduct] = useState(null);
    const [amount, setAmount] = useState(0); // Default to 0
    const [adjType, setAdjType] = useState('IN'); // IN, OUT
    const [manualCode, setManualCode] = useState('');
    const [loading, setLoading] = useState(false);

    // Smart Search States
    const [inventoryList, setInventoryList] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);

    const { t, language } = useLanguage();

    // Fetch full inventory on mount for smart search
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await api.getInventory();
                let inventory = [];
                if (Array.isArray(response)) {
                    inventory = response;
                } else if (response && Array.isArray(response.data)) {
                    inventory = response.data;
                }
                setInventoryList(inventory);
            } catch (error) {
                console.error("Failed to load inventory for search:", error);
            }
        };
        fetchInventory();

        // Close details on click outside
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    // Listen for reset event from Layout
    useEffect(() => {
        const handleResetEvent = () => handleReset();
        window.addEventListener('reset-scan-view', handleResetEvent);
        return () => window.removeEventListener('reset-scan-view', handleResetEvent);
    }, []);

    // Filter suggestions as user types
    useEffect(() => {
        if (!manualCode.trim() || inventoryList.length === 0) {
            setSuggestions([]);
            return;
        }

        const term = manualCode.toLowerCase();
        const matches = inventoryList.filter(item => {
            const barcode = String(item.barcode || '').toLowerCase();
            const name = String(item.name || '').toLowerCase();
            return barcode.includes(term) || name.includes(term);
        }).slice(0, 5); // Limit to 5 suggestions

        setSuggestions(matches);
        setShowSuggestions(true);
    }, [manualCode, inventoryList]);


    // Handle successful scan
    const handleScan = async (code) => {
        setScannedCode(code);
        loadProduct(code);
    };

    const loadProduct = async (codeOrName) => {
        setView('LOADING');
        // If we have local inventory, search instantly
        if (inventoryList.length > 0) {
            const searchTerm = String(codeOrName).trim().toLowerCase();
            const found = inventoryList.find(i =>
                String(i.barcode).toLowerCase() === searchTerm ||
                String(i.name).toLowerCase() === searchTerm
            );

            if (found) {
                setupProductView(found);
                return;
            }
        }

        // Fallback to API if not found locally (e.g. new item not yet refreshed)
        try {
            const response = await api.getInventory();
            let inventory = [];
            if (Array.isArray(response)) inventory = response;
            else if (response && Array.isArray(response.data)) inventory = response.data;

            // Refresh local list
            setInventoryList(inventory);

            const searchCode = String(codeOrName).trim();
            const found = inventory.find(i =>
                String(i.barcode) === searchCode || String(i.name) === searchCode
            );

            if (found) {
                setupProductView(found);
            } else {
                alert(`${t('scan.productNotFound')}: ${codeOrName}`);
                setView('SCAN');
            }
        } catch (e) {
            console.error('Error fetching product:', e);
            alert(t('scan.errorFetching'));
            setView('SCAN');
        }
    };

    const setupProductView = (found) => {
        const productWithDefaults = {
            barcode: found.barcode || '',
            name: found.name || 'ไม่ระบุชื่อ',
            stock: found.stock || 0,
            unit: found.unit || 'ชิ้น',
            price: found.price || 0,
            minStock: found.minStock || 0,
            category: found.category || '',
            shelf: found.shelf || '',
            row: found.row || '',
            imageUrl: found.imageUrl || 'https://placehold.co/600x400/png?text=No+Image',
            lastUpdated: found.lastUpdated || new Date().toISOString()
        };
        setProduct(productWithDefaults);
        setView('RESULT');
        setManualCode(''); // Clear search
        setShowSuggestions(false);
    };




    const handleSubmit = async () => {
        if (!product) return;
        setLoading(true);
        try {
            const response = await api.updateStock(product.barcode, amount, adjType);
            if (response.success) {
                alert(response.message || t('scan.stockUpdated'));

                // Update local inventory state to reflect change immediately
                const updatedList = inventoryList.map(item => {
                    if (item.barcode === product.barcode) {
                        return {
                            ...item,
                            stock: adjType === 'IN'
                                ? parseInt(item.stock) + amount
                                : parseInt(item.stock) - amount
                        };
                    }
                    return item;
                });
                setInventoryList(updatedList);

                handleReset();
            } else {
                alert(response.error || t('scan.failedUpdate'));
            }
        } catch (e) {
            console.error('Error updating stock:', e);
            alert(t('scan.failedUpdate'));
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setView('SCAN');
        setScannedCode('');
        setProduct(null);
        setAmount(0); // Default to 0 as requested
        setManualCode('');
        setSuggestions([]);
    };

    if (view === 'LOADING') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-sm md:text-base text-slate-500">{t('scan.loading')}</p>
            </div>
        );
    }

    if (view === 'RESULT' && product) {
        return (
            <div className="h-full flex flex-col max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">


                <InventoryCard product={product} />

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100">
                    <h4 className="text-base md:text-lg font-semibold text-slate-800 mb-3 md:mb-4">{t('scan.adjustStock')}</h4>

                    <div className="flex gap-2 mb-4 md:mb-6">
                        <button
                            onClick={() => setAdjType('IN')}
                            className={`flex-1 py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold transition-all ${adjType === 'IN' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}
                        >
                            {t('scan.receive')}
                        </button>
                        <button
                            onClick={() => setAdjType('OUT')}
                            className={`flex-1 py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold transition-all ${adjType === 'OUT' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}
                        >
                            {t('scan.issue')}
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-6 md:mb-8 px-4 md:px-8">
                        <button
                            onClick={() => setAmount(Math.max(1, amount - 1))}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-all"
                        >
                            <Minus className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                        </button>
                        <div className="text-center flex-1 mx-4">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value) || 1;
                                    setAmount(Math.max(1, value));
                                }}
                                onFocus={(e) => e.target.select()}
                                className="text-3xl md:text-4xl font-bold text-slate-800 text-center w-full max-w-[120px] mx-auto bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-primary focus:outline-none transition-colors"
                                min="1"
                                max="9999"
                            />
                            <p className="text-xs text-slate-400 mt-1">{product.unit}</p>
                        </div>
                        <button
                            onClick={() => setAmount(amount + 1)}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-all"
                        >
                            <Plus className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                        </button>
                    </div>

                    {/* Quick Amount Buttons (Accumulative) */}
                    <div className="mb-4 md:mb-6">
                        <p className="text-xs text-slate-500 mb-2 text-center">
                            {language === 'th' ? 'เพิ่มจำนวนด่วน (+)' : 'Quick Add Amounts (+)'}
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                            {[10, 50, 100, 500, 1000].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setAmount(prev => (parseInt(prev) || 0) + num)}
                                    className="py-2 px-1 rounded-lg text-xs md:text-sm font-semibold transition-all bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105 active:scale-95 border border-slate-200"
                                >
                                    +{num}
                                </button>
                            ))}
                        </div>
                    </div>



                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-sm md:text-base"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {t('scan.confirm')} {adjType}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6 max-w-xl mx-auto">
            <div className="text-center mb-2 md:mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">{t('scan.title')}</h2>
                <p className="text-sm md:text-base text-slate-500">{t('scan.subtitle')}</p>
            </div>

            {/* Scanner Component */}
            <Scanner onScanSuccess={handleScan} />

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50 px-2 text-slate-400">{t('scan.manualEntry')}</span>
                </div>
            </div>

            {/* Smart Search Input */}
            <div ref={searchRef} className="relative">
                <form onSubmit={(e) => { e.preventDefault(); if (manualCode) loadProduct(manualCode); }} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder={language === 'th' ? "ใส่รหัสบาร์โค้ด หรือ ชื่อสินค้า..." : "Enter barcode or product name..."}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            onFocus={() => setShowSuggestions(true)}
                        />
                        {manualCode && (
                            <button
                                type="button"
                                onClick={() => { setManualCode(''); setSuggestions([]); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </form>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        {suggestions.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => loadProduct(item.barcode)}
                                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">{item.name}</p>
                                    <p className="text-xs text-slate-400 font-mono">#{item.barcode}</p>
                                </div>
                                <div className="text-xs text-slate-400 text-right">
                                    <span className="block">stock</span>
                                    <span className={`font-bold ${parseInt(item.stock) <= parseInt(item.minStock) ? 'text-red-500' : 'text-green-600'}`}>
                                        {item.stock}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-100 p-3 md:p-4 rounded-xl">
                <h5 className="font-semibold text-blue-800 text-xs md:text-sm mb-1">{t('scan.quickTip')}</h5>
                <p className="text-xs text-blue-600">
                    {language === 'th'
                        ? 'ใส่ "รหัสสินค้า" หรือ "ชื่อสินค้า" เพื่อค้นหาได้ทันที'
                        : 'Type "Product Code" or "Name" to search instantly.'}
                </p>
            </div>
        </div>
    );
};

export default ScanPage;

