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
