CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` enum('create','update','delete','view','export','import','login','logout') NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int,
	`entityName` varchar(255),
	`oldValues` text,
	`newValues` text,
	`changes` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('success','failed') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`permissions` text,
	`isSystem` enum('true','false') NOT NULL DEFAULT 'false',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `notification_center` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`type` enum('contact','quote','application','newsletter','system','product','news') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`icon` varchar(100),
	`link` varchar(500),
	`relatedEntityType` varchar(100),
	`relatedEntityId` int,
	`isRead` enum('true','false') NOT NULL DEFAULT 'false',
	`readAt` timestamp,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`category` varchar(100),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `notification_center_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`emailNotification` enum('true','false') NOT NULL DEFAULT 'true',
	`inAppNotification` enum('true','false') NOT NULL DEFAULT 'true',
	`pushNotification` enum('true','false') NOT NULL DEFAULT 'false',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_admin_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`assignedBy` int,
	CONSTRAINT `user_admin_roles_id` PRIMARY KEY(`id`)
);
