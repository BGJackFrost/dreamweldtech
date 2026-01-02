CREATE TABLE `dnd_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isEnabled` enum('true','false') NOT NULL DEFAULT 'true',
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`timezone` varchar(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
	`daysOfWeek` varchar(20) NOT NULL DEFAULT '1,2,3,4,5,6,7',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dnd_schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_digest_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`frequency` varchar(20) NOT NULL,
	`contactsCount` int DEFAULT 0,
	`applicationsCount` int DEFAULT 0,
	`newsletterCount` int DEFAULT 0,
	`systemCount` int DEFAULT 0,
	`status` enum('sent','failed','skipped') NOT NULL DEFAULT 'sent',
	`errorMessage` text,
	CONSTRAINT `email_digest_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_digest_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isEnabled` enum('true','false') NOT NULL DEFAULT 'false',
	`frequency` enum('daily','weekly','monthly') NOT NULL DEFAULT 'daily',
	`sendTime` varchar(5) NOT NULL DEFAULT '09:00',
	`sendDay` int DEFAULT 1,
	`timezone` varchar(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
	`includeContacts` enum('true','false') NOT NULL DEFAULT 'true',
	`includeApplications` enum('true','false') NOT NULL DEFAULT 'true',
	`includeNewsletter` enum('true','false') NOT NULL DEFAULT 'true',
	`includeSystem` enum('true','false') NOT NULL DEFAULT 'true',
	`lastSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_digest_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_digest_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` varchar(255) NOT NULL,
	`auth` varchar(255) NOT NULL,
	`userAgent` varchar(500),
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
