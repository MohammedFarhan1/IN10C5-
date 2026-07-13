import Link from 'next/link';
import { Users, Store, Package, ShieldAlert, LogOut, LayoutDashboard } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default function AdminSidebar() {
  const NAV = [
    { href: '/admin',        icon: LayoutDashboard, label: 'Overview' },
    { href: '/admin/users',  icon: Users,           label: 'Users' },
    { href: '/admin/sellers',icon: Store,           label: 'Brand Owners' },
    { href: '/admin/products',icon: Package,        label: 'Products' },
    { href: '/admin/fraud',  icon: ShieldAlert,     label: 'Fraud Reports' },
  ];

  return (
    <aside className="lg:w-56 flex-shrink-0">
      {/* Admin badge */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span className="text-red-600 font-bold text-sm">Admin Panel</span>
        </div>
        <p className="text-gray-500 text-xs">Full platform access</p>
      </div>

      {/* Nav links */}
      <nav className="space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
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
