'use client';

import { useState, useEffect, use } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, XCircle, CheckCircle2,
  RefreshCw, Package, Building2, Hash, MapPin, Flag, ExternalLink, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

type VerifyStatus = 'loading' | 'INVALID_FORMAT' | 'NOT_FOUND' | 'CLAIMED' | 'VERIFIED' | 'SUSPICIOUS' | 'COUNTERFEIT' | 'REVOKED' | 'ERROR';

const STATUS_CONFIG: Record<Exclude<VerifyStatus, 'loading'>, {
  icon: typeof ShieldCheck;
  title: string;
  desc: string;
  border: string;
  badge: string;
  iconColor: string;
}> = {
  VERIFIED: {
    icon: ShieldCheck,
    title: 'Authentic & Verified',
    desc: 'This product is genuine and registered in the Trusta authenticity registry.',
    border: 'border-green-300',
    badge: 'bg-green-50 border-green-200 text-green-700',
    iconColor: 'text-green-600',
  },
  NOT_FOUND: {
    icon: XCircle,
    title: 'ID Not in Registry',
    desc: 'This verification ID does not exist in our database. The product may be counterfeit or the ID was entered incorrectly.',
    border: 'border-red-300',
    badge: 'bg-red-50 border-red-200 text-red-700',
    iconColor: 'text-red-600',
  },
  INVALID_FORMAT: {
    icon: Info,
    title: 'Invalid ID Format',
    desc: 'This does not match the expected verification ID format. Trusta IDs look like TRU-MODEL-VARIANT-0001-K7QF.',
    border: 'border-gray-300',
    badge: 'bg-gray-100 border-gray-200 text-gray-600',
    iconColor: 'text-gray-500',
  },
  CLAIMED: {
    icon: AlertTriangle,
    title: 'Already Claimed by Another Owner',
    desc: 'This unit is registered to a different buyer. If you received this product, it may be counterfeit. A fraud report has been filed automatically.',
    border: 'border-amber-300',
    badge: 'bg-amber-50 border-amber-200 text-amber-700',
    iconColor: 'text-amber-600',
  },
  SUSPICIOUS: {
    icon: AlertTriangle,
    title: 'Suspicious Scan History',
    desc: 'This unit shows irregular activity. Proceed with caution.',
    border: 'border-amber-300',
    badge: 'bg-amber-50 border-amber-200 text-amber-700',
    iconColor: 'text-amber-600',
  },
  COUNTERFEIT: {
    icon: ShieldAlert,
    title: 'Counterfeit Flag Active',
    desc: 'WARNING: This unit has been flagged as counterfeit by multiple reports.',
    border: 'border-red-300',
    badge: 'bg-red-50 border-red-200 text-red-700',
    iconColor: 'text-red-600',
  },
  REVOKED: {
    icon: XCircle,
    title: 'Credentials Revoked',
    desc: 'The merchant or Trusta admin has invalidated this unit code.',
    border: 'border-purple-300',
    badge: 'bg-purple-50 border-purple-200 text-purple-700',
    iconColor: 'text-purple-600',
  },
  ERROR: {
    icon: XCircle,
    title: 'Verification Error',
    desc: 'An unexpected error occurred. Please try again.',
    border: 'border-gray-300',
    badge: 'bg-gray-100 border-gray-200 text-gray-600',
    iconColor: 'text-gray-500',
  },
};

export default function VerificationPage({ params }: { params: Promise<{ unit_code: string }> }) {
  const { unit_code } = use(params);

  const [status, setStatus]   = useState<VerifyStatus>('loading');
  const [data,   setData]     = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showModal,       setShowModal]       = useState(false);
  const [reportReason,    setReportReason]    = useState('Duplicate physical serial instance');
  const [reportDesc,      setReportDesc]      = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const res  = await fetch(`/api/verify/${encodeURIComponent(unit_code)}`);
        const json = await res.json();

        if (res.status === 429) {
          setStatus('ERROR');
          setMessage(json.message ?? 'Rate limited. Please wait and try again.');
          return;
        }

        if (!json.success) {
          // Map API status to our UI status
          const apiStatus: string = json.status ?? 'ERROR';
          setStatus((apiStatus as VerifyStatus) in STATUS_CONFIG ? apiStatus as VerifyStatus : 'ERROR');
          setMessage(json.message ?? null);
          return;
        }

        const d = json.data;
        const authState: string = d?.authenticityState ?? 'VERIFIED';
        setStatus((authState as VerifyStatus) in STATUS_CONFIG ? authState as VerifyStatus : 'VERIFIED');
        setData(d);
      } catch {
        setStatus('ERROR');
        setMessage('Network error. Please check your connection and try again.');
      }
    };
    run();
  }, [unit_code]);

  const handleReportFraud = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      const res  = await fetch('/api/unit/report-fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitCode: unit_code, reason: reportReason, description: reportDesc }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Fraud report submitted successfully.');
        setShowModal(false);
      } else {
        toast.error(json.message ?? 'Failed to submit report.');
      }
    } catch {
      toast.error('Network error submitting report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const cfg    = status !== 'loading' ? STATUS_CONFIG[status] : null;
  const Icon   = cfg?.icon ?? RefreshCw;
  const unit   = data?.unit;
  const product = data?.product ?? unit?.product;
  const variant = data?.variant ?? unit?.variant;
  const seller  = product?.seller ?? data?.seller;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
        {/* Page heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold uppercase tracking-widest mb-3">
            Product Authenticity Check
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Verification Result</h1>
          <p className="text-gray-500 text-sm mt-1 font-mono break-all">{unit_code}</p>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center max-w-xl mx-auto flex flex-col items-center">
            <RefreshCw className="w-10 h-10 text-red-500 animate-spin mb-4" />
            <p className="text-gray-700 font-medium">Checking authenticity registry…</p>
            <p className="text-gray-400 text-sm mt-1">This usually takes less than a second</p>
          </div>
        )}

        {/* Status card */}
        {status !== 'loading' && cfg && (
          <div className="space-y-6">
            <div className={`bg-white border-2 ${cfg.border} rounded-2xl p-6 md:p-8`}>
              <div className="flex items-start gap-5">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.border}`}>
                  <Icon className={`w-7 h-7 ${cfg.iconColor}`} />
                </div>
                <div className="flex-1">
                  <span className={`inline-block px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider mb-2 ${cfg.badge}`}>
                    {status.replace(/_/g, ' ')}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">{cfg.title}</h2>
                  <p className="text-gray-500 text-sm mt-1 max-w-xl">
                    {message ?? cfg.desc}
                  </p>

                  {/* Format hint */}
                  {status === 'INVALID_FORMAT' && (
                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Expected format:</p>
                      <code className="text-sm font-mono text-blue-600">TRU-MODEL-VARIANT-0001-K7QF</code>
                      <p className="text-xs text-gray-400 mt-1">Example: TRU-SNY-XM5-BLK-0001-K7QF</p>
                    </div>
                  )}

                  {/* Anomaly reasons (legacy) */}
                  {data?.reasons?.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      {data.reasons.map((r: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          {r}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product + Seller details (shown when verified) */}
            {(status === 'VERIFIED' || status === 'SUSPICIOUS') && (product || unit) && (
              <div className="grid md:grid-cols-3 gap-5">
                <div className="md:col-span-2 space-y-5">
                  {/* Product card */}
                  {product && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h3 className="text-gray-900 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4 text-red-600" /> Product Details
                      </h3>
                      <div className="flex gap-4 items-start">
                        {(product.thumbnail ?? product.images?.[0]) && (
                          <img src={product.thumbnail ?? product.images[0]} alt={product.name}
                            className="w-20 h-20 object-contain rounded-xl bg-gray-50 p-1 border border-gray-100 flex-shrink-0" />
                        )}
                        <div className="space-y-2 flex-1">
                          <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-semibold uppercase">
                            {product.category ?? 'General'}
                          </span>
                          <h4 className="text-gray-900 font-bold text-base leading-tight">{product.name}</h4>
                          <p className="text-gray-500 text-xs line-clamp-2">{product.description}</p>
                          {variant?.attributes && Object.keys(variant.attributes).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {Object.entries(variant.attributes).map(([k, v]) => (
                                <span key={k} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                  {k}: <strong className="text-gray-900">{String(v)}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                          <Link href={`/product/${product.id}`}
                            className="text-red-600 hover:text-red-700 text-xs font-medium flex items-center gap-1 pt-1 transition-colors">
                            View Product <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seller card */}
                  {seller && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h3 className="text-gray-900 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-red-600" /> Authorized Brand Owner
                      </h3>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-900 font-bold">{seller.business_name ?? 'Verified Brand Owner'}</span>
                            {seller.verification_status === 'approved' && (
                              <CheckCircle2 className="w-4 h-4 text-green-600 fill-green-100" />
                            )}
                          </div>
                          <p className="text-gray-400 text-xs font-mono">ID: {seller.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Trust Score</p>
                          <p className="text-lg font-bold text-green-600">{seller.trust_score ?? 100}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unit info */}
                  {unit && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h3 className="text-gray-900 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-red-600" /> Unit Information
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Verification ID', value: unit.verification_id ?? unit.unique_unit_code, mono: true },
                          { label: 'Unit Number',     value: unit.unit_number ?? unit.serial_number ?? '—', mono: true },
                          { label: 'Status',          value: unit.status ?? 'Unknown', mono: false },
                          { label: 'Warranty',        value: data?.warrantyState ?? 'Standard Coverage', mono: false },
                        ].map(({ label, value, mono }) => (
                          <div key={label} className="bg-gray-50 border border-gray-200 p-3 rounded-xl">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">{label}</span>
                            <span className={`text-sm text-gray-900 font-semibold ${mono ? 'font-mono' : ''} break-all`}>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right panel */}
                <div className="space-y-5">
                  {/* Scan summary */}
                  {data?.scanSummary && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h3 className="text-gray-900 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-red-600" /> Scan History
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-500 text-xs">Total Scans</span>
                          <span className="text-gray-900 font-bold font-mono bg-gray-100 px-2 py-0.5 rounded-md">
                            {data.scanSummary.totalScans}
                          </span>
                        </div>
                        {data.scanSummary.lastScanLocation && (
                          <div className="py-2 border-b border-gray-100">
                            <span className="text-gray-400 text-xs block mb-1">Last Location</span>
                            <span className="text-gray-700 text-xs font-medium flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                              {data.scanSummary.lastScanLocation}
                            </span>
                          </div>
                        )}
                        {data.scanSummary.lastScanAt && (
                          <div className="py-2">
                            <span className="text-gray-400 text-xs block mb-1">Last Scanned</span>
                            <span className="text-gray-700 text-xs font-mono">
                              {new Date(data.scanSummary.lastScanAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ownership */}
                  {unit && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h3 className="text-gray-900 font-bold text-sm uppercase tracking-widest mb-3">
                        Ownership
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2 h-2 rounded-full ${unit.is_owned ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {unit.owned_by_me ? 'Owned by You' : unit.is_owned ? 'Registered' : 'Available'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        {unit.owned_by_me
                          ? 'This unit is registered to your account.'
                          : unit.is_owned
                          ? 'This unit is bound to a verified buyer.'
                          : 'This unit has not yet been registered to a buyer.'}
                      </p>
                    </div>
                  )}

                  {/* Report fraud */}
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
                    <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Suspect Counterfeit?</h4>
                    <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                      If this unit looks fake or duplicated, report it immediately.
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5" /> Report Fraud
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* NOT_FOUND / CLAIMED – show report button prominently */}
            {(status === 'NOT_FOUND' || status === 'CLAIMED') && (
              <div className="max-w-xl mx-auto">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                  <h4 className="text-sm font-bold text-red-600 mb-2">Report This ID</h4>
                  <p className="text-gray-500 text-xs mb-4">
                    Help us protect buyers by reporting this suspected counterfeit product.
                  </p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 py-2 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                  >
                    <Flag className="w-4 h-4" /> Report Fraud
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Fraud report modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-600" /> Report Counterfeit
            </h3>
            <p className="text-gray-500 text-xs">
              Submitting a report flags this unit and alerts our trust team for investigation.
            </p>
            <form onSubmit={handleReportFraud} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Reason</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-red-500/30 focus:border-red-400 focus:outline-none appearance-none">
                  <option value="Duplicate physical serial instance">Duplicate serial instance</option>
                  <option value="Tampered security packaging labels">Tampered packaging</option>
                  <option value="Product parameters do not match passport">Product doesn't match ID</option>
                  <option value="Suspicious origin or shipment routing">Suspicious origin / routing</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Evidence Notes (optional)</label>
                <textarea rows={3} value={reportDesc} onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Describe where acquired and observable defects…"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500/30 focus:border-red-400 focus:outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} disabled={submittingReport}
                  className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={submittingReport}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
                  {submittingReport ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
