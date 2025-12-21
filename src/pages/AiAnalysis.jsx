import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Key, AlertCircle, Loader2, Package } from 'lucide-react';
import { api } from '../services/api';
import { analyzeInventory, checkApiKey } from '../services/gemini';
import { useLanguage } from '../i18n/LanguageContext';

const AiAnalysis = () => {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);

    // Test Key State
    const [checkingKey, setCheckingKey] = useState(false);
    const [modelStatus, setModelStatus] = useState(null); // { success: boolean, message: string }

    // Analysis Result State
    const [analysisData, setAnalysisData] = useState(null);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);

    // Date Filter State
    const [selectedPeriod, setSelectedPeriod] = useState('1m'); // Default 1 month
    const [customStartDate, setCustomStartDate] = useState('');

    const { t, language } = useLanguage();

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) setApiKey(savedKey);

        // Default custom date
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        setCustomStartDate(d.toISOString().split('T')[0]);
    }, []);

    const handleCheckKey = async () => {
        if (!apiKey) return;
        setCheckingKey(true);
        setModelStatus(null);
        try {
            const models = await checkApiKey(apiKey);
            setModelStatus({
                success: true,
                message: `✅ Key is valid! Available models: ${models.slice(0, 3).join(', ')}...`
            });
            localStorage.setItem('gemini_api_key', apiKey);
        } catch (err) {
            setModelStatus({ success: false, message: `❌ Invalid Key: ${err.message}` });
        } finally {
            setCheckingKey(false);
        }
    };

    const handleAnalyze = async () => {
        if (!apiKey) {
            setError('กรุณาใส่ Gemini API Key ก่อนเริ่มการวิเคราะห์');
            return;
        }

        localStorage.setItem('gemini_api_key', apiKey);
        setLoading(true);
        setError('');
        setAnalysisData(null);

        try {
            // Determine Start Date
            let startDate = null;
            if (selectedPeriod !== 'all') {
                const now = new Date();
                if (selectedPeriod === '1m') now.setMonth(now.getMonth() - 1);
                else if (selectedPeriod === '3m') now.setMonth(now.getMonth() - 3);
                else if (selectedPeriod === '6m') now.setMonth(now.getMonth() - 6);
                else if (selectedPeriod === '1y') now.setFullYear(now.getFullYear() - 1);
                else if (selectedPeriod === 'custom' && customStartDate) {
                    now.setTime(new Date(customStartDate).getTime());
                }
                startDate = now.toISOString().split('T')[0];
            }

            // 1. Fetch Data
            const [inventoryRes, historyRes] = await Promise.all([
                api.getInventory(),
                api.getHistory(startDate)
            ]);

            // Fix: Handle API Response format (Direct Array or Object wrapper)
            let inventory = [], history = [];

            if (Array.isArray(inventoryRes)) inventory = inventoryRes;
            else if (inventoryRes && Array.isArray(inventoryRes.data)) inventory = inventoryRes.data;

            if (Array.isArray(historyRes)) history = historyRes;
            else if (historyRes && Array.isArray(historyRes.data)) history = historyRes.data;

            if (inventory.length === 0) throw new Error(t('scan.productNotFound') || 'ไม่พบข้อมูลสินค้า');

            // 2. Analyze with Gemini
            const textResponse = await analyzeInventory(
                apiKey,
                inventory,
                history
            );

            // 3. Parse JSON
            let parsedData;
            try {
                // Remove ```json and ``` if present
                const cleanText = textResponse.replace(/^```json/, '').replace(/```$/, '').trim();
                parsedData = JSON.parse(cleanText);
            } catch (e) {
                console.error("JSON Parse Error", e);
                // Fallback if AI returns plain text
                parsedData = { summary_markdown: textResponse, recommendations: [] };
            }

            setAnalysisData(parsedData);

        } catch (err) {
            console.error(err);
            setError(err.message || 'เกิดข้อผิดพลาดในการวิเคราะห์');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyUpdates = async () => {
        if (!analysisData?.recommendations?.length) return;

        if (!window.confirm(`ยืนยันการอัปเดต Min Stock ของสินค้า ${analysisData.recommendations.length} รายการ?`)) return;

        setUpdating(true);
        try {
            const updates = analysisData.recommendations.map(r => ({
                barcode: r.barcode,
                minStock: r.recommended_min_stock
            }));

            const res = await api.bulkUpdateMinStock(updates);
            if (res.success) {
                alert(`✅ ${res.message}`);
                // Optional: Refresh inventory logic here if needed
            } else {
                throw new Error(res.error);
            }
        } catch (err) {
            alert(`❌ อัปเดตไม่สำเร็จ: ${err.message}`);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Brain className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold">OptiStock AI Analyst</h1>
                    </div>
                    <p className="text-violet-100 max-w-xl">
                        AI-Powered Inventory Optimization & Automated Restocking
                    </p>
                </div>
                <Sparkles className="absolute right-0 top-0 w-64 h-64 text-white/10 -translate-y-1/2 translate-x-1/4" />
            </div>

            {/* API Key Input */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <Key className="w-5 h-5 text-slate-400" />
                    <h3 className="font-semibold text-slate-700">Gemini API Configuration</h3>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value.trim())}
                            placeholder="Paste your Gemini API Key here..."
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                        />
                        <button
                            onClick={handleCheckKey}
                            disabled={checkingKey || !apiKey}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm whitespace-nowrap flex items-center gap-2"
                        >
                            {checkingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test Key'}
                        </button>
                    </div>

                    {modelStatus && (
                        <div className={`text-xs px-3 py-2 rounded-lg border ${modelStatus.success ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {modelStatus.message}
                        </div>
                    )}

                    {/* Date Analysis Period Selection */}
                    <div className="border-t border-slate-100 pt-4 mt-2">
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">Analysis Period (ช่วงเวลาวิเคราะห์)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {[
                                { id: '1m', label: '1 Month' },
                                { id: '3m', label: '3 Months' },
                                { id: '6m', label: '6 Months' },
                                { id: '1y', label: '1 Year' },
                                { id: 'all', label: 'All Time' },
                                { id: 'custom', label: 'Custom' },
                            ].map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPeriod(p.id)}
                                    className={`px-3 py-1.5 text-xs md:text-sm rounded-lg border transition-all ${selectedPeriod === p.id
                                            ? 'bg-violet-600 text-white border-violet-600 shadow-md transform scale-105'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {selectedPeriod === 'custom' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs text-slate-500 mb-1 block">Start Date (เริ่มตั้งแต่วันที่)</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-auto focus:ring-2 focus:ring-violet-500/20 outline-none"
                                />
                            </div>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                            {selectedPeriod === 'all' ? 'Analyzing all available history.' : `Analyzing sales data from the selected period.`}
                        </p>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !apiKey}
                        className="w-full md:w-auto bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {language === 'th' ? 'เริ่มวิเคราะห์ (Start Analysis)' : 'Analyze'}
                    </button>
                </div>

                {error && (
                    <div className="flex items-center gap-2 mt-3 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}
                {!apiKey && (
                    <p className="text-xs text-slate-400 mt-2">
                        * Get your free API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">Google AI Studio</a>
                    </p>
                )}
            </div>

            {/* Results Area */}
            {analysisData && (
                <div className="space-y-6">
                    {/* Markdown Report */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-700">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-violet-500" />
                                Analysis Report
                            </h3>
                            <span className="text-xs text-slate-400">Generated by Gemini</span>
                        </div>
                        <div className="p-6 overflow-x-auto">
                            <div className="prose prose-slate max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed">
                                {analysisData.summary_markdown}
                            </div>
                        </div>
                    </div>

                    {/* Action Area */}
                    {analysisData.recommendations?.length > 0 && (
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-4">
                            <div>
                                <h3 className="text-lg font-bold text-emerald-800 mb-1">Apply AI Recommendations?</h3>
                                <p className="text-emerald-600 text-sm">
                                    System found {analysisData.recommendations.length} optimization opportunities.
                                    Clicking apply will automatically update Min Stock levels in Google Sheets.
                                </p>
                            </div>
                            <button
                                onClick={handleApplyUpdates}
                                disabled={updating}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                                {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
                                {updating ? 'Updating...' : 'Update All Changes'}
                            </button>
                        </div>
                    )}
                </div>
            )}
            {/* Danger Zone: Reset History */}
            <div className="border-t border-slate-200 mt-12 pt-8">
                <div className="bg-red-50 rounded-xl p-6 border border-red-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-red-800 mb-1">Reset Analysis Data</h3>
                        <p className="text-red-600 text-sm">
                            Clear all transaction history to restart the AI analysis from scratch.
                            <br /><span className="font-bold">Warning: This action cannot be undone.</span>
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            if (confirm('⚠️ Are you sure you want to clear ALL transaction history?\n\nThis will permanently delete the "Transaction_History" sheet content (except usage headers) to reset the AI analysis context.\n\nType OK to confirm.')) {
                                try {
                                    setLoading(true);
                                    await api.clearHistory();
                                    alert('✅ History cleared successfully. You can now start a fresh analysis.');
                                    // Make sure to reload or clear local state if needed
                                    setAnalysisData(null);
                                } catch (e) {
                                    alert('❌ Failed to clear history: ' + e.message);
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }}
                        className="bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-sm"
                    >
                        <AlertCircle className="w-4 h-4" />
                        Clear History
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiAnalysis;
