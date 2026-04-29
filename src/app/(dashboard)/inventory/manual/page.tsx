export default function InventoryManualPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">手動盤點</h1>
        <p className="text-sm text-muted-foreground">
          手動盤點功能尚在建置中。
        </p>
      </div>

      {/* TODO: 實作手動盤點流程與權限控管。 */}
    </div>
  );
}