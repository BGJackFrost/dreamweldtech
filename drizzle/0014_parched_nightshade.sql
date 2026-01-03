CREATE TABLE `custom_translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`language` varchar(10) NOT NULL,
	`value` text NOT NULL,
	`category` varchar(50) DEFAULT 'common',
	`description` text,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_translations_id` PRIMARY KEY(`id`),
	CONSTRAINT `key_lang_unique` UNIQUE(`key`,`language`)
);
