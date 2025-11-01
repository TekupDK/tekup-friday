CREATE TABLE `customer_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`conversationId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`emailThreadId` int,
	`gmailThreadId` varchar(255) NOT NULL,
	`subject` text,
	`snippet` text,
	`lastMessageDate` timestamp,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`invoiceId` int,
	`billyInvoiceId` varchar(255) NOT NULL,
	`invoiceNo` varchar(64),
	`amount` int NOT NULL,
	`paidAmount` int NOT NULL DEFAULT 0,
	`status` enum('draft','approved','sent','paid','overdue','voided') NOT NULL DEFAULT 'draft',
	`entryDate` timestamp,
	`dueDate` timestamp,
	`paidDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`billyCustomerId` varchar(255),
	`billyOrganizationId` varchar(255),
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`phone` varchar(32),
	`totalInvoiced` int NOT NULL DEFAULT 0,
	`totalPaid` int NOT NULL DEFAULT 0,
	`balance` int NOT NULL DEFAULT 0,
	`invoiceCount` int NOT NULL DEFAULT 0,
	`emailCount` int NOT NULL DEFAULT 0,
	`aiResume` text,
	`lastContactDate` timestamp,
	`lastSyncDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_profiles_id` PRIMARY KEY(`id`)
);
