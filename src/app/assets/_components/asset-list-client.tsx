'use client';

import { useQuery } from '@tanstack/react-query';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const { data: assets, isLoading } = useQuery(
    trpc.asset.list.queryOptions(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>財產總覽</CardTitle>
      </CardHeader>
      <CardContent>
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
                        <TableCell>{asset.quantity}</TableCell>
                        <TableCell>{asset.location}</TableCell>
                        <TableCell>{asset.custodian}</TableCell>
                        <TableCell>{asset.categoryName}</TableCell>
                        <TableCell>
                          <Badge variant={asset.status === 'normal' ? 'default' : 'secondary'}>
                            {statusMap[asset.status] ?? asset.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{borrowRuleMap[asset.borrowRule] ?? asset.borrowRule}</TableCell>
                      </TableRow>
                    ))
                  )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
