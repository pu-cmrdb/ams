import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { type } from 'arktype';

import assert from 'assert';

import { AssetStatus, AssetsSortKey, BorrowRule, OwnershipType, SortDirection } from '@/lib/enums';
import { AssetAuthorizedLenders, Assets } from '@/server/database/type';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { containsLike } from '@/lib/utils';
import { schema } from '@/server/database';

type AssetsTable = typeof schema.assets;

const CreateAssetsInput = Assets.insert
  .omit('id', 'createdById', 'updatedById')
  .and({
    /** 當 borrowRule 為 restricted 時必填 */
    'userIds?': 'string[]',
  });
const UpdateAssetsInput = Assets.update
  .omit('createdById', 'updatedById')
  .and({
    /** 要有財產 ID 才可更新 */
    'id': 'string',
    /** 當 borrowRule 為 restricted 時必填 */
    'userIds?': 'string[]',
  });
const SelectAssetsInput = type({
  /** 財產群組 */
  'categoryId?': 'string',
  /** 關鍵字 */
  'keyword?': 'string',
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
const assetsByIdInput = type({
  id: 'string > 0',
});
const setAuthorizedLendersInput = type({
  // 空陣列代表清除所有授權人
  assetId: 'string > 0',
  userIds: 'string[]',
});

type AssetAuthorizedLendersInfer = typeof AssetAuthorizedLenders.insert.infer;

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
      if (input.borrowRule === BorrowRule.Restricted
        && (!input.userIds || input.userIds.length === 0)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'authorizedLenderIds is required when borrowRule is restricted',
        });
      }
      return await ctx.db.transaction(async (tx) => {
        const { userIds, ...assetValues } = input;

        const uniqueUserIds = userIds ? [...new Set(userIds)] : [];

        const id = nanoid();
        const [result] = await tx.insert(schema.assets).values({
          ...assetValues,
          createdById: ctx.session.user.id,
          id: id,
          updatedById: ctx.session.user.id,
        }).returning(schema.assets._.columns);
        assert(result !== undefined, 'result should never be undefined');

        if (input.borrowRule !== BorrowRule.Restricted || uniqueUserIds.length === 0) {
          return { ...result, authorizedLenders: [] };
        }

        const assetAuthorizedLendersResult = await tx.insert(schema.assetAuthorizedLenders)
          .values(
            uniqueUserIds.map((userId) => ({
              assetId: id,
              userId,
            })),
          )
          .returning(schema.assetAuthorizedLenders._.columns);

        return { ...result, authorizedLenders: assetAuthorizedLendersResult };
      });
    }),
  /**
   * 刪除財產
   */
  delete: protectedProcedure
    .input(assetsByIdInput)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        await tx.delete(schema.assetAuthorizedLenders).where(eq(schema.assetAuthorizedLenders.assetId, input.id));
        await tx.delete(schema.assets).where(eq(schema.assets.id, input.id));
        return { success: true };
      });
    }),
  /** 取得單一財產詳情（含授權出借人列表） */
  get: protectedProcedure
    .input(assetsByIdInput)
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.assets.findFirst({
        where: { id: input.id },
        with: {
          authorizedLenders: true,
          category: true,
        },
      });
      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `assets with id ${input.id} does not exists`,
        });
      }
      return { result };
    }),
  /**
   * 取得財產列表
   *
   * 支援關鍵字搜尋、類別篩選、歸屬單位篩選、分頁
   */
  list: protectedProcedure
    .input(SelectAssetsInput)
    .query(async ({ ctx, input }) => {
      const keyword = input.keyword?.trim();

      const result = await ctx.db.query.assets.findMany({
        limit: input.limit,
        offset: input.offset,
        orderBy: (table, { asc, desc }) => {
          const dir = input.sortDirection === 'asc' ? asc : desc;
          return [dir(table[input.sort ?? AssetsSortKey.UpdatedAt]), asc(table.id)];
        },

        where: {
          AND: [
            keyword
              ? {
                  OR: [
                    { RAW: (table: AssetsTable) => containsLike(table, 'name', keyword) },
                    { RAW: (table: AssetsTable) => containsLike(table, 'schoolAssetNumber', keyword) },
                    { RAW: (table: AssetsTable) => containsLike(table, 'custodian', keyword) },
                    { RAW: (table: AssetsTable) => containsLike(table, 'description', keyword) },
                    { RAW: (table: AssetsTable) => containsLike(table, 'location', keyword) },
                  ],
                }
              : undefined,
            input.categoryId
              ? { categoryId: { eq: input.categoryId } }
              : undefined,
            input.ownershipType
              ? { ownershipType: { eq: input.ownershipType } }
              : undefined,
          ].filter((v): v is NonNullable<typeof v> => v != null),
        },

        with: {
          authorizedLenders: true,
          category: true,
        },
      });

      return result.map(({ authorizedLenders, category, ...rest }) => {
        if (!category) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `assets with id ${rest.id}'s categoryId should not be null`,
          });
        }

        return {
          ...rest,
          authorizedLenders,
          categoryName: category.name,
        };
      });
    }),
  /**
   * 設定財產授權出借人（覆蓋式更新）
   */
  setAuthorizedLenders: protectedProcedure
    .input(setAuthorizedLendersInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const check = await tx.query.assets.findFirst({
          columns: {
            borrowRule: true,
            status: true,
          },
          where: { id: input.assetId },
        });
        if (!check) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Asset with id ${input.assetId} does not exist`,
          });
        }
        if (check.borrowRule !== BorrowRule.Restricted) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Asset ${input.assetId} must have borrowRule="restricted" before setting authorized lenders`,
          });
        }
        await tx.delete(schema.assetAuthorizedLenders)
          .where(eq(schema.assetAuthorizedLenders.assetId, input.assetId));
        if (input.userIds.length > 0) {
          const result = await tx.insert(schema.assetAuthorizedLenders)
            .values(
              input.userIds.map((userId) => ({
                assetId: input.assetId,
                userId,
              })))
            .returning(schema.assetAuthorizedLenders._.columns);
          return { result };
        }
        else {
          if (check.status === AssetStatus.Borrowed) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `The asset with ID ${input.assetId} cannot be in the "borrowed" status`,
            });
          }
          const result: AssetAuthorizedLendersInfer[] = [];
          return { result };
        }
      });
    }),
  /**
   * 更新財產資料
   */
  update: protectedProcedure
    .input(UpdateAssetsInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const { id, userIds, ...data } = input;
        const existing = await tx.query.assets.findFirst({
          where: { id: { eq: id } },
          with: {
            authorizedLenders: true,
          },
        });
        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Asset with id ${id} does not exist`,
          });
        }
        // userIds 若有傳，代表要覆蓋更新；若沒傳，保留現有名單
        const normalizedUserIds = userIds !== undefined ? [...new Set(userIds)] : undefined;
        const nextOwnershipType = data.ownershipType ?? existing.ownershipType;
        const nextSchoolAssetNumber = data.schoolAssetNumber ?? existing.schoolAssetNumber;
        const nextBorrowRule = data.borrowRule ?? existing.borrowRule;

        const nextAuthorizedUserIds = normalizedUserIds
          ?? existing.authorizedLenders.map((item) => item.userId);

        if (nextOwnershipType === OwnershipType.School && !nextSchoolAssetNumber) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'schoolAssetNumber is required when ownershipType is school',
          });
        }
        if (nextBorrowRule === BorrowRule.Restricted && nextAuthorizedUserIds.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'userIds is required when borrowRule is restricted',
          });
        }

        const [result] = await tx.update(schema.assets)
          .set({
            ...data,
            updatedById: ctx.session.user.id,
          })
          .where(eq(schema.assets.id, id))
          .returning(schema.assets._.columns);

        assert(result !== undefined, 'result should never be undefined');

        let authorizedLenders: AssetAuthorizedLendersInfer[] = existing.authorizedLenders;

        // 規則：
        // 1) 如果最終 borrowRule 不是 restricted，清空所有授權人
        // 2) 如果最終 borrowRule 是 restricted 且有傳 userIds，覆蓋式更新
        // 3) 如果最終 borrowRule 是 restricted 但沒傳 userIds，保留原本授權人
        if (nextBorrowRule !== BorrowRule.Restricted) {
          await tx.delete(schema.assetAuthorizedLenders)
            .where(eq(schema.assetAuthorizedLenders.assetId, id));
          authorizedLenders = [];
        }
        else if (normalizedUserIds !== undefined) {
          await tx.delete(schema.assetAuthorizedLenders)
            .where(eq(schema.assetAuthorizedLenders.assetId, id));
          authorizedLenders = await tx.insert(schema.assetAuthorizedLenders)
            .values(
              normalizedUserIds.map((userId) => ({
                assetId: id,
                userId,
              })),
            )
            .returning(schema.assetAuthorizedLenders._.columns);
        }
        return {
          ...result,
          authorizedLenders,
        };
      });
    }),
});
