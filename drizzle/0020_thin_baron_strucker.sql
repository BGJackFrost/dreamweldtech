CREATE TABLE `endpoint_daily_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`endpoint` varchar(255) NOT NULL,
	`method` varchar(10) NOT NULL,
	`totalRequests` int DEFAULT 0,
	`successfulRequests` int DEFAULT 0,
	`failedRequests` int DEFAULT 0,
	`avgResponseTime` int DEFAULT 0,
	`minResponseTime` int DEFAULT 0,
	`maxResponseTime` int DEFAULT 0,
	`p50ResponseTime` int DEFAULT 0,
	`p95ResponseTime` int DEFAULT 0,
	`p99ResponseTime` int DEFAULT 0,
	`errorRate` decimal(5,2) DEFAULT '0.00',
	`totalRequestSize` bigint DEFAULT 0,
	`totalResponseSize` bigint DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `endpoint_daily_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `endpoint_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`endpoint` varchar(255) NOT NULL,
	`method` varchar(10) NOT NULL,
	`responseTime` int NOT NULL,
	`statusCode` int NOT NULL,
	`isSuccess` enum('true','false') NOT NULL DEFAULT 'true',
	`errorMessage` text,
	`requestSize` int,
	`responseSize` int,
	`userAgent` varchar(500),
	`ipAddress` varchar(45),
	`dateKey` varchar(10),
	`hourOfDay` int,
	CONSTRAINT `endpoint_metrics_id` PRIMARY KEY(`id`)
);
