'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTRPC } from '@/trpc/react';

export function CategoryManager() {
  // 呼叫hook,取得實體
  const trpc = useTRPC();

  const queryClient = useQueryClient();

  // 將類別顯示上限設為100
  const { data: categories, isError, isLoading, refetch } = useQuery(
    trpc.category.list.queryOptions({ limit: 100 }),
  );

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<null | string>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<null | string>(null);

  // 定義新增類別,成功後重新載入列表
  const createMutation = useMutation({
    ...trpc.category.create.mutationOptions(),
    onError: () => { alert('建立失敗'); },
    onSuccess: () => {
      setNewName('');
      void queryClient.invalidateQueries(trpc.category.list.queryFilter());
    },
  });

  // 定義更新類別,成功後退出編輯模式並重新載入列表
  const updateMutation = useMutation({
    ...trpc.category.update.mutationOptions(),
    onError: () => { alert('修改失敗'); },
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries(trpc.category.list.queryFilter());
    },
  });

  // 定義刪除類別,成功後重新載入列表
  const deleteMutation = useMutation({
    ...trpc.category.delete.mutationOptions(),
    onError: () => { alert('刪除失敗'); },
    onSettled: () => {
      setDeletingId(null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries(trpc.category.list.queryFilter());
    },
  });

  // early return

  const renderTableContent = () => {
    // 檢查錯誤
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

    // 載入中
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

    // 無類別
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

    // 有類別
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
          {/* 根據是否為編輯狀態,將按鈕切換成 修改/刪除 或 儲存/取消  */}
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
                  <Button
                    disabled={deletingId === category.id}
                    onClick={() => {
                      if (window.confirm(`確定刪除「${category.name}」？`)) {
                        setDeletingId(category.id);
                        deleteMutation.mutate({ id: category.id });
                      }
                    }}
                    size="sm"
                    variant="destructive"
                  >
                    刪除
                  </Button>
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
