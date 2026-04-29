'use client';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';

import { useTRPC } from '@/trpc/react';

export default function InventoryPage({ onSuccess }: { onSuccess?: () => void }) {
  const trpc = useTRPC();

  const [form, setForm] = useState({
    assignedToIds: [] as string[],
    description: '',
    dueAt: new Date(),
    name: '',
    scope: '',
    startAt: new Date(),
  });

  const createInventory = useMutation(trpc.inventory.create.mutationOptions({
    onError: (error) => { alert(error.message); },
    onSuccess: () => {
      alert('建立成功！');
      onSuccess?.();
    },
  }));

  const handleSubmit = () => {
    createInventory.mutate(form);
  };

  return (
    <div className="
      flex min-h-screen items-center justify-center bg-gray-100 p-8
    "
    >
      <div className="
        flex w-full max-w-2xl flex-col gap-6 rounded-2xl bg-white p-10 shadow-lg
      "
      >
        <h1 className="text-center text-3xl font-bold text-gray-800">建立盤點計畫</h1>

        <div className="flex flex-col gap-1">
          <label className="text-base font-medium text-gray-700">計畫名稱</label>
          <input
            className="
              rounded-lg border border-gray-300 px-4 py-3 text-base
              focus:ring-2 focus:ring-indigo-500 focus:outline-none
            "
            onChange={(e) => { setForm({ ...form, name: e.target.value }); }}
            type="text"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-base font-medium text-gray-700">說明</label>
          <input
            className="
              rounded-lg border border-gray-300 px-4 py-3 text-base
              focus:ring-2 focus:ring-indigo-500 focus:outline-none
            "
            onChange={(e) => { setForm({ ...form, description: e.target.value }); }}
            type="text"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-base font-medium text-gray-700">盤點範圍</label>
          <input
            className="
              rounded-lg border border-gray-300 px-4 py-3 text-base
              focus:ring-2 focus:ring-indigo-500 focus:outline-none
            "
            onChange={(e) => { setForm({ ...form, scope: e.target.value }); }}
            type="text"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-base font-medium text-gray-700">盤點人員</label>
          <input
            className="
              rounded-lg border border-gray-300 px-4 py-3 text-base
              focus:ring-2 focus:ring-indigo-500 focus:outline-none
            "
            onChange={(e) => {
              const ids = e.target.value.split(',').map((id) => id.trim());
              setForm({ ...form, assignedToIds: ids });
            }}
            placeholder="例如: user1, user2"
            type="text"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-base font-medium text-gray-700">開始日期</label>
            <input
              className="
                rounded-lg border border-gray-300 px-4 py-3 text-base
                focus:ring-2 focus:ring-indigo-500 focus:outline-none
              "
              onChange={(e) => { setForm({ ...form, startAt: new Date(e.target.value) }); }}
              type="datetime-local"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-base font-medium text-gray-700">結束日期</label>
            <input
              className="
                rounded-lg border border-gray-300 px-4 py-3 text-base
                focus:ring-2 focus:ring-indigo-500 focus:outline-none
              "
              onChange={(e) => { setForm({ ...form, dueAt: new Date(e.target.value) }); }}
              type="datetime-local"
            />
          </div>
        </div>

        <button
          className={`
            mt-2 w-full rounded-xl px-4 py-3 text-lg font-semibold text-white
            transition
            ${
    createInventory.isPending
      ? 'cursor-not-allowed bg-gray-400'
      : `
        bg-indigo-600 shadow-md
        hover:bg-indigo-700
      `
    }
          `}
          disabled={createInventory.isPending}
          onClick={handleSubmit}
          type="button"
        >
          {createInventory.isPending ? '建立中...' : '建立計畫'}
        </button>
      </div>
    </div>
  );
}
