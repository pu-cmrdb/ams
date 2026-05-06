import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTRPC } from '@/trpc/react';

import { CategoryListItem } from './category-list-item';
import { CreateCategoryForm } from './create-category-form';


export function CategoryManager() {
  const trpc = useTRPC();
  const { data: categories, isLoading } = useQuery(
    trpc.category.list.queryOptions({})
  );
  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>
          財產類別管理
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <CreateCategoryForm />

        <div className="flex flex-col">
          {isLoading ? (
            <p>
              載入中
            </p>
          ) : (
            categories?.map((category) => (
              <CategoryListItem key={category.id} category={category} />
            ))
          )}
        </div>

      </CardContent>
    </Card>
  );
}