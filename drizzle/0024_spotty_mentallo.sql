CREATE TABLE `known_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceFingerprint` varchar(64) NOT NULL,
	`deviceName` varchar(255),
	`deviceType` varchar(50),
	`browser` varchar(100),
	`os` varchar(100),
	`lastIpAddress` varchar(45),
	`lastLocation` varchar(255),
	`isTrusted` enum('true','false') NOT NULL DEFAULT 'false',
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `known_devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `security_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`type` varchar(50) NOT NULL DEFAULT 'string',
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `security_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `user_access_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actionType` varchar(100) NOT NULL,
	`description` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`deviceInfo` varchar(255),
	`browser` varchar(100),
	`os` varchar(100),
	`location` varchar(255),
	`metadata` text,
	`status` enum('success','failed','blocked') NOT NULL DEFAULT 'success',
	`riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_access_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_security_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notifyOnNewLogin` enum('true','false') NOT NULL DEFAULT 'true',
	`notifyOnPasswordChange` enum('true','false') NOT NULL DEFAULT 'true',
	`notifyOn2FAChange` enum('true','false') NOT NULL DEFAULT 'true',
	`require2FAForSensitiveActions` enum('true','false') NOT NULL DEFAULT 'false',
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_security_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_security_preferences_userId_unique` UNIQUE(`userId`)
);
