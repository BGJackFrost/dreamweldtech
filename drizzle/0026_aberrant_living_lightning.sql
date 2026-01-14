CREATE TABLE `geo_blocking_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countryCode` varchar(2) NOT NULL,
	`countryName` varchar(100) NOT NULL,
	`ruleType` enum('block','allow') NOT NULL,
	`reason` text,
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`hitCount` int NOT NULL DEFAULT 0,
	`lastHitAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `geo_blocking_rules_id` PRIMARY KEY(`id`)
);
