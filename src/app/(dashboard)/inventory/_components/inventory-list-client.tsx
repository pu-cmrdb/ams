'use client';

import { Package2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTRPC } from '@/trpc/react';

export function InventoryListClient() {
  const trpc = useTRPC();
  const router = useRouter();

  const { data: plans, isError, isLoading } = useQuery(
    trpc.inventory.list.queryOptions({ limit: 50, offset: 0, sort: 'createdAt', sortDirection: 'desc' }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package2 className="size-5" />
          盤點計畫管理
        </CardTitle>
        <CardDescription>
          檢視與管理系統中所有的盤點計畫。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading
          ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )
          : isError || !plans
            ? (
                <div className="py-10 text-center text-muted-foreground">
                  無法取得盤點計畫列表資料
                </div>
              )
            : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>名稱</TableHead>
                        <TableHead>狀態</TableHead>
                        <TableHead>開始時間</TableHead>
                        <TableHead>截止時間</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.length === 0
                        ? (
                            <TableRow>
                              <TableCell
                                className="
                                  h-32 text-center text-muted-foreground
                                "
                                colSpan={6}
                              >
                                目前沒有盤點計畫資料
                              </TableCell>
                            </TableRow>
                          )
                        : (
                            plans.map((plan) => (
                              <TableRow key={plan.id}>
                                <TableCell className="font-medium">{plan.name}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      plan.status === 'completed'
                                        ? 'default'
                                        : plan.status === 'cancelled'
                                          ? 'destructive'
                                          : 'secondary'
                                    }
                                  >
                                    {plan.status === 'completed'
                                      ? '已完成'
                                      : plan.status === 'cancelled'
                                        ? '已取消'
                                        : '進行中'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(plan.startAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                                <TableCell>{format(new Date(plan.dueAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                                <TableCell className="
                                  max-w-50 truncate text-muted-foreground
                                "
                                >
                                  {plan.description || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    onClick={() => { router.push(`/inventory/${plan.id}`); }}
                                    size="sm"
                                    variant="ghost"
                                  >
                                    檢視詳細
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                    </TableBody>
                  </Table>
                </div>
              )}
      </CardContent>
    </Card>
  );
}
