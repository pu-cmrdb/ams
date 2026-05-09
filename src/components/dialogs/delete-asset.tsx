import { Trash2Icon } from 'lucide-react';
import { createChangeEventDetails } from '@base-ui/react/internals/createBaseUIEventDetails';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useTRPC } from '@/trpc/react';

import { Kbd } from '../ui/kbd';

import type { KeyboardEventHandler, MouseEventHandler } from 'react';
import type { AlertDialogRootProps } from '@base-ui/react';

type DeleteAssetDialogProps = Readonly<
  {
    assetId: string;
    assetName: string;
    children?: React.ReactElement;
  } & AlertDialogRootProps
>;

function DeleteAssetDialog({
  assetName: name,
  assetId: id,
  onOpenChange,
  children,
  ...props
}: DeleteAssetDialogProps) {
  const trpc = useTRPC();

  const [inputValue, setInputValue] = useState('');

  const { mutate, isPending } = useMutation(
    trpc.asset.delete.mutationOptions({
      onSettled: () => {
        onOpenChange?.(false, createChangeEventDetails('imperative-action'));
      },
      onSuccess: () => {
        toast.success(`已成功刪除「${name}」`);
      },
    }),
  );

  const onActionDelete: MouseEventHandler = () => {
    mutate({ id });
  };

  const onActionKeyDown: KeyboardEventHandler = (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    mutate({ id });
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} {...props}>
      {children && <AlertDialogTrigger render={children} />}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia variant="destructive">
            <Trash2Icon />
          </AlertDialogMedia>

          <AlertDialogTitle>刪除「{name}」</AlertDialogTitle>

          <AlertDialogDescription>
            這將會同時刪除所有和這個財產有關的內容，並將這個財產從財產類別、盤點計畫等地方移除。這個動作將無法復原。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div>為了確認你真的想要刪除這個財產，請在下方輸入「{name}」。</div>

        <Input
          data-1p-ignore
          disabled={isPending}
          onInput={(e) => setInputValue(e.currentTarget.value)}
          type="text"
          value={inputValue}
        />

        <AlertDialogFooter>
          <AlertDialogCancel>
            <span>取消</span>
            <Kbd data-icon="inline-end">Esc</Kbd>
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={inputValue !== name || isPending}
            onClick={onActionDelete}
            onKeyDown={onActionKeyDown}
            variant="destructive"
          >
            {isPending && <Spinner data-icon="inline-start" />}

            <span>刪除這個財產</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteAssetDialog;
