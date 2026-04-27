CREATE TYPE "public"."metric_type" AS ENUM('weight', 'body_fat', 'steps');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('healthplanet');--> statement-breakpoint
CREATE TYPE "public"."source_endpoint" AS ENUM('innerscan', 'pedometer');--> statement-breakpoint
CREATE TABLE "goal_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" text NOT NULL,
	"target_date" text NOT NULL,
	"start_weight" numeric(10, 3) NOT NULL,
	"target_weight" numeric(10, 3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "provider" NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp with time zone,
	"granted_scopes" text NOT NULL,
	"last_successful_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"metric_type" "metric_type" NOT NULL,
	"source_endpoint" "source_endpoint" NOT NULL,
	"source_tag" text NOT NULL,
	"value" numeric(10, 3) NOT NULL,
	"measured_at" timestamp with time zone NOT NULL,
	"measurement_day" text,
	"device_model" text,
	"source" text,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"trigger" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text NOT NULL,
	"records_imported" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"error_message" text,
	"partial_failure" boolean DEFAULT false NOT NULL,
	"details" jsonb
);
--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_connection_id_health_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."health_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_connection_id_health_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."health_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goal_settings_active_idx" ON "goal_settings" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "measurements_uniq" ON "measurements" USING btree ("connection_id","metric_type","measured_at");--> statement-breakpoint
CREATE INDEX "measurements_by_metric_measured_at" ON "measurements" USING btree ("connection_id","metric_type","measured_at");--> statement-breakpoint
CREATE INDEX "measurements_by_metric_day" ON "measurements" USING btree ("connection_id","metric_type","measurement_day");--> statement-breakpoint
CREATE INDEX "sync_runs_by_conn_started_at" ON "sync_runs" USING btree ("connection_id","started_at");