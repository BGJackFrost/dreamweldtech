CREATE TABLE `uptime_monthly_stats` (
`id` int AUTO_INCREMENT NOT NULL,
`yearMonth` varchar(7) NOT NULL,
`totalChecks` int DEFAULT 0,
`successfulChecks` int DEFAULT 0,
`failedChecks` int DEFAULT 0,
`degradedChecks` int DEFAULT 0,
`availabilityPercentage` decimal(5,2) DEFAULT '100.00',
`avgResponseTime` int DEFAULT 0,
`maxResponseTime` int DEFAULT 0,
`minResponseTime` int DEFAULT 0,
`totalDowntimeSeconds` int DEFAULT 0,
`incidentCount` int DEFAULT 0,
`mttr` int DEFAULT 0,
`createdAt` timestamp NOT NULL DEFAULT (now()),
`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `uptime_monthly_stats_id` PRIMARY KEY(`id`),
CONSTRAINT `uptime_monthly_stats_yearMonth_unique` UNIQUE(`yearMonth`)
);
