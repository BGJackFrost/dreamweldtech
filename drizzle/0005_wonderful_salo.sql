CREATE TABLE `job_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`resumeUrl` varchar(500),
	`coverLetter` text,
	`status` enum('pending','reviewing','interviewed','accepted','rejected') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`department` varchar(100),
	`location` varchar(255),
	`type` enum('full-time','part-time','contract','internship') DEFAULT 'full-time',
	`experience` varchar(100),
	`salary` varchar(100),
	`description` text,
	`requirements` text,
	`benefits` text,
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`deadline` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `jobs_slug_unique` UNIQUE(`slug`)
);
