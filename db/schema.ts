import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pieces = sqliteTable("pieces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: integer("code").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  productionStatus: text("production_status").notNull().default("EM PRODUÇÃO"),
  productionValue: real("production_value").notNull().default(0),
  bathStatus: text("bath_status"),
  bathValue: real("bath_value"),
  shippingStatus: text("shipping_status"),
  transportValue: real("transport_value"),
  bathSendStatus: text("bath_send_status"),
  bathSendValue: real("bath_send_value"),
  bathReturnStatus: text("bath_return_status"),
  bathReturnValue: real("bath_return_value"),
  mailValue: real("mail_value"),
  mailStatus: text("mail_status"),
  billingStatus: text("billing_status"),
  photoKey: text("photo_key"),
  paidValue: real("paid_value").default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
