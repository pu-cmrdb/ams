import { AssetStatus, BorrowRule, OwnershipType } from '@/lib/enums';

export interface AssetFormValues {
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

export interface AssetQueryData {
  authorizedLenders: { userId: string }[];
  borrowRule: BorrowRule;
  categoryId: string;
  custodian: string;
  description: null | string;
  location: string;
  name: string;
  ownershipType: OwnershipType;
  purchaseDate: Date | null | number | string | undefined;
  records: { quantity: number; status: AssetStatus }[];
  schoolAssetNumber: null | string;
}

export const defaultValues: AssetFormValues = {
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

export const statusOptions: { label: string; value: AssetStatus }[] = [
  { label: '正常', value: AssetStatus.Normal },
  { label: '維修中', value: AssetStatus.Repairing },
  { label: '遺失', value: AssetStatus.Lost },
  { label: '報廢', value: AssetStatus.Scrapped },
];

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return '請稍後再試';
}

export function mapAssetToFormValues(asset: AssetQueryData): AssetFormValues {
  const normalRecord = asset.records.find((record) => record.status === AssetStatus.Normal);
  const firstRecord = asset.records[0];
  const displayRecord = normalRecord ?? firstRecord;

  return {
    authorizedLenderIds: asset.authorizedLenders.map((lender) => lender.userId),
    borrowRule: asset.borrowRule,
    categoryId: asset.categoryId,
    custodian: asset.custodian,
    description: asset.description ?? '',
    location: asset.location,
    name: asset.name,
    ownershipType: asset.ownershipType,
    purchaseDate: toDateInputValue(asset.purchaseDate),
    quantity: displayRecord?.quantity ?? 1,
    schoolAssetNumber: asset.schoolAssetNumber ?? '',
    status: displayRecord?.status ?? AssetStatus.Normal,
  };
}

export function toDateInputValue(value: Date | null | number | string | undefined): string {
  if (value == null) return '';

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const date = String(parsed.getDate()).padStart(2, '0');

  return `${year}-${month}-${date}`;
}
