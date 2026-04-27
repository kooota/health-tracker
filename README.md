## Health Tracker (Health Planet Dashboard)

個人用の Health Planet ダッシュボード（v1）です。

### セットアップ

`.env.local` を作成し、以下を設定してください。

- `AUTH_SECRET`
- `APP_LOGIN_USERNAME`
- `APP_LOGIN_PASSWORD_HASH`（bcrypt）
- `DATABASE_URL`
- `HEALTHPLANET_CLIENT_ID`
- `HEALTHPLANET_CLIENT_SECRET`
- `HEALTHPLANET_REDIRECT_URI`
- `TOKEN_ENCRYPTION_KEY`
- `CRON_SECRET`

DBを用意できたら、マイグレーションを生成・適用します。

```bash
npm run db:generate
npm run db:migrate
```

起動:

```bash
npm run dev
```

### 動作確認（最低限）

- `/login` でログインできること
- `/settings` で「連携する」を押し、Health Planet 認可 → コールバックで `connected` になること
- `/settings` の「手動同期」でデータを取り込みできること
- Cronは `GET /api/cron/sync` に `Authorization: Bearer ${CRON_SECRET}` を付けて実行できること
