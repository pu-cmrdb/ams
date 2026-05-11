'use client';

import { Edit2Icon, LayoutGridIcon, LayoutListIcon, LockOpenIcon, MoreVerticalIcon, PlusIcon, RotateCcwIcon, ShapesIcon, Trash2Icon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useQuery } from '@tanstack/react-query';

import Image from 'next/image';
import Link from 'next/link';

import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemHeader, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button, buttonVariants } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { BorrowRule } from '@/lib/enums';
import { Kbd } from '@/components/ui/kbd';
import { OwnershipType } from '@/lib/enums';
import { Spinner } from '@/components/ui/spinner';
import { usePlatform } from '@/components/providers/platform-provider';
import { useTRPC } from '@/trpc/react';

import DeleteAssetDialog from '@/components/dialogs/delete-asset';

import type { inferProcedureOutput } from '@trpc/server';

import type { AppRouter } from '@/server/api/root';

type Asset = inferProcedureOutput<AppRouter['asset']['list']>[number];

const OwnershipLabelMap: Record<OwnershipType, string> = {
  [OwnershipType.Cmrdb]: '行雲財產',
  [OwnershipType.School]: '學校財產',
};

const BorrowRuleMap: Record<BorrowRule, string> = {
  [BorrowRule.None]: '不開放',
  [BorrowRule.Public]: '公開',
  [BorrowRule.Restricted]: '限制',
};

const BorrowRuleIconMap: Record<BorrowRule, React.ReactElement> = {
  [BorrowRule.None]: <XIcon data-icon="inline-start" />,
  [BorrowRule.Public]: <LockOpenIcon data-icon="inline-start" />,
  [BorrowRule.Restricted]: <LockOpenIcon data-icon="inline-start" />,
};

export function AssetList() {
  const trpc = useTRPC();
  const [layout, setLayout] = useState<'list' | 'grid'>('list');

  const { data, error, isPending, isRefetching, refetch } = useQuery(
    trpc.asset.list.queryOptions({ limit: 20 }),
  );

  let children: React.ReactElement;

  if (error) {
    children = (
      <Empty>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon />
        </EmptyMedia>

        <EmptyHeader>
          <EmptyTitle>發生錯誤</EmptyTitle>

          <EmptyDescription>載入列表時發生錯誤</EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <Button
            disabled={isRefetching}
            onClick={() => void refetch()}
            variant="outline"
          >
            <RotateCcwIcon data-icon="inline-start" />

            <span>再試一次</span>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (isPending) {
    children = (
      <Empty>
        <EmptyHeader>
          <EmptyTitle className="flex items-center gap-2">
            <Spinner />

            <span>載入中</span>
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  if (data?.length) {
    children = (
      <ItemGroup
        className="grid-cols-[repeat(auto-fill,minmax(var(--container-2xs),1fr))] data-[layout=grid]:grid"
        data-layout={layout}
      >
        {data.map((asset) => (
          <AssetListItem asset={asset} key={asset.id} />
        ))}
      </ItemGroup>
    );
  } else {
    children = (
      <div className="rounded-md border p-8">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>沒有財產紀錄</EmptyTitle>

            <EmptyDescription>
              目前還沒有財產紀錄，點擊上方建立來新增一個
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between" role="toolbar">
        <div className="flex items-center gap-4">
          {data ? `共有 ${data.length} 筆資料` : '載入中'}
        </div>

        <div className="flex items-center gap-4">
          <ToggleGroup
            onValueChange={([value]) => setLayout(value as 'list' | 'grid')}
            value={[layout]}
            variant="outline"
          >
            <Tooltip>
              <TooltipTrigger
                delay={0}
                render={<ToggleGroupItem aria-label="列表顯示" value="list" />}
              >
                <LayoutListIcon />
              </TooltipTrigger>

              <TooltipContent sideOffset={8}>列表顯示</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                delay={0}
                render={<ToggleGroupItem aria-label="網格顯示" value="grid" />}
              >
                <LayoutGridIcon />
              </TooltipTrigger>

              <TooltipContent sideOffset={8}>網格顯示</TooltipContent>
            </Tooltip>
          </ToggleGroup>

          <Link className={buttonVariants()} href="/assets/new">
            <PlusIcon data-icon="inline-start" />

            <span>建立</span>
          </Link>
        </div>
      </div>

      {children}
    </div>
  );
}

type AssetItemProps = Readonly<{
  asset: Asset;
}>;

function AssetListItem({ asset }: AssetItemProps) {
  return (
    <Item variant="outline">
      <ItemHeader className="h-32 rounded-lg bg-muted group-data-[layout=list]/item-group:hidden">
        {asset.imageHash ? (
          <Image alt={asset.name} fill src={`/api/image/${asset.imageHash}`} />
        ) : (
          <ShapesIcon className="m-auto size-5 text-muted-foreground" />
        )}
      </ItemHeader>

      <ItemMedia
        className="bg-muted group-data-[layout=grid]/item-group:hidden"
        variant="image"
      >
        {asset.imageHash ? (
          <Image alt={asset.name} fill src={`/api/image/${asset.imageHash}`} />
        ) : (
          <ShapesIcon className="size-5 text-muted-foreground" />
        )}
      </ItemMedia>

      <ItemContent>
        <ItemTitle>
          <Link href={`/asset/${asset.id}`}>{asset.name}</Link>

          <Badge variant="secondary">
            {OwnershipLabelMap[asset.ownershipType]}
          </Badge>

          <Badge variant="outline">
            {BorrowRuleIconMap[asset.borrowRule]}
            {BorrowRuleMap[asset.borrowRule]}
          </Badge>
        </ItemTitle>

        <ItemDescription>{asset.description}</ItemDescription>
      </ItemContent>

      <ItemActions>
        <AssetListItemDropdown asset={asset} />
      </ItemActions>
    </Item>
  );
}

function AssetListItemDropdown({ asset }: AssetItemProps) {
  const { ctrl, ctrlKey, isMacOS } = usePlatform();

  const [isDropdownMenuOpen, setDropdownMenuOpen] = useState(false);
  const [isDeleteAssetDialogOpen, setDeleteAssetDialogOpen] = useState(false);

  const editRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);

  useHotkeys(
    `${ctrlKey}+e`,
    () => editRef.current?.click(),
    {
      description: '編輯財產資訊',
      enabled: isDropdownMenuOpen,
    },
    [editRef],
  );
  useHotkeys(
    isMacOS ? `${ctrlKey}+backspace` : 'delete',
    () => deleteRef.current?.click(),
    {
      description: '刪除財產',
      enabled: isDropdownMenuOpen,
    },
    [deleteRef],
  );

  return (
    <DropdownMenu onOpenChange={setDropdownMenuOpen} open={isDropdownMenuOpen}>
      <DropdownMenuTrigger render={<Button size="icon" variant="ghost" />}>
        <MoreVerticalIcon />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem
          ref={editRef}
          render={<Link href={`/asset/${asset.id}/edit`} />}
        >
          <Edit2Icon data-icon="inline-start" />

          <span>編輯</span>

          <DropdownMenuShortcut>
            <Kbd>{ctrl}E</Kbd>
          </DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setDeleteAssetDialogOpen(true)}
          ref={deleteRef}
          variant="destructive"
        >
          <Trash2Icon data-icon="inline-start" />

          <span>刪除</span>

          <DropdownMenuShortcut>
            <Kbd>{isMacOS ? <>{ctrl}⌫</> : 'Delete'}</Kbd>
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>

      <DeleteAssetDialog
        assetId={asset.id}
        assetName={asset.name}
        onOpenChange={setDeleteAssetDialogOpen}
        open={isDeleteAssetDialogOpen}
      />
    </DropdownMenu>
  );
}
