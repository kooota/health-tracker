# Health Planet Dashboard Web App Plan

## Summary

- `Next.js App Router + TypeScript`で個人用のWebアプリを新規構築し、Git連携でVercelへデプロイする。
- v1は`体重・体脂肪率・歩数`を対象にし、`目標体重 + 達成期限`を1組だけ持つ。
- Health Planet連携はOAuth認可コードフローで接続し、取得データは`Postgres`へ蓄積して長期履歴を表示する。
- 更新は`手動同期 + Vercel Cronによる日次自動同期`の併用にする。
- アクセス制御はVercel機能に依存せず、`アプリ内ログイン`で保護する。

## Key Changes

### App architecture

- フロントは`Next.js 15`、スタイルは`Tailwind CSS`、UIは`shadcn/ui`、チャートは`Recharts`を採用する。
- デザインは明るい背景を基調にし、`teal/emerald=良化`, `coral/red=目標から離れる`, `amber=注意`, `slate=中立`の意味色を固定する。
- 画面は`/login`、`/dashboard`、`/settings`の3系統に絞る。
- デプロイは`main`を本番、ブランチごとにVercel Previewを使う。
- DBマイグレーションは`Drizzle`で管理し、本番適用はVercelデプロイ前後の自動実行ではなく、明示コマンドで適用する運用にする。

### Auth and security

- アプリ内ログインは`Auth.js Credentials`で実装し、単一管理者アカウントを環境変数で持つ。
- Vercel環境変数に`HEALTHPLANET_CLIENT_ID`, `HEALTHPLANET_CLIENT_SECRET`, `HEALTHPLANET_REDIRECT_URI`, `AUTH_SECRET`, `APP_LOGIN_USERNAME`, `APP_LOGIN_PASSWORD_HASH`, `DATABASE_URL`, `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`を設定する。
- Health Planetの`access_token`はDB保存前にアプリ側で暗号化する。鍵ローテーションはv1では未実装とし、将来課題として明記する。
- Health Planet公式仕様では`/oauth/token`の`grant_type`は`authorization_code`のみ記載されているため、v1では`refresh_token`更新を実装前提にしない。トークン期限到来または401系エラー時は`再連携が必要`として扱う。
- ログイン試行にはEdge Middlewareまたはサーバー側レート制限を入れ、単一管理者構成でも総当たり耐性を持たせる。
- 同期APIと設定更新APIは認証必須、Cronエンドポイントは`Authorization: Bearer ${CRON_SECRET}`検証で保護する。

### Data model and sync

- DBは`Neon Postgres via Vercel Marketplace`を前提にし、ORMは`Drizzle`を採用する。
- 主テーブルは`health_connections`, `measurements`, `goal_settings`, `sync_runs`の4つにする。
- `health_connections`は単一利用者前提でもテーブル化し、少なくとも`id`, `provider`, `access_token_encrypted`, `refresh_token_encrypted?`, `token_expires_at?`, `granted_scopes`, `last_successful_sync_at`, `created_at`, `updated_at`を保持する。`refresh_token_encrypted`は将来拡張用の予約カラム扱いで、v1の同期分岐では使用しない。
- `measurements`は1行1測定値の正規化モデルにし、`metric_type`, `source_endpoint`, `source_tag`, `value`, `measured_at`, `measurement_day`, `device_model`, `source`, `synced_at`を保持する。
- `measurements`には`UNIQUE(connection_id, metric_type, measured_at)`を置き、再同期時はupsertで重複保存を防ぐ。
- `sync_runs`はジョブ単位の親レコードに加え、window単位の進捗を追える構造にし、少なくとも`endpoint`, `window_from`, `window_to`, `status`, `imported_count`, `error_message`を保持する。
- v1の取得対象は次の対応で固定する。
  - `innerscan` scope / `/status/innerscan` / `6021=weight`, `6022=body_fat`
  - `pedometer` scope / `/status/pedometer` / `6331=steps`
- OAuth認可時のscopeは`innerscan,pedometer`を要求し、血圧はv1対象外とする。
- `innerscan`はAPIの測定日時をそのまま`measured_at`へ保存し、`pedometer`は日次値として扱って対象日のローカル日付を`measurement_day`へ保存、`measured_at`は`00:00:00 Asia/Tokyo`に正規化する。
- 初回接続時は「最古日まで無制限に遡る」前提を置かず、`直近12か月`を上限に3か月幅で分割バックフィルする。
- 1回の同期実行では最大`8 window`まで処理する。v1の初回バックフィルは`12か月 x 2 endpoint`でちょうど収まる想定だが、将来の対象追加時も1ジョブ上限を固定してCronの実行時間を抑える。
- 増分同期は`last_successful_sync_at`以降を対象にし、部分失敗時は成功した窓だけ保存しても同期カーソルは進めず、次回Cronで同じ開始点から再取得してupsertで収束させる。
- Cron失敗時の特別リトライは持たず、次回日次Cronと手動同期の両方が`last_successful_sync_at`基準で自動キャッチアップする。
- トークン失効やAPIエラー時は`sync_runs`に失敗理由を残し、UI上で`再連携が必要`を明示する。window単位の失敗がある場合は、どのendpoint・どの期間で止まったかを表示する。
- `goal_settings`はv1では現行1件だけを参照するが、DB上は`id`, `is_active`, `start_date`, `target_date`, `start_weight`, `target_weight`, `created_at`を持たせ、将来の履歴化に備える。

### UX and dashboard behavior

- ダッシュボード上部に`現在体重`, `目標との差`, `開始時との差`, `残り日数`, `必要ペース(kg/週)`をカード表示する。
- `現在体重`は最新の体重測定1件を使う。当日複数回ある場合も平均化せず、`measured_at`が最も新しい値を採用する。
- `目標との差`は`currentWeight - targetWeight`、`開始時との差`は`currentWeight - startWeight`で統一し、減量方向はマイナス、増量方向はプラスで表示する。
- `必要ペース(kg/週)`は`(targetWeight - currentWeight) / remainingWeeks`で計算する。`remainingWeeks`は`max(remainingDays / 7, 1/7)`の小数値を使い、表示は小数第2位で丸める。期限超過時は数値の代わりに`期限超過`を表示する。
- 体重チャートは`実測線 + 目標線 + 目標期間の帯`を重ね、現在位置と差分を一目で見せる。
- 体重チャートは生データを時系列で描画し、同日に複数測定がある場合も間引かない。日次集約はv1では行わない。
- 体脂肪率は体重チャートと同一X軸の二段構成で表示し、日付比較をしやすくする。
- 歩数は日別バーと7日移動平均線で表示する。
- 設定画面で`目標体重`, `目標期限`, `目標開始日`, `Health Planet再連携`, `手動同期`を操作できるようにする。
- 目標保存時に`startWeight`をスナップショット保存し、`開始時との差`は後続の測定補正に影響されない表示にする。
- 同期状態として`最終同期日時`, `件数`, `失敗時メッセージ`を表示する。

## Public Interfaces / Types

- Pages: `/login`, `/dashboard`, `/settings`
- Routes:
  - `GET /api/healthplanet/connect`
  - `GET /api/healthplanet/callback`
  - `POST /api/sync/manual`
  - `GET /api/cron/sync`
  - `PATCH /api/goals/current`
- Server-side types:
  - `MetricType = 'weight' | 'body_fat' | 'steps'`
  - `SourceEndpoint = 'innerscan' | 'pedometer'`
  - `Measurement = { metricType, sourceEndpoint, sourceTag, value, measuredAt, measurementDay, deviceModel, syncedAt }`
  - `GoalSetting = { startDate, targetDate, startWeight, targetWeight }`
  - `SyncStatus = { status, lastSyncedAt, recordsImported, errorCode, errorMessage, partialFailure }`
  - `SyncWindowStatus = { endpoint, windowFrom, windowTo, status, importedCount, errorMessage }`

## Test Plan

- Health Planet OAuth接続成功、認可拒否、期限切れコード、無効トークンを確認する。
- トークン期限切れまたは401系エラー時に自動refreshへ進まず、再連携要求UIへ遷移することを確認する。
- 初回バックフィルで直近12か月を3か月単位に分割取得し、`innerscan`と`pedometer`の両系統を保存できることを確認する。
- 同じ期間のバックフィルを2回連続で実行しても件数が増えず、upsertで重複が発生しないことを確認する。
- 手動同期とCron同期の両方で、増分取得・0件取得・部分失敗時の挙動、および次回同期で`last_successful_sync_at`から自動キャッチアップすることを確認する。
- 1回の同期でwindow上限を超えないこと、各windowの成否と件数が`sync_runs`に記録されることを確認する。
- 目標設定の変更で、カード差分・必要ペース・チャート目標線が即時反映されることを確認する。
- 同日複数回測定時に最新値が`現在体重`へ採用されること、歩数が日次バーとして正しく集計表示されることを確認する。
- 未接続、データ空、同期失敗、目標未設定、期限超過の各空状態をUIで確認する。
- モバイル幅とデスクトップ幅で主要カードとチャートが崩れないことを確認する。
- ログイン失敗のレート制限と、Cronの`CRON_SECRET`不一致時の拒否を確認する。

## Assumptions and Additional Considerations

- 2026年4月27日時点の公式仕様に基づき、Health Planet APIはOAuth認可コードフロー、`innerscan`, `pedometer`, `sphygmomanometer`の個別scope、1時間60回制限、各取得リクエストの3か月幅制約を持つ前提で設計する。参考: [Health Planet API仕様](https://www.healthplanet.jp/apis/api.html)
- 2026年4月27日時点の公式仕様では`refresh_token`による更新フローは明示されておらず、`/oauth/token`の`grant_type`は`authorization_code`のみ記載されている。このため本計画では`refresh不可または未サポート`として扱う。参考: [Health Planet API仕様](https://www.healthplanet.jp/apis/api.html)
- 2026年4月27日時点で、VercelのPassword Protectionは`EnterpriseまたはProの有料アドオン`条件があるため、個人用でもアプリ内ログインを標準案にする。参考: [Deployment Protection](https://vercel.com/docs/deployment-protection), [Password Protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection)
- Vercel上のDBは現行の`Marketplace Storage`前提にし、PostgresはNeonを第一候補にする。参考: [Storage on Vercel Marketplace](https://vercel.com/docs/marketplace-storage), [Storage overview](https://vercel.com/docs/storage)
- 自動同期はVercel Cronを使い、v1は`日次同期`を標準とする。参考: [Cron Jobs](https://vercel.com/docs/cron-jobs)
- 追加で検討すべき項目は3つだけに絞る。
  - 将来的に`血圧`を別scope追加を伴う`v2`として入れるか
  - CSVエクスポートを入れるか
  - 体重以外の目標指標`歩数目標`まで広げるか
