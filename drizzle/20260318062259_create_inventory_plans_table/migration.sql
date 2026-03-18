CREATE TABLE `inventory_plans` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`created_by_id` text NOT NULL,
	`assigned_to_ids` text NOT NULL,
	`start_at` integer NOT NULL,
	`due_at` integer NOT NULL,
	`completed_at` integer,
	`scope` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_assets` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`category_id` text NOT NULL,
	`description` text NOT NULL,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_assets_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_assets_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_assets`(`id`, `name`, `category_id`, `description`, `created_by_id`, `created_at`, `updated_at`) SELECT `id`, `name`, `category_id`, `description`, `created_by_id`, `created_at`, `updated_at` FROM `assets`;--> statement-breakpoint
DROP TABLE `assets`;--> statement-breakpoint
ALTER TABLE `__new_assets` RENAME TO `assets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE,
	`color` integer NOT NULL,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_categories_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_categories`(`id`, `name`, `color`, `created_by_id`, `created_at`, `updated_at`) SELECT `id`, `name`, `color`, `created_by_id`, `created_at`, `updated_at` FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;