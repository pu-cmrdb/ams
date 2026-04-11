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
  .and({
    /** 財產 ID 陣列 */
    assetIds: 'string[]',
    /** 盤點人員 ID 陣列 */
    assigneeIds: 'string[]',
  });

const UpdateInventoryInput = InventoryPlans.update
  .omit('createdById')
  .and({
    /** 財產 ID 陣列 */
    'assetIds?': 'string[]',
    /** 盤點人員 ID 陣列 */
    'assigneeIds?': 'string[]',
    /** 盤點計畫 ID */
    'id': 'string',
  });

export const inventoryRouter = createTRPCRouter({
  /**
   * 建立新盤點計畫。
   */
  create: protectedProcedure
    .input(CreateInventoryInput)
    .mutation(({ ctx, input }) => {
      const id = nanoid();
      const { assetIds, assigneeIds, ...planData } = input;

      const value = {
        ...planData,
        createdById: ctx.session.user.id,
        id,
      };

      const result = ctx.db.transaction((tx) => {
        const [plan] = tx
          .insert(schema.inventoryPlans)
          .values(value)
          .returning()
          .all();

        assert(plan !== undefined, 'result should never be undefined');

        if (assigneeIds.length > 0) {
          tx.insert(schema.inventoryPlanAssignees)
            .values(assigneeIds.map((userId) => ({ planId: id, userId })))
            .run();
        }

        if (assetIds.length > 0) {
          tx.insert(schema.inventoryPlanAssets)
            .values(assetIds.map((assetId) => ({ assetId, planId: id })))
            .run();
        }

        return plan;
      });

      return { ...result, assetIds, assigneeIds };
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
          with: { assets: true, assignees: true },
        });

      if (!plan) return null;

      const { assets, assignees, ...rest } = plan;
      return {
        ...rest,
        assetIds: assets.map((a) => a.assetId),
        assigneeIds: assignees.map((a) => a.userId),
      };
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
  /**
   * 更新盤點計畫（部分欄位）。
   */
  update: protectedProcedure
    .input(UpdateInventoryInput)
    .mutation(({ ctx, input }) => {
      const { assetIds, assigneeIds, id, ...planData } = input;

      return ctx.db.transaction((tx) => {
        let result = tx.query.inventoryPlans
          .findFirst({ where: { id } })
          .sync();

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Inventory plan with id ${id} does not exists`,
          });
        }

        if (Object.keys(planData).length > 0) {
          const [updated] = tx
            .update(schema.inventoryPlans)
            .set(planData)
            .where(eq(schema.inventoryPlans.id, id))
            .returning()
            .all();

          if (updated) result = updated;
        }

        if (assetIds !== undefined) {
          tx.delete(schema.inventoryPlanAssets)
            .where(eq(schema.inventoryPlanAssets.planId, id))
            .run();

          if (assetIds.length > 0) {
            tx.insert(schema.inventoryPlanAssets)
              .values(assetIds.map((assetId) => ({ assetId, planId: id })))
              .run();
          }
        }

        if (assigneeIds !== undefined) {
          tx.delete(schema.inventoryPlanAssignees)
            .where(eq(schema.inventoryPlanAssignees.planId, id))
            .run();

          if (assigneeIds.length > 0) {
            tx.insert(schema.inventoryPlanAssignees)
              .values(assigneeIds.map((userId) => ({ planId: id, userId })))
              .run();
          }
        }

        const finalAssetIds = assetIds
          ?? tx.query.inventoryPlanAssets
            .findMany({ where: { planId: id } })
            .sync()
            .map((a) => a.assetId);

        const finalAssigneeIds = assigneeIds
          ?? tx.query.inventoryPlanAssignees
            .findMany({ where: { planId: id } })
            .sync()
            .map((a) => a.userId);

        return {
          ...result,
          assetIds: finalAssetIds,
          assigneeIds: finalAssigneeIds,
        };
      });
    }),
});
