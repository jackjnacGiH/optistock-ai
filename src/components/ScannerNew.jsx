import React, { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';

const ScannerNew = ({ onScanSuccess, autoStart = false }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const [isQuaggaLoaded, setIsQuaggaLoaded] = useState(false);
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const onScanSuccessRef = useRef(onScanSuccess);

    // Update ref when callback changes
    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
    }, [onScanSuccess]);

    // Load Quagga library
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.min.js';
        script.async = true;
        script.onload = () => {
            console.log('Quagga loaded successfully');
            setIsQuaggaLoaded(true);
            if (autoStart) {
                setTimeout(() => {
                    handleStartScan();
                }, 500);
            }
        };
        script.onerror = () => {
            setError('ไม่สามารถโหลด Scanner ได้ กรุณาลองใหม่');
        };
        document.body.appendChild(script);

        return () => {
            stopScanner();
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const stopScanner = () => {
        if (window.Quagga) {
            try {
                window.Quagga.stop();
                console.log('Quagga stopped');
            } catch (e) {
                console.log('Quagga stop error:', e);
            }
        }
        setIsScanning(false);
    };

    const handleStartScan = async () => {
        setError('');

        if (!window.Quagga) {
            setError('Scanner ยังโหลดไม่เสร็จ กรุณารอสักครู่');
            return;
        }

        setIsScanning(true);

        try {
            await window.Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: videoRef.current,
                    constraints: {
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 },
                        facingMode: "environment",
                        aspectRatio: { min: 1, max: 2 }
                    },
                    area: { // Scan area (center 80%)
                        top: "10%",
                        right: "10%",
                        left: "10%",
                        bottom: "10%"
                    }
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: navigator.hardwareConcurrency || 4,
                decoder: {
                    readers: [
                        "code_128_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "code_39_reader",
                        "code_39_vin_reader",
                        "codabar_reader",
                        "upc_reader",
                        "upc_e_reader",
                        "i2of5_reader"
                    ],
                    debug: {
                        drawBoundingBox: false,
                        showFrequency: false,
                        drawScanline: false,
                        showPattern: false
                    },
                    multiple: false
                },
                locate: true,
                frequency: 10 // Scan 10 times per second
            }, (err) => {
                if (err) {
                    console.error('Quagga init error:', err);
                    let errorMessage = 'ไม่สามารถเปิดกล้องได้';

                    if (err.name === 'NotAllowedError') {
                        errorMessage = 'กรุณาอนุญาตให้เข้าถึงกล้อง\nไปที่ Settings > Safari > Camera';
                    } else if (err.name === 'NotFoundError') {
                        errorMessage = 'ไม่พบกล้อง';
                    } else if (err.message) {
                        errorMessage = err.message;
                    }

                    setError(errorMessage);
                    setIsScanning(false);
                    return;
                }

                console.log('Quagga initialized');
                window.Quagga.start();

                // Listen for detected barcodes
                window.Quagga.onDetected((result) => {
                    if (result && result.codeResult && result.codeResult.code) {
                        const code = result.codeResult.code;
                        console.log('Barcode detected:', code);

                        // Stop scanning
                        stopScanner();

                        // Call success callback
                        if (onScanSuccessRef.current) {
                            onScanSuccessRef.current(code);
                        }
                    }
                });
            });
        } catch (err) {
            console.error('Scanner error:', err);
            setError('เกิดข้อผิดพลาด: ' + err.message);
            setIsScanning(false);
        }
    };

    const handleFileUpload = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const imageFile = e.target.files[0];

        if (!window.Quagga) {
            setError('Scanner ยังโหลดไม่เสร็จ');
            return;
        }

        try {
            const imageUrl = URL.createObjectURL(imageFile);

            await window.Quagga.decodeSingle({
                src: imageUrl,
                numOfWorkers: 0,
                inputStream: {
                    size: 800
                },
                decoder: {
                    readers: [
                        "code_128_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "code_39_reader",
                        "code_39_vin_reader",
                        "codabar_reader",
                        "upc_reader",
                        "upc_e_reader",
                        "i2of5_reader"
                    ]
                },
                locate: true
            }, (result) => {
                URL.revokeObjectURL(imageUrl);

                if (result && result.codeResult && result.codeResult.code) {
                    console.log('Image barcode detected:', result.codeResult.code);
                    onScanSuccessRef.current(result.codeResult.code);
                } else {
                    setError('ไม่พบบาร์โค้ดในภาพ กรุณาลองใหม่');
                }
            });
        } catch (err) {
            console.error('Image scan error:', err);
            setError('ไม่พบบาร์โค้ดในภาพ กรุณาลองใหม่');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto relative">
            {/* Version Indicator */}
            <div className="absolute top-2 right-2 z-30 bg-purple-600/90 text-white text-[10px] px-2 rounded-full pointer-events-none shadow-sm">
                v5.0 Quagga (iOS 18+)
            </div>

            {/* Scan Area */}
            <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-slate-800 mb-4">
                <div
                    ref={videoRef}
                    className="w-full h-full"
                    style={{ display: isScanning ? 'block' : 'none' }}
                />

                {!isScanning && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white z-10 transition-all">
                        <Camera className="w-16 h-16 text-purple-500 mb-4 opacity-80" />
                        <button
                            onClick={handleStartScan}
                            disabled={!isQuaggaLoaded}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-purple-900/50 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Camera className="w-5 h-5" />
                            {isQuaggaLoaded ? 'แตะเพื่อเปิดกล้อง' : 'กำลังโหลด...'}
                        </button>
                        <p className="mt-4 text-xs text-slate-400">Quagga Scanner - iOS 18 Compatible</p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-white z-20 p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="mb-6 text-sm whitespace-pre-line">{error}</p>
                        <button
                            onClick={handleStartScan}
                            className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> ลองใหม่
                        </button>
                    </div>
                )}

                {/* Scanning indicator with scan line animation */}
                {isScanning && (
                    <>
                        {/* Scan line animation */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan-line shadow-lg shadow-green-400/50"></div>
                        </div>

                        {/* Scanning corners */}
                        <div className="absolute inset-0 pointer-events-none p-8">
                            <div className="w-full h-full border-2 border-green-400/50 relative">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                            กำลังสแกน...
                        </div>
                    </>
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
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                    <ImageIcon className="w-5 h-5 text-green-600" />
                    ถ่ายภาพสแกน (รองรับ iOS 100%)
                </button>
            </div>

            {/* Add scan line animation */}
            <style>{`
                @keyframes scan-line {
                    0% {
                        top: 10%;
                    }
                    50% {
                        top: 90%;
                    }
                    100% {
                        top: 10%;
                    }
                }
                .animate-scan-line {
                    animation: scan-line 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default ScannerNew;
