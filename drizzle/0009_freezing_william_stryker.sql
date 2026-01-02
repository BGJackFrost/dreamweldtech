CREATE TABLE `banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` text,
	`description` text,
	`image` varchar(500) NOT NULL,
	`mobileImage` varchar(500),
	`link` varchar(500),
	`buttonText` varchar(100),
	`buttonLink` varchar(500),
	`position` enum('hero','promo','sidebar','footer') NOT NULL DEFAULT 'hero',
	`sortOrder` int DEFAULT 0,
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `banners_id` PRIMARY KEY(`id`)
);
