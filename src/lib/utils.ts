import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { ClassValue } from 'clsx';

/**
 * 合併多個 class 名稱並解決 Tailwind CSS 衝突
 *
 * 這個函式結合 clsx 與 tailwind-merge 來處理條件式 class 名稱，
 * 並自動解決 Tailwind CSS 類別衝突（例如：`px-2 px-4` 會保留 `px-4`）。
 *
 * @param inputs - 任意數量的 class 值（字串、物件、陣列或條件式）
 * @returns 合併且去除衝突後的 class 字串
 *
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', { 'text-blue-500': true }) // => 'text-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 將物件的 value 轉換為「至少一個元素」的 tuple 型別。
 *
 * 為了解決 TypeScript 中 `Object.values()` 只能推導為 `T[]`
 *（可能為空陣列），而某些 API（例如資料庫 enum 定義）需要
 * `[T, ...T[]]`（至少一個元素）的問題。
 *
 * 此 helper 會：
 * - 在型別層級：將 value 推導為 union，並轉為非空 tuple
 * - 在執行時：檢查是否為空物件，避免不合法情況
 *
 * @template T - key 為 string，value 為 string 的物件型別
 *
 * @param obj - 要轉換的物件（通常為 `as const` 定義的常數物件）
 *
 * @returns 一個至少包含一個元素的 tuple，
 *          型別為 `[T[keyof T], ...T[keyof T][]]`
 *
 * @throws {Error} 當物件沒有任何 value 時拋出錯誤
 */
export function valuesToTuple<T extends Record<string, string>>(
  obj: T,
): [T[keyof T], ...T[keyof T][]] {
  const values = Object.values(obj);

  if (values.length === 0) {
    throw new Error('Object must have at least one value');
  }

  return values as [T[keyof T], ...T[keyof T][]];
}
