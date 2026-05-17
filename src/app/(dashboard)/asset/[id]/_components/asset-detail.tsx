'use client';

import { ArrowLeftIcon, Edit2Icon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import Link from 'next/link';

import { OwnershipType } from '@/lib/enums';
import { Spinner } from '@/components/ui/spinner';
import { buttonVariants } from '@/components/ui/button';
import { useTRPC } from '@/trpc/react';


const OwnershipTypeMap: Record<OwnershipType, string> = {
  [OwnershipType.Cmrdb]: '行雲財產',
  [OwnershipType.School]: '學校財產',
};

type AssetDetailProps = Readonly<{
  assetId: string;
}>;

export function AssetDetail({ assetId }: AssetDetailProps) {
  const trpc = useTRPC();

  const { data, isPending, error } = useQuery({
    ...trpc.asset.get.queryOptions({ id: assetId }),
    refetchOnWindowFocus: false,
  });

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
      <div className="space-y-4 rounded-lg border p-6">
        <div>
          <p className="text-muted-foreground text-sm">財產名稱</p>
          <p className="font-semibold text-lg">{data.name}</p>
        </div>

        <div>
          <p className="text-muted-foreground text-sm">描述</p>
          <p>{data.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-sm">保管單位</p>
            <p>{data.custodian}</p>
          </div>

          <div>
            <p className="text-muted-foreground text-sm">位置</p>
            <p>{data.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-sm">歸屬單位</p>
            <p>{OwnershipTypeMap[data.ownershipType] || data.ownershipType}</p>
          </div>

          {data.schoolAssetNumber && (
            <div>
              <p className="text-muted-foreground text-sm">學校財產編號</p>
              <p>{data.schoolAssetNumber}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Link className={buttonVariants()} href={`/asset/${assetId}/edit`}>
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
