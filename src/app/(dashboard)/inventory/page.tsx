import { InventoryPlanListClient } from './_components/inventory-plan-list-client';

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">盤點計畫管理</h1>
        <p className="text-sm text-muted-foreground">
          查看進行中的盤點計畫與歷史紀錄。
        </p>
      </div>

      <InventoryPlanListClient />

      {/* TODO: 補上盤點計畫頁面的權限控管。 */}
    </div>
  );
}