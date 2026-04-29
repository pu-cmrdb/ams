'use client';
import { useState } from 'react';

import InventoryPage from './create/modal';

export default function CreatePage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* 頂部標題列 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">盤點計畫總覽</h1>
        <button
          className="
            rounded-sm bg-blue-500 px-4 py-2 text-white
            hover:bg-blue-600
          "
          onClick={() => { setIsOpen(true); }}
        >
          建立
        </button>
      </div>

      {/* 列表區 */}
      <div className="w-full rounded-lg bg-white p-6 shadow-md">
        <p className="text-center text-gray-400">尚無盤點計畫</p>
      </div>

      {/* Modal */}
      {isOpen && (
        <div
          className="
            fixed inset-0 z-50 flex items-center justify-center bg-black/50
          "
          onClick={() => { setIsOpen(false); }}
        >
          <div onClick={(e) => { e.stopPropagation(); }}>
            <InventoryPage onSuccess={() => { setIsOpen(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}
