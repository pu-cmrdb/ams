import { AssetStatus, BorrowRule, OwnershipType } from '@/lib/enums';
import { type } from '@/lib/arktype';

export const AssetFormSchema = type({
  authorizedLenderIds: type.string.array(),
  borrowRule: BorrowRule.$schema,
  categoryId: type.string
    .atLeastLength(1)
    .configure({ message: '財產類別不得為空' }),
  custodian: type.string
    .atLeastLength(1)
    .configure({ message: '保管單位不得為空' }),
  description: type.string,
  location: type.string.atLeastLength(1).configure({ message: '位置不得為空' }),
  name: type.string.atLeastLength(1).configure({ message: '財產名稱不得為空' }),
  ownershipType: OwnershipType.$schema,
  purchaseDate: type.Date,
  records: type({
    note: type.string,
    quantity: type.keywords.number.integer
      .configure({ message: '數量必須為整數' })
      .atLeast(1)
      .configure({ message: '數量必須大於等於 1' }),
    status: AssetStatus.$schema,
  })
    .array()
    .atLeastLength(1)
    .configure({ message: '必須至少要有一項財產紀錄' }),
  schoolAssetNumber: 'string',
}).narrow((value, ctx) => {
  let isValid = true;

  if (
    value.borrowRule === BorrowRule.Restricted
    && !value.authorizedLenderIds?.length
  ) {
    ctx.reject({
      message: '限制借用時，至少要選擇一位授權人員',
      path: ['authorizedLenderIds'],
    });
    isValid = false;
  }

  if (
    value.ownershipType === OwnershipType.School
    && !value.schoolAssetNumber?.length
  ) {
    ctx.reject({
      message: '學校列管財產必須填寫學校產編',
      path: ['schoolAssetNumber'],
    });
    isValid = false;
  }

  return isValid;
});
