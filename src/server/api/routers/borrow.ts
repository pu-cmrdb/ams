import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { type } from 'arktype';

import assert from 'assert';

import { AssetStatus, BorrowRecordsSortKey, RecordStatus, SortDirection } from '@/lib/enums';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { BorrowRecords } from '@/server/database/type';
import { schema } from '@/server/database';

const CreateBorrowRecordsInput = BorrowRecords.insert
  .omit('id', 'actualReturnDate', 'recordStatus', 'creatorId')
  .and({
    'creatorId?': 'string > 0',
  });

const ReturnBorrowRecordsInput = type({
  'borrowRecordId': 'string > 0',
  'notes?': 'string',
});

const SelectBorrowRecordsInput = type({
  /** 是否針對特定財產 */
  'assetId?': 'string',
  /** 借用人 ID */
  'borrowerId?': 'string',
  /** 建單人 ID */
  'creatorId?': 'string',
  /** 每頁筆數 */
  'limit': 'number.integer >= 1 = 20',
  /** 跳過筆數 */
  'offset': 'number.integer >= 0 = 0',
  /** 單據狀態 */
  'recordStatus?': RecordStatus.$schema,
  /** 排序 */
  'sort?': BorrowRecordsSortKey.$schema,
  /** 排序方向 */
  'sortDirection?': SortDirection.$schema,
});

const GetBorrowRecordInput = type({
  id: 'string > 0',
});

export const borrowRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateBorrowRecordsInput)
    .mutation(async ({ ctx, input }) => {
      const andConditions = [];
      andConditions.push({
        assetId: { eq: input.assetId },
        status: { eq: AssetStatus.Normal },
      });
      const asset = await ctx.db.query.assets.findFirst({
        where: { AND: andConditions },
        with: {
          authorizedLenders: {
            where: {
              AND: [{
                userId: {
                  eq: input.creatorId,
                },
              }],
            },
          } },
      });
      if (!asset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Asset with id ${input.assetId} does not exist or has an invalid status ! >_<`,
        });
      }
      let creatorId = ctx.session.user.id;
      if (asset.authorizedLenders[0] && !input.creatorId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `CreatorId  ! >_<`,
        });
      }
      if (asset.authorizedLenders[0]?.userId && asset.authorizedLenders[0].userId === input.creatorId) {
        creatorId = asset.authorizedLenders[0].userId;
      }
      const [result] = await ctx.db.transaction(async (tx) => {
        const [record] = await tx.insert(schema.borrowRecords)
          .values({
            creatorId: creatorId,
            id: nanoid(),
            recordStatus: RecordStatus.Active,
            ...input,
          }).returning(schema.borrowRecords._.columns);

        assert(result !== undefined, 'result should never be undefined ! >_<');

        await tx.update(schema.assets)
          .set({
            status: AssetStatus.Borrowed,
            updatedById: ctx.session.user.id,
          })
          .where(eq(schema.assets.id, input.assetId));

        return [record];
      });

      return { ...result, ...asset };
    }),

  get: protectedProcedure
    .input(GetBorrowRecordInput)
    .query(async ({ ctx, input }) => {
      const record = await ctx.db.query.borrowRecords.findFirst({
        where: { id: { eq: input.id } },
        with: {
          asset: true,
        },
      });

      if (!record) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Borrow record with id ${input.id} does not exist ! >_<`,
        });
      }

      const { asset, ...recordData } = record;
      return {
        ...recordData,
        asset,
      };
    }),

  list: protectedProcedure
    .input(SelectBorrowRecordsInput)
    .query(async ({ ctx, input }) => {
      const andConditions = [];
      const assetId = input.assetId?.trim();
      const creatorId = input.creatorId?.trim();
      const borrowerId = input.borrowerId?.trim();

      if (assetId) {
        andConditions.push({ assetId: { eq: assetId } });
      }
      if (creatorId) {
        andConditions.push({ creatorId: { eq: creatorId } });
      }
      if (borrowerId) {
        andConditions.push({ borrowerId: { eq: borrowerId } });
      }
      if (input.recordStatus) {
        andConditions.push({ recordStatus: { eq: input.recordStatus } });
      }

      const result = await ctx.db.query.borrowRecords.findMany({
        limit: input.limit,
        offset: input.offset,
        orderBy: (table, { asc, desc }) => {
          const dir = input.sortDirection === 'asc' ? asc : desc;
          const sortKey = input.sort ?? BorrowRecordsSortKey.CreatedAt;
          return [dir(table[sortKey]), asc(table.id)];
        },
        where: andConditions.length > 0 ? { AND: andConditions } : undefined,
        with: {
          asset: true,
        },
      });

      return result.map(({ asset, ...rest }) => {
        if (!asset) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Borrow record with id ${rest.id}'s asset should not be null ! >_<`,
          });
        }
        return {
          ...rest,
          asset,
        };
      });
    }),

  return: protectedProcedure
    .input(ReturnBorrowRecordsInput)
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.query.borrowRecords.findFirst({
        where: { id: { eq: input.borrowRecordId } },
      });

      if (!record) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Borrow record with id ${input.borrowRecordId} does not exist ! >_<`,
        });
      }
      if (record.actualReturnDate !== null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This asset has already been returned ! >_<',
        });
      }
      if (ctx.session.user.id !== record.creatorId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the creator of the borrow record can return it ! >_<',
        });
      }
      return await ctx.db.transaction(async (tx) => {
        const [updatedRecord] = await tx.update(schema.borrowRecords)
          .set({
            actualReturnDate: new Date(),
            recordStatus: RecordStatus.Returned,
            ...(input.notes !== undefined && { notes: input.notes }),
          })
          .where(eq(schema.borrowRecords.id, input.borrowRecordId))
          .returning(schema.borrowRecords._.columns);

        assert(updatedRecord !== undefined, 'updatedRecord should never be undefined ! >_<');

        await tx.update(schema.assets)
          .set({
            status: AssetStatus.Normal,
            updatedById: ctx.session.user.id,
          })
          .where(eq(schema.assets.id, record.assetId));

        return { ...updatedRecord };
      });
    }),
});
