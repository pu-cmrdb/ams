import { InventoryListClient } from './_components/inventory-list-client';

export default function InventoryListPage() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">盤點計畫</h1>
          <p className="bg-transparent text-muted-foreground">
            管理系統中的所有盤點計畫、檢視進度與結果。
          </p>
        </div>
      </div>

      <InventoryListClient />
    </div>
  );
}
