CREATE TYPE "public"."mill_line" AS ENUM('Premix', 'Excel', 'CGM');--> statement-breakpoint
CREATE TYPE "public"."production_state" AS ENUM('Pending', 'Mixing', 'Completed', 'Blocked');--> statement-breakpoint
CREATE TABLE "production_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"customer" text NOT NULL,
	"product" text NOT NULL,
	"weight_lbs" numeric(10, 2) NOT NULL,
	"delivery_time" text NOT NULL,
	"state" "production_state" NOT NULL,
	"mill_line" "mill_line" NOT NULL,
	"texture_type" text,
	"line_code" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_state" "production_state",
	"to_state" "production_state" NOT NULL,
	"changed_by" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text NOT NULL,
	"row_count" integer NOT NULL,
	"imported_by" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"email" text,
	"last_seen_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_production_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."production_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orders_state" ON "production_orders" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_orders_mill_line" ON "production_orders" USING btree ("mill_line");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_orders_order_number" ON "production_orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "idx_events_order_id_changed_at_desc" ON "order_events" USING btree ("order_id","changed_at" DESC NULLS LAST);