'use client';

import { GhostIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxValue } from '@/components/ui/combobox';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { env } from '@/env';
import { useTRPC } from '@/trpc/react';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

import type { ComboboxRootProps } from '@base-ui/react';

type UserSelectProps = Readonly<
  Omit<ComboboxRootProps<string, boolean>, 'items'>
>;

export function UserSelect(props: UserSelectProps) {
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.user.list.queryOptions(
      {
        limit: 100,
      },
      {
        select: (data) => data.data,
      },
    ),
  );

  type User = NonNullable<typeof data>[number];

  return (
    <Combobox items={data} {...props}>
      {props.multiple ? (
        <ComboboxChips>
          <ComboboxValue>
            {(props as ComboboxRootProps<string, true>).value?.map((id) => {
              const item = data?.find((item) => item.id === id);
              const name = item?.displayUsername ?? item?.username ?? id;
              return <ComboboxChip key={id}>{name}</ComboboxChip>;
            })}
          </ComboboxValue>

          <ComboboxChipsInput
            autoComplete="off"
            data-1p-ignore
            placeholder="選擇使用者"
          />
        </ComboboxChips>
      ) : (
        <ComboboxInput
          autoComplete="off"
          data-1p-ignore
          placeholder="選擇使用者"
        />
      )}

      <ComboboxContent>
        <ComboboxEmpty>
          <Empty>
            <EmptyMedia variant="icon">
              <GhostIcon />
            </EmptyMedia>

            <EmptyHeader>
              <EmptyTitle>找不到相符的使用者</EmptyTitle>

              <EmptyDescription>
                請確認拼字是否正確，或使用其他關鍵字搜尋
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </ComboboxEmpty>

        <ComboboxList>
          {(item: User) => {
            const name = item.displayUsername ?? item.username;
            return (
              <ComboboxItem key={item.id} value={item.id}>
                <Avatar size="sm">
                  <AvatarImage
                    draggable={false}
                    src={`${env.NEXT_PUBLIC_BETTER_AUTH_IAM_URL}/api/user/${item.id}/image`}
                  />

                  <AvatarFallback>{name[0]}</AvatarFallback>
                </Avatar>

                {name}
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
