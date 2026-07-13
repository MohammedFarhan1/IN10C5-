'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, Loader2, QrCode, RadioTower, ScanBarcode, ShieldAlert, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type ScanResult = {
  success: boolean;
  status?: string;
  authenticityState?: string;
  riskScore?: number;
  reasons?: string[];
  message?: string;
  product?: {
    product_id?: string | null;
    name?: string | null;
    brand?: string | null;
    category?: string | null;
    batch_number?: string | null;
    manufacturing_details?: string | null;
    country_of_origin?: string | null;
    thumbnail?: string | null;
  } | null;
  verification?: {
    verificationId?: string;
    activationStatus?: string;
    lastScanAt?: string;
  };
};

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = {
  detect(video: HTMLVideoElement): Promise<DetectedBarcode[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

export default function VerificationScannerClient({
  initialCode = '',
  backHref = '/seller/dashboard/verification',
}: {
  initialCode?: string;
  backHref?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manualCode, setManualCode] = useState(initialCode);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const verifyCode = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error('Enter or scan a verification ID.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/verification/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId: trimmed }),
      });
      const data = await response.json();
      setResult(data);
      if (data.success) toast.success('Verification scan stored.');
      else toast.error(data.message || 'Verification failed.');
    } catch {
      toast.error('Verification API request failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraEnabled(true);
      toast.success('Camera access enabled.');
    } catch {
      toast.error('Camera access was blocked or unavailable.');
    }
  };

  const scanFromCamera = async () => {
    if (!videoRef.current) return;
    if (!window.BarcodeDetector) {
      toast.error('Native barcode scanning is not supported in this browser. Use manual entry.');
      return;
    }

    setScanning(true);
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      const codes = await detector.detect(videoRef.current);
      const code = codes[0]?.rawValue;
      if (!code) {
        toast.error('No QR or barcode detected in the current frame.');
        return;
      }
      setManualCode(code);
      await verifyCode(code);
    } catch {
      toast.error('Unable to scan the camera frame.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={backHref} className="text-gray-400 hover:text-gray-900 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 rounded-full px-3 py-1 mb-3">
            <RadioTower className="w-3.5 h-3.5" /> NFC / QR / Barcode Scanner
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">NFC Verification</h1>
          <p className="text-gray-500 text-sm mt-1">Enable camera access, scan a code, and validate product authenticity.</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_420px] gap-6">
        <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="aspect-video bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className={`w-full h-full object-cover ${cameraEnabled ? 'block' : 'hidden'}`} muted playsInline />
            {!cameraEnabled && (
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Camera preview will appear here.</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={enableCamera}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm transition shadow-sm"
            >
              <Camera className="w-4 h-4" /> Enable Camera
            </button>
            <button
              type="button"
              onClick={scanFromCamera}
              disabled={!cameraEnabled || scanning}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm transition shadow-sm"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanBarcode className="w-4 h-4" />}
              Scan QR / Barcode
            </button>
          </div>

          <div className="pt-5 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Manual NFC / QR / Barcode ID</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder="WB-001"
                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 font-mono transition"
              />
              <button
                type="button"
                onClick={() => verifyCode(manualCode)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold text-sm transition shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Verify
              </button>
            </div>
          </div>
        </section>

        <ResultPanel result={result} />
      </div>
    </div>
  );
}

function ResultPanel({ result }: { result: ScanResult | null }) {
  if (!result) {
    return (
      <aside className="bg-white border border-gray-200 rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[360px] shadow-sm">
        <ShieldAlert className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-700 font-semibold">No verification scan yet.</p>
        <p className="text-gray-400 text-sm mt-2">Scan or enter a verification ID to fetch matching product intelligence.</p>
      </aside>
    );
  }

  const isSuccess = result.success && result.riskScore !== undefined && result.riskScore < 70;

  return (
    <aside className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
      <div className="flex items-start gap-3">
        {isSuccess ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-red-500" />}
        <div>
          <h2 className="text-xl font-black text-gray-900">{result.authenticityState || result.status || 'Verification Result'}</h2>
          <p className="text-gray-500 text-sm mt-1">{result.message || `Risk score: ${result.riskScore ?? 0}%`}</p>
        </div>
      </div>

      {result.product && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-xl bg-white border border-gray-200 overflow-hidden flex-shrink-0">
              {result.product.thumbnail ? (
                <img src={result.product.thumbnail} alt={result.product.name || 'Product'} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div>
              <p className="text-gray-900 font-bold">{result.product.name}</p>
              <p className="text-gray-500 text-xs mt-1">{result.product.brand} · {result.product.category}</p>
              <p className="text-red-600 text-xs font-mono mt-2">{result.product.product_id || result.verification?.verificationId}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Fact label="Verification ID" value={result.verification?.verificationId} />
        <Fact label="Status" value={result.status} />
        <Fact label="Activation" value={result.verification?.activationStatus} />
        <Fact label="Last Scan" value={result.verification?.lastScanAt ? new Date(result.verification.lastScanAt).toLocaleString() : 'Now'} />
      </div>

      {result.reasons && result.reasons.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-amber-700 font-bold text-sm mb-2">Fraud Signals</p>
          <ul className="space-y-1 text-sm text-amber-700">
            {result.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </div>
      )}
    </aside>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-gray-400 text-xs uppercase tracking-wider">{label}</span>
      <p className="text-gray-700 mt-1 break-all">{value || 'Not available'}</p>
    </div>
  );
}
