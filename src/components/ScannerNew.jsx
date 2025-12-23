import React, { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, RefreshCw, AlertCircle, Smartphone } from 'lucide-react';

const ScannerNew = ({ onScanSuccess, autoStart = false }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const [deviceType, setDeviceType] = useState('unknown');
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const onScanSuccessRef = useRef(onScanSuccess);
    const html5ScannerRef = useRef(null);

    // Update ref when callback changes
    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
    }, [onScanSuccess]);

    // Detect device and check if library is ready
    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
        const type = (isIOS || isSafari) ? 'ios' : 'android';
        setDeviceType(type);

        // Check if library is already pre-loaded (from index.html)
        const checkLibrary = () => {
            const isReady = type === 'ios' ? !!window.Quagga : !!window.Html5Qrcode;
            if (isReady) {
                console.log(`Scanner Library (${type}) is ready and pre-loaded!`);
                if (autoStart) {
                    setTimeout(() => handleStartScan(), 300);
                }
            } else {
                console.warn(`Scanner Library (${type}) not found yet, waiting...`);
                setTimeout(checkLibrary, 500); // Retry every 0.5s if not ready
            }
        };

        checkLibrary();
    }, []);

    const handleStartScan = async () => {
        setIsScanning(true);
        setError('');

        if (deviceType === 'ios') {
            startQuagga();
        } else {
            startHtml5QrCode();
        }
    };

    const startQuagga = () => {
        if (!window.Quagga) {
            setError('iOS Scanner Library ไม่พร้อมใช้งาน กรุณารีเฟรชหน้าเว็บ');
            setIsScanning(false);
            return;
        }

        window.Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: videoRef.current,
                constraints: {
                    facingMode: "environment"
                }
            },
            decoder: {
                readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader"]
            }
        }, (err) => {
            if (err) {
                console.error(err);
                setError('ไม่สามารถเปิดกล้องได้');
                setIsScanning(false);
                return;
            }
            window.Quagga.start();
        });

        window.Quagga.onDetected((data) => {
            if (data && data.codeResult && data.codeResult.code) {
                stopScanner();
                onScanSuccessRef.current(data.codeResult.code);
            }
        });
    };

    const startHtml5QrCode = async () => {
        if (!window.Html5Qrcode) {
            setError('Android Scanner Library ไม่พร้อมใช้งาน กรุณารีเฟรชหน้าเว็บ');
            setIsScanning(false);
            return;
        }

        try {
            const scanner = new window.Html5Qrcode("qr-reader");
            html5ScannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 15, // Increase FPS for smoother scanning
                    qrbox: { width: 300, height: 200 } // Larger and wider box to match barcodes
                },
                (decodedText) => {
                    stopScanner();
                    onScanSuccessRef.current(decodedText);
                },
                (errorMessage) => {
                    // Ignore errors during live scan
                }
            );
        } catch (err) {
            console.error(err);
            setError('ไม่สามารถเปิดกล้องได้: ' + err);
            setIsScanning(false);
        }
    };

    const stopScanner = () => {
        setIsScanning(false);
        if (deviceType === 'ios' && window.Quagga) {
            window.Quagga.stop();
        } else if (deviceType === 'android' && html5ScannerRef.current) {
            html5ScannerRef.current.stop().catch(e => console.error(e));
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

    return (
        <div className="w-full max-w-md mx-auto relative">
            {/* Device Type Indicator */}
            <div className={`absolute top-2 right-2 z-30 ${deviceType === 'ios' ? 'bg-purple-600/90' : 'bg-green-600/90'} text-white text-[10px] px-2 py-1 rounded-full pointer-events-none shadow-sm flex items-center gap-1`}>
                <Smartphone className="w-3 h-3" />
                {deviceType === 'ios' ? 'iOS Ready' : 'Android Ready'}
            </div>

            {/* Scan Area */}
            <div className="relative aspect-square bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-slate-800 mb-4">
                {deviceType === 'ios' ? (
                    <div ref={videoRef} className="w-full h-full" />
                ) : (
                    <div id="qr-reader" className="w-full h-full" />
                )}

                {/* Animated Scanning Line */}
                {isScanning && (
                    <div className="absolute inset-0 pointer-events-none z-20">
                        <div className="w-full h-0.5 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)] absolute top-0 animate-scan-line"></div>
                    </div>
                )}

                {!isScanning && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white z-10">
                        <Camera className={`w-16 h-16 mb-4 opacity-80 ${deviceType === 'ios' ? 'text-purple-500' : 'text-green-500'}`} />
                        <button
                            onClick={handleStartScan}
                            className={`${deviceType === 'ios' ? 'bg-purple-600' : 'bg-green-600'} text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2`}
                        >
                            <Camera className="w-5 h-5" />
                            เปิดกล้องสแกน
                        </button>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-white z-20 p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="text-sm">{error}</p>
                        <button onClick={() => window.location.reload()} className="mt-4 bg-white text-slate-900 px-6 py-2 rounded-full font-bold flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> รีเฟรชหน้าเว็บ
                        </button>
                    </div>
                )}

                {isScanning && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse z-30 flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                        สแกนเนอร์กำลังทำงาน
                    </div>
                )}
            </div>

            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
                <ImageIcon className="w-5 h-5 text-green-600" />
                ถ่ายภาพสแกน (ใช้เมื่อกล้องไม่ทำงาน)
            </button>

            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
            />

            <div id="qr-reader-file" style={{ display: 'none' }}></div>

            <style>{`
                @keyframes scan-line {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan-line {
                    animation: scan-line 3s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ScannerNew;
