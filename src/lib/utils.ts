import { clsx } from 'clsx';
import { sql } from 'drizzle-orm';
import { twMerge } from 'tailwind-merge';
import { type } from 'arktype';

import type { AnyColumn } from 'drizzle-orm';
import type { ClassValue } from 'clsx';
import type { SQL } from 'drizzle-orm';

type EnumLike<T extends EnumLikeInput> = {
  /**
   * 至少包含一個元素的 tuple。
   *
   * 適合用在需要 `[T, ...T[]]` 型別的場景，
   * 例如 SQLite 的 enum 定義 API。
   */
  readonly $enum: NonEmptyTuple<Values<T>>;

  /**
   * ArkType schema，可用來做 runtime validation，
   * 並透過 `typeof EnumName.$schema.infer` 取得對應 union type。
   */
  readonly $schema: ReturnType<typeof type.valueOf<T>>;

  /**
   * 此 enum-like 物件的所有值陣列。
   *
   * 例如：
   * `['active', 'returned']`
   */
  readonly $values: readonly Values<T>[];

} & Readonly<T>;

type EnumLikeInput = Record<string, number | string | symbol>;
type NonEmptyTuple<T> = readonly [T, ...T[]];
type Values<T extends EnumLikeInput> = T[keyof T];

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
 * 定義一個具備：
 * - 列舉值存取（如 `Status.ACTIVE`）
 * - ArkType schema（`$schema`）
 * - 所有值陣列（`$values`）
 * - SQLite Enum 定義
 *
 * 的 enum-like 常數物件。
 *
 * @template T - 由字串 key 對應 primitive value（string / number / symbol）的定義物件
 * @param definition - enum-like 定義物件，建議搭配 `as const` 使用以保留 literal type
 * @returns 一個經過 `Object.freeze()` 的唯讀物件，包含原始定義、`$enum`、`$schema` 與 `$values`
 *
 * @example
 * ```ts
 * const STATUS = defineEnum({
 *   ACTIVE: 'active',
 *   INACTIVE: 'inactive',
 * } as const);
 *
 * type Status = typeof STATUS.$schema.infer; // 'active' | 'inactive'
 *
 * STATUS.ACTIVE; // 'active'
 * STATUS.$values; // ['active', 'inactive']
 *
 * // SQLite Enum 定義
 * status: text('status', { enum: AssetStatus.$enum }).notNull().default(AssetStatus.Normal),
 *
 * ```
 */
export function defineEnum<const T extends EnumLikeInput>(definition: T): EnumLike<T> {
  const $enum = valuesToTuple(definition);
  const $values = Object.values(definition) as Values<T>[];
  const $schema = type.valueOf(definition);

  return Object.freeze({
    ...definition,
    $enum,
    $schema,
    $values,
  }) as EnumLike<T>;
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

type ColumnKeyOf<TTable extends object> = {
  [K in Extract<keyof TTable, string>]: TTable[K] extends AnyColumn ? K : never;
}[Extract<keyof TTable, string>];

/**
 * 建立包含關鍵字的 `LIKE` SQL 條件，並附加 `ESCAPE` 子句
 *
 * 適用於 Drizzle relational queries 的 `RAW: (table) => ...` callback，
 *
 * @typeParam TTable - Drizzle relational query callback 中的資料表型別
 * @param table - `RAW` callback 提供的資料表物件
 * @param columnKey - 欄位名稱，例如 `'name'`、`'location'`
 * @param keyword - 使用者輸入的搜尋關鍵字
 * @returns 對應的 SQL `LIKE ... ESCAPE ...` 條件片段
 *
 * @example
 * containsLike(table, 'name', '100%');
 * // => table.name LIKE '%100\%%' ESCAPE '\'
 */
export function containsLike<TTable extends object>(
  table: TTable,
  columnKey: ColumnKeyOf<TTable>,
  keyword: string,
): SQL {
  const pattern = `%${escapeLikePattern(keyword)}%`;
  const column = table[columnKey];
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
