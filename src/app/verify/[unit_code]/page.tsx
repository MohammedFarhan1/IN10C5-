'use client';

import { useState, useEffect, use } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, XCircle, CheckCircle2,
  MapPin, Hash, User, Building2, Package, RefreshCw,
  FileText, ExternalLink, Flag,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerificationPage({ params }: { params: Promise<{ unit_code: string }> }) {
  const resolvedParams = use(params);
  const { unit_code } = resolvedParams;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reportReason, setReportReason] = useState('Duplicate physical serial instance');
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    const runVerification = async () => {
      try {
        const res = await fetch(`/api/verify/${unit_code}`);
        const data = await res.json();
        if (data.success) {
          setResult(data.data);
        } else {
          setErrorMsg(data.message || 'Verification failed.');
          setResult({ authenticityState: data.status || 'INVALID', unit: null });
        }
      } catch {
        setErrorMsg('Network error during verification.');
      } finally {
        setLoading(false);
      }
    };
    runVerification();
  }, [unit_code]);

  const handleReportFraud = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      const res = await fetch('/api/unit/report-fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitCode: unit_code, reason: reportReason, description: reportDesc }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Counterfeit report submitted successfully.');
        setShowModal(false);
        if (result) setResult({ ...result, authenticityState: data.newStatus || result.authenticityState, fraudScore: Math.min(100, result.fraudScore + 25) });
      } else {
        toast.error(data.message || 'Failed to submit report.');
      }
    } catch {
      toast.error('Network error submitting report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const stateObj = result?.authenticityState || 'INVALID';
  const unit = result?.unit;
  const product = unit?.product;
  const variant = unit?.variant;
  const seller = unit?.seller;

  type StatusCfg = { title: string; desc: string; badgeCls: string; icon: typeof ShieldCheck; iconBg: string; borderCls: string; };
  let statusConfig: StatusCfg = {
    title: 'Identity Unresolved',
    desc: 'This Verification ID is not recognized in our authenticity registry.',
    badgeCls: 'bg-gray-100 border-gray-200 text-gray-500',
    icon: XCircle,
    iconBg: 'bg-gray-50',
    borderCls: 'border-gray-200',
  };

  if (stateObj === 'VERIFIED') {
    statusConfig = { title: 'Authentic & Fully Verified', desc: 'This product has been cryptographically verified as genuine by an accredited manufacturer.', badgeCls: 'bg-green-50 border-green-200 text-green-700', icon: ShieldCheck, iconBg: 'bg-green-50', borderCls: 'border-green-300' };
  } else if (stateObj === 'SUSPICIOUS') {
    statusConfig = { title: 'Suspicious Scan History', desc: 'This unit exhibits irregular scan patterns. Exercise caution.', badgeCls: 'bg-amber-50 border-amber-200 text-amber-700', icon: AlertTriangle, iconBg: 'bg-amber-50', borderCls: 'border-amber-300' };
  } else if (stateObj === 'COUNTERFEIT') {
    statusConfig = { title: 'Counterfeit Flag Active', desc: 'WARNING: This unit has been flagged as counterfeit by multiple reports.', badgeCls: 'bg-red-50 border-red-200 text-red-700', icon: ShieldAlert, iconBg: 'bg-red-50', borderCls: 'border-red-300' };
  } else if (stateObj === 'REVOKED') {
    statusConfig = { title: 'Credentials Revoked', desc: 'The merchant or Trusta admin has invalidated this unit code.', badgeCls: 'bg-purple-50 border-purple-200 text-purple-700', icon: XCircle, iconBg: 'bg-purple-50', borderCls: 'border-purple-300' };
  }

  const StatusIcon = statusConfig.icon;
  const fraudScore = result?.fraudScore ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold uppercase tracking-widest mb-3">
            Product Authenticity Check
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Verification Result</h1>
          <p className="text-gray-500 text-sm mt-1 font-mono">{unit_code}</p>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center max-w-2xl mx-auto flex flex-col items-center">
            <RefreshCw className="w-10 h-10 text-red-500 animate-spin mb-4" />
            <p className="text-gray-700 font-medium">Checking authenticity registry…</p>
            <p className="text-gray-400 text-sm mt-1">This usually takes a moment</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className={`bg-white border-2 ${statusConfig.borderCls} rounded-2xl p-6 md:p-7`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start md:items-center gap-4">
                  <div className={`w-14 h-14 ${statusConfig.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 border ${statusConfig.borderCls}`}>
                    <StatusIcon className="w-7 h-7" style={{ color: stateObj === 'VERIFIED' ? '#16a34a' : stateObj === 'SUSPICIOUS' ? '#d97706' : stateObj === 'COUNTERFEIT' ? '#dc2626' : stateObj === 'REVOKED' ? '#9333ea' : '#6b7280' }} />
                  </div>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider mb-2 ${statusConfig.badgeCls}`}>
                      {stateObj}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900">{statusConfig.title}</h2>
                    <p className="text-gray-500 text-sm mt-1 max-w-lg">{statusConfig.desc}</p>
                  </div>
                </div>

                {/* Fraud Score */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center min-w-36 shrink-0">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">Fraud Risk Score</span>
                  <div className={`text-3xl font-bold font-mono ${fraudScore > 50 ? 'text-red-600' : fraudScore > 20 ? 'text-amber-600' : 'text-green-600'}`}>
                    {fraudScore}<span className="text-sm text-gray-400">/100</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full rounded-full ${fraudScore > 50 ? 'bg-red-500' : fraudScore > 20 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.max(5, fraudScore)}%` }} />
                  </div>
                </div>
              </div>

              {result?.reasons?.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Integrity Anomalies Detected:</p>
                  {result.reasons.map((r: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details Grid */}
            {unit && (
              <div className="grid md:grid-cols-3 gap-5">
                <div className="md:col-span-2 space-y-5">
                  {/* Product Info */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-gray-900 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4 text-red-600" /> Product Details
                    </h3>
                    {product ? (
                      <div className="flex gap-4 items-start">
                        {product.thumbnail && (
                          <img src={product.thumbnail} alt={product.name} className="w-20 h-20 object-contain rounded-xl bg-gray-50 p-1 border border-gray-200 flex-shrink-0" />
                        )}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                              {product.category || 'General'}
                            </span>
                            {variant?.seller_sku && (
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
                                SKU: {variant.seller_sku}
                              </span>
                            )}
                          </div>
                          <h4 className="text-gray-900 font-bold text-base leading-tight">{product.name}</h4>
                          <p className="text-gray-500 text-xs line-clamp-2">{product.description || 'No description available.'}</p>
                          {variant?.attributes && Object.keys(variant.attributes).length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {Object.entries(variant.attributes).map(([k, v]) => (
                                <span key={k} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                                  {k}: <strong className="text-gray-900">{String(v)}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                          <Link href={`/product/${product.id}`} className="text-red-600 hover:text-red-700 text-xs font-medium flex items-center gap-1 pt-1 transition-colors">
                            View Product <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Product information not available.</p>
                    )}
                  </div>

                  {/* Seller Info */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-gray-900 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-red-600" /> Authorized Brand Owner
                    </h3>
                    {seller ? (
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-900 font-bold">{seller.business_name || 'Verified Brand Owner'}</span>
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
                    ) : (
                      <p className="text-gray-400 text-sm">Brand owner information not available.</p>
                    )}
                  </div>

                  {/* Unit Keys */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-gray-900 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-600" /> Unit Information
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { label: 'Verification Code', value: unit.unique_unit_code, mono: true },
                        { label: 'Serial Number',     value: unit.serial_number,    mono: true },
                        { label: 'Manufacture Date',  value: unit.manufacture_date ? new Date(unit.manufacture_date).toLocaleDateString() : '—', mono: false },
                        { label: 'Warranty Status',   value: result?.warrantyState || 'Standard Coverage', mono: false },
                      ].map(({ label, value, mono }) => (
                        <div key={label} className="bg-gray-50 border border-gray-200 p-3 rounded-xl">
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">{label}</span>
                          <span className={`text-sm text-gray-900 font-semibold ${mono ? 'font-mono' : ''} break-all`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right panel */}
                <div className="space-y-5">
                  {/* Scan summary */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-gray-900 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-red-600" /> Scan History
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500 text-xs">Total Scans</span>
                        <span className="text-gray-900 font-bold font-mono bg-gray-100 px-2 py-0.5 rounded-md">
                          {result?.scanSummary?.totalScans ?? unit.scan_count ?? 1}
                        </span>
                      </div>
                      <div className="py-2 border-b border-gray-100">
                        <span className="text-gray-400 text-xs block mb-1">Last Location</span>
                        <span className="text-gray-700 text-xs font-medium flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          {result?.scanSummary?.lastScanLocation || unit.last_scan_location || 'Not recorded'}
                        </span>
                      </div>
                      <div className="py-2">
                        <span className="text-gray-400 text-xs block mb-1">Last Scanned</span>
                        <span className="text-gray-700 text-xs font-mono">
                          {new Date(result?.scanSummary?.lastScanAt || unit.last_scan_at || Date.now()).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ownership */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-gray-900 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-red-600" /> Ownership
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${unit.ownership_status === 'REGISTERED' ? 'bg-green-500' : 'bg-amber-400'}`} />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {unit.ownership_status || 'UNCLAIMED'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      {unit.ownership_status === 'REGISTERED'
                        ? 'This unit is bound to a verified customer record.'
                        : 'Ownership registers automatically upon purchase confirmation.'}
                    </p>
                  </div>

                  {/* Report Fraud */}
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
          </div>
        )}
      </main>

      {/* Fraud Report Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-600" /> Report Counterfeit
            </h3>
            <p className="text-gray-500 text-xs">
              Submitting a report flags this unit in our registry and alerts our trust team for investigation.
            </p>
            <form onSubmit={handleReportFraud} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Reason</label>
                <select value={reportReason} onChange={e => setReportReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-red-500/30 focus:border-red-400 focus:outline-none appearance-none">
                  <option value="Duplicate physical serial instance">Duplicate serial instance</option>
                  <option value="Tampered security packaging labels">Tampered packaging</option>
                  <option value="Product parameters do not match passport">Product doesn't match ID</option>
                  <option value="Suspicious origin or shipment routing">Suspicious origin/routing</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Evidence Notes (optional)</label>
                <textarea rows={3} value={reportDesc} onChange={e => setReportDesc(e.target.value)}
                  placeholder="Describe where acquired and observable defects…"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500/30 focus:border-red-400 focus:outline-none resize-none leading-relaxed" />
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
