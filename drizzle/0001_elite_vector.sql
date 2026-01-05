CREATE TABLE `keepsakes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int,
	`userId` int NOT NULL,
	`title` text,
	`description` text,
	`pinnedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keepsakes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('text','voice','video') NOT NULL DEFAULT 'text',
	`status` enum('sent','delivered','read') NOT NULL DEFAULT 'sent',
	`isOffline` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offlineMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`content` text,
	`mediaUrl` text,
	`messageType` enum('text','voice','video') NOT NULL,
	`viewed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offlineMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sharedHorizon` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weatherCondition` varchar(50),
	`temperature` varchar(10),
	`timeOfDay` varchar(20),
	`backgroundColor` varchar(7),
	`accentColor` varchar(7),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sharedHorizon_id` PRIMARY KEY(`id`),
	CONSTRAINT `sharedHorizon_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `userPresence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isOnline` int NOT NULL DEFAULT 0,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`latitude` varchar(20),
	`longitude` varchar(20),
	`timezone` varchar(50),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPresence_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPresence_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `keepsakes` ADD CONSTRAINT `keepsakes_messageId_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keepsakes` ADD CONSTRAINT `keepsakes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_receiverId_users_id_fk` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offlineMessages` ADD CONSTRAINT `offlineMessages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offlineMessages` ADD CONSTRAINT `offlineMessages_receiverId_users_id_fk` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sharedHorizon` ADD CONSTRAINT `sharedHorizon_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userPresence` ADD CONSTRAINT `userPresence_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;