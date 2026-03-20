import { count, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
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
const CategoryDeleteInput = CategoryByIdInput.and({
  deleteAssets: 'boolean = false',
});

export const categoryRouter = createTRPCRouter({
  /** 新增財產類別 */
  create: protectedProcedure
    .input(CreateCategoryInput)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.categories.findFirst({
        columns: { id: true },
        where: { name: { eq: input.name } },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Category name "${input.name}" already exists ! >_<`,
        });
      }

      const [result] = await ctx.db
        .insert(schema.categories)
        .values({
          id: nanoid(),
          ...input,
          name: input.name,
        })
        .returning(schema.categories._.columns);

      assert(result !== undefined, 'result should never be undefined ! >_<');
      return { ...result };
    }),
  /** 刪除財產類別 */
  delete: protectedProcedure
    .input(CategoryDeleteInput)
    .mutation(async ({ ctx, input }) => {
      const assets = await ctx.db
        .select({ value: count() })
        .from(schema.assets)
        .where(eq(schema.assets.categoryId, input.id));
      const assetCount = assets[0]?.value ?? 0;

      if (assetCount > 0 && !input.deleteAssets) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete category ${input.id} because it still contains ${assetCount} asset(s) ! >_<
          Set deleteAssets=true to confirm cascading deletion.`,
        });
      }
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
      return {
        deletedAssetCount: assetCount,
        deletedCategoryId: result[0]?.id,
        success: true,
      };
    }),
  /** 取得所有財產類別 */
  list: protectedProcedure
    .input(SelectCategoryInput)
    .query(async ({ ctx, input }) => {
      const keyword = input.keyword?.trim();
      const escapedKeyword = keyword?.replace(/[%_\\]/g, '\\$&');
      const andConditions = [];
      if (keyword) {
        andConditions.push({
          OR: [
            { name: { like: `%${escapedKeyword}%` } },
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
      const { id } = input;

      const current = await ctx.db.query.categories
        .findFirst({
          columns: { id: true, name: true },
          where: { id: { eq: id } },
        });

      if (!current) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Category with id ${id} does not exist ! >_<`,
        });
      }

      // 只有在名稱真的變更時，才需要查重
      if (current.name !== input.name) {
        const duplicate = await ctx.db.query.categories.findFirst({
          columns: { id: true },
          where: {
            AND: [
              {
                name: {
                  eq: input.name,
                },
              }, {
                id: {
                  ne: id,
                },
              },
            ],
          },
        });
        if (duplicate) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Category name "${input.name}" already exists ! >_<`,
          });
        }
      }
      const [result] = await ctx.db
        .update(schema.categories)
        .set({
          name: input.name,
        })
        .where(eq(schema.categories.id, id))
        .returning(schema.categories._.columns);
      assert(result !== undefined, 'result should never be undefined ! >_<');
      return {
        ...result,
      };
    }),
});
