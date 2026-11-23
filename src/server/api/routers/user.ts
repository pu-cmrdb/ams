import { adminProcedure, createTRPCRouter } from '@/server/api/trpc';
import { getIamUsers } from '@/server/iam/users';
import { z } from '@/lib/zod';

const ListUsersInput = z.object({
  /** 從完整列表起算的偏移量，預設為 `0` */
  cursor: z.number().int().min(0).default(0),
  /** 每頁筆數，範圍 1–100，預設為 `10` */
  limit: z.number().int().min(1).max(100).default(10),
});

export const userRouter = createTRPCRouter({
  /**
   * 回傳所有 IAM 使用者的分頁結果
   *
   * - `cursor` — 從完整列表起算的偏移量，預設為 `0`
   * - `limit`  — 每頁筆數，範圍 1–100，預設為 `10`
   *
   * @remarks 完整使用者列表每五分鐘從 IAM 取得一次並快取於伺服器端，
   * 在此期間的請求均直接從記憶體回應
   */
  list: adminProcedure.input(ListUsersInput).query(async ({ input }) => {
    const users = await getIamUsers();

    const { cursor: currentCursor, limit: perPage } = input;

    const data = users.slice(currentCursor, currentCursor + perPage);

    const totalItems = users.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const currentPage = totalItems
      ? Math.floor(currentCursor / perPage) + 1
      : 0;
    const hasNextPage = currentCursor + perPage < totalItems;
    const hasPreviousPage = currentCursor > 0;
    const nextCursor = hasNextPage ? currentCursor + perPage : null;

    return {
      data: data,
      meta: {
        currentCursor,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        nextCursor,
        perPage,
        totalItems,
        totalPages,
      },
    };
  }),
});
