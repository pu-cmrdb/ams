'use client';

import { AlertCircleIcon, ChevronDownIcon, LoaderCircleIcon } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AssetStatus, BorrowRule, OwnershipType } from '@/lib/enums';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTRPC } from '@/trpc/react';

interface AssetFormProps {
  assetId?: string;
  mode: 'create' | 'edit';
}

interface AssetFormValues {
  authorizedLenderIds: string[];
  borrowRule: BorrowRule;
  categoryId: string;
  custodian: string;
  description: string;
  location: string;
  name: string;
  ownershipType: OwnershipType;
  purchaseDate: string;
  quantity: number;
  schoolAssetNumber: string;
  status: AssetStatus;
}

const defaultValues: AssetFormValues = {
  authorizedLenderIds: [],
  borrowRule: BorrowRule.Public,
  categoryId: '',
  custodian: '',
  description: '',
  location: '',
  name: '',
  ownershipType: OwnershipType.Cmrdb,
  purchaseDate: '',
  quantity: 1,
  schoolAssetNumber: '',
  status: AssetStatus.Normal,
};

const statusOptions: { label: string; value: AssetStatus }[] = [
  { label: '正常', value: AssetStatus.Normal },
  { label: '維修中', value: AssetStatus.Repairing },
  { label: '遺失', value: AssetStatus.Lost },
  { label: '報廢', value: AssetStatus.Scrapped },
];

export function AssetForm({ assetId, mode }: AssetFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const initializedAssetIdRef = useRef<null | string>(null);
  const previousOwnershipTypeRef = useRef<null | OwnershipType>(null);
  const previousBorrowRuleRef = useRef<null | BorrowRule>(null);

  const [submitError, setSubmitError] = useState<null | string>(null);

  const form = useForm<AssetFormValues>({
    defaultValues,
  });

  const createMutation = useMutation(trpc.asset.create.mutationOptions());
  const updateMutation = useMutation(trpc.asset.update.mutationOptions());
  const updateRecordMutation = useMutation(trpc.asset.updateRecord.mutationOptions());

  const categoriesQuery = useQuery(trpc.category.list.queryOptions({
    limit: 200,
    offset: 0,
  }));

  const usersQuery = useQuery(trpc.user.list.queryOptions({
    cursor: 0,
    limit: 100,
  }));

  const assetQuery = useQuery({
    ...trpc.asset.get.queryOptions({ id: assetId ?? '' }),
    enabled: mode === 'edit' && (assetId?.trim().length ?? 0) > 0,
  });

  const ownershipType = useWatch({ control: form.control, name: 'ownershipType' });
  const borrowRule = useWatch({ control: form.control, name: 'borrowRule' });
  const authorizedLenderIds = useWatch({ control: form.control, name: 'authorizedLenderIds' });
  const status = useWatch({ control: form.control, name: 'status' });

  useEffect(() => {
    const previousOwnershipType = previousOwnershipTypeRef.current;

    if (previousOwnershipType === OwnershipType.School && ownershipType !== OwnershipType.School) {
      form.setValue('schoolAssetNumber', '');
      form.clearErrors('schoolAssetNumber');
    }

    previousOwnershipTypeRef.current = ownershipType;
  }, [form, ownershipType]);

  useEffect(() => {
    const previousBorrowRule = previousBorrowRuleRef.current;

    if (previousBorrowRule === BorrowRule.Restricted && borrowRule !== BorrowRule.Restricted) {
      form.setValue('authorizedLenderIds', []);
      form.clearErrors('authorizedLenderIds');
    }

    previousBorrowRuleRef.current = borrowRule;
  }, [borrowRule, form]);

  useEffect(() => {
    if (mode !== 'edit') {
      initializedAssetIdRef.current = null;
      return;
    }

    if (assetId && initializedAssetIdRef.current !== assetId) {
      initializedAssetIdRef.current = null;
    }
  }, [assetId, mode]);

  useEffect(() => {
    if (mode !== 'edit' || !assetQuery.data || !assetId) return;
    if (initializedAssetIdRef.current === assetId) return;

    const normalRecord = assetQuery.data.records.find((record) => record.status === AssetStatus.Normal);
    const firstRecord = assetQuery.data.records[0];
    const displayRecord = normalRecord ?? firstRecord;

    form.reset({
      authorizedLenderIds: assetQuery.data.authorizedLenders.map((lender) => lender.userId),
      borrowRule: assetQuery.data.borrowRule,
      categoryId: assetQuery.data.categoryId,
      custodian: assetQuery.data.custodian,
      description: assetQuery.data.description ?? '',
      location: assetQuery.data.location,
      name: assetQuery.data.name,
      ownershipType: assetQuery.data.ownershipType,
      purchaseDate: toDateInputValue(assetQuery.data.purchaseDate),
      quantity: displayRecord?.quantity ?? 1,
      schoolAssetNumber: assetQuery.data.schoolAssetNumber ?? '',
      status: displayRecord?.status ?? AssetStatus.Normal,
    });

    initializedAssetIdRef.current = assetId;
  }, [assetId, assetQuery.data, form, mode]);

  useEffect(() => {
    if (mode !== 'edit' || !assetQuery.data) return;

    form.setValue('categoryId', assetQuery.data.categoryId, { shouldDirty: false, shouldValidate: false });
    form.setValue('ownershipType', assetQuery.data.ownershipType, { shouldDirty: false, shouldValidate: false });
    form.setValue('borrowRule', assetQuery.data.borrowRule, { shouldDirty: false, shouldValidate: false });
  }, [assetQuery.data, form, mode]);

  const usersData = usersQuery.data?.data;
  const users = useMemo(() => usersData ?? [], [usersData]);

  const selectedLenderLabels = useMemo(() => {
    const userMap = new Map(users.map((user) => [user.id, user.displayUsername ?? user.username]));

    return authorizedLenderIds.map((id) => userMap.get(id) ?? id);
  }, [authorizedLenderIds, users]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending || updateRecordMutation.isPending;

  const pageTitle = mode === 'create' ? '新增財產' : '編輯財產';
  const actionText = mode === 'create' ? '登記財產' : '儲存修改';

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    const schoolAssetNumber = values.schoolAssetNumber.trim();

    if (!values.categoryId.trim()) {
      form.setError('categoryId', {
        message: '請選擇財產類別',
        type: 'manual',
      });
      return;
    }

    if (values.ownershipType === OwnershipType.School && schoolAssetNumber.length === 0) {
      form.setError('schoolAssetNumber', {
        message: '學校列管財產必須填寫學校產編',
        type: 'manual',
      });
      return;
    }

    if (values.borrowRule === BorrowRule.Restricted && values.authorizedLenderIds.length === 0) {
      form.setError('authorizedLenderIds', {
        message: '限制借用時，至少要選擇一位授權人員',
        type: 'manual',
      });
      return;
    }

    if (values.quantity <= 0 || !Number.isFinite(values.quantity)) {
      form.setError('quantity', {
        message: '數量必須大於 0',
        type: 'manual',
      });
      return;
    }

    const commonPayload = {
      categoryId: values.categoryId,
      custodian: values.custodian,
      description: values.description.trim() ? values.description.trim() : undefined,
      location: values.location,
      name: values.name,
      purchaseDate: values.purchaseDate ? new Date(`${values.purchaseDate}T00:00:00`) : undefined,
    };

    const ownershipPayload = values.ownershipType === OwnershipType.School
      ? {
          ownershipType: OwnershipType.School,
          schoolAssetNumber,
        }
      : {
          ownershipType: OwnershipType.Cmrdb,
        };

    const borrowRulePayload = values.borrowRule === BorrowRule.Restricted
      ? {
          authorizedLenderIds: values.authorizedLenderIds,
          borrowRule: BorrowRule.Restricted,
        }
      : {
          borrowRule: values.borrowRule,
        };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          ...commonPayload,
          ...borrowRulePayload,
          ...ownershipPayload,
          records: [
            {
              quantity: values.quantity,
              status: values.status,
            },
          ],
        });
      }
      else {
        if (!assetId) {
          setSubmitError('找不到要編輯的財產 ID');
          return;
        }

        await updateMutation.mutateAsync({
          ...commonPayload,
          ...borrowRulePayload,
          id: assetId,
          ...ownershipPayload,
        });

        await updateRecordMutation.mutateAsync({
          id: assetId,
          records: [
            {
              quantity: values.quantity,
              status: values.status,
            },
          ],
        });
      }

      router.push('/assets');
      router.refresh();
    }
    catch (error) {
      const title = mode === 'create' ? '登記財產失敗' : '修改財產失敗';
      setSubmitError(`${title}：${getErrorMessage(error)}`);
    }
  });

  const toggleAuthorizedLender = (id: string) => {
    const current = form.getValues('authorizedLenderIds');

    if (current.includes(id)) {
      form.setValue(
        'authorizedLenderIds',
        current.filter((currentId) => currentId !== id),
        { shouldValidate: true },
      );
      return;
    }

    form.setValue('authorizedLenderIds', [...current, id], { shouldValidate: true });
  };

  if (mode === 'edit' && assetQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircleIcon className="size-4 animate-spin" />
        載入財產資料中...
      </div>
    );
  }

  if (mode === 'edit' && assetQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>載入財產失敗</AlertTitle>
        <AlertDescription>{getErrorMessage(assetQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{pageTitle}</CardTitle>
        <CardDescription>填寫完整資料後即可送出。</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            void onSubmit(event);
          }}
        >
          {submitError && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>{mode === 'create' ? '登記財產失敗' : '修改財產失敗'}</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name">名稱</Label>
            <Input
              id="name"
              placeholder="例如：投影機"
              {...form.register('name', { required: '請輸入財產名稱' })}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="
            grid gap-2
            sm:grid-cols-2
          "
          >
            <div className="grid gap-2">
              <Label htmlFor="quantity">數量</Label>
              <Input
                id="quantity"
                min={1}
                type="number"
                {...form.register('quantity', {
                  required: '請輸入數量',
                  setValueAs: (value: string) => Number(value),
                })}
              />
              {form.formState.errors.quantity && (
                <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>狀態</Label>
              <Select
                onValueChange={(value) => { form.setValue('status', value as AssetStatus, { shouldValidate: true }); }}
                value={status}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="請選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="
            grid gap-2
            sm:grid-cols-2
          "
          >
            <div className="grid gap-2">
              <Label htmlFor="location">位置</Label>
              <Input
                id="location"
                placeholder="例如：鐵櫃"
                {...form.register('location', { required: '請輸入存放位置' })}
              />
              {form.formState.errors.location && (
                <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="custodian">保管單位</Label>
              <Input
                id="custodian"
                placeholder="例如：主機組"
                {...form.register('custodian', { required: '請輸入保管單位' })}
              />
              {form.formState.errors.custodian && (
                <p className="text-sm text-destructive">{form.formState.errors.custodian.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>類別</Label>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={categoriesQuery.isLoading ? '載入類別中...' : '請選擇類別'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoriesQuery.data ?? []).map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.categoryId && (
              <p className="text-sm text-destructive">{form.formState.errors.categoryId.message}</p>
            )}
          </div>

          <div className="
            grid gap-2
            sm:grid-cols-2
          "
          >
            <div className="grid gap-2">
              <Label>歸屬單位</Label>
              <Controller
                control={form.control}
                name="ownershipType"
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value as OwnershipType);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="請選擇歸屬單位" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OwnershipType.Cmrdb}>社團自購</SelectItem>
                      <SelectItem value={OwnershipType.School}>學校列管</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {ownershipType === OwnershipType.School && (
              <div className="grid gap-2">
                <Label htmlFor="schoolAssetNumber">學校產編</Label>
                <Input
                  id="schoolAssetNumber"
                  placeholder="例如：31404032010D0132"
                  {...form.register('schoolAssetNumber', {
                    validate: (value) => Boolean(value.trim()) || '學校列管財產必填學校產編',
                  })}
                />
                {form.formState.errors.schoolAssetNumber && (
                  <p className="text-sm text-destructive">{form.formState.errors.schoolAssetNumber.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>借用權限</Label>
            <Controller
              control={form.control}
              name="borrowRule"
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value as BorrowRule);
                  }}
                  value={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="請選擇借用權限" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BorrowRule.Public}>公開借用</SelectItem>
                    <SelectItem value={BorrowRule.Restricted}>限制借用</SelectItem>
                    <SelectItem value={BorrowRule.None}>不可借用</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {borrowRule === BorrowRule.Restricted && (
            <div className="grid gap-2">
              <Label>授權名單</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="w-full justify-between" type="button" variant="outline">
                    {selectedLenderLabels.length > 0
                      ? `已選擇 ${selectedLenderLabels.length} 位人員`
                      : '請選擇授權人員'}
                    <ChevronDownIcon className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80">
                  <div className="max-h-60 space-y-2 overflow-y-auto">
                    {usersQuery.isLoading && (
                      <p className="text-sm text-muted-foreground">
                        載入人員中...
                      </p>
                    )}
                    {users.map((user) => {
                      const checked = authorizedLenderIds.includes(user.id);
                      const displayName = user.displayUsername ?? user.username;

                      return (
                        <label className="flex items-center gap-2 text-sm" key={user.id}>
                          <Checkbox
                            aria-label={`授權 ${displayName}`}
                            checked={checked}
                            onCheckedChange={() => {
                              toggleAuthorizedLender(user.id);
                            }}
                          />
                          <span>{displayName}</span>
                        </label>
                      );
                    })}
                    {!usersQuery.isLoading && users.length === 0 && (
                      <p className="text-sm text-muted-foreground">目前沒有可選的使用者</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedLenderLabels.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedLenderLabels.join('、')}</p>
              )}
              {form.formState.errors.authorizedLenderIds && (
                <p className="text-sm text-destructive">{form.formState.errors.authorizedLenderIds.message}</p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="purchaseDate">購置日期</Label>
            <Input id="purchaseDate" type="date" {...form.register('purchaseDate')} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">補充說明</Label>
            <Textarea
              id="description"
              placeholder="可填寫資產來源、備註等資訊"
              {...form.register('description')}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => { router.push('/assets'); }} type="button" variant="outline">取消</Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting
                ? (
                    <>
                      <LoaderCircleIcon className="size-4 animate-spin" />
                      處理中...
                    </>
                  )
                : actionText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return '請稍後再試';
}

function toDateInputValue(value: Date | null | number | string | undefined): string {
  if (value == null) return '';

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const date = String(parsed.getDate()).padStart(2, '0');

  return `${year}-${month}-${date}`;
}
