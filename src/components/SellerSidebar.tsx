import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingBag, BarChart3, Truck, Boxes, ChevronRight, LogOut, ShieldCheck } from 'lucide-react';
import { logout } from '@/app/actions/auth';

type SellerSidebarSeller = {
  business_name?: string | null;
  verification_status?: string | null;
};

export default function SellerSidebar({ seller }: { seller: SellerSidebarSeller | null }) {
  const NAV = [
    { href: '/seller/dashboard',                    icon: LayoutDashboard, label: 'Overview' },
    { href: '/seller/dashboard/products',           icon: Package,         label: 'Products' },
    { href: '/seller/dashboard/verification',       icon: ShieldCheck,     label: 'Verification' },
    { href: '/seller/dashboard/orders',             icon: ShoppingBag,     label: 'Orders' },
    { href: '/seller/dashboard/inventory',          icon: Boxes,           label: 'Inventory' },
    { href: '/seller/dashboard/analytics',          icon: BarChart3,       label: 'Analytics' },
    { href: '/seller/dashboard/products/bulk',      icon: Truck,           label: 'Bulk Upload' },
  ];

  const statusColor =
    seller?.verification_status === 'approved'  ? 'text-green-600 bg-green-50' :
    seller?.verification_status === 'rejected'  ? 'text-red-600 bg-red-50' :
    seller?.verification_status === 'suspended' ? 'text-orange-600 bg-orange-50' :
    'text-amber-600 bg-amber-50';

  return (
    <aside className="lg:w-56 flex-shrink-0">
      {/* Business info card */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-5 h-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-900 font-semibold text-sm truncate" title={seller?.business_name ?? undefined}>
              {seller?.business_name ?? 'My Store'}
            </p>
            <span className={`text-xs font-medium capitalize px-1.5 py-0.5 rounded ${statusColor}`}>
              {seller?.verification_status || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors group"
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{label}</span>
            <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </nav>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
