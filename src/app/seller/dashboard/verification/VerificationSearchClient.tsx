'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, PackagePlus, QrCode, Search, ShieldCheck, Upload } from 'lucide-react';

type ProductInfo = {
  product_id?: string | null;
  name?: string | null;
  brand?: string | null;
  category?: string | null;
  batch_number?: string | null;
  thumbnail?: string | null;
  images?: string[] | null;
};

type VerificationIdentity = {
  id: string;
  product_id: string;
  verification_id: string;
  qr_id?: string | null;
  barcode_id?: string | null;
  nfc_id?: string | null;
  verification_status?: string | null;
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
  scanned_at?: string | null;
};

type FraudLog = {
  id: string;
  alert_type: string;
  severity?: string | null;
  created_at?: string | null;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  created_at?: string | null;
  read_at?: string | null;
};

const FILTERS = ['All', 'NFC', 'QR', 'Barcode', 'Product ID'] as const;
type Filter = (typeof FILTERS)[number];

export default function VerificationSearchClient({
  identities,
  logs,
  fraudLogs,
  notifications,
}: {
  identities: VerificationIdentity[];
  logs: VerificationLog[];
  fraudLogs: FraudLog[];
  notifications: Notification[];
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const search = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!search) return [];

    return identities.filter((identity) => {
      const product = identity.product;
      const values =
        filter === 'NFC' ? [identity.nfc_id] :
        filter === 'QR' ? [identity.qr_id] :
        filter === 'Barcode' ? [identity.barcode_id] :
        filter === 'Product ID' ? [product?.product_id] :
        [
          identity.verification_id,
          identity.nfc_id,
          identity.qr_id,
          identity.barcode_id,
          product?.product_id,
          product?.name,
          product?.brand,
          product?.batch_number,
        ];

      return values.some((value) => String(value || '').toLowerCase().includes(search));
    });
  }, [filter, identities, search]);

  const activeCount = identities.filter((identity) => identity.verification_status === 'Active').length;
  const unreadAlerts = notifications.filter((notification) => !notification.read_at).length;
  const recentActivity = [
    ...logs.slice(0, 4).map((log) => ({
      id: `log-${log.id}`,
      title: log.scan_result === 'success' ? 'Successful verification scan' : 'Verification scan failed',
      detail: `${log.verification_id || 'Unknown ID'} · ${log.device_type || 'Unknown device'} · ${log.platform_type || 'Unknown platform'}`,
      time: log.scanned_at,
      tone: log.scan_result === 'success' ? 'ok' : 'warn',
    })),
    ...fraudLogs.slice(0, 3).map((log) => ({
      id: `fraud-${log.id}`,
      title: log.alert_type,
      detail: `${log.severity || 'medium'} severity fraud signal`,
      time: log.created_at,
      tone: 'danger',
    })),
    ...notifications.slice(0, 3).map((notification) => ({
      id: `notification-${notification.id}`,
      title: notification.title,
      detail: notification.message,
      time: notification.created_at,
      tone: notification.read_at ? 'neutral' : 'info',
    })),
  ].sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()).slice(0, 5);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setRecentSearches((items) => [value, ...items.filter((item) => item !== value)].slice(0, 5));
    setShowRecent(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid xl:grid-cols-[1fr_320px] gap-5">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 rounded-full px-3 py-1 mb-4">
                <ShieldCheck className="w-3.5 h-3.5" /> Product Intelligence
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Verification Management</h1>
              <p className="text-gray-500 text-sm mt-2 max-w-2xl">
                Search identities, inspect product authenticity, and review verification activity from one consistent workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton href="/seller/dashboard/verification/nfc" label="Open Scanner" icon={<QrCode className="w-4 h-4" />} primary />
              <ActionButton href="/seller/dashboard/products/new" label="Add Product Identity" icon={<PackagePlus className="w-4 h-4" />} />
              <ActionButton href="/seller/dashboard/products/bulk" label="Bulk Upload" icon={<Upload className="w-4 h-4" />} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
            <StatCard label="Total Identities" value={identities.length} icon={<ShieldCheck className="w-4 h-4" />} />
            <StatCard label="Active Verifications" value={activeCount} icon={<CheckCircle2 className="w-4 h-4" />} tone="ok" />
            <StatCard label="Total Scans" value={logs.length} icon={<Activity className="w-4 h-4" />} />
            <StatCard label="Alerts" value={fraudLogs.length + unreadAlerts} icon={<AlertTriangle className="w-4 h-4" />} tone="warn" />
          </div>
        </section>

        <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Scanner Preview</p>
          <div className="aspect-square rounded-2xl border border-gray-100 bg-gray-50 grid place-items-center">
            <div className="w-36 h-36 rounded-2xl border border-red-200 bg-white p-4 grid grid-cols-4 gap-2 shadow-sm">
              {Array.from({ length: 16 }).map((_, index) => (
                <span
                  key={index}
                  className={`rounded-sm ${index % 3 === 0 || index % 5 === 0 ? 'bg-gray-900' : 'bg-red-100'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-gray-900 font-semibold mt-4">Scan or search any identity</p>
          <p className="text-gray-400 text-sm mt-1">QR, barcode, NFC, and product IDs resolve into one product intelligence view.</p>
        </aside>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <form onSubmit={submitSearch} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setShowRecent(true)}
              placeholder="Search verification ID, NFC, QR, barcode, or product ID..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition"
            />
            {showRecent && recentSearches.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-[calc(100%+8px)] rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={() => {
                      setQuery(item);
                      setShowRecent(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </form>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                  filter === item
                    ? 'border-red-400 bg-red-50 text-red-600 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          {!search ? <RecentActivity items={recentActivity} /> : <SearchResults identities={filtered} />}
        </div>
      </section>
    </div>
  );
}

function SearchResults({ identities }: { identities: VerificationIdentity[] }) {
  if (identities.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
        <p className="text-gray-900 font-semibold">No matching product found</p>
        <p className="text-gray-400 text-sm mt-1">Try another verification identity or product ID.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {identities.map((identity) => (
        <IdentityCard key={identity.id} identity={identity} />
      ))}
    </div>
  );
}

function IdentityCard({ identity }: { identity: VerificationIdentity }) {
  return (
    <Link
      href={`/seller/dashboard/verification/${identity.id}`}
      className="group grid md:grid-cols-[76px_1fr_auto] gap-4 items-center bg-white hover:bg-gray-50 border border-gray-200 hover:border-red-300 rounded-2xl p-4 transition-all shadow-sm hover:shadow-md"
    >
      <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
        {identity.product?.thumbnail || identity.product?.images?.[0] ? (
          <img
            src={identity.product.thumbnail || identity.product.images?.[0]}
            alt={identity.product.name || 'Product'}
            className="w-full h-full object-cover"
          />
        ) : (
          <QrCode className="w-7 h-7 text-gray-300" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h2 className="text-gray-900 font-bold text-base truncate">{identity.product?.name || 'Unnamed product'}</h2>
          <StatusPill value={identity.verification_status || 'Unverified'} />
        </div>
        <p className="text-red-600 font-mono text-sm">{identity.verification_id}</p>
        <p className="text-gray-400 text-sm mt-1 truncate">
          {(identity.product?.product_id || 'No product ID')} - {(identity.product?.brand || 'No brand')} - {(identity.product?.category || 'No category')}
        </p>
      </div>
      <div className="text-sm font-semibold text-red-600 group-hover:text-red-700 transition-colors">
        View Details
      </div>
    </Link>
  );
}

function RecentActivity({
  items,
}: {
  items: Array<{ id: string; title: string; detail: string; time?: string | null; tone: string }>;
}) {
  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <div className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-gray-900 font-bold">Recent Verification Activity</h2>
          <span className="text-gray-400 text-xs uppercase tracking-wider">Live feed</span>
        </div>
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-9 h-9 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-900 font-semibold">No scan activity yet</p>
            <p className="text-gray-400 text-sm mt-1">New verification events will appear here.</p>
          </div>
        ) : items.map((item) => (
          <div key={item.id} className="grid sm:grid-cols-[14px_1fr_auto] gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
            <span className={`mt-2 w-2.5 h-2.5 rounded-full ${dotColor(item.tone)}`} />
            <div className="min-w-0">
              <p className="text-gray-700 text-sm font-semibold truncate">{item.title}</p>
              <p className="text-gray-400 text-xs mt-1 truncate">{item.detail}</p>
            </div>
            <span className="text-gray-400 text-xs">{formatDate(item.time)}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider">Workflow</p>
        <div className="mt-4 space-y-3">
          {['Create identity', 'Scan product', 'Review signal', 'Open details'].map((step, index) => (
            <div key={step} className="flex items-center gap-3 text-sm">
              <span className="w-7 h-7 rounded-full bg-red-50 border border-red-100 text-red-600 grid place-items-center font-bold text-xs">{index + 1}</span>
              <span className="text-gray-600">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ href, label, icon, primary }: { href: string; label: string; icon: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
        primary
          ? 'bg-red-600 border-red-600 text-white hover:bg-red-700 shadow-sm'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function StatCard({ label, value, icon, tone = 'default' }: { label: string; value: number; icon: React.ReactNode; tone?: 'default' | 'ok' | 'warn' }) {
  const color = tone === 'ok' ? 'text-green-600' : tone === 'warn' ? 'text-amber-500' : 'text-red-600';
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 hover:border-gray-200 transition-colors">
      <div className={color}>{icon}</div>
      <p className="text-gray-400 text-xs uppercase tracking-wider mt-3">{label}</p>
      <p className="text-gray-900 text-2xl font-black mt-1">{value}</p>
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

function dotColor(tone: string) {
  if (tone === 'ok') return 'bg-green-500';
  if (tone === 'warn') return 'bg-amber-500';
  if (tone === 'danger') return 'bg-red-500';
  if (tone === 'info') return 'bg-blue-500';
  return 'bg-gray-400';
}

function formatDate(value?: string | null) {
  if (!value) return 'Just now';
  return new Date(value).toLocaleDateString();
}
