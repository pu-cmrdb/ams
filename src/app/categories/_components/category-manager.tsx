'use client';

import { useState } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/trpc/react';

export function CategoryManager() {
  const utils = api.useUtils();

  const { data: categories, isLoading } = api.category.list.useQuery({});

  const [newName, setNewName] = useState('');

  const [editingId, setEditingId] = useState<null | string>(null);
  const [editName, setEditName] = useState('');

  const createMutation = api.category.create.useMutation({
    onError: () => { alert('建立失敗'); },
    onSuccess: () => {
      setNewName('');
      void utils.category.list.invalidate();
    },
  });

  const updateMutation = api.category.update.useMutation({
    onError: () => { alert('修改失敗'); },
    onSuccess: () => {
      setEditingId(null);
      void utils.category.list.invalidate();
    },
  });

  const deleteMutation = api.category.delete.useMutation({
    onError: () => { alert('刪除失敗'); },
    onSuccess: () => {
      void utils.category.list.invalidate();
    },
  });

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>財產類別管理</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="flex gap-4">
          <Input
            onChange={(e) => { setNewName(e.target.value); }}
            placeholder="輸入新類別名稱..."
            value={newName}
          />
          <Button
            disabled={createMutation.isPending || !newName.trim()}
            onClick={() => { createMutation.mutate({ name: newName }); }}
          >
            {createMutation.isPending ? '建立中...' : '新增類別'}
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
            {isLoading
              ? (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center text-muted-foreground"
                      colSpan={2}
                    >
                      載入中...
                    </TableCell>
                  </TableRow>
                )
              : categories?.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        className="h-24 text-center text-muted-foreground"
                        colSpan={2}
                      >
                        目前尚無類別
                      </TableCell>
                    </TableRow>
                  )
                : (
                    categories?.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
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
                                    onClick={() => { updateMutation.mutate({ id: category.id, name: editName }); }}
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
                                    disabled={deleteMutation.isPending}
                                    onClick={() => {
                                      if (window.confirm(`確定要刪除「${category.name}」嗎？`)) {
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
                    ))
                  )}
          </TableBody>
        </Table>

      </CardContent>
    </Card>
  );
}
