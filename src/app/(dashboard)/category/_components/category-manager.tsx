'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTRPC } from '@/trpc/react';

import { CategoryDeleteButton } from './category-delete-button';

export function CategoryManager() {
  const trpc = useTRPC();

  const queryClient = useQueryClient();

  const { data: categories, isError, isLoading, refetch } = useQuery(
    trpc.category.list.queryOptions({ limit: 100 }),
  );

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<null | string>(null);
  const [editName, setEditName] = useState('');

  const createMutation = useMutation(trpc.category.create.mutationOptions({  
    onError: () => { toast.error('建立失敗'); },  
    onSuccess: () => {  
      setNewName('');  
      void queryClient.invalidateQueries(trpc.category.list.queryFilter());  
    },  
  }));  

  const updateMutation = useMutation(trpc.category.update.mutationOptions({  
    onError: () => { toast.error('修改失敗'); },  
    onSuccess: () => {  
      setEditingId(null);  
      void queryClient.invalidateQueries(trpc.category.list.queryFilter());  
    },  
  }));

  // early return

  const renderTableContent = () => {
    if (isError) {
      return (
        <TableRow>
          <TableCell className="p-4" colSpan={2}>
            <Empty>
              <EmptyHeader>
                <EmptyTitle className="text-destructive">類別載入失敗，請稍後再試</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => void refetch()} size="sm" variant="outline">
                  再試一次
                </Button>
              </EmptyContent>
            </Empty>
          </TableCell>
        </TableRow>
      );
    }

    if (isLoading) {
      return (
        <TableRow>
          <TableCell className="p-4" colSpan={2}>
            <Empty>
              <EmptyHeader>
                <EmptyTitle className="text-muted-foreground">類別載入中...</EmptyTitle>
              </EmptyHeader>
            </Empty>
          </TableCell>
        </TableRow>
      );
    }

    if (categories?.length === 0) {
      return (
        <TableRow>
          <TableCell className="p-4" colSpan={2}>
            <Empty>
              <EmptyHeader>
                <EmptyTitle className="text-muted-foreground">目前尚無類別</EmptyTitle>
              </EmptyHeader>
            </Empty>
          </TableCell>
        </TableRow>
      );
    }

    return categories?.map((category) => (
      <TableRow key={category.id}>
        <TableCell>
          {/* 根據是否為編輯狀態,切換成 純文字名稱 或 可修改的輸入框 */}
          {editingId === category.id
            ? (
                <Input
                  autoFocus
                  onChange={(e) => { setEditName(e.target.value); }}
                  value={editName}
                />
              )
            : (
                category.name
              )}
        </TableCell>
        <TableCell className="text-right">
          {/* 根據是否為編輯狀態,將按鈕切換成 取消/儲存 或 修改/刪除  */}
          {editingId === category.id
            ? (
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => { setEditingId(null); }}
                    size="sm"
                    variant="ghost"
                  >
                    取消
                  </Button>
                  <Button
                    disabled={updateMutation.isPending || !editName.trim()}
                    onClick={() => { updateMutation.mutate({ id: category.id, name: editName.trim() }); }}
                    size="sm"
                  >
                    儲存
                  </Button>
                </div>
              )
            : (
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      setEditingId(category.id);
                      setEditName(category.name);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    修改
                  </Button>
                  <CategoryDeleteButton category={category} />
                </div>
              )}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>財產類別管理</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="flex gap-4">
          <Input
            onChange={(e) => { setNewName(e.target.value); }}
            placeholder="輸入新類別名稱"
            value={newName}
          />
          <Button
            disabled={createMutation.isPending || !newName.trim()}
            onClick={() => { createMutation.mutate({ name: newName.trim() }); }}
          >
            {createMutation.isPending ? '建立中' : '新增類別'}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>類別名稱</TableHead>
              <TableHead className="w-[200px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 回傳狀態或資料 */}
            {renderTableContent()}
          </TableBody>
        </Table>

      </CardContent>
    </Card>
  );
}
