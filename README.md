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

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
