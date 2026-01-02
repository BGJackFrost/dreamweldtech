CREATE TABLE `partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`logo` varchar(500),
	`website` varchar(500),
	`description` text,
	`testimonial` text,
	`testimonialAuthor` varchar(255),
	`testimonialPosition` varchar(255),
	`category` enum('manufacturer','distributor','enterprise','government','other') DEFAULT 'enterprise',
	`isFeatured` enum('true','false') DEFAULT 'false',
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`),
	CONSTRAINT `partners_slug_unique` UNIQUE(`slug`)
);
