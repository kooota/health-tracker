import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const providerEnum = pgEnum("provider", ["healthplanet"]);
export const metricTypeEnum = pgEnum("metric_type", ["weight", "body_fat", "steps"]);
export const sourceEndpointEnum = pgEnum("source_endpoint", ["innerscan", "pedometer"]);

export const healthConnections = pgTable("health_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: providerEnum("provider").notNull(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  grantedScopes: text("granted_scopes").notNull(),
  lastSuccessfulSyncAt: timestamp("last_successful_sync_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const measurements = pgTable(
  "measurements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => healthConnections.id, { onDelete: "cascade" }),
    metricType: metricTypeEnum("metric_type").notNull(),
    sourceEndpoint: sourceEndpointEnum("source_endpoint").notNull(),
    sourceTag: text("source_tag").notNull(),
    value: numeric("value", { precision: 10, scale: 3 }).notNull(),
    measuredAt: timestamp("measured_at", { withTimezone: true }).notNull(),
    measurementDay: text("measurement_day"),
    deviceModel: text("device_model"),
    source: text("source"),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("measurements_uniq").on(
      t.connectionId,
      t.metricType,
      t.measuredAt,
    ),
    byMetricMeasuredAt: index("measurements_by_metric_measured_at").on(
      t.connectionId,
      t.metricType,
      t.measuredAt,
    ),
    byMetricDay: index("measurements_by_metric_day").on(
      t.connectionId,
      t.metricType,
      t.measurementDay,
    ),
  }),
);

// NOTE: in v1 we rely on UNIQUE(connection_id, metric_type, measured_at) and ignore conflicts.

export const goalSettings = pgTable(
  "goal_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    isActive: boolean("is_active").notNull().default(true),
    startDate: text("start_date").notNull(),
    targetDate: text("target_date").notNull(),
    startWeight: numeric("start_weight", { precision: 10, scale: 3 }).notNull(),
    targetWeight: numeric("target_weight", { precision: 10, scale: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    activeIdx: index("goal_settings_active_idx").on(t.isActive),
  }),
);

export const syncRuns = pgTable(
  "sync_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => healthConnections.id, { onDelete: "cascade" }),
    trigger: text("trigger").notNull(), // manual | cron
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    status: text("status").notNull(), // ok | error | needs_relink | partial
    recordsImported: integer("records_imported").notNull().default(0),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    partialFailure: boolean("partial_failure").notNull().default(false),
    details: jsonb("details"),
  },
  (t) => ({
    byConnStartedAt: index("sync_runs_by_conn_started_at").on(
      t.connectionId,
      t.startedAt,
    ),
  }),
);

