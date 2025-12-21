import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.getHistory();
                // Fix: Handle both Array direct and object data response
                let data = [];
                if (Array.isArray(response)) {
                    data = response;
                } else if (response && Array.isArray(response.data)) {
                    data = response.data;
                }
                setHistory(data);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800">{t('history.title')}</h1>
                <p className="text-sm md:text-base text-slate-500">{t('history.subtitle')}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-6 md:p-8 text-center text-sm md:text-base text-slate-500">{t('history.loading')}</div>
                ) : history.length === 0 ? (
                    <div className="p-6 md:p-8 text-center text-sm md:text-base text-slate-500">{t('history.noHistory')}</div>
                ) : (
                    <div className="divide-y divide-slate-100 max-h-[calc(100vh-16rem)] overflow-y-auto scrollable">
                        {history.map((item, index) => (
                            <div key={item.id || index} className="p-3 md:p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {item.type === 'IN' ? <ArrowDownLeft className="w-4 h-4 md:w-5 md:h-5" /> : <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {/* Fix: Use name or productName */}
                                        <h4 className="font-semibold text-sm md:text-base text-slate-800 truncate">{item.name || item.productName || 'Unknown Product'}</h4>

                                        {/* Added Barcode Display */}
                                        <div className="text-xs text-slate-500 font-mono mb-0.5">#{item.barcode}</div>

                                        <div className="flex items-center text-xs text-slate-400 gap-1 md:gap-2">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(item.timestamp || item.date).toLocaleDateString()}</span>
                                            <span className="hidden md:inline">•</span>
                                            <span className="hidden md:inline">{t('history.by')} {item.userId}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-right font-bold text-sm md:text-base flex-shrink-0 ml-2 ${item.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.type === 'IN' ? '+' : '-'}{item.amount}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
