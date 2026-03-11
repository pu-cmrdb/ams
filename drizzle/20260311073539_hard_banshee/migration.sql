CREATE TABLE `assets` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_assets_category_categories_name_fk` FOREIGN KEY (`category`) REFERENCES `categories`(`name`),
	CONSTRAINT `fk_assets_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`name` text PRIMARY KEY UNIQUE,
	`color` integer NOT NULL,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_categories_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`created_by_id` text NOT NULL,
	`assigned_to_id` text NOT NULL,
	`due_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_tasks_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`),
	CONSTRAINT `fk_tasks_assigned_to_id_users_id_fk` FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY UNIQUE,
	`name` text NOT NULL,
	`image_hash` text NOT NULL
);
