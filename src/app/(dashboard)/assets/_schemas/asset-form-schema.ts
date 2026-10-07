import { AssetStatus, BorrowRule, OwnershipType } from '@/lib/enums';
import { z } from '@/lib/zod';

export const AssetFormSchema = z
  .object({
    authorizedLenderIds: z.array(z.string()),
    borrowRule: BorrowRule.$schema,
    categoryId: z.string().min(1, '財產類別不得為空'),
    custodian: z.string().min(1, '保管單位不得為空'),
    description: z.string(),
    location: z.string().min(1, '位置不得為空'),
    name: z.string().min(1, '財產名稱不得為空'),
    ownershipType: OwnershipType.$schema,
    purchaseDate: z.date(),
    records: z
      .array(
        z.object({
          note: z.string(),
          quantity: z
            .number()
            .int('數量必須為整數')
            .min(1, '數量必須大於等於 1'),
          status: AssetStatus.$schema,
        }),
      )
      .min(1, '必須至少要有一項財產紀錄'),
    schoolAssetNumber: z.string(),
  })
  .superRefine((value, ctx) => {
    if (
      value.borrowRule === BorrowRule.Restricted
      && !value.authorizedLenderIds.length
    ) {
      ctx.addIssue({
        code: 'custom',
        message: '限制借用時，至少要選擇一位授權人員',
        path: ['authorizedLenderIds'],
      });
    }
    if (
      value.ownershipType === OwnershipType.School
      && !value.schoolAssetNumber.length
    ) {
      ctx.addIssue({
        code: 'custom',
        message: '學校列管財產必須填寫學校產編',
        path: ['schoolAssetNumber'],
      });
    }
  });
