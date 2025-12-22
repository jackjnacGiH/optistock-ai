import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';

const Scanner = ({ onScanSuccess, autoStart = false }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const scannerRef = useRef(null);
    const fileInputRef = useRef(null);
    const startedRef = useRef(false);

    // Use ref to keep track of the latest callback to prevent stale closures
    const onScanSuccessRef = useRef(onScanSuccess);

    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
    }, [onScanSuccess]);

    // Cleanup on unmount
    useEffect(() => {
        // Auto start logic
        if (autoStart && !startedRef.current) {
            startedRef.current = true;
            setTimeout(() => {
                handleStartScan();
            }, 100);
        }

        return () => {
            stopScanner();
        };
    }, []); // Keep dependency empty to run only once on mount

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (e) {
                console.warn("Stop failed", e);
            }
            scannerRef.current = null;
            setIsScanning(false);
        }
    };

    const handleStartScan = async () => {
        setError('');
        setIsScanning(true);

        try {
            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            // Removed aspectRatio to prevent black screen on some devices
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            const successCallback = (decodedText) => {
                stopScanner();
                // Always call the latest version of the function
                if (onScanSuccessRef.current) {
                    onScanSuccessRef.current(decodedText);
                }
            };

            // Try Back Camera (Environment)
            try {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    successCallback,
                    () => { }
                );
            } catch (e) {
                console.warn("Back camera failed, trying user camera", e);
                // Fallback to User Camera
                await html5QrCode.start(
                    { facingMode: "user" },
                    config,
                    successCallback,
                    () => { }
                );
            }

        } catch (err) {
            console.error("Camera start error", err);
            setError("ไม่สามารถเปิดกล้องได้ กรุณาใช้ปุ่ม 'ถ่ายภาพ' ด้านล่างแทน");
            setIsScanning(false);
        }
    };

    const handleFileUpload = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const imageFile = e.target.files[0];
            const html5QrCode = new Html5Qrcode("reader");

            html5QrCode.scanFile(imageFile, true)
                .then(decodedText => {
                    if (onScanSuccessRef.current) {
                        onScanSuccessRef.current(decodedText);
                    }
                })
                .catch(err => {
                    setError("ไม่พบบาร์โค้ดในภาพ กรุณาลองใหม่");
                });
        }
    };

    return (
        <div className="w-full max-w-md mx-auto relative">
            {/* Version Indicator */}
            <div className="absolute top-2 right-2 z-30 bg-green-600/90 text-white text-[10px] px-2 rounded-full pointer-events-none shadow-sm">
                v3.1 (Auto-Update)
            </div>

            {/* Scan Area */}
            <div className="relative aspect-[2/1] bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-slate-800 mb-4">
                <div id="reader" className="w-full h-full"></div>

                {!isScanning && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white z-10 transition-all">
                        <Camera className="w-16 h-16 text-blue-500 mb-4 opacity-80" />
                        <button
                            onClick={handleStartScan}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-900/50 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Camera className="w-5 h-5" />
                            แตะเพื่อเปิดกล้อง
                        </button>
                        <p className="mt-4 text-xs text-slate-400">ระบบสแกนแบบใหม่ (เสถียร)</p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-white z-20 p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="mb-6 text-sm">{error}</p>
                        <button
                            onClick={handleStartScan}
                            className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> ลองใหม่
                        </button>
                    </div>
                )}
            </div>

            {/* Fallback Option */}
            <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">- หรือ -</p>
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
                <button
                    onClick={() => fileInputRef.current.click()}
                    className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                    <ImageIcon className="w-5 h-5 text-green-600" />
                    ถ่ายภาพสแกน (ใช้ได้ 100%)
                </button>
            </div>
        </div>
    );
};

export default Scanner;
