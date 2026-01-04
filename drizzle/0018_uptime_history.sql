CREATE TABLE `uptime_history` (
`id` int AUTO_INCREMENT NOT NULL,
`timestamp` timestamp NOT NULL DEFAULT (now()),
`status` enum('up','down','degraded') NOT NULL DEFAULT 'up',
`responseTime` int,
`statusCode` int,
`errorMessage` text,
`checkType` varchar(50) DEFAULT 'http',
`endpoint` varchar(255) DEFAULT '/api/health',
`downtimeDuration` int,
`yearMonth` varchar(7),
CONSTRAINT `uptime_history_id` PRIMARY KEY(`id`)
);
