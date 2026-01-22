CREATE TABLE "notificationPreferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"enableBrowserNotifications" integer DEFAULT 1 NOT NULL,
	"enableInAppNotifications" integer DEFAULT 1 NOT NULL,
	"enableSoundAlerts" integer DEFAULT 1 NOT NULL,
	"enableVibration" integer DEFAULT 1 NOT NULL,
	"notifyOfflineMessages" integer DEFAULT 1 NOT NULL,
	"notifyMissedCalls" integer DEFAULT 1 NOT NULL,
	"quietHoursStart" varchar(5),
	"quietHoursEnd" varchar(5),
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notificationPreferences_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"messageId" integer,
	"offlineMessageId" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"read" integer DEFAULT 0 NOT NULL,
	"archived" integer DEFAULT 0 NOT NULL,
	"actionUrl" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"readAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "notificationPreferences" ADD CONSTRAINT "notificationPreferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_senderId_users_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_messageId_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_offlineMessageId_offlineMessages_id_fk" FOREIGN KEY ("offlineMessageId") REFERENCES "public"."offlineMessages"("id") ON DELETE no action ON UPDATE no action;