import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { type } from 'arktype';

import assert from 'assert';

import { AssetStatus, BorrowRecordSortKey, BorrowRule, RecordStatus, SortDirection } from '@/lib/enums';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { BorrowRecords } from '@/server/database/type';
import { schema } from '@/server/database';

const CreateBorrowRecordsInput = BorrowRecords.insert
  .omit('id', 'actualReturnDate', 'recordStatus', 'creatorId');

const SelectBorrowRecordsInput = BorrowRecords.select.partial()
  .and({
    /** 每頁筆數 */
    limit: '0 < number.integer <= 100 = 20',
    /** 跳過筆數 */
    offset: 'number.integer >= 0 = 0',
    /** 排序 */
    sort: BorrowRecordSortKey.$schema.default(BorrowRecordSortKey.CreatedAt),
    /** 排序方向 */
    sortDirection: SortDirection.$schema.default(SortDirection.Descending),
  });

const UpdateBorrowRecordsInput = BorrowRecords.update.and({
  id: 'string > 0',
});

const GetBorrowRecordInput = type({
  id: 'string > 0',
});

export const borrowRouter = createTRPCRouter({
  /**
   * 建立借用單
   *
   * 針對指定財產建立一筆新的借用記錄。
   */
  create: protectedProcedure
    .input(CreateBorrowRecordsInput)
    .mutation(async ({ ctx, input }) => {
      const asset = await ctx.db.query.assets.findFirst({
        where: {
          id: input.assetId,
          status: AssetStatus.Normal,
        },
        with: {
          authorizedLenders: {
            columns: {
              userId: true,
            },
          },
        },
      });

      if (!asset) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `找不到 ID 為 ${input.assetId} 的財產`,
        });
      }

      if (asset.borrowRule === BorrowRule.Restricted
        && !asset.authorizedLenders.some(({ userId }) => userId === ctx.session.user.id)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `你沒有權限建立這個財產的出借單`,
        });
      }

      const id = nanoid();

      const value = {
        ...input,
        creatorId: ctx.session.user.id,
        id,
        recordStatus: RecordStatus.Active,
      };

      const [record] = await ctx.db.transaction(async (tx) => {
        const [inserted] = await tx.insert(schema.borrowRecords)
          .values(value)
          .returning(schema.borrowRecords._.columns);

        assert(inserted !== undefined, 'record should never be undefined');

        // TODO(kamiya4047,DavidWu94): 討論處理借出後財產狀態更新

        return [inserted];
      });

      return { ...record, asset };
    }),

  /**
   * 取得單筆借用單
   *
   * 依借用單 ID 查詢，回傳借用單資料及關聯財產資訊。
   */
  get: protectedProcedure
    .input(GetBorrowRecordInput)
    .query(async ({ ctx, input }) => {
      const record = await ctx.db.query.borrowRecords.findFirst({
        where: { id: input.id },
        with: { asset: true },
      });

      if (!record) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `找不到 ID 為 ${input.id} 的借用單`,
        });
      }

      return record;
    }),

  /**
   * 列出借用單
   *
   * 支援依財產、借用人、建單人及單據狀態篩選，並提供分頁與排序功能。
   * 每筆結果皆包含關聯財產資訊。
   */
  list: protectedProcedure
    .input(SelectBorrowRecordsInput)
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.assetId) conditions.push({ assetId: input.assetId.trim() });
      if (input.creatorId) conditions.push({ creatorId: input.creatorId.trim() });
      if (input.borrowerId) conditions.push({ borrowerId: input.borrowerId.trim() });
      if (input.recordStatus) conditions.push({ recordStatus: input.recordStatus });

      const result = await ctx.db.query.borrowRecords.findMany({
        limit: input.limit,
        offset: input.offset,
        orderBy: (table, { asc, desc }) => {
          const dir = input.sortDirection === SortDirection.Ascending
            ? asc
            : desc;

          return [
            dir(table[input.sort]),
            asc(table.id),
          ];
        },
        where: { AND: conditions },
        with: { asset: true },
      });

      return result;
    }),

  /**
   * 更新借用單
   *
   * 更新指定借用單的欄位資料。僅限建單人操作。
   */
  update: protectedProcedure
    .input(UpdateBorrowRecordsInput)
    .mutation(async ({ ctx, input: { id, ...input } }) => {
      const record = await ctx.db.query.borrowRecords.findFirst({
        where: { id },
        with: { asset: true },
      });

      if (!record?.asset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `找不到 ID 為 ${id} 的借用單`,
        });
      }

      if (ctx.session.user.id !== record.creatorId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '你沒有權限更新這個出借單',
        });
      }

      return await ctx.db.transaction(async (tx) => {
        const [updatedRecord] = await tx.update(schema.borrowRecords)
          .set(input)
          .where(eq(schema.borrowRecords.id, id))
          .returning(schema.borrowRecords._.columns);

        assert(updatedRecord !== undefined, 'updatedRecord should never be undefined');

        // TODO(kamiya4047,DavidWu94): 討論處理歸還後財產狀態更新

        return updatedRecord;
      });
    }),
});
