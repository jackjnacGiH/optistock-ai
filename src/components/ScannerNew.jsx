import React, { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, RefreshCw, AlertCircle, Smartphone } from 'lucide-react';

const ScannerNew = ({ onScanSuccess, autoStart = false }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const [libraryLoaded, setLibraryLoaded] = useState(false);
    const [deviceType, setDeviceType] = useState('unknown');
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const onScanSuccessRef = useRef(onScanSuccess);
    const html5ScannerRef = useRef(null);

    // Update ref when callback changes
    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
    }, [onScanSuccess]);

    // Detect device type
    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);

        if (isIOS || isSafari) {
            setDeviceType('ios');
            loadQuagga();
        } else {
            setDeviceType('android');
            // For Android, skip library loading and use file input directly
            setLibraryLoaded(true);
            setError('');
            console.log('Android detected - using file input for scanning');
        }
    }, []);

    // Load Quagga for iOS
    const loadQuagga = (retryCount = 0) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.min.js';
        script.async = true;
        script.onload = () => {
            console.log('Quagga loaded (iOS)');
            setLibraryLoaded(true);
            setError(''); // Clear error
            if (autoStart) {
                setTimeout(() => handleStartScan(), 500);
            }
        };
        script.onerror = () => {
            console.error('Failed to load Quagga, retry:', retryCount);
            if (retryCount < 3) {
                setError(`กำลังโหลด Scanner... (ครั้งที่ ${retryCount + 1})`);
                setTimeout(() => loadQuagga(retryCount + 1), 2000);
            } else {
                setError('ไม่สามารถโหลด Scanner ได้ กรุณาลองใหม่');
            }
        };
        document.body.appendChild(script);
    };

    // Load html5-qrcode for Android
    const loadHtml5QrCode = (retryCount = 0) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
        script.async = true;
        script.onload = () => {
            // Validate that Html5Qrcode is actually available
            if (typeof window.Html5Qrcode !== 'undefined') {
                console.log('html5-qrcode loaded (Android)');
                setLibraryLoaded(true);
                setError(''); // Clear error
                if (autoStart) {
                    setTimeout(() => handleStartScan(), 500);
                }
            } else {
                console.error('Html5Qrcode not found after script load');
                if (retryCount < 3) {
                    setError(`กำลังโหลด Scanner... (ครั้งที่ ${retryCount + 1})`);
                    setTimeout(() => loadHtml5QrCode(retryCount + 1), 2000);
                } else {
                    setError('ไม่สามารถโหลด Scanner ได้ กรุณาลองใหม่');
                }
            }
        };
        script.onerror = () => {
            console.error('Failed to load html5-qrcode, retry:', retryCount);
            if (retryCount < 3) {
                setError(`กำลังโหลด Scanner... (ครั้งที่ ${retryCount + 1})`);
                setTimeout(() => loadHtml5QrCode(retryCount + 1), 2000);
            } else {
                setError('ไม่สามารถโหลด Scanner ได้ กรุณาลองใหม่');
            }
        };
        document.body.appendChild(script);

        return () => {
            stopScanner();
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    };

    const stopScanner = () => {
        if (deviceType === 'ios' && window.Quagga) {
            try {
                window.Quagga.stop();
                console.log('Quagga stopped');
            } catch (e) {
                console.log('Quagga stop error:', e);
            }
        } else if (deviceType === 'android' && html5ScannerRef.current) {
            try {
                html5ScannerRef.current.stop();
                console.log('html5-qrcode stopped');
            } catch (e) {
                console.log('html5-qrcode stop error:', e);
            }
        }
        setIsScanning(false);
    };

    const handleStartScan = async () => {
        setError('');

        if (!libraryLoaded) {
            setError('Scanner ยังโหลดไม่เสร็จ กรุณารอสักครู่');
            return;
        }

        setIsScanning(true);

        if (deviceType === 'ios') {
            startQuaggaScan();
        } else {
            startHtml5Scan();
        }
    };

    // iOS Scanning with Quagga
    const startQuaggaScan = async () => {
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
                    area: {
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
                frequency: 10
            }, (err) => {
                if (err) {
                    handleScanError(err);
                    return;
                }

                window.Quagga.start();
                window.Quagga.onDetected((result) => {
                    if (result && result.codeResult && result.codeResult.code) {
                        const code = result.codeResult.code;
                        console.log('Quagga detected:', code);
                        stopScanner();
                        if (onScanSuccessRef.current) {
                            onScanSuccessRef.current(code);
                        }
                    }
                });
            });
        } catch (err) {
            handleScanError(err);
        }
    };

    // Android Scanning with html5-qrcode
    const startHtml5Scan = async () => {
        try {
            const scanner = new window.Html5Qrcode("qr-reader");
            html5ScannerRef.current = scanner;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await scanner.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    console.log('html5-qrcode detected:', decodedText);
                    stopScanner();
                    if (onScanSuccessRef.current) {
                        onScanSuccessRef.current(decodedText);
                    }
                },
                (errorMessage) => {
                    // Ignore scan errors (they're normal)
                }
            );
        } catch (err) {
            handleScanError(err);
        }
    };

    const handleScanError = (err) => {
        console.error('Scanner error:', err);
        let errorMessage = 'ไม่สามารถเปิดกล้องได้';

        if (err.name === 'NotAllowedError') {
            errorMessage = 'กรุณาอนุญาตให้เข้าถึงกล้อง\nไปที่ Settings > Camera';
        } else if (err.name === 'NotFoundError') {
            errorMessage = 'ไม่พบกล้อง';
        } else if (err.message) {
            errorMessage = err.message;
        }

        setError(errorMessage);
        setIsScanning(false);
    };

    const handleFileUpload = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const imageFile = e.target.files[0];

        if (deviceType === 'ios' && window.Quagga) {
            // Quagga image scan
            try {
                const imageUrl = URL.createObjectURL(imageFile);
                await window.Quagga.decodeSingle({
                    src: imageUrl,
                    numOfWorkers: 0,
                    inputStream: { size: 800 },
                    decoder: {
                        readers: [
                            "code_128_reader",
                            "ean_reader",
                            "ean_8_reader",
                            "code_39_reader",
                            "upc_reader"
                        ]
                    },
                    locate: true
                }, (result) => {
                    URL.revokeObjectURL(imageUrl);
                    if (result && result.codeResult && result.codeResult.code) {
                        onScanSuccessRef.current(result.codeResult.code);
                    } else {
                        setError('ไม่พบบาร์โค้ดในภาพ');
                    }
                });
            } catch (err) {
                setError('ไม่พบบาร์โค้ดในภาพ');
            }
        } else if (deviceType === 'android' && window.Html5Qrcode) {
            // html5-qrcode image scan
            try {
                const scanner = new window.Html5Qrcode("qr-reader-file");
                const result = await scanner.scanFile(imageFile, true);
                if (result) {
                    onScanSuccessRef.current(result);
                } else {
                    setError('ไม่พบบาร์โค้ดในภาพ');
                }
            } catch (err) {
                setError('ไม่พบบาร์โค้ดในภาพ');
            }
        }
    };

    const getDeviceLabel = () => {
        if (deviceType === 'ios') return 'iOS (Quagga)';
        if (deviceType === 'android') return 'Android (html5-qrcode)';
        return 'Loading...';
    };

    const getDeviceColor = () => {
        if (deviceType === 'ios') return 'bg-purple-600/90';
        if (deviceType === 'android') return 'bg-green-600/90';
        return 'bg-gray-600/90';
    };

    return (
        <div className="w-full max-w-md mx-auto relative">
            {/* Device Type Indicator */}
            <div className={`absolute top-2 right-2 z-30 ${getDeviceColor()} text-white text-[10px] px-2 py-1 rounded-full pointer-events-none shadow-sm flex items-center gap-1`}>
                <Smartphone className="w-3 h-3" />
                {getDeviceLabel()}
            </div>

            {/* Scan Area */}
            <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-slate-800 mb-4">
                {deviceType === 'ios' ? (
                    <div
                        ref={videoRef}
                        className="w-full h-full"
                        style={{ display: isScanning ? 'block' : 'none' }}
                    />
                ) : (
                    <div
                        id="qr-reader"
                        className="w-full h-full"
                        style={{ display: isScanning ? 'block' : 'none' }}
                    />
                )}

                {!isScanning && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white z-10 transition-all">
                        <Camera className={`w-16 h-16 mb-4 opacity-80 ${deviceType === 'ios' ? 'text-purple-500' : 'text-green-500'}`} />

                        {deviceType === 'android' ? (
                            // Android: Show file input button directly
                            <>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-green-900/50 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                    ถ่ายภาพเพื่อสแกน
                                </button>
                                <p className="mt-4 text-xs text-slate-400">กดเพื่อเปิดกล้องและถ่ายรูปบาร์โค้ด</p>
                            </>
                        ) : (
                            // iOS: Show camera button
                            <>
                                <button
                                    onClick={handleStartScan}
                                    disabled={!libraryLoaded}
                                    className="bg-purple-600 hover:bg-purple-500 shadow-purple-900/50 text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Camera className="w-5 h-5" />
                                    {libraryLoaded ? 'แตะเพื่อเปิดกล้อง' : 'กำลังโหลด...'}
                                </button>
                                <p className="mt-4 text-xs text-slate-400">Optimized for iOS</p>
                            </>
                        )}
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

                {/* Scanning indicator */}
                {isScanning && (
                    <>
                        {deviceType === 'ios' && (
                            <>
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan-line shadow-lg shadow-green-400/50"></div>
                                </div>
                                <div className="absolute inset-0 pointer-events-none p-8">
                                    <div className="w-full h-full border-2 border-green-400/50 relative">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse z-30">
                            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                            กำลังสแกน...
                        </div>
                    </>
                )}
            </div>

            {/* Fallback Option - Only for iOS */}
            {deviceType === 'ios' && (
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
                        ถ่ายภาพสแกน (รองรับทุกอุปกรณ์ 100%)
                    </button>
                </div>
            )}

            {/* Hidden file input for Android */}
            {deviceType === 'android' && (
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
            )}

            {/* Hidden div for html5-qrcode file scan */}
            <div id="qr-reader-file" style={{ display: 'none' }}></div>

            {/* Scan line animation */}
            <style>{`
                @keyframes scan-line {
                    0% { top: 10%; }
                    50% { top: 90%; }
                    100% { top: 10%; }
                }
                .animate-scan-line {
                    animation: scan-line 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default ScannerNew;
