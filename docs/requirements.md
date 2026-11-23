# AMS 需求與驗收

行雲者研發基地資產管理系統（AMS）：財產登記、分類、出借、盤點、標籤列印與圖片管理。

## 1. 技術棧

| 項目 | 選擇 |
| --- | --- |
| 框架 | Next.js 16（App Router，Server Components 優先） |
| 語言 | TypeScript（strict） |
| 執行環境／套件管理 | Bun（`bun.lock`） |
| API | tRPC v11 + TanStack Query，`superjson` 序列化；OpenAPI 文件在 `/reference` |
| 資料庫 | SQLite（Bun SQLite）+ Drizzle ORM，migration 在 `drizzle/` |
| 認證 | Better Auth，透過 `genericOAuth` 以行雲 IAM（`pu-cmrdb/identity`）OIDC 登入 |
| 驗證 | Zod v4 |
| UI | Tailwind CSS v4、Base UI、shadcn/ui |
| Lint／格式 | Biome |
| 測試 | `bun test`（`tests/`，以記憶體 SQLite 呼叫 tRPC caller） |

## 2. 本機開發

AMS 不自己管帳號，登入一律導向 identity，所以本機開發要**同時跑 identity 與 ams**：

| 服務 | Port | 倉庫 |
| --- | --- | --- |
| identity（IAM） | 3000 | `pu-cmrdb/identity` |
| ams | 3001 | `pu-cmrdb/ams` |

### 2.1 啟動 identity（port 3000）

```bash
git clone https://github.com/pu-cmrdb/identity.git && cd identity
bun install
cp .env.example .env          # 填本機用假值，例如 BETTER_AUTH_SECRET 用 openssl rand -base64 32
bun run drizzle:migrate
bun run db:seed               # 建立本機管理員、AMS OAuth client 與 API key
bun run dev                   # http://localhost:3000
```

`db:seed` 會印出本機 AMS 的 client ID／secret 與 API key。這些是**本機開發用的值**，只填進 ams 的本機 `.env`，不要貼到 issue、PR 或 commit。

### 2.2 啟動 ams（port 3001）

```bash
git clone https://github.com/pu-cmrdb/ams.git && cd ams
bun install
cp .env.example .env
```

`.env` 需要的值：

| 變數 | 本機值 |
| --- | --- |
| `APP_DEV_URL` | `http://localhost:3001` |
| `BETTER_AUTH_SECRET` | 本機隨機字串（≥ 32 字元） |
| `BETTER_AUTH_IAM_URL`、`NEXT_PUBLIC_BETTER_AUTH_IAM_URL` | `http://localhost:3000` |
| `BETTER_AUTH_IAM_CLIENT_ID`、`BETTER_AUTH_IAM_CLIENT_SECRET` | identity `db:seed` 印出的本機值 |
| `BETTER_AUTH_IAM_API_KEY` | identity `db:seed` 印出的本機值 |
| `DATABASE_URL` | `file:./data/db.sqlite` |

```bash
bun run drizzle:migrate
bun run dev                   # http://localhost:3001，登入會導向 localhost:3000
```

只跑測試、lint、typecheck 不需要 identity；build 可用 `SKIP_ENV_VALIDATION=true` 搭配假值（見 `.github/workflows/pr-check.yml`）。

## 3. 範圍

| 模組 | 內容 | tRPC router |
| --- | --- | --- |
| 認證 | 透過 identity OIDC 登入／登出、session | （Better Auth，`/api/auth/*`） |
| 財產 | 財產 CRUD、異動紀錄、分類 | `asset`、`category` |
| 使用者 | 從 identity 讀取使用者 | `user` |
| 出借 | 出借單、歸還、授權出借人 | `borrow` |
| 盤點 | 盤點計畫、指派、盤點結果 | `inventory` |
| 標籤列印 | 財產編號與 QR code 標籤（規劃中，詳見開發規劃） | — |
| 圖片 | 財產圖片上傳與管理 | （規劃中） |

## 4. 驗收條件

### 4.1 每個 PR 都要滿足

- [ ] 對應一個 issue，PR 說明含 `Closes #N`。
- [ ] CI（`PR Check`：Lint & Typecheck、Test、Build）在 PR head commit 全綠。
- [ ] 新功能或修正附 `bun test` 測試；寫入資料的 API 要測未授權情境。
- [ ] 沒有提交 `.env`、金鑰、真實資料或建置產物（`.next/`、`data/`、`*.sqlite`）。
- [ ] Schema 異動附 migration，且可套用在空資料庫上。

### 4.2 基礎／CI

- [ ] 乾淨 clone 後 `bun install --frozen-lockfile` 成功。
- [ ] `main` 的 `PR Check` 與 `Build and Push Docker Image` 皆為綠燈。
- [ ] 依第 2 節，只用 `.env.example` 與本機 identity 產生的值即可完成登入。

### 4.3 安全

- [ ] 未登入呼叫任何 `protectedProcedure` 得到 `UNAUTHORIZED`。
- [ ] 權限依第 5.2 節的預設；未授權回 `FORBIDDEN`，資料不變。
- [ ] Better Auth 與 identity 使用一致且無已知漏洞的版本。

### 4.4 功能模組

各模組（出借、盤點、標籤列印、圖片）的驗收條件寫在各自的 issue 中；完成時對照 issue 的勾選清單逐項驗證。本週的範圍與優先依第 5 節。

## 5. 本週驗收底稿（行雲司 2026-11-23）

> 本節是本週的範圍與驗收基準。和 issue 內文衝突時，以本節為準。

### 5.1 流程限制

- 不另外新增 Gate 1 workflow，也不修改社團既有 workflow（`pr-check.yml`、`claude-code-review.yml`、`claude.yml`、`deploy.yaml`）。唯一例外：`deploy.yaml` 的 `enable={{is_default}}` 改成 `{{is_default_branch}}`，這是修好 main 紅燈所必需。
- **查明前不合併任何 ams PR。** `deploy.yaml` 每次 push main 都會 build 並 push `ghcr.io/pu-cmrdb/ams:latest`；若正式站有 watchtower 之類的工具自動拉 latest，合併就等於正式部署。
- 優先順序：P0 → P6，依行雲司清單（見 5.6）。

### 5.2 角色權限預設（確認前先照此實作）

| 操作 | 管理員 | 一般社員 |
| --- | --- | --- |
| 新增、修改、刪除財產（含異動紀錄） | ✅ | ❌ `FORBIDDEN` |
| 新增、修改、刪除類別 | ✅ | ❌ |
| 新增、修改、刪除盤點計畫 | ✅ | ❌ |
| 查看 identity 使用者名單（`user.list`） | ✅ | ❌ |
| 查看財產、類別 | ✅ | ✅ |
| 查看出借紀錄 | ✅ | ✅ |
| 查看並執行被分配的盤點 | ✅ | ✅（只有被分配的計畫） |
| 借出 | 依 `borrow_rule`、授權人名單（`asset_authorized_lenders`） | 同左 |
| 修改、歸還出借單 | 只有開單人（`creator_id`） | 同左 |
| 盤點結案 | 只有計畫發起人 | 同左 |

驗收：上表每一格都有 `bun test` 測試（授權成功、未授權 `FORBIDDEN`）。

### 5.3 出借

- 補齊現有的 `borrow` router，不另起一套。
- 借出時財產狀態改為 `borrowed`，歸還時改回 `normal`。
  - 目前狀態存在 `asset_records`（每種狀態一列，記錄數量），`assets` 表本身沒有 status 欄位。實作方式：在 `AssetStatus` 加上 `borrowed`，借出時把數量從 `normal` 移到 `borrowed`，歸還時移回（同一個 transaction）。
  - 庫存檢查改用 `normal` 的數量，避免和進行中的出借單重複扣除。
- 驗收：
  - [ ] 借出後該財產的 `borrowed` 數量增加、`normal` 數量減少；歸還後恢復。
  - [ ] 出借單 `recordStatus` 從 `active` 變成 `returned`。
  - [ ] 非開單人歸還得到 `FORBIDDEN`；已歸還的單不能再歸還。
  - [ ] 以上都有測試。

### 5.4 標籤機（NIIMBOT B21S，驅動做在 ams 內）

- 不做獨立的列印伺服器。
- 列印路徑：瀏覽器（Web Bluetooth）→ ams 內建驅動 → B21S。
- QR code 一律指向 `/scan?id=<assetId>`，再依登入身分導向對應頁面。
- 貼紙內容：財產名稱、財產編號（學校產編）、QR code；Logo 可選。
- 驗收（本週以「已配對的桌面瀏覽器能印出」為準）：
  - [ ] ams 內建驅動能印出 B21S 標籤，內容和版面符合上述規格。（#47）
  - [ ] 由瀏覽器觸發列印並成功；印表機未連線時顯示明確錯誤訊息。（#48）
  - [ ] 掃描 QR 會進入 `/scan?id=<assetId>`，並依登入身分導向正確頁面。
- 不做：批次列印、缺紙或卡紙等硬體狀態回報。

### 5.5 本週不做

- 逾期 Email 通知、多層審核、批次列印、盤點圖表、全站統計。
- 各 issue 中標為「第一版暫緩」的項目。
- identity 的預設管理員密碼與種子腳本修改。

### 5.6 P0–P6 優先順序

依行雲司清單。清單內容收到後補在這裡。
