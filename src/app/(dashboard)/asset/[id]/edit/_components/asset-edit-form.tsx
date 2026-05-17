'use client';

import { ArrowLeftIcon, CalendarDaysIcon, CornerDownRightIcon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { arktypeResolver } from '@hookform/resolvers/arktype';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { zhTW } from 'react-day-picker/locale';

import Link from 'next/link';

import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BorrowRule, OwnershipType } from '@/lib/enums';
import { Button, buttonVariants } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { AssetFormSchema } from '@/app/(dashboard)/assets/_schemas/asset-form-schema';
import { AssetRecordEditor } from '@/app/(dashboard)/assets/new/_components/asset-record-editor';
import { Calendar } from '@/components/ui/calendar';
import { CategorySelect } from '@/components/category-select';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { UserSelect } from '@/components/user-select';
import { useTRPC } from '@/trpc/react';


type AssetEditFormProps = Readonly<{
  assetId: string;
}>;

export function AssetEditForm({ assetId }: AssetEditFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const {
    data,
    error,
    isPending: isQueryPending,
  } = useQuery({
    ...trpc.asset.get.queryOptions({ id: assetId }),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const assetValues = useMemo(
    () => {
      if (!data) {
        return undefined;
      }
      return {
        authorizedLenderIds: data.authorizedLenders.map((v) => v.userId),
        borrowRule: data.borrowRule,
        categoryId: data.categoryId,
        custodian: data.custodian,
        description: data.description ?? '',
        location: data.location,
        name: data.name,
        ownershipType: data.ownershipType,
        purchaseDate:
          data.purchaseDate instanceof Date
            ? data.purchaseDate
            : new Date(data.purchaseDate ?? new Date()),
        records: data.records.map((record) => ({
          note: record.note ?? '',
          quantity: record.quantity,
          status: record.status,
        })),
        schoolAssetNumber: data.schoolAssetNumber ?? '',
      };
    },
    [data],
  );

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
    resetOptions: {
      keepDirtyValues: true,
      keepErrors: true,
    },
    resolver: arktypeResolver(AssetFormSchema),
    values: assetValues,
  });

  const borrowRule = form.watch('borrowRule');
  const ownershipType = form.watch('ownershipType');

  const { mutate: updateAsset, isPending: isUpdatePending } = useMutation(
    trpc.asset.update.mutationOptions({
      onError: (mutationError) => {
        toast.error(`更新財產時發生錯誤：${mutationError.message}`);
      },
    }),
  );

  const { mutate: updateRecord, isPending: isRecordPending } = useMutation(
    trpc.asset.updateRecord.mutationOptions({
      onError: (mutationError) => {
        toast.error(`更新財產紀錄時發生錯誤：${mutationError.message}`);
      },
      onSuccess: async () => {
        toast.success('已成功更新財產');

        await queryClient.invalidateQueries({
          queryKey: trpc.asset.list.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.asset.get.queryKey({ id: assetId }),
        });

        router.push('/assets');
      },
    }),
  );

  const isSubmitting = isUpdatePending || isRecordPending || form.formState.isSubmitting;

  const onSubmit: React.SubmitEventHandler = (event) =>
    form.handleSubmit((values) => {
      const updateAssetInput =
        values.borrowRule === BorrowRule.Restricted
          ? {
              authorizedLenderIds: values.authorizedLenderIds,
              borrowRule: values.borrowRule,
              categoryId: values.categoryId,
              custodian: values.custodian,
              description: values.description,
              id: assetId,
              location: values.location,
              name: values.name,
              ownershipType: values.ownershipType,
              purchaseDate: values.purchaseDate,
              schoolAssetNumber: values.schoolAssetNumber,
            }
          : {
              borrowRule: values.borrowRule,
              categoryId: values.categoryId,
              custodian: values.custodian,
              description: values.description,
              id: assetId,
              location: values.location,
              name: values.name,
              ownershipType: values.ownershipType,
              purchaseDate: values.purchaseDate,
              schoolAssetNumber: values.schoolAssetNumber,
            };

      updateAsset(updateAssetInput as Parameters<typeof updateAsset>[0], {
        onSuccess: () => {
          updateRecord({
            id: assetId,
            records: values.records,
          });
        },
      });
    })(event);

  if (isQueryPending) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Spinner />
        <span>載入中</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive">載入財產資料失敗：{error.message}</div>
    );
  }

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
        <Button disabled={isSubmitting} type="submit">
          更新
        </Button>

        <Link className={buttonVariants({ variant: 'outline' })} href="/assets">
          <ArrowLeftIcon data-icon="inline-start" />

          <span>返回</span>
        </Link>
      </Field>
    </form>
  );
}
