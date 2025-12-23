import React, { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';

const ScannerNew = ({ onScanSuccess, autoStart = false }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const codeReaderRef = useRef(null);

    // Load ZXing library
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@zxing/library@latest';
        script.async = true;
        script.onload = () => {
            console.log('ZXing library loaded');
            if (autoStart) {
                setTimeout(() => {
                    handleStartScan();
                }, 500);
            }
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
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsScanning(false);
    };

    const handleStartScan = async () => {
        setError('');
        setIsScanning(true);

        try {
            // Check if ZXing is loaded
            if (!window.ZXing) {
                throw new Error('Scanner library not loaded yet. Please try again.');
            }

            // Request camera access with specific constraints for iOS
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', true); // Important for iOS
                await videoRef.current.play();

                // Initialize ZXing BrowserMultiFormatReader
                const codeReader = new window.ZXing.BrowserMultiFormatReader();
                codeReaderRef.current = codeReader;

                // Start continuous scanning
                codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
                    if (result) {
                        console.log('Scanned:', result.text);
                        stopScanner();
                        onScanSuccess(result.text);
                    }
                    // Ignore errors during scanning (they're normal)
                });
            }
        } catch (err) {
            console.error('Camera error:', err);
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
        }
    };

    const handleFileUpload = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const imageFile = e.target.files[0];

            try {
                if (!window.ZXing) {
                    throw new Error('Scanner library not loaded');
                }

                const codeReader = new window.ZXing.BrowserMultiFormatReader();
                const result = await codeReader.decodeFromImageUrl(URL.createObjectURL(imageFile));

                if (result) {
                    onScanSuccess(result.text);
                } else {
                    setError('ไม่พบบาร์โค้ดในภาพ กรุณาลองใหม่');
                }
            } catch (err) {
                console.error('Image scan error:', err);
                setError('ไม่พบบาร์โค้ดในภาพ กรุณาลองใหม่');
            }
        }
    };

    return (
        <div className="w-full max-w-md mx-auto relative">
            {/* Version Indicator */}
            <div className="absolute top-2 right-2 z-30 bg-green-600/90 text-white text-[10px] px-2 rounded-full pointer-events-none shadow-sm">
                v4.0 (iOS Compatible)
            </div>

            {/* Scan Area */}
            <div className="relative aspect-[2/1] bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-slate-800 mb-4">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    style={{ display: isScanning ? 'block' : 'none' }}
                />

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
                        <p className="mt-4 text-xs text-slate-400">รองรับ iOS Safari</p>
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
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                        กำลังสแกน...
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
                    ถ่ายภาพสแกน (รองรับ iOS 100%)
                </button>
            </div>
        </div>
    );
};

export default ScannerNew;
