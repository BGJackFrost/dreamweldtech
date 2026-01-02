CREATE TABLE `faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` text NOT NULL,
	`questionEn` text,
	`answer` text NOT NULL,
	`answerEn` text,
	`category` varchar(100),
	`sortOrder` int DEFAULT 0,
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `home_page_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionKey` varchar(100) NOT NULL,
	`title` varchar(500),
	`titleEn` varchar(500),
	`subtitle` text,
	`subtitleEn` text,
	`content` text,
	`contentEn` text,
	`image` varchar(500),
	`backgroundImage` varchar(500),
	`buttonText` varchar(100),
	`buttonTextEn` varchar(100),
	`buttonLink` varchar(500),
	`sortOrder` int DEFAULT 0,
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `home_page_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `home_page_sections_sectionKey_unique` UNIQUE(`sectionKey`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`status` enum('active','unsubscribed') NOT NULL DEFAULT 'active',
	`source` varchar(100),
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`unsubscribedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`)
);
