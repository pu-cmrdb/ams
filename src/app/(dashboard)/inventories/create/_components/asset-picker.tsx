'use client';

import { SearchXIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

  return (
    <div>
      <Popover>
        <PopoverTrigger render={<Button>新增財產</Button>} />
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
    </div>
  );
}
