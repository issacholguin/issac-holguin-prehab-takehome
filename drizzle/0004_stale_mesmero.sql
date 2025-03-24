DROP INDEX `name_idx`;--> statement-breakpoint
DROP INDEX `description_idx`;--> statement-breakpoint
CREATE INDEX `isPublic_userId_idx` ON `exercises` (`isPublic`,`userId`);--> statement-breakpoint
CREATE INDEX `isPublic_difficulty_idx` ON `exercises` (`isPublic`,`difficulty`);