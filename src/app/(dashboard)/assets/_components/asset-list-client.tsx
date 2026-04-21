'use client';

import { useQuery } from '@tanstack/react-query';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTRPC } from '@/trpc/react';

// 狀態
const statusMap: Record<string, string> = {
  borrowed: '借出',
  lost: '遺失',
  normal: '在庫',
  repairing: '維修',
  scrapped: '報廢',
};

// 歸屬單位
const ownershipMap: Record<string, string> = {
  cmrdb: '社團',
  school: '學校',
};

// 借用權限
const borrowRuleMap: Record<string, string> = {
  none: '不開放',
  public: '公開借用',
  restricted: '限制借用',
};

export function AssetListClient() {
  const trpc = useTRPC();
  // 抓取全部資料
  const { data: assets, isError, isLoading } = useQuery(
    trpc.asset.list.queryOptions({
      limit: Number.MAX_SAFE_INTEGER,
    }),
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
          {isError && (
            <TableRow>
              <TableCell className="h-24 text-center text-destructive" colSpan={8}>
                資料載入失敗，請重新整理頁面
              </TableCell>
            </TableRow>
          )}
          {isLoading
            ? (
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
                  assets?.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>{ownershipMap[asset.ownershipType] ?? asset.ownershipType}</TableCell>
                      <TableCell>
                        <div className="font-medium">{asset.name}</div>
                        {asset.schoolAssetNumber && (
                          <div className="text-xs text-muted-foreground">{asset.schoolAssetNumber}</div>
                        )}
                      </TableCell>
                      <TableCell>{asset.records[0]?.quantity ?? 0}</TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>{asset.custodian}</TableCell>
                      <TableCell>{asset.category?.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            asset.records[0]?.status === 'normal'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {asset.records[0]
                            ? (statusMap[
                                asset.records[0].status as keyof typeof statusMap
                              ] ?? asset.records[0].status)
                            : '無狀態'}
                        </Badge>
                      </TableCell>
                      <TableCell>{borrowRuleMap[asset.borrowRule] ?? asset.borrowRule}</TableCell>
                    </TableRow>
                  ))
                )}
        </TableBody>
      </Table>
    </div>
  );
}
