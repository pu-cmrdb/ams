import { nanoid } from 'nanoid';
import { type } from 'arktype';

import assert from 'assert';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { InventoryPlans } from '@/server/database/type';
import { schema } from '@/server/database';

const CreateInventoryInput = InventoryPlans.insert
  .omit('id', 'createdById')
  .narrow((data, ctx) => data.assignedToIds.length > 0 || ctx.mustBe('not empty'));

export const inventoryRouter = createTRPCRouter({
  /**
   * 建立新盤點計畫。
   */
  create: protectedProcedure
    .input(CreateInventoryInput)
    .mutation(async ({ ctx, input }) => {
      const id = nanoid();

      const value = {
        ...input,
        createdById: ctx.session.user.id,
        id,
        status: 'pending',
      };

      const [result] = await ctx.db
        .insert(schema.inventoryPlans)
        .values(value)
        .returning(schema.inventoryPlans._.columns);

      assert(result !== undefined, 'result should never be undefined');

      return result;
    }),

  /**
   * 取得單一盤點計畫詳情，包含所有盤點人員。
   */
  get: protectedProcedure
    .input(type({
      /** 盤點計畫 ID */
      id: 'string > 0',
    }))
    .query(async ({ ctx, input }) => {
      const plan = await ctx.db.query.inventoryPlans
        .findFirst({
          where: { id: input.id },
        });

      return plan ?? null;
    }),

  /**
   * 取得所有盤點計畫。
   *
   * @returns 盤點計畫陣列
   */
  list: protectedProcedure
    .input(type({
      /** 每頁筆數，預設 20 */
      limit: 'number.integer >= 1 = 20',
      /** 跳過筆數，預設 0 */
      offset: 'number.integer >= 0 = 0',
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.inventoryPlans.findMany({
        limit: input.limit,
        offset: input.offset,
      });
    }),
});
