import React, { useEffect, useState } from 'react';
import { Package, TrendingUp, AlertTriangle, Activity, Printer, FileSpreadsheet } from 'lucide-react';
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
                    const stock = parseInt(i.stock);
                    const min = parseInt(i.minStock);

                    // Skip if values are invalid (NaN or empty)
                    if (isNaN(stock) || isNaN(min)) {
                        return false;
                    }

                    // Skip if minStock is not set (0 or negative)
                    if (min <= 0) {
                        return false;
                    }

                    // Skip if stock is exactly 0 or empty (but allow negative values)
                    if (stock === 0) {
                        return false;
                    }

                    // Show items where stock is less than or equal to minStock (including negative)
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

    const handlePrint = () => {
        window.print();
    };

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

            {/* Print-only Content (Hidden on screen, visible when printing) */}
            <div id="printable-area" className="print-only" style={{ display: 'none' }}>
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-area,
                        #printable-area * {
                            visibility: visible;
                        }
                        #printable-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            display: block !important;
                        }
                        @page {
                            size: A4;
                            margin: 20mm;
                        }
                    }
                `}</style>
                <div className="p-8 bg-white text-black">
                    <div className="mb-6 border-b-2 border-black pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-black mb-1">Low Stock Report</h1>
                                <p className="text-sm text-gray-600">OptiStock AI Inventory System</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString('th-TH')}</p>
                                <p className="text-sm text-gray-600">Total Items: {lowStockItems.length}</p>
                            </div>
                        </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="py-2 font-bold text-black">Item Name</th>
                                <th className="py-2 font-bold text-black text-right w-32">Barcode</th>
                                <th className="py-2 font-bold text-black text-right w-20">Stock</th>
                                <th className="py-2 font-bold text-black text-right w-20">Min</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStockItems.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-300" style={{ pageBreakInside: 'avoid' }}>
                                    <td className="py-2 pr-2" style={{ maxWidth: '250px' }}>
                                        <div className="font-medium text-black" style={{ wordWrap: 'break-word', whiteSpace: 'normal', lineHeight: '1.4' }}>
                                            {item.name || 'Unknown Product'}
                                        </div>
                                    </td>
                                    <td className="py-2 text-right font-mono text-sm text-gray-700">{item.barcode}</td>
                                    <td className={`py-2 text-right font-bold ${item.stock <= 0 ? 'text-red-600' : 'text-black'}`}>{item.stock}</td>
                                    <td className="py-2 text-right text-gray-700">{item.minStock}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500">
                        <p>Generated by OptiStock AI - {new Date().toLocaleString('th-TH')}</p>
                    </div>
                </div>
            </div>

            {/* Low Stock Modal */}
            {showLowStockModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50 flex-shrink-0">
                            <h3 className="font-bold text-amber-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="truncate">{t('dashboard.lowStockAlerts')} ({lowStockItems.length})</span>
                            </h3>
                            <button
                                onClick={() => setShowLowStockModal(false)}
                                className="w-8 h-8 rounded-full bg-white/50 hover:bg-white text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors"
                            >
                                <span className="text-xl leading-none">&times;</span>
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-0 scrollable">
                            {lowStockItems.length === 0 ? (
                                <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                                    <Package className="w-12 h-12 mb-2 opacity-20" />
                                    <p>No low stock items.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {lowStockItems.map((item, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="min-w-0 pr-4">
                                                <p className="font-semibold text-slate-800 text-sm truncate">{item.name || 'Unknown'}</p>
                                                <p className="text-xs text-slate-400 font-mono">#{item.barcode}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="flex items-baseline justify-end gap-1">
                                                    <span className={`text-lg font-bold ${item.stock <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                                        {item.stock}
                                                    </span>
                                                    <span className="text-xs text-slate-400">/ {item.minStock}</span>
                                                </div>
                                                {parseInt(item.stock) === 0 && (
                                                    <span className="inline-block text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">EMPTY</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-3 border-t border-slate-100 bg-slate-50 flex flex-col gap-2 flex-shrink-0">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => {
                                        const headers = ['Barcode', 'Product Name', 'Category', 'Current Stock', 'Min Stock', 'Price', 'Value'];
                                        const csvContent = [
                                            headers.join(','),
                                            ...lowStockItems.map(item => [
                                                `"${String(item.barcode).replace(/"/g, '""')}"`,
                                                `"${String(item.name).replace(/"/g, '""')}"`,
                                                `"${String(item.category || '').replace(/"/g, '""')}"`,
                                                item.stock,
                                                item.minStock,
                                                item.price,
                                                item.stock * (item.price || 0)
                                            ].join(','))
                                        ].join('\n');

                                        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.setAttribute('href', url);
                                        link.setAttribute('download', `Low_Stock_${new Date().toISOString().split('T')[0]}.csv`);
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold active:scale-95 transition-all shadow-sm"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span>Excel</span>
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold active:scale-95 transition-all shadow-sm"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Print</span>
                                </button>
                            </div>
                            <button
                                onClick={() => setShowLowStockModal(false)}
                                className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-bold active:scale-95 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
