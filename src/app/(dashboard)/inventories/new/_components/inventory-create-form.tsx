'use client';

import { ArrowLeftIcon, CalendarDaysIcon } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { addDays, format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { arktypeResolver } from '@hookform/resolvers/arktype';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { zhTW } from 'react-day-picker/locale';

import Link from 'next/link';

import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserSelect } from '@/components/user-select';
import { type } from '@/lib/arktype';
import { useTRPC } from '@/trpc/react';

import { AssetPicker } from './asset-picker';

import type { SubmitEventHandler } from 'react';

const InventoryCreateFormSchema = type({
  assetIds: type.string.array().atLeastLength(1).configure({
    message: '必須至少選擇一項要盤點的財產',
  }),
  assigneeIds: type.string.array().atLeastLength(1).configure({
    message: '必須至少要有一位盤點人員',
  }),
  description: 'string',
  dueAt: type.Date,
  name: type.string.atLeastLength(1).configure({
    message: '盤點計劃名稱不得為空',
  }),
  startAt: type.Date,
});

export function InventoryCreateForm() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { isPending, mutate } = useMutation(
    trpc.inventory.create.mutationOptions({
      onError: (error) => {
        toast.error(`建立盤點計劃時發生錯誤：${error.message}`);
      },
      onSuccess: async (value) => {
        toast.success(`已成功建立盤點計劃「${value.name}」`);

        await queryClient.invalidateQueries({
          queryKey: trpc.inventory.list.queryKey(),
        });

        router.push('/inventories');
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      assetIds: [],
      assigneeIds: [],
      description: '',
      dueAt: addDays(new Date(), 7),
      name: '',
      startAt: new Date(),
    },
    resolver: arktypeResolver(InventoryCreateFormSchema),
  });

  const onSubmit = useCallback<SubmitEventHandler>(
    (e) => form.handleSubmit((value) => mutate(value))(e),
    [form, mutate],
  );

  const startAt = form.watch('startAt');

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <div className="flex grid-cols-2 flex-col gap-8 lg:grid">
        <FieldSet>
          <FieldLegend>基礎資訊</FieldLegend>

          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>名稱</FieldLabel>

                <Input
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  data-1p-ignore
                  disabled={isPending}
                  id={field.name}
                  placeholder="期末數量盤點"
                  required
                  {...field}
                />

                <FieldError errors={fieldState.error && [fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>計劃敘述</FieldLabel>

                <Textarea
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  className="resize-y"
                  data-1p-ignore
                  disabled={isPending}
                  id={field.name}
                  {...field}
                />

                <FieldError errors={fieldState.error && [fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="assigneeIds"
            render={({ field: { onChange, ...field }, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>盤點人員</FieldLabel>

                <UserSelect
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                  id={field.name}
                  multiple
                  onValueChange={onChange}
                  {...field}
                />

                <FieldError errors={fieldState.error && [fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="startAt"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>開始日期</FieldLabel>

                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        className="justify-start px-2.5 font-normal"
                        id={field.name}
                        variant="outline"
                      >
                        <CalendarDaysIcon data-icon="inline-start" />

                        {format(field.value, 'LLLdo EEEE, y', {
                          locale: zhTW,
                        })}
                      </Button>
                    }
                  />

                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      captionLayout="dropdown"
                      defaultMonth={field.value}
                      disabled={{ before: new Date() }}
                      locale={zhTW}
                      mode="single"
                      onSelect={field.onChange}
                      selected={field.value}
                    />
                  </PopoverContent>
                </Popover>

                <FieldError errors={fieldState.error && [fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="dueAt"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>截止日期</FieldLabel>

                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        className="justify-start px-2.5 font-normal"
                        id={field.name}
                        variant="outline"
                      >
                        <CalendarDaysIcon data-icon="inline-start" />

                        {format(field.value, 'LLLdo EEEE, y', { locale: zhTW })}
                      </Button>
                    }
                  />

                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      captionLayout="dropdown"
                      defaultMonth={field.value}
                      disabled={{ before: startAt }}
                      locale={zhTW}
                      mode="single"
                      onSelect={field.onChange}
                      selected={field.value}
                    />
                  </PopoverContent>
                </Popover>

                <FieldError errors={fieldState.error && [fieldState.error]} />
              </Field>
            )}
          />
        </FieldSet>

        <FieldSet>
          <FieldLegend>盤點財產清單</FieldLegend>

          <Controller
            control={form.control}
            name="assetIds"
            render={({ field, fieldState }) => (
              <Field>
                <FieldDescription>
                  請選擇這個盤點計劃的目標財產
                </FieldDescription>

                {fieldState.error && <FieldError errors={[fieldState.error]} />}

                <AssetPicker {...field} />
              </Field>
            )}
          />
        </FieldSet>
      </div>

      <Field orientation="horizontal">
        <Button type="submit">建立</Button>

        <Link
          className={buttonVariants({ variant: 'outline' })}
          href="/inventories"
        >
          <ArrowLeftIcon data-icon="inline-start" />

          <span>返回</span>
        </Link>
      </Field>
    </form>
  );
}
