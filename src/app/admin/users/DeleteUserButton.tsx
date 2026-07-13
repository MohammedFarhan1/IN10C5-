'use client';

import { Trash2 } from 'lucide-react';
import { deleteUserAccount } from '@/app/actions/admin';
import { useState } from 'react';

export default function DeleteUserButton({ userId }: { userId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) return;

    setIsDeleting(true);
    const result = await deleteUserAccount(userId);
    setIsDeleting(false);

    if (result && !result.success) {
      alert(`Failed to delete user: ${result.error}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      title="Delete User Permanently"
      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
