'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import {
  BarChart3, TrendingUp, ShieldAlert, CheckCircle2,
  MapPin, RefreshCw
} from 'lucide-react';

export default function VerificationAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/analytics/verification');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setErrorMsg(json.message || 'Failed to read aggregation distributions.');
        }
      } catch {
        setErrorMsg('Network error requesting metric payloads.');
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, []);

  const totalScans = data?.totalScans || 120;
  const verified = data?.successfulVerifications || 95;
  const counterfeit = data?.counterfeitDetections || 25;
  const fraudReports = data?.totalFraudReports || 12;

  const totalProcessed = verified + counterfeit || 1;
  const verifiedPercent = Math.round((verified / totalProcessed) * 100);
  const counterfeitPercent = 100 - verifiedPercent;

  const monthlyData = data?.monthlyData || [
    { month: 'Jan', scans: 10, verified: 8, suspicious: 2 },
    { month: 'Feb', scans: 25, verified: 20, suspicious: 5 },
    { month: 'Mar', scans: 45, verified: 39, suspicious: 6 },
    { month: 'Apr', scans: 80, verified: 65, suspicious: 15 },
    { month: 'May', scans: 150, verified: 120, suspicious: 30 },
  ];

  const maxMonthScans = Math.max(...monthlyData.map((m: any) => m.scans), 1);

  const heatRegionMap = data?.heatmap || {
    'US': { count: 85, suspiciousCount: 5, color: 'rgb(59, 130, 246)' },
    'IN': { count: 42, suspiciousCount: 12, color: 'rgb(234, 179, 8)' },
    'GB': { count: 18, suspiciousCount: 2, color: 'rgb(59, 130, 246)' },
    'CN': { count: 35, suspiciousCount: 20, color: 'rgb(239, 68, 68)' },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showCategoryMenu={false} />

      <div className="container mx-auto px-4 py-10 flex-1 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar />

          <main className="flex-1 space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold uppercase tracking-wider mb-2">
                  <BarChart3 className="w-3.5 h-3.5" /> Verification Analytics
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Global Verification Analytics
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Aggregated telemetry stats, audit queries, authentication volumes, and geographical threat map.
                </p>
              </div>

              {loading && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Synchronizing...
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
                {errorMsg}
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Audits</span>
                <span className="text-3xl font-black text-gray-900 mt-1 block font-mono">{totalScans}</span>
                <p className="text-xs text-blue-600 mt-2">Total QR verification actions</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Authentic Hits</span>
                <span className="text-3xl font-black text-green-600 mt-1 block font-mono">{verified}</span>
                <p className="text-xs text-green-600 mt-2">{verifiedPercent}% Success rate</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Threat Indicators</span>
                <span className="text-3xl font-black text-red-600 mt-1 block font-mono">{counterfeit}</span>
                <p className="text-xs text-red-500 mt-2">{counterfeitPercent}% Flag ratio</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Fraud Reports</span>
                <span className="text-3xl font-black text-amber-500 mt-1 block font-mono">{fraudReports}</span>
                <p className="text-xs text-amber-500 mt-2">Explicit manual reports</p>
              </div>
            </div>

            {/* Timeline Histogram */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-600" /> Monthly Audit Volumes
                </h3>
                <p className="text-gray-400 text-xs mt-1">Monthly scan events vs detected threat flags</p>
              </div>

              <div className="h-64 flex items-end gap-4 pt-10 border-b border-gray-100 px-2">
                {monthlyData.map((item: any, index: number) => {
                  const scanHeight = Math.max(8, Math.round((item.scans / maxMonthScans) * 100));
                  const verifiedHeight = Math.max(4, Math.round((item.verified / item.scans) * scanHeight));
                  const suspiciousHeight = Math.max(0, scanHeight - verifiedHeight);

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="opacity-0 group-hover:opacity-100 transition duration-150 bg-gray-900 border border-gray-700 px-2 py-1 rounded-lg text-[10px] text-center font-mono absolute -translate-y-12 z-20 pointer-events-none shadow-xl">
                        <strong className="text-white block">{item.scans} Scans</strong>
                        <span className="text-green-400">{item.verified} Valid</span> • <span className="text-red-400">{item.suspicious} Suspicious</span>
                      </div>

                      <div className="w-full max-w-12 bg-gray-100 rounded-t-xl flex flex-col justify-end overflow-hidden relative border border-gray-200" style={{ height: `${scanHeight}%` }}>
                        <div className="w-full bg-red-500 transition-all group-hover:brightness-110" style={{ height: `${suspiciousHeight}%` }} />
                        <div className="w-full bg-gradient-to-t from-green-600 to-green-400 transition-all group-hover:brightness-110" style={{ height: `${verifiedHeight}%` }} />
                      </div>

                      <span className="text-xs font-mono text-gray-400 group-hover:text-gray-900 transition font-bold block mt-1">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 text-xs">
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="w-3 h-3 rounded bg-gradient-to-t from-green-600 to-green-400 block" />
                  <span>Verified Identity Claims</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="w-3 h-3 rounded bg-red-500 block" />
                  <span>Flagged Anomalies</span>
                </div>
              </div>
            </div>

            {/* Proportions & Regional Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" /> Verification Proportions
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">Authentic units vs duplicate serial attempts</p>
                </div>

                <div className="space-y-4 my-auto">
                  <div className="h-6 w-full rounded-2xl bg-gray-100 overflow-hidden flex p-0.5 border border-gray-200">
                    <div className="h-full bg-green-500 rounded-l-xl transition-all" style={{ width: `${verifiedPercent}%` }} title={`Verified: ${verifiedPercent}%`} />
                    <div className="h-full bg-red-500 rounded-r-xl transition-all" style={{ width: `${counterfeitPercent}%` }} title={`Counterfeit: ${counterfeitPercent}%`} />
                  </div>

                  <div className="flex justify-between items-center text-xs font-mono">
                    <div>
                      <span className="text-green-600 font-bold block">{verifiedPercent}% Authentic</span>
                      <span className="text-gray-400">Cryptographically sound</span>
                    </div>
                    <div className="text-right">
                      <span className="text-red-600 font-bold block">{counterfeitPercent}% Flagged</span>
                      <span className="text-gray-400">High-risk audit</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700 leading-relaxed">
                  Telemetry metrics evaluate device uniqueness, geographic distance, and vendor accreditation instantly.
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" /> Regional Risk Grid
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">Telemetry queries sorted by originating region</p>
                </div>

                <div className="space-y-3 pt-2">
                  {Object.entries(heatRegionMap).map(([countryCode, stats]: any) => {
                    const ratio = stats.count > 0 ? Math.round((stats.suspiciousCount / stats.count) * 100) : 0;

                    return (
                      <div key={countryCode} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 font-mono font-black text-gray-700 flex items-center justify-center text-xs">
                            {countryCode}
                          </span>
                          <div>
                            <strong className="text-gray-900 block">{stats.count} Audit Requests</strong>
                            <span className="text-gray-400">{stats.suspiciousCount} suspicious flags</span>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div className="text-right font-mono">
                            <span className={`font-bold block ${ratio > 30 ? 'text-red-600' : ratio > 10 ? 'text-amber-500' : 'text-green-600'}`}>
                              {ratio}% Risk
                            </span>
                            <span className="text-gray-400 text-[9px] uppercase">Threat Rate</span>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stats.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Most Verified Products */}
            {data?.mostVerifiedProducts?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Most Scanned Products</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {data.mostVerifiedProducts.map((product: any) => (
                    <div key={product.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                      {product.thumbnail ? (
                        <img src={product.thumbnail} alt={product.name} className="w-10 h-10 object-contain rounded-lg bg-white border border-gray-200 p-0.5 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 font-mono text-xs">P</div>
                      )}
                      <div className="truncate flex-1">
                        <h4 className="text-gray-900 font-bold text-xs truncate">{product.name}</h4>
                        <span className="text-xs text-red-600 font-mono block mt-0.5">{product.scanCount} Scans</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
