import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTRPC } from '@/trpc/react';

import { CategoryDeleteButton } from './category-delete-button';

interface CategoryListItemProps {
  category: { id: string; name: string };
}

export function CategoryListItem({ category }: CategoryListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const updateMutation = useMutation(
    trpc.category.update.mutationOptions({
      onError: () => toast.error('修改失敗'),
      onSuccess: () => {
        setIsEditing(false);
        void queryClient.invalidateQueries(trpc.category.list.queryFilter());
        toast.success('修改成功');
      },
    })
  );

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input 
          value={editName} 
          onChange={(e) => setEditName(e.target.value)} 
        />
        <Button 
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ id: category.id, name: editName })}
        >
          {updateMutation.isPending ? '儲存中' : '儲存'}
        </Button>
        <Button variant="ghost" onClick={() => setIsEditing(false)}>
          取消
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 border-b">
      <span>{category.name}</span>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setIsEditing(true)}>
          修改      
        </Button>
        <CategoryDeleteButton category={category} />
      </div>
    </div>
  );
}