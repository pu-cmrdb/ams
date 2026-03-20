import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { type } from 'arktype';

import assert from 'assert';

import { CATEGORY_SORT_KEYS, CategorySortKeySchema, SortDirectionSchema } from '@/lib/enums';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { Categories } from '@/server/database/type';
import { schema } from '@/server/database';

const CreateCategoryInput = Categories.insert.omit('id');
const SelectCategoryInput = type({
  /** 關鍵字 */
  'keyword?': 'string',
  /** 每頁筆數，預設 20 */
  'limit': 'number.integer >= 1 = 20',
  /** 跳過筆數，預設 0 */
  'offset': 'number.integer >= 0 = 0',
  /** 排序 */
  'sort?': CategorySortKeySchema,
  /** 排序方向 */
  'sortDirection?': SortDirectionSchema,
});
const UpdateCategoryInput = Categories.update
  .and({
    /** 要有財產類別 ID 才可更新 */
    id: 'string > 0',
    /** 要有財產類別名稱才可更新 ( 也只有這個欄位能更新 ) */
    name: 'string > 0',
  });
const CategoryByIdInput = type({
  id: 'string > 0',
});

/**
 * 判斷是否為 categories.name 的 unique constraint 錯誤
 */
function isCategoryNameUniqueConstraintError(error: unknown): boolean {
  const parts: string[] = [];
  if (error instanceof Error) {
    parts.push(error.message);
  }
  if (error && typeof error === 'object' && 'cause' in error && error.cause instanceof Error) {
    parts.push(error.cause.message);
  }
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    parts.push(error.code);
  }
  const message = parts.join(' ').toLowerCase();
  return (
    message.includes('sqlite_constraint_unique')
    || message.includes('unique constraint failed: categories.name')
    || (message.includes('unique constraint failed') && message.includes('categories.name'))
  );
}

export const categoryRouter = createTRPCRouter({
  /** 新增財產類別 */
  create: protectedProcedure
    .input(CreateCategoryInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const [result] = await ctx.db.insert(schema.categories)
          .values({
            id: nanoid(),
            ...input,
          }).returning(schema.categories._.columns);
        assert(result !== undefined, 'result should never be undefined ! >_<');
        return { ...result };
      }
      catch (error) {
        if (isCategoryNameUniqueConstraintError(error)) {
          throw new TRPCError({
            cause: error,
            code: 'CONFLICT',
            message: `Category name "${input.name}" already exists ! >_<`,
          });
        }
        throw error;
      }
    }),
  /** 刪除財產類別 */
  delete: protectedProcedure
    .input(CategoryByIdInput).mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(schema.categories)
        .where(eq(schema.categories.id, input.id))
        .returning({ id: schema.categories.id });
      if (result.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Category with id ${input.id} does not exist ! >_<`,
        });
      }
      return { success: true };
    }),
  /** 取得所有財產類別 */
  list: protectedProcedure
    .input(SelectCategoryInput)
    .query(async ({ ctx, input }) => {
      const keyword = input.keyword?.trim();
      const andConditions = [];
      if (keyword) {
        andConditions.push({
          OR: [
            { name: { like: `%${keyword}%` } },
          ],
        });
      }
      const result = await ctx.db.query.categories.findMany({
        limit: input.limit,
        offset: input.offset,
        orderBy: (table, { asc, desc }) => {
          const dir = input.sortDirection === 'asc' ? asc : desc;
          return [dir(table[input.sort ?? CATEGORY_SORT_KEYS.NAME]), asc(table.id)];
        },
        where: andConditions.length > 0 ? { AND: andConditions } : undefined,
      });
      return result;
    }),
  /** 更新財產類別名稱 */
  update: protectedProcedure
    .input(UpdateCategoryInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        const [result] = await ctx.db.update(schema.categories)
          .set({
            ...data,
          })
          .where(eq(schema.categories.id, id))
          .returning(schema.categories._.columns);
        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Category with id ${id} does not exist ! >_<`,
          });
        }
        return {
          ...result,
        };
      }
      catch (error) {
        if (isCategoryNameUniqueConstraintError(error)) {
          throw new TRPCError({
            cause: error,
            code: 'CONFLICT',
            message: `Category name "${input.name}" already exists ! >_<`,
          });
        }
        throw error;
      }
    }),
});
