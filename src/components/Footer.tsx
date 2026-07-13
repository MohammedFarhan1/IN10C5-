'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Hexagon } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-20 border-t border-gray-800">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Hexagon className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Trusta</span>
            </div>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Your trusted marketplace for verified authentic products with transparent brand owner ratings and complete product traceability.
            </p>
            <div className="flex gap-4 text-sm">
              {['Facebook', 'Twitter', 'Instagram', 'LinkedIn'].map(s => (
                <a key={s} href="#" className="text-gray-500 hover:text-white transition-colors">{s}</a>
              ))}
            </div>
          </div>

          {/* Browse */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Browse</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/products',                    label: 'All Products' },
                { href: '/products?category=electronics', label: 'Electronics' },
                { href: '/products?category=automotive',  label: 'Automotive' },
                { href: '/products?category=furniture',   label: 'Furniture' },
                { href: '/products?verified=true',        label: 'Verified Products' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">For Brand Owners</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/signup/seller',         label: 'Sell Products' },
                { href: '/seller/dashboard',      label: 'Dashboard' },
                { href: '/verify',                label: 'Verify Product' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600" />
                <span>support@trusta.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600" />
                <span>1-800-TRUSTA-1</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600" />
                <span>123 Trust Street, Business City</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
          </div>
          <p>&copy; 2026 Trusta Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
