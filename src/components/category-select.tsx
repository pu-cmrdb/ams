'use client';

import { ShapesIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox';
import { useTRPC } from '@/trpc/react';

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty';

import type { ComboboxRootProps } from '@base-ui/react';

type CategorySelectProps = Readonly<
  Omit<ComboboxRootProps<string, false>, 'items'>
>;

export function CategorySelect(props: CategorySelectProps): React.ReactNode {
  const trpc = useTRPC();

  const { data } = useQuery(trpc.category.list.queryOptions({ limit: 100 }));

  return (
    <Combobox items={data} {...props}>
      <ComboboxInput
        autoComplete="off"
        data-1p-ignore
        placeholder="選擇財產類別"
      />

      <ComboboxContent>
        <ComboboxEmpty>
          <Empty>
            <EmptyMedia variant="icon">
              <ShapesIcon />
            </EmptyMedia>

            <EmptyHeader>
              <EmptyTitle>找不到相符的財產類別</EmptyTitle>

              <EmptyDescription>
                請確認拼字是否正確，或使用其他關鍵字搜尋
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </ComboboxEmpty>

        <ComboboxList>
          {data?.map((category) => (
            <ComboboxItem key={category.id} value={category.id}>
              {category.name}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
