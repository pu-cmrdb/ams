import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { type } from 'arktype';

import assert from 'assert';

import { AssetsSortKey, BorrowRule, OwnershipType, SortDirection } from '@/lib/enums';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { Assets } from '@/server/database/type';
import { containsLike } from '@/lib/utils';
import { schema } from '@/server/database';

type AssetsTable = typeof schema.assets;

const CreateAssetsInput = Assets.insert
  .omit('id', 'borrowRule', 'createdById', 'updatedById')
  .and({
    authorizedLenderIds: 'string[] > 0',
    borrowRule: `'${BorrowRule.Restricted}'`,
  })
  .or(
    Assets.insert.omit('id', 'borrowRule', 'createdById', 'updatedById').and({
      borrowRule: BorrowRule.$schema.exclude(`'${BorrowRule.Restricted}'`),
    }),
  );

const _UpdateAssetsInputBase = Assets.update
  .omit('createdById', 'updatedById')
  .and({
    'authorizedLenderIds?': 'string[] > 0',
    'id': 'string.trim',
  });

const UpdateAssetsInput = _UpdateAssetsInputBase
  .and(
    type({
      authorizedLenderIds: 'string[] > 0',
      borrowRule: `'${BorrowRule.Restricted}'`,
    })
      .or({
        'borrowRule?': BorrowRule.$schema.exclude(`'${BorrowRule.Restricted}'`),
      }),
  )
  .and(
    type({
      ownershipType: `'${OwnershipType.School}'`,
      schoolAssetNumber: 'string.trim',
    })
      .or({
        'ownershipType?': OwnershipType.$schema.exclude(`'${OwnershipType.School}'`),
      }),
  );

const ListAssetsInput = type({
  /** 財產群組 */
  'categoryId?': 'string.trim',
  /** 關鍵字 */
  'keyword?': 'string.trim',
  /** 每頁筆數，預設 20 */
  'limit': 'number.integer >= 1 = 20',
  /** 跳過筆數，預設 0 */
  'offset': 'number.integer >= 0 = 0',
  /**  歸屬單位 */
  'ownershipType?': OwnershipType.$schema,
  /** 排序 */
  'sort?': AssetsSortKey.$schema,
  /** 排序方向 */
  'sortDirection?': SortDirection.$schema,
});

const DeleteAssetInput = type({
  id: 'string.trim',
});

const GetAssetInput = type({
  id: 'string.trim',
});

export const assetsRouter = createTRPCRouter({
  /**
   * 新增財產（含 `borrow_rule` 與授權人設定）
   */
  create: protectedProcedure
    .input(CreateAssetsInput)
    .mutation(async ({ ctx, input }) => {
      if (input.ownershipType === OwnershipType.School && !input.schoolAssetNumber) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `schoolAssetNumber is required when ownershipType is school`,
        });
      }

      return await ctx.db.transaction(async (tx) => {
        const id = nanoid();

        await tx.insert(schema.assets)
          .values({
            ...input,
            createdById: ctx.session.user.id,
            id: id,
            updatedById: ctx.session.user.id,
          });

        if (input.borrowRule === BorrowRule.Restricted) {
          const uniqueIds = [...new Set(input.authorizedLenderIds)];

          await tx.insert(schema.assetAuthorizedLenders)
            .values(
              uniqueIds.map((userId) => ({
                assetId: id,
                userId,
              })),
            );
        }

        const result = await tx.query.assets.findFirst({
          where: { id },
        });

        assert(result !== undefined, 'result should never be undefined');

        return result;
      });
    }),
  /**
   * 刪除財產
   */
  delete: protectedProcedure
    .input(DeleteAssetInput)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        await tx.delete(schema.assetAuthorizedLenders).where(eq(schema.assetAuthorizedLenders.assetId, input.id));
        await tx.delete(schema.assets).where(eq(schema.assets.id, input.id));
        return { success: true };
      });
    }),
  /**
   * 依財產 ID 取得單一詳情
   */
  get: protectedProcedure
    .input(GetAssetInput)
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.assets.findFirst({
        where: { id: input.id },
        with: {
          authorizedLenders: true,
          borrowRecords: true,
          category: true,
          records: true,
        },
      });

      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `assets with id ${input.id} does not exists`,
        });
      }

      return result;
    }),
  /**
   * 取得財產列表
   *
   * 支援關鍵字搜尋、類別篩選、歸屬單位篩選、分頁
   */
  list: protectedProcedure
    .input(ListAssetsInput)
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.keyword) {
        const keyword = input.keyword;
        conditions.push({
          OR: [
            { RAW: (table: AssetsTable) => containsLike(table.name, keyword) },
            { RAW: (table: AssetsTable) => containsLike(table.schoolAssetNumber, keyword) },
            { RAW: (table: AssetsTable) => containsLike(table.custodian, keyword) },
            { RAW: (table: AssetsTable) => containsLike(table.description, keyword) },
            { RAW: (table: AssetsTable) => containsLike(table.location, keyword) },
          ],
        });
      }
      if (input.categoryId) conditions.push({ categoryId: input.categoryId });
      if (input.ownershipType) conditions.push({ ownershipType: input.ownershipType });

      const result = await ctx.db.query.assets.findMany({
        limit: input.limit,
        offset: input.offset,
        orderBy: (table, { asc, desc }) => {
          const dir = input.sortDirection === SortDirection.Ascending ? asc : desc;

          return [
            dir(table[input.sort ?? AssetsSortKey.UpdatedAt]),
            asc(table.id),
          ];
        },
        where: { AND: conditions },
        with: {
          category: true,
          records: true,
        },
      });

      return result;
    }),
  /**
   * 更新財產資料
   */
  update: protectedProcedure
    .input(UpdateAssetsInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const existing = await tx.query.assets.findFirst({
          where: { id: input.id },
          with: {
            authorizedLenders: true,
          },
        });

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Asset with id ${input.id} does not exist`,
          });
        }

        if (input.borrowRule && (
          input.borrowRule === BorrowRule.Restricted
          || input.borrowRule !== existing.borrowRule
        )) {
          if (input.borrowRule === BorrowRule.Restricted) {
            const uniqueIds = [...new Set(input.authorizedLenderIds)];

            await tx.delete(schema.assetAuthorizedLenders)
              .where(eq(schema.assetAuthorizedLenders.assetId, input.id));

            await tx.insert(schema.assetAuthorizedLenders)
              .values(uniqueIds.map((userId) => ({
                assetId: input.id,
                userId,
              })));
          }
        }

        await tx.update(schema.assets)
          .set({
            ...input,
            updatedById: ctx.session.user.id,
          })
          .where(eq(schema.assets.id, input.id));

        const result = await tx.query.assets.findFirst({
          where: { id: input.id },
          with: {
            authorizedLenders: true,
            category: true,
          },
        });

        assert(result !== undefined, 'result should never be undefined');

        return result;
      });
    }),
});
