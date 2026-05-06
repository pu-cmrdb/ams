'use client';

import { AlertTriangle, CalendarDays, CheckCircle2, CircleDashed, FileText, Package2 } from 'lucide-react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AssetStatus } from '@/lib/enums';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/components/providers/session-provider';
import { useTRPC } from '@/trpc/react';

interface InventoryDetailsClientProps {
  id: string;
}

export function InventoryDetailsClient({ id }: InventoryDetailsClientProps) {
  const trpc = useTRPC();
  const session = useSession();
  const queryClient = useQueryClient();

  const { data: plan, isError, isLoading } = useQuery(trpc.inventory.get.queryOptions({ id }));

  const assetQueries = useQueries({
    queries: (plan?.assetIds ?? []).map((assetId: string) => ({
      ...trpc.asset.get.queryOptions({ id: assetId }),
      enabled: !!plan && plan.assetIds.length > 0,
    })),
  });

  const isAssetsLoading = assetQueries.some((q) => q.isLoading);
  const assets = assetQueries.map((q) => q.data).filter(Boolean);

  const updateInventory = useMutation({
    ...trpc.inventory.update.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: trpc.inventory.get.queryOptions({ id }).queryKey,
      });
    },
  });

  if (isLoading || isAssetsLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div>
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>錯誤</AlertTitle>
          <AlertDescription>無法查詢該計畫</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="
        flex flex-col justify-between gap-4
        md:flex-row md:items-start
      "
      >
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{plan.name}</h1>
            <Badge
              className="px-3 py-1 text-sm"
              variant={
                plan.status === 'completed'
                  ? 'default'
                  : plan.status === 'cancelled'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {plan.status === 'completed' ? '已完成' : plan.status === 'cancelled' ? '已取消' : '進行中'}
            </Badge>
          </div>
          <p className="whitespace-pre-wrap text-muted-foreground">{plan.description}</p>
        </div>
        {plan.createdById === session.user.id && plan.status === 'pending' && (
          <p className="text-sm text-muted-foreground">
            結案功能需改由後端受保護的專用操作處理，暫時停用此前端入口。
          </p>
        )}
      </div>

      <div className="
        grid gap-4
        md:grid-cols-3
      "
      >
        <Card>
          <CardHeader className="
            flex flex-row items-center justify-between space-y-0 pb-2
          "
          >
            <CardTitle className="text-sm font-medium">開始時間</CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(new Date(plan.startAt), 'yyyy-MM-dd HH:mm')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="
            flex flex-row items-center justify-between space-y-0 pb-2
          "
          >
            <CardTitle className="text-sm font-medium">截止時間</CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(new Date(plan.dueAt), 'yyyy-MM-dd HH:mm')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="
            flex flex-row items-center justify-between space-y-0 pb-2
          "
          >
            <CardTitle className="text-sm font-medium">完成時間</CardTitle>
            {plan.status === 'completed'
              ? (
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                )
              : (
                  <CircleDashed className="size-4 text-muted-foreground" />
                )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plan.completedAt ? format(new Date(plan.completedAt), 'yyyy-MM-dd HH:mm') : '尚未完成'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="size-5" />
            盤點明細
          </CardTitle>
          <CardDescription>
            此計畫包含的財產明細以及其目前的記錄狀態。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plan.assetIds.length > 0
              ? (
                  <div className="
                    grid grid-cols-1 gap-4
                    md:grid-cols-2
                    lg:grid-cols-3
                  "
                  >
                    {assets.map((asset: any) => (
                      <AssetItem asset={asset} key={asset.id} />
                    ))}
                  </div>
                )
              : (
                  <div className="py-10 text-center text-muted-foreground">
                    尚無財產明細資料
                  </div>
                )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AssetItem({ asset }: { asset: any }) {
  if (!asset) {
    return (
      <Card className="h-full border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">載入失敗</CardTitle>
          <CardDescription>
            無法取得財產資料
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasAnomaly = asset.records.some(
    (record: { note: null | string; status: string }) => record.status !== AssetStatus.Normal || !!record.note,
  );

  return (
    <Card className={hasAnomaly ? 'border-destructive/50 bg-destructive/5' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{asset.name}</CardTitle>
          {hasAnomaly && (
            <Badge className="ml-2 whitespace-nowrap" variant="destructive">異常 / 變動</Badge>
          )}
        </div>
        <CardDescription>
          ID:
          {asset.id}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <span className="mr-2 border-r pr-2 text-muted-foreground">地點</span>
            {asset.location}
          </div>
          <div>
            <span className="mr-2 border-r pr-2 text-muted-foreground">保管單位</span>
            {asset.custodian}
          </div>

          {asset.records.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-2 flex items-center gap-1 font-semibold">
                <FileText className="size-4" />
                {' '}
                記錄狀態
              </p>
              <div className="space-y-2">
                {asset.records.map(
                  (
                    record: { note: null | string; quantity: null | number; status: string },
                  ) => (
                    <div
                      className="
                        flex flex-col gap-1 rounded-md bg-secondary/50 p-2
                      "
                      key={record.status}
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant={record.status === AssetStatus.Normal ? 'outline' : 'secondary'}>
                          {record.status}
                        </Badge>
                        <span>
                          數量:
                          {record.quantity}
                        </span>
                      </div>
                      {record.note && (
                        <p className="
                          mt-1 line-clamp-3 text-xs wrap-break-word
                          text-muted-foreground
                        "
                        >
                          備註:
                          {record.note}
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
