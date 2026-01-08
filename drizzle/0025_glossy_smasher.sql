CREATE TABLE `admin_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`username` varchar(255),
	`action` varchar(50) NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` int,
	`resourceName` varchar(255),
	`description` text,
	`previousValues` text,
	`newValues` text,
	`changedFields` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('success','failed','partial') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`durationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ip_access_control` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`type` enum('blacklist','whitelist') NOT NULL,
	`reason` text,
	`addedBy` int,
	`expiresAt` timestamp,
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`hitCount` int NOT NULL DEFAULT 0,
	`lastHitAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ip_access_control_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ip_lockouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`failedAttempts` int NOT NULL DEFAULT 0,
	`lockedAt` timestamp,
	`lockedUntil` timestamp,
	`isLocked` enum('true','false') NOT NULL DEFAULT 'false',
	`lastAttemptAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ip_lockouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `ip_lockouts_ipAddress_unique` UNIQUE(`ipAddress`)
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`username` varchar(255),
	`success` enum('true','false') NOT NULL DEFAULT 'false',
	`userAgent` text,
	`failureReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`)
);
