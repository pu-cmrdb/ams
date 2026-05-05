'use client';

import { AlertCircleIcon, LoaderCircleIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { arktypeResolver } from '@hookform/resolvers/arktype';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BorrowRule, OwnershipType } from '@/lib/enums';
import { useTRPC } from '@/trpc/react';

import { AssetFormSchema, defaultValues, getErrorMessage, mapAssetToFormValues } from '../asset-form-utils';
import { AssetFormFields } from './asset-form-fields';

import type { AssetFormValues } from '../asset-form-utils';


interface AssetEditFormProps {
  assetId: string;
}

export function AssetEditForm({ assetId }: AssetEditFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [submitError, setSubmitError] = useState<null | string>(null);
  const safeAssetId = assetId?.trim() ?? '';

  const categoriesQuery = useQuery(
    trpc.category.list.queryOptions({
      limit: 200,
      offset: 0,
    }),
  );

  const usersQuery = useQuery(
    trpc.user.list.queryOptions({
      cursor: 0,
      limit: 100,
    }),
  );

  const assetQuery = useQuery({
    ...trpc.asset.get.queryOptions({ id: safeAssetId }),
    enabled: safeAssetId.length > 0,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const formValues = useMemo(() => {
    if (!assetQuery.data) {
      return defaultValues;
    }
    return mapAssetToFormValues(assetQuery.data);
  }, [assetQuery.data]);

  const form = useForm<AssetFormValues>({
    defaultValues,
    mode: 'onChange',
    resolver: arktypeResolver(AssetFormSchema) as any,
    values: formValues,
  });

  const updateMutation = useMutation({
    ...trpc.asset.update.mutationOptions(),
    onError: (error) => {
      setSubmitError(`修改財產失敗：${getErrorMessage(error)}`);
    },
    onSuccess: () => {
      router.push('/assets');
      router.refresh();
    },
  });
  const updateRecordMutation = useMutation({
    ...trpc.asset.updateRecord.mutationOptions(),
    onError: (error) => {
      setSubmitError(`更新庫存狀態失敗：${getErrorMessage(error)}`);
    },
  });

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

    if (
      values.ownershipType === OwnershipType.School
      && schoolAssetNumber.length === 0
    ) {
      form.setError('schoolAssetNumber', {
        message: '學校列管財產必須填寫學校產編',
        type: 'manual',
      });
      return;
    }

    if (
      values.borrowRule === BorrowRule.Restricted
      && values.authorizedLenderIds.length === 0
    ) {
      form.setError('authorizedLenderIds', {
        message: '限制借用時，至少要選擇一位授權人員',
        type: 'manual',
      });
      return;
    }

    // Schema 已驗證 quantity > 0 和 integer，此檢查由 schema 負責

    const commonPayload = {
      categoryId: values.categoryId,
      custodian: values.custodian,
      description: values.description.trim()
        ? values.description.trim()
        : undefined,
      location: values.location,
      name: values.name,
      purchaseDate: values.purchaseDate
        ? new Date(`${values.purchaseDate}T00:00:00`)
        : undefined,
    };

    const ownershipPayload =
      values.ownershipType === OwnershipType.School
        ? {
            ownershipType: OwnershipType.School,
            schoolAssetNumber,
          }
        : {
            ownershipType: OwnershipType.Cmrdb,
          };

    const borrowRulePayload =
      values.borrowRule === BorrowRule.Restricted
        ? {
            authorizedLenderIds: values.authorizedLenderIds,
            borrowRule: BorrowRule.Restricted,
          }
        : {
            borrowRule: values.borrowRule,
          };

    try {
      updateMutation.mutate({
        ...commonPayload,
        ...borrowRulePayload,
        id: assetId,
        ...ownershipPayload,
      });

      updateRecordMutation.mutate({
        id: assetId,
        records: [
          {
            quantity: values.quantity,
            status: values.status,
          },
        ],
      });

      router.push('/assets');
      router.refresh();
    } catch (error) {
      setSubmitError(`修改財產失敗：${getErrorMessage(error)}`);
    }
  });

  if (assetQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <LoaderCircleIcon className="size-4 animate-spin" />
        載入財產資料中...
      </div>
    );
  }

  if (assetQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>載入財產失敗</AlertTitle>
        <AlertDescription>{getErrorMessage(assetQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <AssetFormFields
      categories={categoriesQuery.data ?? []}
      categoriesLoading={categoriesQuery.isLoading}
      form={form}
      isSubmitting={updateMutation.isPending || updateRecordMutation.isPending}
      mode="edit"
      onCancel={() => {
        router.push('/assets');
      }}
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      submitError={submitError}
      users={usersQuery.data?.data ?? []}
      usersLoading={usersQuery.isLoading}
    />
  );
}
