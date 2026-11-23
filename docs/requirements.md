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

只跑測試、lint、typecheck 不需要 identity；`bun run build` 需要設定 `SKIP_ENV_VALIDATION=true` 並搭配假環境變數（見 `.github/workflows/pr-check.yml` 的 Build job）。

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
- [ ] 權限依第 5.2 節；未授權回 `FORBIDDEN`，資料不變。
- [ ] Better Auth 與 identity 使用一致且無已知漏洞的版本。

### 4.4 功能模組

各模組（出借、盤點、標籤列印、圖片）的驗收條件寫在各自的 issue 中；完成時對照 issue 的勾選清單逐項驗證。本週的範圍與優先依第 5 節。

## 5. 本週驗收底稿（行雲司 2026-11-23；David 16:54 定案）

> 本節是本週的範圍與驗收基準。和 issue 內文衝突時，以本節為準。

### 5.1 流程限制

- 不另外新增 Gate 1 workflow，也不修改社團既有 workflow（`pr-check.yml`、`claude-code-review.yml`、`claude.yml`、`deploy.yaml`）。唯一例外：`deploy.yaml` 的 `enable={{is_default}}` 改成 `{{is_default_branch}}`，這是修好 main 紅燈所必需。
- **查明前不合併任何 ams PR。** `deploy.yaml` 每次 push main 都會 build 並 push `ghcr.io/pu-cmrdb/ams:latest`；若正式站有 watchtower 之類的工具自動拉 latest，合併就等於正式部署。
- 舊 PR #50、#54 由替代 PR 接手，不對別人的遠端分支 rebase 或 force push。舊 PR 註明被哪一支取代，等 David 同意後再關。
- 優先順序：P0 → P6，依行雲司清單（見 5.7）。

### 5.2 角色權限（定案）

角色沿用 identity 既有的 `role`（admin plugin 的 `admin`／`user`），不自創「財產管理員」等其他名稱。ams 取得登入者 role 的方式：沿用現有 IAM API key 的使用者查詢，或 OIDC claim，擇一實作。

| 操作 | `admin` | `user`（一般社員） |
| --- | --- | --- |
| 新增、修改、刪除財產（含異動紀錄、`borrow_rule`、授權出借人名單） | ✅ | ❌ `FORBIDDEN` |
| 新增、修改、刪除類別 | ✅ | ❌ `FORBIDDEN` |
| 新增、修改、刪除盤點計畫 | ✅ | ❌ `FORBIDDEN` |
| 查看使用者名單（`user.list`） | ✅ | ❌ `FORBIDDEN` |
| 查看財產、類別 | ✅ | ✅ |
| 借出 | 依 `borrow_rule` 與授權人名單；可選任何借用人 | 依 `borrow_rule` 與授權人名單；**借用人固定為自己**（不需要 `user.list`） |
| 修改、歸還出借單 | 只有開單人（`creator_id`） | 同左 |
| 執行被分配的盤點（勾選、填異常） | 被分配者 | 被分配者 |
| 盤點結案 | 只有計畫發起人 | 非發起人 ❌ `FORBIDDEN` |

驗收：上表每一格都有 `bun test` 測試（授權成功、未授權 `FORBIDDEN`）。

### 5.3 出借（補齊現有 `borrow` router，不另起一套）

資料模型：一張出借單（`borrow_records`）對應**一筆財產**（`assetId`）和借出數量（`quantity`）。財產狀態存在 `asset_records`（每種狀態一列，記錄數量），`assets` 表本身沒有 status 欄位。

- 在 `AssetStatus` 加上 `borrowed`。
- 借出：把該單的 `quantity` 從該財產的 `normal` 移到 `borrowed`。單件財產（數量 1）就等於整件改為 borrowed。
- 歸還：把該單的 `quantity` 從 `borrowed` 移回 `normal`，出借單 `recordStatus` 改為 `returned`。
- 只動該單內的財產和數量，不動單據以外的財產；借出和歸還都在同一個 transaction 內完成。
- 庫存檢查改用 `normal` 的數量，避免和進行中的出借單重複扣除。
- 借用人：一般社員只能幫自己借（`borrowerId` 固定為自己，後端也驗證）；admin 才能選其他借用人。不為社員另開使用者名單查詢。
- 修改出借單（`update`）：只限開單人、只限 `active` 的單，只能改非數量欄位（備註、預計歸還日）；`assetId`、`quantity`、`recordStatus` 不能用 `update` 修改（狀態只透過借出和歸還改變）。
- 驗收：
  - [ ] 借出後該財產的 `borrowed` 數量增加、`normal` 數量減少；歸還後恢復；其他財產不變。
  - [ ] 出借單 `recordStatus` 從 `active` 變成 `returned`。
  - [ ] 非開單人歸還得到 `FORBIDDEN`；已歸還的單不能再歸還，也不能修改。
  - [ ] 一般社員把 `borrowerId` 設成別人時得到 `FORBIDDEN`。
  - [ ] `update` 傳入 `quantity`、`assetId` 或 `recordStatus` 時被拒絕。
  - [ ] 以上都有測試。

### 5.4 標籤機（NIIMBOT B21S，驅動做在 ams 內）

- 不做獨立的列印伺服器。
- 列印路徑：電腦瀏覽器（Chrome／Edge，Web Bluetooth）→ ams 內建驅動 → 已配對的 B21S。
- **本週只支援電腦版 Chrome／Edge。** 手機（含 Android）先不做；不支援的瀏覽器提示「請改用電腦版 Chrome 或 Edge」。
- QR code 一律指向 `/scan?id=<assetId>`，再依登入身分導向對應頁面。
- 貼紙內容：財產名稱、財產編號（學校產編）、QR code；Logo 可選。
- **標籤紙尺寸可調，不寫死**（David 2026-11-23 17:00 定案）：
  - 預設 50×30 mm（寬×高），集中定義在一個設定模組，程式其他地方不出現寫死的尺寸。
  - 列印對話框可以調整寬、高（mm），並記在該瀏覽器（例如 localStorage）；讀不到時回到預設值。
  - 區分兩種上限：**標籤紙尺寸**的輸入範圍依 B21S 支援的紙寬（上限 50 mm，預設 50×30 mm 必須合法）；**列印畫布**寬度是 `min(紙寬 mm × 8, 384)` px（203 DPI ≈ 8 px/mm，印字頭 384 px ≈ 48 mm，紙寬超過的部分是左右邊距）。
  - 版面（QR 大小、文字行數與字級）依畫布尺寸計算。
  - 超出紙張輸入範圍的尺寸要擋下並提示，不送出列印。
- `pu-cmrdb/printer` 倉庫不再使用，但**不封存、不刪除**（是否封存或刪除由 David 另外決定）。
- 驗收：
  - [ ] ams 內建驅動能用已配對的電腦 Chrome／Edge 印出 B21S 標籤，內容符合上述規格。
  - [ ] 預設以 50×30 mm 印出；改成其他尺寸（例如 40×30 mm）後版面會重新排列，印出尺寸正確；重新整理後設定仍在。
  - [ ] 不合法的尺寸被擋下並顯示提示。
  - [ ] 由瀏覽器觸發列印並成功；印表機未連線時顯示明確錯誤訊息。
  - [ ] 不支援的瀏覽器顯示改用電腦版 Chrome／Edge 的提示。
  - [ ] 掃描 QR 會進入 `/scan?id=<assetId>`，並依登入身分導向正確頁面。
- 不做：批次列印、缺紙或卡紙等硬體狀態回報、手機列印。

### 5.5 安全升級

- Next.js 升到 16.4.6（併入 M1）。
- Better Auth 升到 1.7.16（與 identity 一起規劃，合併前先在本機實測登入）。

### 5.6 本週不做

- 逾期通知信、批次列印、盤點圖表、多層審核、全站統計。
- 各 issue 中標為「第一版暫緩」的項目。
- 手機（含 Android）標籤列印。
- identity 的預設管理員密碼與種子腳本修改。

### 5.7 P0–P6 優先順序

依行雲司清單。清單內容收到後補在這裡。
