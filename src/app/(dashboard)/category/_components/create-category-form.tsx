'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTRPC } from '@/trpc/react';

export function CreateCategoryForm() {
  const [newName, setNewName] = useState('');

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const createMutation = useMutation(
    trpc.category.create.mutationOptions({
      onError: () => {
        toast.error('建立失敗');
      },
      onSuccess: () => {
        setNewName('');
        void queryClient.invalidateQueries(trpc.category.list.queryFilter());
        toast.success('建立成功');
      },
    }),
  );

  return (
    <div className="flex gap-4">
      <Input
        onChange={(e) => setNewName(e.target.value)}
        placeholder="輸入新類別名稱"
        value={newName}
      />
      <Button
        disabled={createMutation.isPending || !newName.trim()}
        onClick={() => createMutation.mutate({ name: newName })}
      >
        {createMutation.isPending ? '建立中...' : '新增類別'}
      </Button>
    </div>
  );
}
