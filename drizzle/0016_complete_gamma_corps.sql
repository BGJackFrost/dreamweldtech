CREATE TABLE `alert_thresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricName` varchar(50) NOT NULL,
	`warningThreshold` int NOT NULL,
	`criticalThreshold` int NOT NULL,
	`unit` varchar(10) DEFAULT '%',
	`description` text,
	`isEnabled` enum('true','false') NOT NULL DEFAULT 'true',
	`cooldownMinutes` int DEFAULT 15,
	`lastAlertAt` timestamp,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_thresholds_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_thresholds_metricName_unique` UNIQUE(`metricName`)
);
