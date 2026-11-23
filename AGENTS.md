# AGENTS.md

給所有在 `pu-cmrdb/ams` 工作的人類與 AI agent 的規則。
本倉庫採用 **issue-driven-dev** 流程：每個變更都從 GitHub issue 開始，經過審查的 PR 才能進 `main`。

需求、技術棧、本機開發與驗收條件見 [`docs/requirements.md`](docs/requirements.md)；一般貢獻規範見 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

## 流程

1. 從一個 open issue `#N` 開始；沒有 issue 就先開 issue，寫清楚背景、要做什麼、驗收條件。
2. 從最新的 `main` 切分支：`<type>/<N>-<short-slug>`（例：`fix/12-asset-delete-permission`）。
3. Commit 使用 Conventional Commits，並在訊息中引用 issue（`#N`）。
4. 推送前在本機跑過 CI 會跑的檢查（見下方「推送前檢查」），紅燈不推。
5. 開 PR，說明中寫 `Closes #N`、改了什麼、為什麼、怎麼驗證。一個 issue 對一個 PR，彼此獨立的工作分開送。
6. PR 可合併的條件：
   - CI 在 PR 目前的 head commit 全綠。
   - 審查（邏輯／正確性／安全）回報 0 Blocker、0 Major；動到前端（TSX、CSS、樣式 token）時另做 UI 審查。
   - 審查與合併針對同一個 head commit，用 `gh pr merge --match-head-commit <sha>` 鎖定。
7. 合併由維護者決定，開發者 agent 不自行合併。

## 推送前檢查

```bash
bun install --frozen-lockfile
SKIP_ENV_VALIDATION=true bun run typegen
bun run lint
bun run typecheck
bun test
bun run build   # 需要環境變數，可用 .env.example 填假值或加 SKIP_ENV_VALIDATION=true
```

改了 `package.json` 一定要一起提交更新後的 `bun.lock`，否則 CI 的 `--frozen-lockfile` 會失敗。

## 硬性規則

- **不要 push 到 `main`**，所有變更都走 PR。
- **不要 force-push** 共用分支。
- **開發者／審查者 agent 不合併 PR。**
- **不要建立、印出或提交 `.env` 或任何金鑰**（OAuth client secret、API key、`BETTER_AUTH_SECRET`）。本機需要值時，從 `.env.example` 複製並填假值或本機 identity 產生的開發用值。
- **不要碰正式站**（`ams.cmrdb.cs.pu.edu.tw`、`iam.cmrdb.cs.pu.edu.tw`），也不要觸發部署。`deploy.yaml` 只在 push `main` 時建置並推送映像。
- **不要提交真實人員或財產資料**，測試只用合成資料（見 `tests/helpers/mock-data.ts`）。
- 不要跳過 hooks 或停用 CI 檢查來讓 PR 變綠。
- `src/components/ui/` 由 shadcn 產生，非必要不手動修改；必須修改時在 PR 說明原因。
- Schema 異動時，`bun run drizzle:generate` 產生的 migration 與程式碼放在同一個 PR。
- 新增環境變數時同步更新 `src/env.ts` 與 `.env.example`（只放範例值）。
