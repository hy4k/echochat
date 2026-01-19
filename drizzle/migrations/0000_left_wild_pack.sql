CREATE TABLE "keepsakes" (
	"id" serial PRIMARY KEY NOT NULL,
	"messageId" integer,
	"userId" integer NOT NULL,
	"title" text,
	"description" text,
	"pinnedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"senderId" integer NOT NULL,
	"receiverId" integer NOT NULL,
	"content" text,
	"mediaUrl" text,
	"messageType" text DEFAULT 'text' NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"isOffline" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offlineMessages" (
	"id" serial PRIMARY KEY NOT NULL,
	"senderId" integer NOT NULL,
	"receiverId" integer NOT NULL,
	"content" text,
	"mediaUrl" text,
	"messageType" text NOT NULL,
	"viewed" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharedHorizon" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"weatherCondition" varchar(50),
	"temperature" varchar(10),
	"timeOfDay" varchar(20),
	"backgroundColor" varchar(7),
	"accentColor" varchar(7),
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sharedHorizon_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "userPresence" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"isOnline" integer DEFAULT 0 NOT NULL,
	"lastSeenAt" timestamp with time zone DEFAULT now() NOT NULL,
	"latitude" varchar(20),
	"longitude" varchar(20),
	"timezone" varchar(50),
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "userPresence_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" text DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "keepsakes" ADD CONSTRAINT "keepsakes_messageId_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keepsakes" ADD CONSTRAINT "keepsakes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_users_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_users_id_fk" FOREIGN KEY ("receiverId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offlineMessages" ADD CONSTRAINT "offlineMessages_senderId_users_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offlineMessages" ADD CONSTRAINT "offlineMessages_receiverId_users_id_fk" FOREIGN KEY ("receiverId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharedHorizon" ADD CONSTRAINT "sharedHorizon_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userPresence" ADD CONSTRAINT "userPresence_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;