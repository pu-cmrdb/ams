import { getIamUsers } from '@/server/iam/users';

/**
 * 判斷使用者角色是否包含指定角色
 *
 * identity 的 `role` 來自 Better Auth admin plugin，可能是單一角色，
 * 也可能是以逗號分隔的多個角色（例如 `"user,admin"`）。
 *
 * @param role - IAM 使用者的 `role` 欄位
 * @param target - 要檢查的角色
 * @returns 是否包含該角色；`target` 為空字串時一律回傳 `false`
 */
export function hasRole(
  role: string | null | undefined,
  target: string,
): boolean {
  const normalizedTarget = target.trim();
  if (!role || !normalizedTarget) {
    return false;
  }

  return role.split(',').some((v) => v.trim() === normalizedTarget);
}

/**
 * 取得登入者在 identity 的角色
 *
 * ams 的 session 使用者 ID 與 identity 不同，因此以 email 對應 IAM 使用者
 * （identity 的 email 唯一）。IAM 使用者列表有五分鐘快取，角色變更最多延遲五分鐘生效。
 *
 * @param email - 登入者的 email
 * @returns 對應 IAM 使用者的 `role`；找不到時回傳 `null`
 * @throws {TRPCError} 無法取得 IAM 使用者列表時拋出 `BAD_GATEWAY`
 */
export async function resolveIamRole(
  email: string | null | undefined,
): Promise<null | string> {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const users = await getIamUsers();
  const user = users.find(
    (v) => v.email?.trim().toLowerCase() === normalizedEmail,
  );

  return user?.role ?? null;
}
