'use client';

import { ChevronRightIcon, CircleCheckIcon, CircleDotIcon, CircleSlashIcon, RotateCcwIcon, SquareDashedTextIcon, TriangleAlertIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import Link from 'next/link';

import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { InventoryPlanStatus } from '@/lib/enums';
import { useTRPC } from '@/trpc/react';

function getStatusIcon(status: InventoryPlanStatus): React.ReactNode {
  switch (status) {
    case InventoryPlanStatus.Pending:
      return <CircleDotIcon />;

    case InventoryPlanStatus.Completed:
      return <CircleCheckIcon />;

    case InventoryPlanStatus.Cancelled:
      return <CircleSlashIcon />;
  }
}

export function InventoryList(): React.ReactNode {
  const trpc = useTRPC();

  const { data, error, isPending, isRefetching, refetch } = useQuery(
    trpc.inventory.list.queryOptions({ limit: 100 }),
  );

  if (error) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon />
        </EmptyMedia>

        <EmptyHeader>
          <EmptyTitle>發生錯誤</EmptyTitle>

          <EmptyDescription>取得盤點計劃列表時發生錯誤</EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <Button disabled={isRefetching} onClick={() => refetch()}>
            <RotateCcwIcon data-icon="inline-start" />

            <span>再試一次</span>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (isPending) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>載入中</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!data?.length) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <SquareDashedTextIcon />
        </EmptyMedia>

        <EmptyHeader>
          <EmptyTitle>沒有盤點計劃</EmptyTitle>

          <EmptyDescription>
            目前還沒有盤點計劃，點擊上方創建來新增一個
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ItemGroup>
      {data.map((item) => (
        <Item
          key={item.id}
          render={
            <Link href={`/inventory/${item.id}`}>
              <ItemMedia variant="icon">{getStatusIcon(item.status)}</ItemMedia>

              <ItemContent>
                <ItemTitle>{item.name}</ItemTitle>

                <ItemDescription>{item.description}</ItemDescription>
              </ItemContent>

              <ItemActions>
                <ChevronRightIcon />
              </ItemActions>
            </Link>
          }
          variant="outline"
        />
      ))}
    </ItemGroup>
  );
}
