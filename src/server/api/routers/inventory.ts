import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { type } from 'arktype';

import assert from 'assert';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { InventoryPlans } from '@/server/database/type';
import { schema } from '@/server/database';

const CreateInventoryInput = InventoryPlans.insert
  .omit('id', 'createdById', 'status')
  .and({ /** 盤點人員 ID 陣列 */ assignedToIds: 'string[]' })
  .narrow((data, ctx) => data.assignedToIds.length > 0 || ctx.mustBe('not empty'));

export const inventoryRouter = createTRPCRouter({
  /**
   * 建立新盤點計畫。
   */
  create: protectedProcedure
    .input(CreateInventoryInput)
    .mutation(async ({ ctx, input }) => {
      const id = nanoid();
      const { assignedToIds, ...planData } = input;

      const value = {
        ...planData,
        createdById: ctx.session.user.id,
        id,
      };

      const [result] = await ctx.db
        .insert(schema.inventoryPlans)
        .values(value)
        .returning(schema.inventoryPlans._.columns);

      assert(result !== undefined, 'result should never be undefined');

      await ctx.db
        .insert(schema.inventoryPlanAssignees)
        .values(assignedToIds.map((userId) => ({ planId: id, userId })));

      return { ...result, assignedToIds };
    }),

  /**
   * 更新盤點計畫（部分欄位）。
   */
  edit: protectedProcedure
    .input(InventoryPlans.update
      .omit('createdById')
      .and({
        /** 盤點人員 ID 陣列 */
        'assignedToIds?': 'string[]',
        /** 盤點計畫 ID */
        'id': 'string',
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { assignedToIds, id, ...planData } = input;

      const [result] = await ctx.db
        .update(schema.inventoryPlans)
        .set(planData)
        .where(eq(schema.inventoryPlans.id, id))
        .returning(schema.inventoryPlans._.columns);

      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Inventory plan with id ${id} does not exists`,
        });
      }

      if (assignedToIds !== undefined) {
        await ctx.db
          .delete(schema.inventoryPlanAssignees)
          .where(eq(schema.inventoryPlanAssignees.planId, id));

        await ctx.db
          .insert(schema.inventoryPlanAssignees)
          .values(assignedToIds.map((userId) => ({ planId: id, userId })));
      }

      const finalAssignedToIds = assignedToIds
        ?? (await ctx.db.query.inventoryPlanAssignees.findMany({ where: { planId: id } }))
          .map((a) => a.userId);

      return { ...result, assignedToIds: finalAssignedToIds };
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
          with: { assignees: true },
        });

      if (!plan) return null;

      const { assignees, ...rest } = plan;
      return { ...rest, assignedToIds: assignees.map((a) => a.userId) };
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
      /** 排序欄位，預設 createdAt */
      sort: '"name" | "status" | "startAt" | "dueAt" | "completedAt" | "createdAt" | "updatedAt" = "createdAt"',
      /** 排序方向，預設 desc */
      sortDirection: '"asc" | "desc" = "desc"',
    }))
    .query(async ({ ctx, input }) => {
      const plans = await ctx.db.query.inventoryPlans.findMany({
        limit: input.limit,
        offset: input.offset,
        orderBy: (table, { asc, desc }) => {
          const dir = input.sortDirection === 'asc' ? asc : desc;
          return [dir(table[input.sort]), asc(table.id)];
        },
        with: { assignees: true },
      });

      return plans.map(({ assignees, ...rest }) => ({
        ...rest,
        assignedToIds: assignees.map((a) => a.userId),
      }));
    }),
});
