CREATE TABLE `alert_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` int NOT NULL,
	`triggeredAt` timestamp NOT NULL DEFAULT (now()),
	`currentValue` int NOT NULL,
	`thresholdValue` int NOT NULL,
	`triggeredTarget` varchar(255),
	`status` enum('triggered','acknowledged','resolved') NOT NULL DEFAULT 'triggered',
	`acknowledgedBy` int,
	`acknowledgedAt` timestamp,
	`resolutionNotes` text,
	`resolvedAt` timestamp,
	`notificationSent` enum('true','false') NOT NULL DEFAULT 'false',
	CONSTRAINT `alert_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`alertType` varchar(50) NOT NULL,
	`target` varchar(255) DEFAULT '*',
	`metric` varchar(50) NOT NULL,
	`threshold` int NOT NULL,
	`operator` varchar(10) DEFAULT 'gt',
	`evaluationWindow` int DEFAULT 5,
	`cooldownMinutes` int DEFAULT 15,
	`isEnabled` enum('true','false') NOT NULL DEFAULT 'true',
	`notificationChannels` varchar(255) DEFAULT 'email',
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'warning',
	`lastTriggeredAt` timestamp,
	`triggerCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performance_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `query_daily_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`queryType` varchar(20) NOT NULL,
	`tableName` varchar(100),
	`totalQueries` int DEFAULT 0,
	`successfulQueries` int DEFAULT 0,
	`failedQueries` int DEFAULT 0,
	`avgExecutionTime` int DEFAULT 0,
	`minExecutionTime` int DEFAULT 0,
	`maxExecutionTime` int DEFAULT 0,
	`p50ExecutionTime` int DEFAULT 0,
	`p95ExecutionTime` int DEFAULT 0,
	`p99ExecutionTime` int DEFAULT 0,
	`totalRows` bigint DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `query_daily_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `query_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`queryType` varchar(20) NOT NULL,
	`tableName` varchar(100),
	`executionTime` int NOT NULL,
	`rowCount` int,
	`isSuccess` enum('true','false') NOT NULL DEFAULT 'true',
	`errorMessage` text,
	`queryHash` varchar(64),
	`callerEndpoint` varchar(255),
	`dateKey` varchar(10),
	CONSTRAINT `query_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate_limit_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`endpointPattern` varchar(255) NOT NULL,
	`maxRequests` int NOT NULL DEFAULT 100,
	`windowSeconds` int NOT NULL DEFAULT 60,
	`isEnabled` enum('true','false') NOT NULL DEFAULT 'true',
	`blockDurationSeconds` int DEFAULT 60,
	`errorMessage` varchar(500),
	`priority` int DEFAULT 100,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rate_limit_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `rate_limit_config_endpointPattern_unique` UNIQUE(`endpointPattern`)
);
--> statement-breakpoint
CREATE TABLE `rate_limit_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`endpoint` varchar(255) NOT NULL,
	`ipAddress` varchar(45),
	`wasBlocked` enum('true','false') NOT NULL DEFAULT 'false',
	`requestCount` int DEFAULT 1,
	`configId` int,
	`dateKey` varchar(10),
	`hourOfDay` int,
	CONSTRAINT `rate_limit_usage_id` PRIMARY KEY(`id`)
);
