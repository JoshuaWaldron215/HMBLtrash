CREATE TABLE "driver_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"total_pickups" integer DEFAULT 0,
	"completed_pickups" integer DEFAULT 0,
	"total_distance" numeric(10, 2),
	"total_earnings" numeric(10, 2),
	"average_rating" numeric(3, 2),
	"hours_worked" numeric(5, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"action_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"pickup_id" integer,
	"subscription_id" integer,
	"stripe_payment_intent_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"status" text NOT NULL,
	"payment_method" text,
	"failure_reason" text,
	"refund_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pickups" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"driver_id" integer,
	"address" text NOT NULL,
	"full_address" text,
	"coordinates" text,
	"bag_count" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"service_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_date" timestamp DEFAULT now(),
	"scheduled_date" timestamp,
	"completed_at" timestamp,
	"special_instructions" text,
	"route_id" integer,
	"route_order" integer,
	"estimated_arrival" timestamp,
	"pickup_window" text,
	"priority" text DEFAULT 'normal',
	"estimated_duration" integer,
	"actual_duration" integer,
	"customer_rating" integer,
	"driver_notes" text,
	"before_photo_url" text,
	"after_photo_url" text,
	"cancellation_reason" text,
	"payment_status" text DEFAULT 'pending',
	"stripe_payment_intent_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"pickup_ids" text[],
	"optimized_order" jsonb,
	"total_distance" numeric(10, 2),
	"estimated_time" integer,
	"google_maps_url" text,
	"start_location" text,
	"end_location" text,
	"route_instructions" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"zip_codes" text[],
	"is_active" boolean DEFAULT true,
	"base_fee" numeric(10, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"status" text NOT NULL,
	"next_pickup_date" timestamp,
	"frequency" text DEFAULT 'weekly' NOT NULL,
	"preferred_day" text,
	"preferred_time" text,
	"bag_count_limit" integer DEFAULT 5,
	"price_per_month" numeric(10, 2),
	"paused_until" timestamp,
	"cancellation_date" timestamp,
	"cancellation_reason" text,
	"auto_renewal" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"password_hash" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"phone" text,
	"address" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"first_name" text,
	"last_name" text,
	"profile_image_url" text,
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp,
	"email_verified" boolean DEFAULT false,
	"email_verification_token" text,
	"password_reset_token" text,
	"password_reset_expires" timestamp,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"two_factor_secret" text,
	"two_factor_enabled" boolean DEFAULT false,
	"login_history" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "driver_metrics" ADD CONSTRAINT "driver_metrics_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_pickup_id_pickups_id_fk" FOREIGN KEY ("pickup_id") REFERENCES "public"."pickups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickups" ADD CONSTRAINT "pickups_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickups" ADD CONSTRAINT "pickups_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickups" ADD CONSTRAINT "pickups_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");