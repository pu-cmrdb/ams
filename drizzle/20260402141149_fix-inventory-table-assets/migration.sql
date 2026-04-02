CREATE TABLE `asset_records` (
	`asset_id` text NOT NULL,
	`status` text NOT NULL,
	`quantity` integer NOT NULL,
	`note` text,
	CONSTRAINT `asset_records_pk` PRIMARY KEY(`asset_id`, `status`),
	CONSTRAINT `fk_asset_records_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `inventory_plan_assets` (
	`plan_id` text NOT NULL,
	`asset_id` text NOT NULL,
	CONSTRAINT `fk_inventory_plan_assets_plan_id_inventory_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `inventory_plans`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_inventory_plan_assets_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `assets` DROP COLUMN `quantity`;--> statement-breakpoint
ALTER TABLE `assets` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `inventory_plans` DROP COLUMN `scope`;