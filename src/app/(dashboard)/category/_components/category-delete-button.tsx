import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/trpc/react';

interface CategoryDeleteButtonProps {
  category: {
    id: string;
    name: string;
  };
}

export function CategoryDeleteButton({ category }: CategoryDeleteButtonProps) {
  const queryClient = useQueryClient();

  const trpc = useTRPC();

  const deleteMutation = useMutation(
    trpc.category.delete.mutationOptions({
      onError: () => {
        toast.error('刪除失敗');
      },
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.category.list.queryFilter());
        toast.success('刪除成功');
      },
    }),
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            disabled={deleteMutation.isPending}
            size="sm"
            variant="destructive"
          >
            {deleteMutation.isPending ? '刪除中' : '刪除'}
          </Button>
        }
      />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確定刪除「{category.name}」類別？</AlertDialogTitle>
          <AlertDialogDescription>
            此動作無法復原，將永久刪除該類別。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              deleteMutation.mutate({ id: category.id });
            }}
          >
            刪除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
