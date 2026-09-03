CREATE TABLE `pieces` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` integer NOT NULL,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`production_status` text DEFAULT 'EM PRODUÇÃO' NOT NULL,
	`production_value` real DEFAULT 0 NOT NULL,
	`bath_status` text,
	`bath_value` real,
	`shipping_status` text,
	`transport_value` real,
	`mail_status` text,
	`billing_status` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
