'use client';

import { updateOrderItemStatus } from '@/app/actions/seller';
import { useTransition } from 'react';

export default function StatusSelector({ itemId, currentStatus }: { itemId: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    startTransition(async () => {
      await updateOrderItemStatus(itemId, newStatus);
    });
  };

  return (
    <div className="relative">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className={`bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-900 focus:ring-2 focus:ring-red-500/30 focus:border-red-400 focus:outline-none appearance-none cursor-pointer transition-opacity ${isPending ? 'opacity-50' : ''}`}
      >
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="dispatched">Dispatched</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
