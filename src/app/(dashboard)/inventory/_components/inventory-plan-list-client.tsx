'use client';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTRPC } from '@/trpc/react';

type InventoryPlanStatus = 'cancelled' | 'completed' | 'in_progress' | 'pending';

type InventoryPlanListItem = {
  completedAt: Date | string | number | null;
  description: string;
  dueAt: Date | string | number;
  id: string;
  name: string;
  startAt: Date | string | number;
  status: InventoryPlanStatus;
};

const statusLabelMap: Record<InventoryPlanStatus, string> = {
  cancelled: 'cancelled',
  completed: 'completed',
  in_progress: 'in_progress',
  pending: 'in_progress',
};

function formatDateTime(value: Date | string | number | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function toDisplayStatus(status: InventoryPlanListItem['status']) {
  if (status === 'pending') return 'in_progress';
  return status;
}

export function InventoryPlanListClient() {
  const trpc = useTRPC();
  const { data: plans, isError, isLoading, refetch } = useQuery(
    trpc.inventory.list.queryOptions({ limit: 50 }),
  );

  if (isError) {
    return (
      <div className="rounded-md border p-8">
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="text-destructive">資料載入失敗，請稍後再試</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => void refetch()} size="sm" variant="outline">
              再試一次
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-md border p-8">
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="text-muted-foreground">資料載入中...</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (!plans?.length) {
    return (
      <div className="rounded-md border p-8">
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="text-muted-foreground">目前尚無盤點計畫</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>盤點計畫名稱</TableHead>
            <TableHead>說明</TableHead>
            <TableHead className="whitespace-nowrap">開始時間</TableHead>
            <TableHead className="whitespace-nowrap">結束時間</TableHead>
            <TableHead className="whitespace-nowrap">狀態</TableHead>
            <TableHead className="whitespace-nowrap">操作</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {plans.map((plan) => {
            const displayStatus = toDisplayStatus(plan.status as InventoryPlanListItem['status']);
            const isInProgress = displayStatus === 'in_progress';

            return (
              <TableRow key={plan.id}>
                <TableCell className="font-medium whitespace-normal">{plan.name}</TableCell>
                <TableCell className="max-w-[28rem] whitespace-normal text-muted-foreground">
                  {plan.description}
                </TableCell>
                <TableCell>{formatDateTime(plan.startAt)}</TableCell>
                <TableCell>{formatDateTime(plan.dueAt)}</TableCell>
                <TableCell>
                  <Badge variant={isInProgress ? 'secondary' : 'default'}>
                    {statusLabelMap[displayStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {isInProgress ? (
                    <Button
                      size="sm"
                      variant="outline"
                      render={(
                        <Link href="/inventory/manual">
                          前往手動盤點
                        </Link>
                      )}
                    >
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}