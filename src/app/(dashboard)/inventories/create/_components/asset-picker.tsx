'use client';

import { PlusIcon, SearchXIcon, Trash2Icon } from 'lucide-react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import Image from 'next/image';

import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useTRPC } from '@/trpc/react';

type AssetPickerProps = Readonly<{
  onChange: (value: string[]) => void;
  value: string[];
}>;

export function AssetPicker({ onChange, value }: AssetPickerProps) {
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.category.list.queryOptions({
      limit: 100,
    }),
  );

  const onItemSelect = (assetId: string) => {
    const newValue = [...value];

    if (newValue.includes(assetId)) {
      newValue.splice(newValue.indexOf(assetId), 1);
    } else {
      newValue.push(assetId);
    }

    onChange(newValue);
  };

  const onGroupSelect = (categoryId: string) => {
    const newValue = [...value];

    const category = data?.find((category) => category.id === categoryId);
    if (!category) {
      return;
    }

    const ids = category.assets.map((asset) => asset.id);
    const selected = category.assets.every((asset) =>
      newValue.includes(asset.id),
    );

    if (selected) {
      for (const id of ids) {
        const index = newValue.indexOf(id);

        if (index !== -1) {
          newValue.splice(index, 1);
        }
      }
    } else {
      newValue.push(...ids.filter((id) => !newValue.includes(id)));
    }

    onChange(newValue);
  };

  const onClear = () => {
    onChange([]);
  };

  const content = data?.map((category) => (
    <CommandGroup
      heading={
        <CommandItem onSelect={onGroupSelect} value={category.id}>
          <Checkbox
            checked={category.assets.every((asset) => value.includes(asset.id))}
          />
          {category.name}
        </CommandItem>
      }
      key={category.id}
    >
      {category.assets.map((asset) => (
        <CommandItem key={asset.id} onSelect={onItemSelect} value={asset.id}>
          <Checkbox checked={value.includes(asset.id)} />
          {asset.name}
        </CommandItem>
      ))}
    </CommandGroup>
  ));

  const assets = useMemo(
    () => data?.flatMap((category) => category.assets),
    [data],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger
            render={
              <Button>
                <PlusIcon data-icon="inline-start" />
                <span>新增財產</span>
              </Button>
            }
          />
          <PopoverContent align="start" className="w-auto p-0">
            <Command>
              <CommandInput />
              <CommandList>
                <CommandEmpty>
                  <Empty>
                    <EmptyMedia variant="icon">
                      <SearchXIcon />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>找不到相符的財產</EmptyTitle>
                      <EmptyDescription>
                        請確認拼字是否正確，或使用其他關鍵字搜尋
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </CommandEmpty>
                {content}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {value.length > 0 && (
          <Button onClick={onClear} variant="outline">
            清除
          </Button>
        )}
      </div>
      <ItemGroup>
        {value.map((id) => {
          const item = assets?.find((asset) => asset.id === id);

          if (!item) {
            return (
              <Item key={id} variant="outline">
                <ItemContent>
                  <ItemTitle>
                    <Skeleton className="w-12" />
                  </ItemTitle>
                  <ItemDescription>
                    <Skeleton className="w-28" />
                  </ItemDescription>
                </ItemContent>
              </Item>
            );
          }

          return (
            <Item key={id} variant="outline">
              {item.imageHash && (
                <ItemMedia variant="image">
                  <Image
                    alt={item.name}
                    fill
                    src={`/api/image/${item.imageHash}`}
                  />
                </ItemMedia>
              )}
              <ItemContent>
                <ItemTitle>{item.name}</ItemTitle>
                <ItemDescription>{item.description}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  onClick={() => onItemSelect(id)}
                  size="icon"
                  variant="destructive"
                >
                  <Trash2Icon />
                </Button>
              </ItemActions>
            </Item>
          );
        })}
      </ItemGroup>
    </div>
  );
}
