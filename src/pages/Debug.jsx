import React, { useState } from 'react';
import { api } from '../services/api';

const Debug = () => {
    const [logs, setLogs] = useState([]);

    const log = (msg, data = null) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `${timestamp}: ${msg} ${data ? JSON.stringify(data, null, 2) : ''}`]);
    };

    const testConnection = async () => {
        setLogs([]);
        log('🚀 Starting connection test...');
        log(`🔗 URL: ${api.config.API_URL}`);

        try {
            // Test 1: Simple GET request directly
            log('📡 Fetching from URL (no proxy)...');
            const res = await fetch(`${api.config.API_URL}?action=getInventory`);
            log(`Status: ${res.status} ${res.statusText}`);

            if (!res.ok) {
                log('❌ Network response was not ok');
                const text = await res.text();
                log('📄 Response text (might be HTML error):', text.substring(0, 500));
                return;
            }

            const contentType = res.headers.get("content-type");
            log(`Content-Type: ${contentType}`);

            if (contentType && contentType.indexOf("application/json") !== -1) {
                const json = await res.json();
                log('✅ JSON Response received:', json);
            } else {
                log('⚠️ Response is NOT JSON (likely HTML Auth page)');
                const text = await res.text();
                log('📄 Preview:', text.substring(0, 200));
                log('💡 FIX: Please redeploy GAS with "Who has access: Anyone"');
            }

        } catch (error) {
            log('❌ Fetch Error:', error.message);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Connection Debugger</h1>
            <p className="mb-4 text-slate-600">Use this tool to diagnose connection issues with Google Apps Script.</p>

            <button
                onClick={testConnection}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors mb-6"
            >
                Start Test
            </button>

            <div className="bg-slate-900 text-green-400 p-4 rounded-xl font-mono text-xs md:text-sm h-[500px] overflow-auto whitespace-pre-wrap shadow-lg">
                {logs.length === 0 ? '// Ready to test...' : logs.join('\n\n')}
            </div>
        </div>
    );
};

export default Debug;
