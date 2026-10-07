import { sql } from 'drizzle-orm';
import { z } from '@/lib/zod';

import type { AnyColumn, SQL } from 'drizzle-orm';

type EnumLike<T extends EnumLikeInput> = {
  /**
   * Zod schema，可用來做 runtime validation，
   * 並透過 `z.infer<typeof EnumName.$schema>` 取得對應 union type。
   */
  readonly $schema: z.ZodType<Values<T>, Values<T>>;

  /**
   * 至少包含一個元素的 tuple。
   *
   * 適合用在需要 `[T, ...T[]]` 型別的場景，
   * 例如 SQLite 的 enum 定義 API。
   */
  readonly $values: NonEmptyTuple<Values<T>>;
} & Readonly<T>;

type EnumLikeInput = Record<string, string>;
type NonEmptyTuple<T> = readonly [T, ...T[]];
type Values<T extends EnumLikeInput> = T[keyof T];

export { cn } from 'cn';

/**
 * 定義一個具備：
 * - 列舉值存取（如 `Status.ACTIVE`）
 * - Zod schema（`$schema`）
 * - SQLite Enum 定義
 *
 * 的 enum-like 常數物件。
 *
 * @template T - 由字串 key 對應 primitive value（string / number / symbol）的定義物件
 * @param definition - enum-like 定義物件，建議搭配 `as const` 使用以保留 literal type
 * @returns 一個經過 `Object.freeze()` 的唯讀物件，包含原始定義、`$schema` 與 `$values`
 *
 * @example
 * ```ts
 * const STATUS = defineEnum({
 *   ACTIVE: 'active',
 *   INACTIVE: 'inactive',
 * } as const);
 *
 * type Status = z.infer<typeof STATUS.$schema>; // 'active' | 'inactive'
 *
 * STATUS.ACTIVE; // 'active'
 *
 * // SQLite Enum 定義
 * status: text('status', { enum: AssetStatus.$values }).notNull().default(AssetStatus.Normal),
 *
 * ```
 */
export function defineEnum<const T extends EnumLikeInput>(
  definition: T,
): EnumLike<T> {
  const $values = valuesToTuple(definition);
  const $schema = z.enum(
    $values as unknown as [string, ...string[]],
  ) as unknown as z.ZodType<Values<T>, Values<T>>;

  return Object.freeze({
    ...definition,
    $schema,
    $values,
  });
}

/**
 * 將物件的 value 轉換為「至少一個元素」的 tuple 型別。
 *
 * 為了解決 TypeScript 中 `Object.values()` 只能推導為 `T[]`
 *（可能為空陣列），而某些 API（例如 SQLite 的 enum 定義）需要
 * `[T, ...T[]]`（至少一個元素）的問題。
 *
 * 此 helper 會：
 * - 在型別層級：將 value 推導為 union，並轉為非空 tuple
 * - 在執行時：檢查是否為空物件，避免不合法情況
 *
 * @template T - key 為 string，value 為 primitive（string / number / symbol）的物件型別
 *
 * @param obj - 要轉換的物件（通常為 `as const` 定義的常數物件）
 *
 * @returns 一個至少包含一個元素的 tuple，
 *          型別為 `[T[keyof T], ...T[keyof T][]]`
 *
 * @throws {Error} 當物件沒有任何 value 時拋出錯誤
 */
export function valuesToTuple<T extends EnumLikeInput>(
  obj: T,
): NonEmptyTuple<Values<T>> {
  const values = Object.values(obj) as Values<T>[];

  if (values.length === 0) {
    throw new Error('Object must have at least one value');
  }

  return Object.freeze(values) as NonEmptyTuple<Values<T>>;
}

const LIKE_ESCAPE_CHAR = '\\' as const;

/**
 * 建立包含關鍵字的 `LIKE` SQL 條件，並附加 `ESCAPE` 子句
 *
 * @param column - 資料表欄位
 * @param keyword - 使用者輸入的搜尋關鍵字
 * @returns 對應的 SQL `LIKE ... ESCAPE ...` 條件片段
 *
 * @example
 * containsLike(table.name, '100%');
 * // => table.name LIKE '%100\%%' ESCAPE '\'
 */
export function containsLike(column: AnyColumn, keyword: string): SQL {
  const pattern = `%${escapeLikePattern(keyword)}%`;
  return sql`${column} LIKE ${pattern} ESCAPE ${LIKE_ESCAPE_CHAR}`;
}

/**
 * 轉義 SQL `LIKE` pattern 中具有特殊意義的字元，使其以字面值比對
 *
 * 會處理以下字元：
 * - `%`：任意長度萬用字元
 * - `_`：單一字元萬用字元
 * - `\`：escape 字元本身
 *
 * @param value - 要轉義的原始字串。
 * @returns 可安全用於 SQL `LIKE` pattern 的字串
 *
 * @example
 * escapeLikePattern('100%');
 * // => '100\\%'
 *
 * @example
 * escapeLikePattern('A_01');
 * // => 'A\\_01'
 *
 * @example
 * escapeLikePattern('C:\\temp');
 * // => 'C:\\\\temp'
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
