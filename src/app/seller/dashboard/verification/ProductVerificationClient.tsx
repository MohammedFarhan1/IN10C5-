'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Heart,
  LineChart,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Smartphone,
  XCircle,
} from 'lucide-react';

type ProductInfo = {
  id: string;
  product_id?: string | null;
  name?: string | null;
  brand?: string | null;
  category?: string | null;
  batch_number?: string | null;
  manufacturing_details?: string | null;
  country_of_origin?: string | null;
  specifications?: Record<string, unknown> | null;
  thumbnail?: string | null;
  images?: string[] | null;
  trust_score?: number | null;
  avg_rating?: number | null;
  verified_buyer_reviews?: number | null;
};

type VerificationIdentity = {
  id: string;
  product_id: string;
  verification_id: string;
  qr_id?: string | null;
  barcode_id?: string | null;
  nfc_id?: string | null;
  barcode_value?: string | null;
  verification_status?: string | null;
  activation_status?: string | null;
  verification_date?: string | null;
  last_scan_at?: string | null;
  total_scans?: number | null;
  successful_verifications?: number | null;
  failed_verifications?: number | null;
  duplicate_attempts?: number | null;
  high_risk_device_count?: number | null;
  product?: ProductInfo | null;
};

type VerificationLog = {
  id: string;
  verification_identity_id?: string | null;
  verification_id?: string | null;
  product_id?: string | null;
  scan_result?: string | null;
  device_type?: string | null;
  platform_type?: string | null;
  geolocation?: string | null;
  country?: string | null;
  scanned_at?: string | null;
};

type FraudLog = {
  id: string;
  verification_identity_id?: string | null;
  product_id?: string | null;
  alert_type: string;
  severity?: string | null;
  description?: string | null;
  created_at?: string | null;
};

type WishlistItem = { product_id: string };
type Review = { product_id: string; rating?: number | null; title?: string | null; comment?: string | null; created_at?: string | null };
type ConsumerActivity = { product_id: string; activity_type: string; created_at?: string | null };
type Notification = { id: string; type: string; title: string; message: string; created_at?: string | null; read_at?: string | null };

const TABS = ['Verification', 'Tracking', 'Fraud', 'Analytics', 'Consumers', 'Notifications'] as const;
type Tab = (typeof TABS)[number];

export default function ProductVerificationClient({
  identities,
  logs,
  fraudLogs,
  wishlistItems,
  reviews,
  activity,
  notifications,
  detailIdentityId,
}: {
  identities: VerificationIdentity[];
  logs: VerificationLog[];
  fraudLogs: FraudLog[];
  wishlistItems: WishlistItem[];
  reviews: Review[];
  activity: ConsumerActivity[];
  notifications: Notification[];
  detailIdentityId?: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('Verification');

  const selected = identities.find((identity) => identity.id === detailIdentityId) || identities[0];
  const selectedLogs = logs.filter((log) =>
    log.verification_identity_id === selected?.id ||
    log.verification_id === selected?.verification_id ||
    log.product_id === selected?.product_id
  );
  const selectedFraud = fraudLogs.filter((log) =>
    log.verification_identity_id === selected?.id || log.product_id === selected?.product_id
  );
  const productReviews = reviews?.filter((review) => review.product_id === selected?.product_id) || [];
  const wishlistCount = wishlistItems?.filter((item) => item.product_id === selected?.product_id).length || 0;
  const engagementCount = activity?.filter((item) => item.product_id === selected?.product_id).length || 0;
  const successful = selectedLogs.filter((log) => log.scan_result === 'success').length;
  const failed = selectedLogs.filter((log) => log.scan_result === 'failed').length;
  const regionCounts = countBy(selectedLogs.map((log) => log.country || log.geolocation || 'Unknown'));
  const deviceCounts = countBy(selectedLogs.map((log) => log.device_type || 'Unknown'));
  const platformCounts = countBy(selectedLogs.map((log) => log.platform_type || 'Unknown'));
  const dailyScans = countSince(selectedLogs, 1);
  const weeklyScans = countSince(selectedLogs, 7);
  const monthlyScans = countSince(selectedLogs, 30);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 rounded-full px-3 py-1 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Product Verification
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Product Verification Details</h1>
          <p className="text-gray-500 text-sm mt-1">Verification intelligence, trust signals, scans, and alerts for the selected product.</p>
        </div>
        <Link
          href="/seller/dashboard/verification"
          className="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors shadow-sm"
        >
          Back to Verification Search
        </Link>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-5 items-start">
        <aside className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm sticky top-24">
          {selected ? <SelectedIdentityCard identity={selected} /> : (
            <p className="p-6 text-sm text-gray-400">No verification identity selected.</p>
          )}
        </aside>

        {selected ? (
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <ProductHeader selected={selected} logs={selectedLogs} fraudCount={selectedFraud.length} />

            <div className="px-5 border-b border-gray-100 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                      activeTab === tab
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 min-h-[360px]">
              {activeTab === 'Verification' && <VerificationPanel identity={selected} logs={selectedLogs} fraudCount={selectedFraud.length} />}
              {activeTab === 'Tracking' && (
                <TrackingPanel
                  total={selectedLogs.length}
                  successful={successful}
                  failed={failed}
                  logs={selectedLogs}
                  deviceCounts={deviceCounts}
                  platformCounts={platformCounts}
                  regionCounts={regionCounts}
                />
              )}
              {activeTab === 'Fraud' && <FraudPanel identity={selected} fraudLogs={selectedFraud} />}
              {activeTab === 'Analytics' && (
                <AnalyticsPanel
                  dailyScans={dailyScans}
                  weeklyScans={weeklyScans}
                  monthlyScans={monthlyScans}
                  engagementCount={engagementCount}
                  trustScore={selected.product?.trust_score ?? 100}
                  popularity={wishlistCount + productReviews.length + selectedLogs.length}
                  fraudCount={selectedFraud.length}
                  regionCounts={regionCounts}
                />
              )}
              {activeTab === 'Consumers' && (
                <ConsumerPanel wishlistCount={wishlistCount} reviews={productReviews} engagementCount={engagementCount} />
              )}
              {activeTab === 'Notifications' && <NotificationPanel notifications={notifications} />}
            </div>
          </section>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400 shadow-sm">
            No verification identities have been generated yet.
          </div>
        )}
      </div>
    </div>
  );
}

function SelectedIdentityCard({ identity }: { identity: VerificationIdentity }) {
  const product = identity.product;
  const image = product?.thumbnail || product?.images?.[0];
  const trustScore = product?.trust_score ?? 100;

  return (
    <div className="p-5 space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-red-50 p-4">
        <div className="w-24 h-24 rounded-2xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center mb-4 shadow-sm">
          {image ? (
            <img src={image} alt={product?.name || 'Product'} className="w-full h-full object-cover" />
          ) : (
            <QrCode className="w-9 h-9 text-gray-300" />
          )}
        </div>
        <StatusPill value={identity.verification_status || 'Unverified'} />
        <h2 className="text-gray-900 text-xl font-bold mt-3 leading-tight">{product?.name || 'Unnamed product'}</h2>
        <p className="text-red-600 font-mono text-sm mt-2 break-all">{identity.verification_id}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CompactMetric label="Trust Score" value={`${trustScore}%`} tone={trustScore >= 80 ? 'ok' : trustScore >= 50 ? 'warn' : 'default'} />
        <CompactMetric label="Status" value={identity.activation_status || 'Inactive'} />
        <CompactMetric label="Scans" value={identity.total_scans || 0} />
        <CompactMetric label="Failed" value={identity.failed_verifications || 0} tone={(identity.failed_verifications || 0) > 0 ? 'warn' : 'default'} />
      </div>

      <div className="space-y-3 border-t border-gray-100 pt-4">
        <Fact label="Product ID" value={product?.product_id} mono />
        <Fact label="Brand" value={product?.brand} />
        <Fact label="Category" value={product?.category} />
        <Fact label="Batch Number" value={product?.batch_number} mono />
        <Fact label="Last Scan" value={formatDate(identity.last_scan_at)} />
      </div>
    </div>
  );
}

function ProductHeader({
  selected,
  logs,
  fraudCount,
}: {
  selected: VerificationIdentity;
  logs: VerificationLog[];
  fraudCount: number;
}) {
  const product = selected.product;
  const specs = Object.entries(product?.specifications || {}).slice(0, 6);
  const successful = logs.filter((log) => log.scan_result === 'success').length;
  const successRate = logs.length > 0 ? Math.round((successful / logs.length) * 100) : 0;
  const trustScore = product?.trust_score ?? 100;

  return (
    <div className="p-5">
      <div className="grid xl:grid-cols-[148px_1fr_220px] gap-5 items-start">
        <div className="w-36 h-36 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
          {product?.thumbnail || product?.images?.[0] ? (
            <img src={product.thumbnail || product.images?.[0]} alt={product.name || 'Product'} className="w-full h-full object-cover" />
          ) : (
            <QrCode className="w-10 h-10 text-gray-300" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusPill value={selected.verification_status || 'Unverified'} />
            <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold uppercase">
              {selected.activation_status || 'Inactive'}
            </span>
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${trustBadgeClass(trustScore)}`}>
              Trust {trustScore}%
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">{product?.name || 'Unnamed product'}</h2>
          <p className="text-red-600 font-mono text-sm mt-1">{selected.verification_id}</p>

          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mt-5">
            <Fact label="Brand" value={product?.brand} />
            <Fact label="Category" value={product?.category} />
            <Fact label="Product ID" value={product?.product_id} mono />
            <Fact label="Batch Number" value={product?.batch_number} mono />
            <Fact label="Country of Origin" value={product?.country_of_origin} />
            <Fact label="Manufacturing Details" value={product?.manufacturing_details} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CompactMetric label="Scans" value={selected.total_scans || 0} />
          <CompactMetric label="Success" value={selected.successful_verifications || 0} />
          <CompactMetric label="Failed" value={selected.failed_verifications || 0} />
          <CompactMetric label="Alerts" value={fraudCount + (selected.duplicate_attempts || 0) + (selected.high_risk_device_count || 0)} />
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-gray-100 grid lg:grid-cols-[1fr_260px] gap-5">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Product Specifications</p>
          <div className="flex flex-wrap gap-2">
            {specs.length > 0 ? specs.map(([key, value]) => (
              <span key={key} className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 text-xs">
                {key}: {String(value)}
              </span>
            )) : <span className="text-gray-400 text-sm">No specifications provided</span>}
          </div>
        </div>
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-400 text-xs uppercase tracking-wider">Scan Success Rate</span>
            <span className="text-gray-900 font-bold">{successRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 mt-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-green-400"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationPanel({
  identity,
  logs,
  fraudCount,
}: {
  identity: VerificationIdentity;
  logs: VerificationLog[];
  fraudCount: number;
}) {
  const activity = logs.slice(0, 5);

  return (
    <div className="grid xl:grid-cols-[1fr_320px] gap-5">
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Fact label="Verification ID" value={identity.verification_id} mono />
          <Fact label="NFC ID" value={identity.nfc_id || 'Not enabled'} mono />
          <Fact label="QR ID" value={identity.qr_id || 'Not enabled'} mono />
          <Fact label="Barcode ID" value={identity.barcode_id || 'Not enabled'} mono />
          <Fact label="Verification Status" value={identity.verification_status || 'Unverified'} />
          <Fact label="Activation Status" value={identity.activation_status || 'Inactive'} />
          <Fact label="Verification Date" value={formatDate(identity.verification_date)} />
          <Fact label="Last Scan Time" value={formatDate(identity.last_scan_at)} />
        </div>

        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-bold">Verification Timeline</h3>
            <span className={`text-xs font-bold ${fraudCount > 0 ? 'text-amber-500' : 'text-green-600'}`}>
              {fraudCount > 0 ? `${fraudCount} alerts` : 'Healthy'}
            </span>
          </div>
          {activity.length === 0 ? (
            <p className="text-gray-400 text-sm">No timeline activity yet.</p>
          ) : activity.map((log) => (
            <div key={log.id} className="grid grid-cols-[14px_1fr] gap-3 pb-4 last:pb-0">
              <span className={`mt-1.5 w-2.5 h-2.5 rounded-full ${log.scan_result === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="text-gray-900 text-sm font-semibold">
                  {log.scan_result === 'success' ? 'Authenticity validated' : 'Verification failed'}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {formatDate(log.scanned_at)} · {log.device_type || 'Unknown device'} · {log.platform_type || 'Unknown platform'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 flex items-center justify-center border border-gray-200 shadow-sm">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(identity.verification_id)}`}
            alt="Verification QR code"
            className="w-32 h-32"
          />
        </div>
        <BarcodePreview value={identity.barcode_value || identity.verification_id} />
      </div>
    </div>
  );
}

function TrackingPanel({
  total,
  successful,
  failed,
  logs,
  deviceCounts,
  platformCounts,
  regionCounts,
}: {
  total: number;
  successful: number;
  failed: number;
  logs: VerificationLog[];
  deviceCounts: Record<string, number>;
  platformCounts: Record<string, number>;
  regionCounts: Record<string, number>;
}) {
  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-3 gap-3">
        <Metric icon={<QrCode className="w-4 h-4" />} label="Total Scans" value={total} />
        <Metric icon={<CheckCircle2 className="w-4 h-4" />} label="Successful" value={successful} />
        <Metric icon={<XCircle className="w-4 h-4" />} label="Failed" value={failed} />
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <MiniList title="Device Types" data={deviceCounts} />
        <MiniList title="Platform Types" data={platformCounts} />
        <MiniList title="Geo-location Map" data={regionCounts} />
      </div>

      <div className="rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
        {logs.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">No scan history yet.</p>
        ) : logs.slice(0, 10).map((log) => (
          <div key={log.id} className="grid sm:grid-cols-[1fr_1fr_100px] gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 text-sm">
            <span className="text-gray-700">{formatDate(log.scanned_at)}</span>
            <span className="text-gray-400">{log.device_type || 'Unknown'} · {log.platform_type || 'Unknown'}</span>
            <span className={log.scan_result === 'success' ? 'text-green-600' : 'text-red-600'}>{log.scan_result || 'failed'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FraudPanel({ identity, fraudLogs }: { identity: VerificationIdentity; fraudLogs: FraudLog[] }) {
  const alerts = [
    ['Duplicate attempts', identity.duplicate_attempts || 0],
    ['Suspicious activity', fraudLogs.filter((log) => log.alert_type.includes('suspicious')).length],
    ['Abnormal geo', fraudLogs.filter((log) => log.alert_type.includes('geo')).length],
    ['Cloned tag alerts', fraudLogs.filter((log) => log.alert_type.includes('clone')).length],
    ['Excessive scans', fraudLogs.filter((log) => log.alert_type.includes('excessive')).length],
    ['High-risk devices', identity.high_risk_device_count || 0],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-3">
        {alerts.map(([label, value]) => (
          <CompactMetric key={label} label={label} value={value} tone={value > 0 ? 'warn' : 'ok'} />
        ))}
      </div>
      <div className="space-y-2">
        {fraudLogs.length === 0 ? (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-green-700 text-sm">
            No fraud alerts for this identity.
          </div>
        ) : fraudLogs.slice(0, 6).map((log) => (
          <div key={log.id} className="flex gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 text-sm">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-semibold">{log.alert_type} · {log.severity || 'medium'}</p>
              <p className="text-gray-500 mt-1">{log.description || 'Suspicious verification behavior detected.'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPanel({
  dailyScans,
  weeklyScans,
  monthlyScans,
  engagementCount,
  trustScore,
  popularity,
  fraudCount,
  regionCounts,
}: {
  dailyScans: number;
  weeklyScans: number;
  monthlyScans: number;
  engagementCount: number;
  trustScore: number;
  popularity: number;
  fraudCount: number;
  regionCounts: Record<string, number>;
}) {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Metric icon={<Clock3 className="w-4 h-4" />} label="Daily Scans" value={dailyScans} />
        <Metric icon={<LineChart className="w-4 h-4" />} label="Weekly Scans" value={weeklyScans} />
        <Metric icon={<LineChart className="w-4 h-4" />} label="Monthly Scans" value={monthlyScans} />
        <Metric icon={<Smartphone className="w-4 h-4" />} label="Engagement" value={engagementCount} />
        <Metric icon={<ShieldCheck className="w-4 h-4" />} label="Trust Score" value={`${trustScore}%`} />
        <Metric icon={<Heart className="w-4 h-4" />} label="Popularity" value={popularity} />
        <Metric icon={<AlertTriangle className="w-4 h-4" />} label="Fraud Alerts" value={fraudCount} />
      </div>
      <MiniList title="Region-wise Product Activity" data={regionCounts} />
    </div>
  );
}

function ConsumerPanel({ wishlistCount, reviews, engagementCount }: { wishlistCount: number; reviews: Review[]; engagementCount: number }) {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-3">
        <Metric icon={<Heart className="w-4 h-4" />} label="Wishlist Count" value={wishlistCount} />
        <Metric icon={<MessageSquare className="w-4 h-4" />} label="Reviews" value={reviews.length} />
        <Metric icon={<Smartphone className="w-4 h-4" />} label="Engagement" value={engagementCount} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400">No consumer feedback yet.</p>
        ) : reviews.slice(0, 6).map((review, index) => (
          <div key={`${review.product_id}-${index}`} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm">
            <p className="text-gray-900 font-semibold">{review.title || `${review.rating || 0}/5 review`}</p>
            <p className="text-gray-500 mt-1">{review.comment || 'No comment provided.'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationPanel({ notifications }: { notifications: Notification[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {notifications.length === 0 ? (
        <p className="text-sm text-gray-400">No verification notifications yet.</p>
      ) : notifications.slice(0, 8).map((notification) => (
        <div key={notification.id} className="flex gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm">
          <Bell className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-900 font-semibold">{notification.title}</p>
            <p className="text-gray-500 mt-1">{notification.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompactMetric({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'ok' | 'warn' }) {
  const color = tone === 'warn' ? 'text-amber-500' : tone === 'ok' ? 'text-green-600' : 'text-gray-900';
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
      <p className="text-gray-400 text-[10px] uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function Fact({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div>
      <span className="text-gray-400 text-xs uppercase tracking-wider">{label}</span>
      <p className={`text-gray-900 mt-1 ${mono ? 'font-mono text-xs break-all' : 'text-sm'}`}>{value || 'Not available'}</p>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
      <div className="text-red-600 mb-3">{icon}</div>
      <p className="text-gray-400 text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-gray-900 text-2xl font-black mt-1">{value}</p>
    </div>
  );
}

function MiniList({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
      <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-3">{title}</p>
      {entries.length === 0 ? (
        <p className="text-gray-400 text-sm">No data</p>
      ) : entries.map(([label, count]) => (
        <div key={label} className="flex items-center justify-between gap-3 text-sm py-1.5">
          <span className="text-gray-600 truncate">{label}</span>
          <span className="text-gray-900 font-mono">{count}</span>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const color = value === 'Active'
    ? 'bg-green-50 text-green-600 border-green-100'
    : value === 'Suspicious'
      ? 'bg-amber-50 text-amber-600 border-amber-100'
      : value === 'Blocked'
        ? 'bg-red-50 text-red-600 border-red-100'
        : 'bg-gray-100 text-gray-500 border-gray-200';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>{value}</span>;
}

function BarcodePreview({ value }: { value: string }) {
  const chars = value.split('');
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-200 shadow-sm">
      <div className="h-24 flex items-end gap-[2px]">
        {chars.map((char, index) => {
          const height = 32 + ((char.charCodeAt(0) + index) % 56);
          const width = 2 + ((char.charCodeAt(0) + index) % 3);
          return <span key={`${char}-${index}`} className="bg-gray-900 block" style={{ height, width }} />;
        })}
      </div>
      <span className="text-gray-600 font-mono text-xs mt-3">{value}</span>
    </div>
  );
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function countSince(logs: VerificationLog[], days: number) {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return logs.filter((log) => log.scanned_at && new Date(log.scanned_at).getTime() >= threshold).length;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString();
}

function trustBadgeClass(score: number) {
  if (score >= 80) return 'bg-green-50 text-green-600 border-green-100';
  if (score >= 50) return 'bg-amber-50 text-amber-600 border-amber-100';
  return 'bg-red-50 text-red-600 border-red-100';
}
