ALTER TABLE `email_threads` ADD `isStarred` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `email_threads` ADD `isArchived` boolean DEFAULT false NOT NULL;