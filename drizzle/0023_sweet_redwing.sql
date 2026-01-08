CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`isUsed` enum('true','false') NOT NULL DEFAULT 'false',
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user_2fa_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isEnabled` enum('true','false') NOT NULL DEFAULT 'false',
	`totpSecret` varchar(255),
	`backupCodes` text,
	`backupCodesUsed` int DEFAULT 0,
	`lastVerifiedAt` timestamp,
	`failedAttempts` int DEFAULT 0,
	`lockedUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_2fa_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_2fa_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionToken` varchar(255) NOT NULL,
	`deviceType` varchar(50),
	`deviceName` varchar(255),
	`browser` varchar(100),
	`os` varchar(100),
	`ipAddress` varchar(45),
	`location` varchar(255),
	`userAgent` text,
	`isCurrent` enum('true','false') NOT NULL DEFAULT 'false',
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`isRevoked` enum('true','false') NOT NULL DEFAULT 'false',
	`revokedAt` timestamp,
	`revokeReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
