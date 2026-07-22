'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Package, MapPin, CreditCard, ShieldCheck,
  XCircle, RotateCcw, ExternalLink, Clock, CheckCircle2,
  Truck, Home, AlertCircle, Copy, RefreshCw,
} from 'lucide-react';
import { cancelOrder, requestReturn } from '@/app/actions/customer';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  unit_price: number;
  quantity: number;
  total: number;
  unit_code?: string;
  item_status: string;
}

interface ShippingAddress {
  name: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  notes?: string;
  cancel_reason?: string;
  cancelled_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  shipping_address: ShippingAddress;
  order_items: OrderItem[];
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  pending:          'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:        'bg-blue-50 text-blue-700 border-blue-200',
  processing:       'bg-blue-50 text-blue-700 border-blue-200',
  dispatched:       'bg-indigo-50 text-indigo-700 border-indigo-200',
  in_transit:       'bg-purple-50 text-purple-700 border-purple-200',
  out_for_delivery: 'bg-sky-50 text-sky-700 border-sky-200',
  delivered:        'bg-green-50 text-green-700 border-green-200',
  cancelled:        'bg-red-50 text-red-700 border-red-200',
  return_requested: 'bg-orange-50 text-orange-700 border-orange-200',
  returned:         'bg-gray-100 text-gray-600 border-gray-200',
  refunded:         'bg-teal-50 text-teal-700 border-teal-200',
};

const TIMELINE_STEPS = [
  { key: 'pending',          label: 'Order Placed',    icon: Clock },
  { key: 'confirmed',        label: 'Confirmed',       icon: CheckCircle2 },
  { key: 'processing',       label: 'Processing',      icon: Package },
  { key: 'dispatched',       label: 'Dispatched',      icon: Truck },
  { key: 'in_transit',       label: 'In Transit',      icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery',icon: Home },
  { key: 'delivered',        label: 'Delivered',       icon: CheckCircle2 },
];

const STEP_ORDER = TIMELINE_STEPS.map((s) => s.key);

function getStepIndex(status: string): number {
  const idx = STEP_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VerificationBadge({ unitCode }: { unitCode: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(unitCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
        <ShieldCheck className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
        <code className="text-xs font-mono text-green-700 font-semibold">{unitCode}</code>
        <button
          onClick={handleCopy}
          className="ml-0.5 text-green-500 hover:text-green-700 transition-colors"
          title="Copy verification ID"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
      <Link
        href={`/verify/${encodeURIComponent(unitCode)}`}
        target="_blank"
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        Verify now <ExternalLink className="w-3 h-3" />
      </Link>
      {copied && <span className="text-xs text-green-600 font-medium">Copied!</span>}
    </div>
  );
}

function ItemStatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────

function CancelModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [reason, setReason] = useState('Changed my mind');
  const [isPending, start]  = useTransition();
  const [error, setError]   = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await cancelOrder(orderId, reason);
      if (res.success) {
        toast.success('Order cancelled successfully.');
        onClose();
        window.location.reload();
      } else {
        setError(res.error ?? 'Failed to cancel order.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-md w-full space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" /> Cancel Order
        </h3>
        <p className="text-gray-500 text-sm">Please tell us why you'd like to cancel this order.</p>
        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 appearance-none"
          >
            <option>Changed my mind</option>
            <option>Found a better price</option>
            <option>Ordered by mistake</option>
            <option>Delivery time too long</option>
            <option>Other reason</option>
          </select>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors font-medium">
              Go Back
            </button>
            <button type="submit" disabled={isPending}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {isPending ? 'Cancelling…' : 'Confirm Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Return Modal ──────────────────────────────────────────────────────────────

function ReturnModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [reason, setReason] = useState('Damaged or defective');
  const [isPending, start]  = useTransition();
  const [error, setError]   = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await requestReturn(orderId, reason);
      if (res.success) {
        toast.success('Return request submitted.');
        onClose();
        window.location.reload();
      } else {
        setError(res.error ?? 'Failed to request return.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-md w-full space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-orange-500" /> Request Return
        </h3>
        <p className="text-gray-500 text-sm">Tell us why you'd like to return this order.</p>
        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 appearance-none"
          >
            <option>Damaged or defective</option>
            <option>Wrong item received</option>
            <option>Item not as described</option>
            <option>No longer needed</option>
            <option>Other reason</option>
          </select>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors font-medium">
              Go Back
            </button>
            <button type="submit" disabled={isPending}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {isPending ? 'Submitting…' : 'Request Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OrderDetailClient({ initialOrder }: { initialOrder: Order }) {
  const [order,        setOrder]        = useState(initialOrder);
  const [isLive,       setIsLive]       = useState(false);
  const [lastPollAt,   setLastPollAt]   = useState<Date | null>(null);
  const [showCancel,   setShowCancel]   = useState(false);
  const [showReturn,   setShowReturn]   = useState(false);

  const POLL_INTERVAL = 30_000; // 30 seconds

  const pollStatus = useCallback(async () => {
    try {
      const res  = await fetch(`/api/orders/${order.id}`);
      if (!res.ok) return;
      const json = await res.json();
      const fresh = json.order;
      if (!fresh) return;

      setLastPollAt(new Date());
      setIsLive(true);

      // Merge updated status + item statuses without replacing the full object
      if (fresh.status !== order.status || fresh.payment_status !== order.payment_status) {
        setOrder((prev) => ({
          ...prev,
          status:         fresh.status,
          payment_status: fresh.payment_status,
          updated_at:     fresh.updated_at,
          order_items:    prev.order_items.map((item) => {
            const updated = fresh.order_items?.find((fi: any) => fi.id === item.id);
            return updated ? { ...item, item_status: updated.item_status, unit_code: updated.unit_code ?? item.unit_code } : item;
          }),
        }));
      }
    } catch { /* ignore poll errors */ }
  }, [order.id, order.status, order.payment_status]);

  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [pollStatus]);

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled    = ['cancelled', 'return_requested', 'returned', 'refunded'].includes(order.status);
  const canCancel      = ['pending', 'confirmed'].includes(order.status);
  const canReturn      = order.status === 'delivered';

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/account/orders"
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
              <p className="text-gray-400 text-xs mt-0.5">
                Placed {new Date(order.created_at).toLocaleString('en-IN', {
                  dateStyle: 'medium', timeStyle: 'short',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              {isLive && lastPollAt
                ? `Updated ${lastPollAt.toLocaleTimeString('en-IN', { timeStyle: 'short' })}`
                : 'Connecting…'}
            </div>

            <span className={`text-sm px-3 py-1.5 rounded-full border font-semibold ${STATUS_BADGE[order.status] ?? STATUS_BADGE.pending}`}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* ── Status Timeline (only for active orders) ────────────── */}
        {!isCancelled && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-5">Order Timeline</h2>
            <div className="relative">
              {/* Track line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 hidden sm:block" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-green-500 hidden sm:block transition-all duration-500"
                style={{ width: `${(currentStepIdx / (TIMELINE_STEPS.length - 1)) * 100}%` }}
              />

              <div className="flex flex-col sm:flex-row justify-between relative gap-4 sm:gap-0">
                {TIMELINE_STEPS.map((step, idx) => {
                  const done    = idx < currentStepIdx;
                  const active  = idx === currentStepIdx;
                  const Icon    = step.icon;
                  return (
                    <div key={step.key} className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2">
                      <div className={`z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300
                        ${done   ? 'bg-green-500 border-green-500 text-white'
                        : active ? 'bg-white border-blue-500 text-blue-500 shadow-md shadow-blue-100'
                        :          'bg-white border-gray-200 text-gray-300'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="sm:text-center">
                        <p className={`text-xs font-semibold leading-tight
                          ${done ? 'text-green-600' : active ? 'text-blue-600' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Cancelled / Returned banner ──────────────────────────── */}
        {isCancelled && (
          <div className={`rounded-2xl border p-5 flex items-start gap-3
            ${order.status === 'cancelled' ? 'bg-red-50 border-red-200'
            : order.status === 'refunded'  ? 'bg-teal-50 border-teal-200'
            :                                'bg-orange-50 border-orange-200'}`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5
              ${order.status === 'cancelled' ? 'text-red-500'
              : order.status === 'refunded'  ? 'text-teal-500'
              :                                'text-orange-500'}`} />
            <div>
              <p className="text-sm font-semibold text-gray-900 capitalize">{order.status.replace(/_/g, ' ')}</p>
              {order.cancel_reason && (
                <p className="text-xs text-gray-500 mt-0.5">Reason: {order.cancel_reason}</p>
              )}
              {order.cancelled_at && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(order.cancelled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Items ───────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
              Items ({order.order_items.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {order.order_items.map((item) => (
              <div key={item.id} className="px-6 py-5 flex gap-4 items-start">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 flex-shrink-0 overflow-hidden">
                  {item.product_image
                    ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    : <Package className="w-7 h-7 m-auto text-gray-300 mt-4" />
                  }
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/product/${item.product_id}`}
                        className="text-gray-900 font-semibold text-sm hover:text-red-600 transition-colors leading-snug"
                      >
                        {item.product_name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-gray-400 text-xs">Qty {item.quantity}</span>
                        <span className="text-gray-200 text-xs">·</span>
                        <span className="text-gray-400 text-xs">₹{item.unit_price.toLocaleString()} each</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-gray-900 font-bold text-sm">₹{item.total.toLocaleString()}</p>
                      <ItemStatusBadge status={item.item_status} />
                    </div>
                  </div>

                  {/* Verification ID */}
                  {item.unit_code && <VerificationBadge unitCode={item.unit_code} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom grid: Address + Payment ──────────────────────── */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Shipping Address */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" /> Shipping Address
            </h2>
            {order.shipping_address ? (
              <div className="text-sm text-gray-700 space-y-0.5">
                <p className="font-semibold text-gray-900">{order.shipping_address.name}</p>
                <p className="text-gray-500 text-xs">{order.shipping_address.mobile}</p>
                <p>{order.shipping_address.line1}</p>
                {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                <p>{order.shipping_address.city}, {order.shipping_address.state} – {order.shipping_address.pincode}</p>
                {order.shipping_address.country && <p>{order.shipping_address.country}</p>}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No address on record.</p>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-red-500" /> Payment
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString()}</span>
              </div>
              {order.shipping_fee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>₹{order.shipping_fee.toLocaleString()}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>– ₹{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>₹{order.total.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-400 text-xs">Payment status</span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold
                  ${order.payment_status === 'paid'     ? 'bg-green-50 text-green-700 border-green-200'
                  : order.payment_status === 'failed'   ? 'bg-red-50 text-red-700 border-red-200'
                  : order.payment_status === 'refunded' ? 'bg-teal-50 text-teal-700 border-teal-200'
                  :                                       'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {order.payment_status}
                </span>
              </div>

              {order.payment_method && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Payment method</span>
                  <span className="text-gray-600 text-xs font-medium capitalize">{order.payment_method}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Notes ───────────────────────────────────────────────── */}
        {order.notes && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Order Notes</p>
            <p className="text-gray-700 text-sm">{order.notes}</p>
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────── */}
        {(canCancel || canReturn) && (
          <div className="flex flex-wrap gap-3">
            {canCancel && (
              <button
                onClick={() => setShowCancel(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition-colors"
              >
                <XCircle className="w-4 h-4" /> Cancel Order
              </button>
            )}
            {canReturn && (
              <button
                onClick={() => setShowReturn(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm font-semibold transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Return Order
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showCancel && <CancelModal orderId={order.id} onClose={() => setShowCancel(false)} />}
      {showReturn && <ReturnModal orderId={order.id} onClose={() => setShowReturn(false)} />}
    </>
  );
}
