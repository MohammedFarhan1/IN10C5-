'use client';

import { Trash2 } from 'lucide-react';
import { deleteProduct } from '@/app/actions/seller';
import { useState } from 'react';

export default function DeleteProductButton({ productId }: { productId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setIsDeleting(true);
    const result = await deleteProduct(productId);
    setIsDeleting(false);

    if (result && !result.success) {
      alert(`Deletion aborted: ${result.error || 'Foreign key constraints locked.'}`);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
