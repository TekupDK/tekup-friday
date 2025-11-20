CREATE TABLE `email_ai_metadata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`gmailThreadId` varchar(255) NOT NULL,
	`summary` text,
	`priorityScore` int NOT NULL DEFAULT 0,
	`sentiment` enum('positive','neutral','negative','urgent'),
	`actionItems` json,
	`keyTopics` json,
	`suggestedReplies` json,
	`lastAnalyzedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_ai_metadata_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`displayName` varchar(64) NOT NULL,
	`description` text,
	`color` varchar(32),
	`icon` varchar(64),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_labels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`color` varchar(32) NOT NULL,
	`icon` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_labels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`priority` int NOT NULL DEFAULT 0,
	`conditions` json NOT NULL,
	`actions` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` text,
	`body` text NOT NULL,
	`category` varchar(64),
	`variables` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_thread_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`categoryId` int NOT NULL,
	`confidence` int NOT NULL DEFAULT 100,
	`isManual` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_thread_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_thread_labels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`labelId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_thread_labels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `snoozed_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`threadId` int NOT NULL,
	`gmailThreadId` varchar(255) NOT NULL,
	`snoozeUntil` timestamp NOT NULL,
	`reminder` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `snoozed_emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`inboxLayout` enum('gmail_categories','important_other','basic') NOT NULL DEFAULT 'gmail_categories',
	`defaultView` varchar(64) DEFAULT 'all',
	`emailsPerPage` int NOT NULL DEFAULT 50,
	`theme` varchar(32) DEFAULT 'system',
	`enableAISummarization` boolean NOT NULL DEFAULT true,
	`enableSmartReplies` boolean NOT NULL DEFAULT true,
	`enablePriorityScoring` boolean NOT NULL DEFAULT true,
	`settings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
