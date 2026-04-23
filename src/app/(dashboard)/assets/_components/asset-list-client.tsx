'use client';

import { useQuery } from '@tanstack/react-query';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AssetStatus, BorrowRule, OwnershipType } from '@/lib/enums';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/trpc/react';

// 狀態
const statusMap: Record<AssetStatus, string> = {
  borrowed: '借出',
  lost: '遺失',
  normal: '在庫',
  repairing: '維修',
  scrapped: '報廢',
};

// 歸屬單位
const ownershipMap: Record<OwnershipType, string> = {
  cmrdb: '社團',
  school: '學校',
};

// 借用權限
const borrowRuleMap: Record<BorrowRule, string> = {
  none: '不開放',
  public: '公開借用',
  restricted: '限制借用',
};

export function AssetListClient() {
  const trpc = useTRPC();
  // 抓取最多10000筆資料
  const { data: assets, isError, isLoading, refetch } = useQuery(trpc.asset.list.queryOptions({ limit: 10000 }),
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">歸屬單位</TableHead>
            <TableHead>財產名稱 (含學校產編)</TableHead>
            <TableHead>數量</TableHead>
            <TableHead>位置</TableHead>
            <TableHead className="whitespace-nowrap">保管單位</TableHead>
            <TableHead>類別</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead className="whitespace-nowrap">借用權限</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError
            ? (
                // 檢查錯誤
                <TableRow>
                  <TableCell className="h-24 text-center text-destructive" colSpan={8}>
                    <div className="
                      flex flex-col items-center justify-center gap-2
                    "
                    >
                      <span>資料載入失敗</span>
                      <Button
                        onClick={() => void refetch()}
                        size="sm"
                        variant="outline"
                      >
                        再試一次
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            : isLoading
              ? (
                  // 檢查載入
                  <TableRow>
                    <TableCell
                      className="h-24 text-center text-muted-foreground"
                      colSpan={8}
                    >
                      資料載入中...
                    </TableCell>
                  </TableRow>
                )
              : assets?.length === 0
                ? (
                    // 確認資料狀態
                    <TableRow>
                      <TableCell
                        className="h-24 text-center text-muted-foreground"
                        colSpan={8}
                      >
                        目前尚無財產紀錄
                      </TableCell>
                    </TableRow>
                  )
                : (
                    // 印出資料
                    assets?.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>{ownershipMap[asset.ownershipType] || asset.ownershipType}</TableCell>
                        <TableCell>
                          <div className="font-medium">{asset.name}</div>
                          {asset.schoolAssetNumber && (
                            <div className="text-xs text-muted-foreground">{asset.schoolAssetNumber}</div>
                          )}
                        </TableCell>

                        {/* 使用reduce加總所有record的quantity */}
                        <TableCell>
                          {asset.records.reduce((total, record) => total + record.quantity, 0)}
                        </TableCell>

                        <TableCell>{asset.location}</TableCell>
                        <TableCell>{asset.custodian}</TableCell>
                        <TableCell>{asset.category?.name}</TableCell>

                        {/* 把status展開成Badge,並用Set去除重複 */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {asset.records.length > 0
                              ? (
                                  Array.from(new Set(asset.records.map((r) => r.status))).map(
                                    (status) => (
                                      <Badge
                                        key={status}
                                        variant={status === 'normal' ? 'default' : 'secondary'}
                                      >
                                        {statusMap[status as keyof typeof statusMap] || status}
                                      </Badge>
                                    ),
                                  )
                                )
                              : (
                                  <Badge variant="outline">無狀態</Badge>
                                )}
                          </div>
                        </TableCell>

                        <TableCell>{borrowRuleMap[asset.borrowRule] || asset.borrowRule}</TableCell>
                      </TableRow>
                    ))
                  )}
        </TableBody>
      </Table>
    </div>
  );
}
