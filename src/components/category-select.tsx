'use client';

import { ShapesIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox';
import { useTRPC } from '@/trpc/react';

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty';

import type { ComboboxRootProps } from '@base-ui/react';

type Value = { label: string; value: string };

type CategorySelectProps = Readonly<
  Omit<
    ComboboxRootProps<string, false>,
    | 'items'
    | 'isItemEqualToValue'
    | 'onValueChange'
    | 'itemToStringLabel'
    | 'itemToStringValue'
  > & {
    onChange?: (value: string) => void;
  }
>;

export function CategorySelect({
  value,
  onChange,
  disabled,
}: CategorySelectProps): React.ReactNode {
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.category.list.queryOptions(
      { limit: 100 },
      {
        select: (data) => data.map((c) => ({ label: c.name, value: c.id })),
      },
    ),
  );

  const selectedValue = data?.find((item) => item.value === value) ?? null;

  return (
    <Combobox
      disabled={disabled}
      isItemEqualToValue={(a, b) => a?.value === b?.value}
      items={data}
      onValueChange={(val: Value | null) => onChange?.(val?.value ?? '')}
      value={selectedValue}
    >
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
          {(item: Value, index) => (
            <ComboboxItem index={index} key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
