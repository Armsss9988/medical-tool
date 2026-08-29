CREATE TABLE "catalog_items" (
	"code" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"ref_min" real,
	"ref_max" real,
	"unit" text DEFAULT '' NOT NULL,
	"ref_text" text DEFAULT '' NOT NULL,
	"price" real,
	"scientific" text,
	"equipment" text,
	"evaluation_type" text,
	"reference_range_id" text,
	"scale_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinic_info" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"website" text,
	"default_doctor" text NOT NULL,
	"logo_url" text,
	"stamp_url" text,
	"bank_id" text,
	"bank_name" text,
	"bank_account_no" text,
	"bank_account_name" text,
	"bank_branch" text,
	"bank_qr_image_url" text,
	"cashier_name" text,
	"accountant_name" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"specialty" text,
	"phone" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"codes" text[] NOT NULL,
	"price" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zalo_config" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"app_id" text DEFAULT '' NOT NULL,
	"secret_key" text DEFAULT '' NOT NULL,
	"oa_id" text DEFAULT '' NOT NULL,
	"access_token" text DEFAULT '' NOT NULL,
	"refresh_token" text,
	"template_id" text DEFAULT '' NOT NULL,
	"auto_send_on_export" boolean DEFAULT false NOT NULL,
	"proxy_url" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
