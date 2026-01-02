CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('contact','quote','application','newsletter','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`link` varchar(500),
	`isRead` enum('true','false') NOT NULL DEFAULT 'false',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleEn` varchar(255),
	`description` text,
	`descriptionEn` text,
	`category` varchar(100),
	`client` varchar(255),
	`location` varchar(255),
	`completedDate` varchar(50),
	`images` text,
	`videoUrl` varchar(500),
	`tags` varchar(500),
	`isFeatured` enum('true','false') NOT NULL DEFAULT 'false',
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_items_id` PRIMARY KEY(`id`)
);
