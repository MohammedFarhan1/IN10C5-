'use client';

import { XCircle } from 'lucide-react';
import { rejectSeller } from '@/app/actions/admin';

export default function RejectSellerButton({ sellerId }: { sellerId: string }) {
  const handleReject = async () => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    if (confirm('Are you sure you want to reject this brand owner?')) {
      await rejectSeller(sellerId, reason);
    }
  };

  return (
    <button
      onClick={handleReject}
      type="button"
      title="Reject"
      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
    >
      <XCircle className="w-4 h-4" />
    </button>
  );
}
