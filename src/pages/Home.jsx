import React, { useEffect, useState, useRef } from 'react';
import { Package, TrendingUp, AlertTriangle, Activity, Printer, FileSpreadsheet } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
        <div>
            <p className="text-xs md:text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800">{value}</h3>
            {subtext && <p className="text-xs text-slate-400 mt-1 md:mt-2">{subtext}</p>}
        </div>
        <div className={`p-2 md:p-3 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
    </div>
);

const Home = () => {
    const [stats, setStats] = useState({ totalItems: 0, lowStock: 0, totalValue: 0 });
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    const [showLowStockModal, setShowLowStockModal] = useState(false);
    const [lowStockItems, setLowStockItems] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Inventory
                const invResponse = await api.getInventory();
                let inventory = [];
                if (Array.isArray(invResponse)) {
                    inventory = invResponse;
                } else if (invResponse && Array.isArray(invResponse.data)) {
                    inventory = invResponse.data;
                }

                // Fetch History for Transactions Today
                const histResponse = await api.getHistory();
                let history = [];
                if (Array.isArray(histResponse)) {
                    history = histResponse;
                } else if (histResponse && Array.isArray(histResponse.data)) {
                    history = histResponse.data;
                }

                // Clean data: Filter out empty rows (must have barcode)
                // This fixes the issue where Google Sheets returns blank rows as data
                const validInventory = inventory.filter(item => item.barcode && String(item.barcode).trim() !== '');

                const totalItems = validInventory.length;

                // Filter Low Stock Items (Valid entries only)
                const lowStockList = validInventory.filter(i => {
                    const stock = parseInt(i.stock) || 0;
                    const min = parseInt(i.minStock) || 0;

                    // Logic: Stock is low IF it is less/equal to min
                    return stock <= min;
                });

                const lowStockCount = lowStockList.length;
                setLowStockItems(lowStockList);

                // Calculate Transactions Today
                const today = new Date().toDateString();
                const todayTx = history.filter(h => {
                    const txDate = h.timestamp ? new Date(h.timestamp) : new Date();
                    return txDate.toDateString() === today;
                }).length;

                // Calculate total value
                const totalValue = validInventory.reduce((acc, curr) => acc + (curr.stock * (curr.price || 0)), 0);

                setStats({ totalItems, lowStock: lowStockCount, totalValue, todayTx });
            } catch (e) {
                console.error('Error fetching dashboard data:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const StatCardWithClick = ({ title, value, subtext, icon: Icon, color, onClick, clickable }) => (
        <div
            onClick={clickable ? onClick : undefined}
            className={`bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between ${clickable ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]' : ''}`}
        >
            <div>
                <p className="text-xs md:text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800">{value}</h3>
                {subtext && <p className="text-xs text-slate-400 mt-1 md:mt-2">{subtext}</p>}
            </div>
            <div className={`p-2 md:p-3 rounded-lg ${color}`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
        </div>
    );

    const printRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Low_Stock_Report_${new Date().toISOString().split('T')[0]}`,
    });

    return (
        <div className="space-y-4 md:space-y-8 relative">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800">{t('dashboard.title')}</h1>
                <p className="text-sm md:text-base text-slate-500">{t('dashboard.subtitle')}</p>
            </div>

            <button
                onClick={async () => {
                    if (!confirm('Create Daily Report snapshot?')) return;
                    setLoading(true);
                    try {
                        await api.saveReport('Manual Trigger');
                        alert('Report saved to Sheet!');
                    } catch (e) {
                        alert('Error saving report');
                    } finally {
                        setLoading(false);
                    }
                }}
                className="absolute top-0 right-0 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
            >
                <Printer className="w-4 h-4" /> Save Daily Report
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                <StatCardWithClick
                    title={t('dashboard.totalProducts')}
                    value={loading ? "..." : stats.totalItems}
                    icon={Package}
                    color="bg-blue-500"
                    subtext={t('dashboard.totalProductsSub')}
                />
                <StatCardWithClick
                    title={t('dashboard.lowStockAlerts')}
                    value={loading ? "..." : stats.lowStock}
                    icon={AlertTriangle}
                    color="bg-amber-500"
                    subtext={t('dashboard.lowStockAlertsSub')}
                    clickable={true}
                    onClick={() => setShowLowStockModal(true)}
                />
                <StatCardWithClick
                    title={t('dashboard.transactionsToday')}
                    value={loading ? "..." : (stats.todayTx || 0)}
                    icon={Activity}
                    color="bg-green-500"
                    subtext={t('dashboard.transactionsTodaySub')}
                />
            </div>

            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-lg md:text-2xl font-bold mb-2 md:mb-4">{t('dashboard.readyTitle')}</h2>
                    <p className="text-sm md:text-base text-slate-300 max-w-xl mb-4 md:mb-6">{t('dashboard.readyDesc')}</p>
                    <a href="/scan" className="inline-block bg-white text-slate-900 font-bold px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-slate-100 transition-colors text-sm md:text-base">
                        {t('dashboard.startScanning')}
                    </a>
                </div>
                <Package className="absolute -right-10 -bottom-10 w-48 h-48 md:w-64 md:h-64 text-white/5 rotate-12" />
            </div>

            {/* Low Stock Modal */}
            {showLowStockModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50 flex-shrink-0">
                            <h3 className="font-bold text-amber-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                {t('dashboard.lowStockAlerts')} ({lowStockItems.length})
                            </h3>
                            <button
                                onClick={() => setShowLowStockModal(false)}
                                className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors shadow-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Printable Content Area */}
                        <div className="flex-1 overflow-y-auto p-0">
                            <div ref={printRef} className="p-4 md:p-6 bg-white print:p-8">
                                {/* Print Only Header */}
                                <div className="hidden print:block mb-6 border-b pb-4">
                                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Low Stock Report</h1>
                                    <p className="text-sm text-slate-500">
                                        Date: {new Date().toLocaleString()}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Items Count: {lowStockItems.length}
                                    </p>
                                </div>

                                {lowStockItems.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">No items are low in stock.</div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {lowStockItems.map((item, idx) => (
                                            <div key={idx} className="py-3 flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm md:text-base">{item.name || 'Unknown Product'}</p>
                                                    <p className="text-xs text-slate-400 font-mono">#{item.barcode}</p>
                                                    {parseInt(item.stock) === 0 && (
                                                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                                                            OUT OF STOCK
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right flex items-center gap-4">
                                                    <div>
                                                        <span className="block text-xs text-slate-400 uppercase tracking-wide">Stock</span>
                                                        <span className={`font-bold ${item.stock <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                                            {item.stock}
                                                        </span>
                                                    </div>
                                                    <div className="print:hidden h-8 w-px bg-slate-100 mx-1"></div>
                                                    <div>
                                                        <span className="block text-xs text-slate-400 uppercase tracking-wide">Min</span>
                                                        <span className="font-medium text-slate-600">{item.minStock}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center flex-shrink-0">
                            <p className="text-xs text-slate-400 hidden md:block">
                                Print this list to perform manual restocking.
                            </p>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => {
                                        // 1. Convert to CSV
                                        const headers = ['Barcode', 'Product Name', 'Category', 'Current Stock', 'Min Stock', 'Price', 'Value'];
                                        const csvContent = [
                                            headers.join(','),
                                            ...lowStockItems.map(item => [
                                                `"${String(item.barcode).replace(/"/g, '""')}"`, // Handle quotes in data
                                                `"${String(item.name).replace(/"/g, '""')}"`,
                                                `"${String(item.category || '').replace(/"/g, '""')}"`,
                                                item.stock,
                                                item.minStock,
                                                item.price,
                                                item.stock * (item.price || 0)
                                            ].join(','))
                                        ].join('\n');

                                        // 2. Create Blob and Download
                                        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel UTF-8
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.setAttribute('href', url);
                                        link.setAttribute('download', `Low_Stock_Report_${new Date().toISOString().split('T')[0]}.csv`);
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 border border-green-700 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all shadow-sm"
                                >
                                    <FileSpreadsheet className="w-4 h-4" /> Export Excel
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                >
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                                <button
                                    onClick={() => setShowLowStockModal(false)}
                                    className="flex-1 md:flex-none px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 shadow-md"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
