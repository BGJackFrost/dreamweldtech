CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`language` enum('vi','en','ja','zh') NOT NULL DEFAULT 'vi',
	`theme` enum('light','dark','system') NOT NULL DEFAULT 'system',
	`timezone` varchar(100) DEFAULT 'Asia/Ho_Chi_Minh',
	`dateFormat` varchar(50) DEFAULT 'DD/MM/YYYY',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
