'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BorrowRule, OwnershipType } from '@/lib/enums';
import { useTRPC } from '@/trpc/react';

import { defaultValues, getErrorMessage } from './asset-form-utils';
import { AssetFormFields } from './asset-form-fields';

import type { AssetFormValues } from './asset-form-utils';

export function AssetCreateForm() {
  const router = useRouter();
  const trpc = useTRPC();
  const [submitError, setSubmitError] = useState<null | string>(null);

  const form = useForm<AssetFormValues>({
    defaultValues,
  });

  const createMutation = useMutation(trpc.asset.create.mutationOptions());

  const categoriesQuery = useQuery(trpc.category.list.queryOptions({
    limit: 200,
    offset: 0,
  }));

  const usersQuery = useQuery(trpc.user.list.queryOptions({
    cursor: 0,
    limit: 100,
  }));

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

      router.push('/assets');
      router.refresh();
    }
    catch (error) {
      setSubmitError(`登記財產失敗：${getErrorMessage(error)}`);
    }
  });

  return (
    <AssetFormFields
      categories={categoriesQuery.data ?? []}
      categoriesLoading={categoriesQuery.isLoading}
      form={form}
      isSubmitting={createMutation.isPending}
      mode="create"
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
