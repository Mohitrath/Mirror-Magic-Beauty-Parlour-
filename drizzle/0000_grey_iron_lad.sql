CREATE TABLE `appointments` (
	`reference` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`owner` text NOT NULL,
	`service_id` text NOT NULL,
	`service_name` text NOT NULL,
	`category` text NOT NULL,
	`stylist_id` text NOT NULL,
	`date` text NOT NULL,
	`start` integer NOT NULL,
	`duration` integer NOT NULL,
	`price` integer NOT NULL,
	`customer_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`status` text DEFAULT 'booked' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stylist_id`) REFERENCES `stylists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `appointments_request_key` ON `appointments` (`request_key`);--> statement-breakpoint
CREATE INDEX `appointments_schedule` ON `appointments` (`date`,`stylist_id`,`status`,`start`);--> statement-breakpoint
CREATE INDEX `appointments_owner` ON `appointments` (`owner`,`date`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`price` integer NOT NULL,
	`duration` integer NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`position` integer DEFAULT 100 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stylist_skills` (
	`stylist_id` text NOT NULL,
	`category` text NOT NULL,
	PRIMARY KEY(`stylist_id`, `category`),
	FOREIGN KEY (`stylist_id`) REFERENCES `stylists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stylists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL
);
