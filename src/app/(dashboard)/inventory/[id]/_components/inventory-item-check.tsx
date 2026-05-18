"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  assetId: string;
  planId: string;
  canEdit: boolean;
};

export function InventoryItemCheck({ assetId, planId, canEdit }: Props) {
  if (!canEdit) {
    return (
      <Button size="sm" disabled variant="outline">
        編輯財產
      </Button>
    );
  }

  return (
    <Link href={`/asset/${assetId}/edit?from=inventory&planId=${planId}`}>
      <Button size="sm" variant="outline">
        編輯財產
      </Button>
    </Link>
  );
}

export default InventoryItemCheck;
