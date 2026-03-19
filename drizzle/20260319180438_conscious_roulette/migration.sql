CREATE TABLE `asset_authorized_lenders` (
	`asset_id` text NOT NULL,
	`user_id` text NOT NULL,
	CONSTRAINT `asset_authorized_lenders_pk` PRIMARY KEY(`asset_id`, `user_id`),
	CONSTRAINT `fk_asset_authorized_lenders_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `asset_images` (
	`asset_id` text NOT NULL,
	`image_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `asset_images_pk` PRIMARY KEY(`asset_id`, `image_id`),
	CONSTRAINT `fk_asset_images_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_asset_images_image_id_images_id_fk` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `borrow_records` (
	`id` text PRIMARY KEY,
	`asset_id` text NOT NULL,
	`creator_id` text NOT NULL,
	`borrower_id` text NOT NULL,
	`record_status` text NOT NULL,
	`borrow_date` integer NOT NULL,
	`expected_return_date` integer NOT NULL,
	`actual_return_date` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_borrow_records_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` text PRIMARY KEY,
	`title` text,
	`description` text,
	`original_filename` text NOT NULL,
	`format` text NOT NULL,
	`size` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`uploaded_by_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `assets` ADD `ownership_type` text NOT NULL;--> statement-breakpoint
ALTER TABLE `assets` ADD `school_asset_number` text;--> statement-breakpoint
ALTER TABLE `assets` ADD `quantity` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `assets` ADD `image_hash` text REFERENCES images(id);--> statement-breakpoint
ALTER TABLE `assets` ADD `custodian` text NOT NULL;--> statement-breakpoint
ALTER TABLE `assets` ADD `updated_by_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `assets` ADD `status` text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `assets` ADD `location` text NOT NULL;--> statement-breakpoint
ALTER TABLE `assets` ADD `purchase_date` integer;--> statement-breakpoint
ALTER TABLE `assets` ADD `borrow_rule` text DEFAULT 'public' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_assets` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`ownership_type` text NOT NULL,
	`school_asset_number` text,
	`quantity` integer NOT NULL,
	`category_id` text NOT NULL,
	`image_hash` text,
	`custodian` text NOT NULL,
	`description` text,
	`created_by_id` text NOT NULL,
	`updated_by_id` text NOT NULL,
	`status` text DEFAULT 'normal' NOT NULL,
	`location` text NOT NULL,
	`purchase_date` integer,
	`borrow_rule` text DEFAULT 'public' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_assets_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_assets_image_hash_images_id_fk` FOREIGN KEY (`image_hash`) REFERENCES `images`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_assets`(`id`, `name`, `category_id`, `description`, `created_by_id`, `created_at`, `updated_at`) SELECT `id`, `name`, `category_id`, `description`, `created_by_id`, `created_at`, `updated_at` FROM `assets`;--> statement-breakpoint
DROP TABLE `assets`;--> statement-breakpoint
ALTER TABLE `__new_assets` RENAME TO `assets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `categories` DROP COLUMN `color`;--> statement-breakpoint
ALTER TABLE `categories` DROP COLUMN `created_by_id`;