CREATE TABLE `inventory_plans` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`created_by_id` text NOT NULL,
	`assigned_to_ids` text NOT NULL,
	`start_at` integer NOT NULL,
	`due_at` integer NOT NULL,
	`end_at` integer,
	`scope` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `completed_at` integer;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_assets` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_assets_category_categories_name_fk` FOREIGN KEY (`category`) REFERENCES `categories`(`name`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_assets_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_assets`(`id`, `name`, `category`, `description`, `created_by_id`, `created_at`, `updated_at`) SELECT `id`, `name`, `category`, `description`, `created_by_id`, `created_at`, `updated_at` FROM `assets`;--> statement-breakpoint
DROP TABLE `assets`;--> statement-breakpoint
ALTER TABLE `__new_assets` RENAME TO `assets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`name` text PRIMARY KEY UNIQUE,
	`color` integer NOT NULL,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_categories_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_categories`(`name`, `color`, `created_by_id`, `created_at`, `updated_at`) SELECT `name`, `color`, `created_by_id`, `created_at`, `updated_at` FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` text,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`created_by_id` text NOT NULL,
	`assigned_to_id` text NOT NULL,
	`due_at` integer NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_tasks_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_tasks_assigned_to_id_users_id_fk` FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_tasks`(`id`, `name`, `description`, `created_by_id`, `assigned_to_id`, `due_at`, `created_at`, `updated_at`) SELECT `id`, `name`, `description`, `created_by_id`, `assigned_to_id`, `due_at`, `created_at`, `updated_at` FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;