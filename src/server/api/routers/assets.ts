import assert from 'node:assert';

import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import {
  AssetsSortKey,
  BorrowRule,
  OwnershipType,
  SortDirection,
} from '@/lib/enums';
import { AssetRecords, Assets } from '@/server/database/type';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { containsLike } from '@/lib/utils';
import { schema } from '@/server/database';
import { z } from '@/lib/zod';

type AssetsTable = typeof schema.assets;

const _CreateAssetsInputBase = Assets.insert
  .omit({ createdById: true, id: true, updatedById: true })
  .extend({
    records: AssetRecords.insert.omit({ assetId: true }).array().optional(),
  });

const CreateAssetsInput = _CreateAssetsInputBase
  .extend({
    authorizedLenderIds: z.array(z.string()).optional(),
    schoolAssetNumber: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.borrowRule === BorrowRule.Restricted
      && !value.authorizedLenderIds?.length
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one authorized lender is required',
        path: ['authorizedLenderIds'],
      });
    }
    if (
      value.ownershipType === OwnershipType.School
      && !value.schoolAssetNumber?.length
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'School asset number is required',
        path: ['schoolAssetNumber'],
      });
    }
  });

const _UpdateAssetsInputBase = Assets.update
  .omit({ createdById: true, updatedById: true })
  .extend({
    authorizedLenderIds: z.array(z.string()).min(1).optional(),
    id: z.string(),
  });

const UpdateAssetsInput = _UpdateAssetsInputBase.superRefine((value, ctx) => {
  if (
    value.borrowRule === BorrowRule.Restricted
    && !value.authorizedLenderIds?.length
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'At least one authorized lender is required',
      path: ['authorizedLenderIds'],
    });
  }
  if (
    value.ownershipType === OwnershipType.School
    && !value.schoolAssetNumber?.trim()
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'School asset number is required',
      path: ['schoolAssetNumber'],
    });
  }
});

const UpdateAssetRecordInput = z.object({
  id: z.string().trim(),
  records: AssetRecords.insert
    .omit({ assetId: true })
    .extend({ status: AssetRecords.insert.shape.status })
    .array(),
});

const ListAssetsInput = z.object({
  /** 財產群組 */
  categoryId: z.string().trim().optional(),
  /** 關鍵字 */
  keyword: z.string().trim().optional(),
  /** 每頁筆數，預設 20 */
  limit: z.number().int().min(1).default(20),
  /** 跳過筆數，預設 0 */
  offset: z.number().int().min(0).default(0),
  /**  歸屬單位 */
  ownershipType: OwnershipType.$schema.optional(),
  /** 排序 */
  sort: AssetsSortKey.$schema.optional(),
  /** 排序方向 */
  sortDirection: SortDirection.$schema.optional(),
});

const DeleteAssetInput = z.object({
  id: z.string().trim(),
});

const GetAssetInput = z.object({
  id: z.string().trim(),
});

export const assetsRouter = createTRPCRouter({
  /**
   * 建立新財產
   */
  create: protectedProcedure
    .input(CreateAssetsInput)
    .mutation(({ ctx, input }) =>
      ctx.db.transaction((tx) => {
        const id = nanoid();

        tx.insert(schema.assets)
          .values({
            ...input,
            createdById: ctx.session.user.id,
            id: id,
            updatedById: ctx.session.user.id,
          })
          .run();

        if (input.borrowRule === BorrowRule.Restricted) {
          const uniqueIds = [...new Set(input.authorizedLenderIds)];

          tx.insert(schema.assetAuthorizedLenders)
            .values(
              uniqueIds.map((userId) => ({
                assetId: id,
                userId,
              })),
            )
            .run();
        }

        if (input.records?.length) {
          type AssetRecord = Omit<
            z.infer<typeof AssetRecords.insert>,
            'assetId'
          >;

          const values = input.records
            .reduce<AssetRecord[]>((acc, record) => {
              const existing = acc.find(
                (v) => v.status === record.status && v.note === record.note,
              );

              if (existing) {
                existing.quantity += record.quantity;
              } else {
                acc.push(record);
              }

              return acc;
            }, [])
            .map((record) => ({
              ...record,
              assetId: id,
            }));

          tx.insert(schema.assetRecords).values(values).run();
        }

        const result = tx.query.assets
          .findFirst({
            where: { id },
          })
          .sync();

        assert(result !== undefined, 'result should never be undefined');

        return result;
      }),
    ),
  /**
   * 刪除財產
   */
  delete: protectedProcedure
    .input(DeleteAssetInput)
    .mutation(({ ctx, input }) =>
      ctx.db.transaction((tx) => {
        tx.delete(schema.assetAuthorizedLenders)
          .where(eq(schema.assetAuthorizedLenders.assetId, input.id))
          .run();
        tx.delete(schema.assets).where(eq(schema.assets.id, input.id)).run();
        return { success: true };
      }),
    ),
  /**
   * 依財產 ID 取得單一詳情
   */
  get: protectedProcedure.input(GetAssetInput).query(async ({ ctx, input }) => {
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
            {
              RAW: (table: AssetsTable) =>
                containsLike(table.schoolAssetNumber, keyword),
            },
            {
              RAW: (table: AssetsTable) =>
                containsLike(table.custodian, keyword),
            },
            {
              RAW: (table: AssetsTable) =>
                containsLike(table.description, keyword),
            },
            {
              RAW: (table: AssetsTable) =>
                containsLike(table.location, keyword),
            },
          ],
        });
      }
      if (input.categoryId) {
        conditions.push({ categoryId: input.categoryId });
      }
      if (input.ownershipType) {
        conditions.push({ ownershipType: input.ownershipType });
      }

      const result = await ctx.db.query.assets.findMany({
        limit: input.limit,
        offset: input.offset,
        orderBy: (table, { asc, desc }) => {
          const dir =
            input.sortDirection === SortDirection.Ascending ? asc : desc;

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
    .mutation(({ ctx, input }) =>
      ctx.db.transaction((tx) => {
        const existing = tx.query.assets
          .findFirst({
            where: { id: input.id },
            with: {
              authorizedLenders: true,
            },
          })
          .sync();

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Asset with id ${input.id} does not exist`,
          });
        }

        if (
          input.borrowRule
          && (input.borrowRule === BorrowRule.Restricted
            || input.borrowRule !== existing.borrowRule)
          && input.borrowRule === BorrowRule.Restricted
        ) {
          const uniqueIds = [...new Set(input.authorizedLenderIds)];

          tx.delete(schema.assetAuthorizedLenders)
            .where(eq(schema.assetAuthorizedLenders.assetId, input.id))
            .run();

          tx.insert(schema.assetAuthorizedLenders)
            .values(
              uniqueIds.map((userId) => ({
                assetId: input.id,
                userId,
              })),
            )
            .run();
        }

        tx.update(schema.assets)
          .set({
            ...input,
            updatedById: ctx.session.user.id,
          })
          .where(eq(schema.assets.id, input.id))
          .run();

        const result = tx.query.assets
          .findFirst({
            where: { id: input.id },
            with: {
              authorizedLenders: true,
              category: true,
            },
          })
          .sync();

        assert(result !== undefined, 'result should never be undefined');

        return result;
      }),
    ),
  updateRecord: protectedProcedure
    .input(UpdateAssetRecordInput)
    .mutation(({ ctx, input }) => {
      ctx.db.transaction((tx) => {
        type AssetRecord = Omit<z.infer<typeof AssetRecords.insert>, 'assetId'>;

        const values = input.records
          .reduce<AssetRecord[]>((acc, record) => {
            const existing = acc.find(
              (v) => v.status === record.status && v.note === record.note,
            );

            if (existing) {
              existing.quantity += record.quantity;
            } else {
              acc.push(record);
            }

            return acc;
          }, [])
          .map((record) => ({
            ...record,
            assetId: input.id,
          }));

        tx.delete(schema.assetRecords)
          .where(eq(schema.assetRecords.assetId, input.id))
          .run();

        if (values.length) {
          tx.insert(schema.assetRecords).values(values).run();
        }
      });
    }),
});
