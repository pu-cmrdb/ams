'use client';

import { ArrowLeftIcon, CalendarDaysIcon, CornerDownRightIcon } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { arktypeResolver } from '@hookform/resolvers/arktype';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { zhTW } from 'react-day-picker/locale';

import Link from 'next/link';

import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BorrowRule, OwnershipType } from '@/lib/enums';
import { Button, buttonVariants } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Calendar } from '@/components/ui/calendar';
import { CategorySelect } from '@/components/category-select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserSelect } from '@/components/user-select';
import { useTRPC } from '@/trpc/react';

import { AssetFormSchema } from '../../_schemas/asset-form-schema';
import { AssetRecordEditor } from './asset-record-editor';

export function AssetCreateForm() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      authorizedLenderIds: [],
      borrowRule: BorrowRule.Public,
      categoryId: '',
      custodian: '',
      description: '',
      location: '',
      name: '',
      ownershipType: OwnershipType.Cmrdb,
      purchaseDate: new Date(),
      records: [],
      schoolAssetNumber: '',
    },
    resolver: arktypeResolver(AssetFormSchema),
  });

  const borrowRule = form.watch('borrowRule');
  const ownershipType = form.watch('ownershipType');

  const { mutate, isPending } = useMutation(
    trpc.asset.create.mutationOptions({
      onError: (error) => {
        toast.error(`新增財產時發生錯誤：${error.message}`);
      },
      onSuccess: async (value) => {
        toast.success(`已成功建立財產「${value.name}」`);

        await queryClient.invalidateQueries({
          queryKey: trpc.asset.list.queryKey(),
        });

        router.push('/assets');
      },
    }),
  );

  const onSubmit: React.SubmitEventHandler = (event) =>
    form.handleSubmit((values) => {
      mutate(values);
    })(event);

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <div className="flex grid-cols-2 flex-col gap-8 lg:grid">
        <FieldSet>
          <FieldLegend>基本資料</FieldLegend>

          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>財產名稱</FieldLabel>

                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  data-1p-ignore
                  id={field.name}
                  placeholder="藍色原子筆"
                  required
                  type="text"
                />

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>財產描述</FieldLabel>

                <Textarea
                  {...field}
                  aria-invalid={fieldState.invalid}
                  className="resize-y"
                  id={field.name}
                  placeholder="無印良品的藍色原子筆..."
                  required
                />

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>財產類別</FieldLabel>

                <CategorySelect
                  {...field}
                  aria-invalid={fieldState.invalid}
                  id={field.name}
                  required
                />

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="custodian"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>保管單位</FieldLabel>

                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  data-1p-ignore
                  id={field.name}
                  placeholder="伺服器維護小組"
                  required
                  type="text"
                />

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="location"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>位置</FieldLabel>

                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  data-1p-ignore
                  id={field.name}
                  placeholder="主顧 304 櫃子上筆筒"
                  required
                  type="text"
                />

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="ownershipType"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>歸屬單位</FieldLabel>

                <NativeSelect
                  {...field}
                  aria-invalid={fieldState.invalid}
                  id={field.name}
                  required
                >
                  <NativeSelectOption value={OwnershipType.Cmrdb}>
                    行雲者研發基地
                  </NativeSelectOption>

                  <NativeSelectOption value={OwnershipType.School}>
                    學校
                  </NativeSelectOption>
                </NativeSelect>

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {ownershipType === OwnershipType.School && (
            <Controller
              control={form.control}
              name="schoolAssetNumber"
              render={({ field, fieldState }) => (
                <div className="flex items-center gap-4">
                  <CornerDownRightIcon className="text-border" />

                  <Field>
                    <FieldLabel htmlFor={field.name}>學校財產編號</FieldLabel>

                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id={field.name}
                      placeholder="學校財產編號"
                      required
                    />

                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                </div>
              )}
            />
          )}

          <Controller
            control={form.control}
            name="borrowRule"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>出借權限</FieldLabel>

                <NativeSelect
                  {...field}
                  aria-invalid={fieldState.invalid}
                  id={field.name}
                  required
                >
                  <NativeSelectOption value={BorrowRule.Public}>
                    公開
                  </NativeSelectOption>

                  <NativeSelectOption value={BorrowRule.Restricted}>
                    限制借用
                  </NativeSelectOption>

                  <NativeSelectOption value={BorrowRule.None}>
                    不可借用
                  </NativeSelectOption>
                </NativeSelect>

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {borrowRule === BorrowRule.Restricted && (
            <Controller
              control={form.control}
              name="authorizedLenderIds"
              render={({ field, fieldState }) => (
                <div className="flex items-center gap-4">
                  <CornerDownRightIcon className="text-border" />

                  <Field>
                    <FieldLabel htmlFor={field.name}>授權出借人</FieldLabel>

                    <UserSelect
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id={field.name}
                      multiple
                      onValueChange={field.onChange}
                      required
                    />

                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                </div>
              )}
            />
          )}

          <Controller
            control={form.control}
            name="purchaseDate"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>購買日期</FieldLabel>

                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        aria-invalid={fieldState.invalid}
                        className="justify-start px-2.5 font-normal"
                        disabled={field.disabled}
                        id={field.name}
                        variant="outline"
                      />
                    }
                  >
                    <CalendarDaysIcon data-icon="inline-start" />

                    {format(field.value, 'LLLdo EEEE, y', { locale: zhTW })}
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      captionLayout="dropdown"
                      defaultMonth={field.value}
                      locale={zhTW}
                      mode="single"
                      onSelect={field.onChange}
                      required
                      selected={field.value}
                    />
                  </PopoverContent>
                </Popover>

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldSet>

        <FieldSet>
          <Controller
            control={form.control}
            name="records"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>財產紀錄</FieldLabel>

                {fieldState.error && <FieldError errors={[fieldState.error]} />}

                <AssetRecordEditor {...field} />
              </Field>
            )}
          />
        </FieldSet>
      </div>

      <Field orientation="horizontal">
        <Button disabled={isPending} type="submit">
          建立
        </Button>

        <Link className={buttonVariants({ variant: 'outline' })} href="/assets">
          <ArrowLeftIcon data-icon="inline-start" />

          <span>返回</span>
        </Link>
      </Field>
    </form>
  );
}
