# 貢獻指南

## 分支策略

從 `main` 切出新分支，命名格式如下：

```text
feat/member-list
fix/login-redirect
chore/update-deps
```

完成後開 PR 合併回 `main`，需至少一位成員 review 才能 merge。

## Commit 格式

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```text
feat: 新增成員管理頁面
fix: 修正 OAuth callback 錯誤
chore: 更新相依套件
style: 格式調整
refactor: 重構 auth config
docs: 更新 README
```

每筆 commit 只做一件事。訊息用中文或英文都可以，但同一個 PR 內保持一致。

## 提交前

```bash
bun run check   # ESLint + TypeScript 型別檢查
```

確保沒有新的錯誤才開 PR。lint warning 可以暫時保留，但不要讓 error 進 main。

## 資料庫 schema 異動

修改 schema 後，需要重新產生 migration：

```bash
bun run drizzle:generate
```

把產生的 migration 檔案一起納入同一個 PR，不要分開送。

## 幾個注意事項

- `src/components/ui/` 是 shadcn 自動產生的，不要手動改
- 環境變數要新增的話，記得同步更新 `src/env.ts` 和 `.env.example`
- 不要把 `.env` 或任何 secret 推上去

## PR 說明

PR 標題用自然語言描述，不需要套用 commit 格式，這樣更容易一眼看懂改了什麼。說明欄至少寫清楚「改了什麼」和「為什麼這樣改」。截圖或錄影能幫助 reviewer 更快理解，UI 改動的話建議附上。
