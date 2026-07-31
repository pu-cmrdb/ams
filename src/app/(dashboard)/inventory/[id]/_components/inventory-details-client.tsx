'use client';

import { AlertTriangle, CalendarDays, CheckCircle2, CircleDashed, FileText, Package2 } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AssetStatus } from '@/lib/enums';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/components/providers/session-provider';
import { useTRPC } from '@/trpc/react';

import type { RouterOutputs } from '@/trpc/react';



function safeFormatDate(value: unknown, fmt: string, fallback = '-'): string {
  if (!value) return fallback;
  const date = new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return fallback;
  return format(date, fmt);
}


type Asset = RouterOutputs['asset']['list'][number];
const statusMeta = {
  cancelled: { label: '已取消', variant: 'destructive' as const },
  completed: { label: '已完成', variant: 'default' as const },
  pending: { label: '進行中', variant: 'secondary' as const },
};

interface InventoryDetailsClientProps {
  id: string;
}

export function InventoryDetailsClient({ id }: InventoryDetailsClientProps) {
  const trpc = useTRPC();
  const session = useSession();
  const queryClient = useQueryClient();

  const completeMutation = useMutation(
    trpc.inventory.update.mutationOptions({
      onError: () => {
        toast.error('結案失敗');
      },
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.inventory.get.queryFilter());
        toast.success('已成功結案');
      },
    }),
  );

  const {
    data: plan,
    isError,
    isLoading,
  } = useQuery(trpc.inventory.get.queryOptions({ id }));

  const handleComplete = useCallback(() => {
    if (!plan) return;
    completeMutation.mutate({
      completedAt: new Date(),
      id: plan.id,
      status: 'completed',
    });
  }, [completeMutation, plan]);

  const {
    data: assetList,
    isError: isAssetsError,
    isLoading: isAssetsLoading,
  } = useQuery({
    ...trpc.asset.list.queryOptions({
      ids: plan?.assetIds ?? [],
      limit: plan?.assetIds.length ?? 20,
    }),
    enabled: !!plan && plan.assetIds.length > 0,
  });

  const assets = assetList ?? [];

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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="font-bold text-3xl tracking-tight">{plan.name}</h1>
            <Badge
              className="px-3 py-1 text-sm"
              variant={statusMeta[plan.status].variant}
            >
              {statusMeta[plan.status].label}
            </Badge>
          </div>
          <p className="whitespace-pre-wrap text-muted-foreground">
            {plan.description}
          </p>
        </div>
        {plan.createdById === session.user.id && plan.status === 'pending' && (
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button size="sm" />}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? '結案中...' : '結案'}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確定結案「{plan.name}」？</AlertDialogTitle>
                <AlertDialogDescription>
                  結案後計畫狀態將變更為「已完成」，此動作無法復原。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleComplete}
                >
                  確認結案
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">開始時間</CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {safeFormatDate(plan.startAt, 'yyyy-MM-dd HH:mm')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">截止時間</CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {safeFormatDate(plan.dueAt, 'yyyy-MM-dd HH:mm')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">完成時間</CardTitle>
            {plan.status === 'completed' ? (
              <CheckCircle2 className="size-4 text-muted-foreground" />
            ) : (
              <CircleDashed className="size-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {plan.completedAt
                ? safeFormatDate(plan.completedAt, 'yyyy-MM-dd HH:mm', '尚未完成')
                : '尚未完成'}
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
            {isAssetsError
              ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertTitle>錯誤</AlertTitle>
                    <AlertDescription>財產明細查詢失敗</AlertDescription>
                  </Alert>
                )
              : null}
            {!isAssetsError && assets.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {assets.map((asset) => (
                  <AssetItem asset={asset} key={asset.id} />
                ))}
              </div>
            )}
            {!isAssetsError && assets.length === 0 && (
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

const AssetItem = memo(function AssetItem({ asset }: { asset: Asset }) {
  const hasAnomaly = useMemo(
    () => asset.records.some(
      (record) => record.status !== AssetStatus.Normal || !!record.note,
    ),
    [asset.records],
  );

  return (
    <Card
      className={hasAnomaly ? 'border-destructive/50 bg-destructive/5' : ''}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{asset.name}</CardTitle>
          {hasAnomaly && (
            <Badge className="ml-2 whitespace-nowrap" variant="destructive">
              異常 / 變動
            </Badge>
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
            <span className="mr-2 border-r pr-2 text-muted-foreground">
              地點
            </span>
            {asset.location}
          </div>
          <div>
            <span className="mr-2 border-r pr-2 text-muted-foreground">
              保管單位
            </span>
            {asset.custodian}
          </div>

          {asset.records.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-2 flex items-center gap-1 font-semibold">
                <FileText className="size-4" /> 記錄狀態
              </p>
              <div className="space-y-2">
                {asset.records.map(
                  (record) => (
                    <div
                      className="flex flex-col gap-1 rounded-md bg-secondary/50 p-2"
                      key={`${record.assetId}-${record.status}`}
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            record.status === AssetStatus.Normal
                              ? 'outline'
                              : 'secondary'
                          }
                        >
                          {record.status}
                        </Badge>
                        <span>
                          數量:
                          {record.quantity}
                        </span>
                      </div>
                      {record.note && (
                        <p className="mt-1 line-clamp-3 break-words text-muted-foreground text-xs">
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
});
