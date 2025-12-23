import React, { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, RefreshCw, AlertCircle, Smartphone } from 'lucide-react';

const ScannerNew = ({ onScanSuccess, autoStart = false, processing = false }) => {
    const [isScanning, setIsScanning] = useState(autoStart);
    const [error, setError] = useState('');
    const [deviceType, setDeviceType] = useState('unknown');
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const onScanSuccessRef = useRef(onScanSuccess);
    const html5ScannerRef = useRef(null);

    // Keep callback ref updated
    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
    }, [onScanSuccess]);

    // Detect Device Type
    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            setDeviceType('ios');
        } else if (/android/i.test(userAgent)) {
            setDeviceType('android');
        } else {
            setDeviceType('desktop');
        }
    }, []);

    // Check Libraries and AutoStart
    useEffect(() => {
        let checkInterval;
        const checkLibrary = () => {
            if (deviceType === 'ios') {
                if (window.Quagga) {
                    if (autoStart) handleStartScan();
                } else {
                    checkInterval = setTimeout(checkLibrary, 100);
                }
            } else {
                if (window.Html5Qrcode) {
                    if (autoStart) handleStartScan();
                } else {
                    checkInterval = setTimeout(checkLibrary, 100);
                }
            }
        };

        if (deviceType !== 'unknown') {
            checkLibrary();
        }

        return () => clearTimeout(checkInterval);
    }, [deviceType, autoStart]);

    const handleStartScan = async () => {
        setError('');
        setIsScanning(true);

        try {
            if (deviceType === 'ios') {
                // Initialize Quagga for iOS
                await new Promise((resolve) => setTimeout(resolve, 100)); // Slight delay for DOM
                if (!videoRef.current) {
                    throw new Error("Video element not found");
                }

                window.Quagga.init({
                    inputStream: {
                        name: "Live",
                        type: "LiveStream",
                        target: videoRef.current,
                        constraints: {
                            facingMode: "environment",
                            width: { min: 640 },
                            height: { min: 480 },
                            aspectRatio: { min: 1, max: 2 }
                        },
                    },
                    locator: {
                        patchSize: "medium",
                        halfSample: true,
                    },
                    numOfWorkers: 2,
                    decoder: {
                        readers: ["code_128_reader", "ean_reader", "ean_8_reader"]
                    },
                    locate: true,
                }, (err) => {
                    if (err) {
                        console.error(err);
                        setError('ไม่สามารถเปิดเลนส์กล้องได้: ' + err);
                        setIsScanning(false);
                        return;
                    }
                    window.Quagga.start();
                });

                window.Quagga.onDetected((data) => {
                    if (data?.codeResult?.code) {
                        stopScanner();
                        onScanSuccessRef.current(data.codeResult.code);
                    }
                });

            } else {
                // Initialize Html5Qrcode for Android/Desktop
                if (!window.Html5Qrcode) return;

                const scanner = new window.Html5Qrcode("qr-reader");
                html5ScannerRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        formatsToSupport: [
                            0, // QR_CODE
                            1, // AZTEC
                            2, // CODABAR
                            3, // CODE_39
                            4, // CODE_93
                            5, // CODE_128
                            6, // EAN_8
                            11, // UPC_A
                            12  // UPC_E
                        ]
                    },
                    (decodedText) => {
                        stopScanner();
                        onScanSuccessRef.current(decodedText);
                    },
                    (errorMessage) => {
                        // Ignore errors during live scan
                    }
                );
            }
        } catch (err) {
            console.error(err);
            setError('ไม่สามารถเปิดกล้องได้: ' + err);
            setIsScanning(false);
        }
    };

    const stopScanner = () => {
        setIsScanning(false);
        if (deviceType === 'ios' && window.Quagga) {
            try { window.Quagga.stop(); } catch (e) { /* ignore */ }
        } else if (deviceType !== 'unknown' && html5ScannerRef.current) {
            try {
                // Attempt to stop only if it seems active
                html5ScannerRef.current.stop().catch(e => {
                    // Ignore "not running" errors as they are harmless
                    if (String(e).includes("not running")) return;
                    console.warn("Scanner Stop Warning:", e);
                });
            } catch (e) {
                // Safety net
            }
        }
    };

    const handleFileUpload = async (event) => {
        const imageFile = event.target.files[0];
        if (!imageFile) return;

        setError('');

        if (deviceType === 'ios' && window.Quagga) {
            const imageUrl = URL.createObjectURL(imageFile);
            window.Quagga.decodeSingle({
                src: imageUrl,
                decoder: { readers: ["code_128_reader", "ean_reader", "ean_8_reader"] }
            }, (result) => {
                URL.revokeObjectURL(imageUrl);
                if (result?.codeResult?.code) {
                    onScanSuccessRef.current(result.codeResult.code);
                } else {
                    setError('ไม่พบบาร์โค้ดในภาพ');
                }
            });
        } else if (deviceType === 'android' && window.Html5Qrcode) {
            try {
                const scanner = new window.Html5Qrcode("qr-reader-file");
                const result = await scanner.scanFile(imageFile, true);
                onScanSuccessRef.current(result);
            } catch (err) {
                setError('ไม่พบบาร์โค้ดในภาพ');
            }
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, [deviceType]);

    return (
        <div className="w-full max-w-md mx-auto relative">
            {/* Device Type Indicator */}
            <div className={`absolute top-2 right-2 z-30 ${deviceType === 'ios' ? 'bg-purple-600/90' : 'bg-green-600/90'} text-white text-[10px] px-2 py-1 rounded-full pointer-events-none shadow-sm flex items-center gap-1`}>
                <Smartphone className="w-3 h-3" />
                {deviceType === 'ios' ? 'iOS Ready' : 'Android Ready'}
            </div>

            {/* Scan Area */}
            <div className={`relative aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-slate-800 mb-4 transition-all duration-300 ${isScanning ? 'scale-100' : 'scale-[0.98] opacity-80'}`}>
                {deviceType === 'ios' ? (
                    <div ref={videoRef} className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />
                ) : (
                    <div id="qr-reader" className="w-full h-full" />
                )}

                {/* Status Overlay in Top Corner */}
                {isScanning && (
                    <div className="absolute top-4 left-4 z-20">
                        <span className="bg-red-500/80 text-white text-[10px] px-2 py-1 rounded-sm animate-pulse flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
                        </span>
                    </div>
                )}

                {/* --- CUSTOM CSS TO HIDE LIBRARY GUIDES --- */}
                <style>{`
                    #qr-reader video { object-fit: cover; width: 100% !important; height: 100% !important; }
                    #qr-reader__scan_region { display: none !important; } 
                    #qr-reader div { box-shadow: none !important; border: none !important; }
                `}</style>

                {/* Loading Processing Overlay */}
                {processing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white z-40 animate-in fade-in duration-200">
                        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <p className="text-lg font-semibold animate-pulse text-blue-200">กำลังค้นหาสินค้า...</p>
                    </div>
                )}

                {/* Placeholder Overlay (When not scanning) */}
                {!isScanning && !processing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
                        <Camera className="w-20 h-20 text-slate-500/50 mb-2" />
                        <p className="text-slate-400 text-sm">กล้องปิดอยู่</p>
                    </div>
                )}

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/95 text-white z-50 p-6 text-center animate-in zoom-in-95">
                        <AlertCircle className="w-16 h-16 mb-4 text-red-300" />
                        <p className="mb-6 text-base font-medium">{error}</p>
                        <button
                            onClick={() => { setError(''); handleStartScan(); }}
                            className="bg-white text-red-900 px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-all"
                        >
                            ลองอีกครั้ง
                        </button>
                    </div>
                )}
            </div>

            {/* --- CONTROLS (BELOW CAMERA) --- */}
            <div className="mt-4 p-4 bg-white/50 backdrop-blur-sm border border-slate-100 shadow-sm rounded-2xl">
                <div className="flex items-center gap-3">
                    {/* File Upload Button (Small) */}
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="flex flex-col items-center justify-center w-14 h-14 bg-white text-slate-500 rounded-xl hover:bg-slate-50 active:scale-95 transition-all cursor-pointer border border-slate-200 shadow-sm"
                        >
                            <ImageIcon className="w-6 h-6" />
                        </label>
                    </div>

                    {/* Main Scan Button (Large) */}
                    {isScanning ? (
                        <button
                            onClick={stopScanner}
                            className="flex-1 h-14 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-red-200 shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg"
                        >
                            <span className="w-3 h-3 bg-white rounded-sm animate-pulse" />
                            หยุดสแกน
                        </button>
                    ) : (
                        <button
                            onClick={handleStartScan}
                            disabled={processing}
                            className={`flex-1 h-14 ${deviceType === 'ios' ? 'bg-purple-600 shadow-purple-200' : 'bg-green-600 shadow-green-200'} hover:opacity-90 text-white rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Camera className="w-6 h-6" />
                            {processing ? 'กำลังประมวลผล...' : 'เปิดกล้องสแกน'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScannerNew;
