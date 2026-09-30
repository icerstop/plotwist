CREATE TABLE `themes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`appearance` text NOT NULL,
	`assets` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_themes_owner_name` ON `themes` (`owner_id`,`name_key`);