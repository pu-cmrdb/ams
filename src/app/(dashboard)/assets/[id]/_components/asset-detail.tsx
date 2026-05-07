'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/react';
import { Spinner } from '@/components/ui/spinner';
import { buttonVariants } from '@/components/ui/button';
import { ArrowLeftIcon, Edit2Icon } from 'lucide-react';
import Link from 'next/link';

const OwnershipTypeMap: Record<string, string> = {
  cmrdb: '行雲者研發基地',
  school: '學校',
};

type AssetDetailProps = Readonly<{
  assetId: string;
}>;

export function AssetDetail({ assetId }: AssetDetailProps) {
  const trpc = useTRPC();

  const { data, isPending, error } = useQuery(
    trpc.asset.get.queryOptions({ id: assetId }),
  );

  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Spinner />
        <span>載入中</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-destructive">
        載入財產資料失敗：{error?.message || '未知錯誤'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">財產名稱</p>
          <p className="text-lg font-semibold">{data.name}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">描述</p>
          <p>{data.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">保管單位</p>
            <p>{data.custodian}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">位置</p>
            <p>{data.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">歸屬單位</p>
            <p>{OwnershipTypeMap[data.ownershipType] || data.ownershipType}</p>
          </div>

          {data.schoolAssetNumber && (
            <div>
              <p className="text-sm text-muted-foreground">學校財產編號</p>
              <p>{data.schoolAssetNumber}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          className={buttonVariants()}
          href={`/assets/${assetId}/edit`}
        >
          <Edit2Icon data-icon="inline-start" />
          修改
        </Link>

        <Link className={buttonVariants({ variant: 'outline' })} href="/assets">
          <ArrowLeftIcon data-icon="inline-start" />
          返回
        </Link>
      </div>
    </div>
  );
}
