import { sql } from "drizzle-orm";
import { integer, real, pgTable, text } from "drizzle-orm/pg-core";

export const pieces = pgTable("pieces", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: integer("code").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  material: text("material").notNull().default("Sem prata maciça"),
  weightGrams: real("weight_grams"),
  silverGramValue: real("silver_gram_value"),
  goldGramValue: real("gold_gram_value"),
  goldFactor: real("gold_factor"),
  customMaterial: text("custom_material"),
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
  mailPostedConfirmed: integer("mail_posted_confirmed").notNull().default(0),
  mailPostedAt: text("mail_posted_at"),
  billingStatus: text("billing_status"),
  photoKey: text("photo_key"),
  paidValue: real("paid_value").default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const photos = pgTable("photos", {
  key: text("key").primaryKey(),
  contentType: text("content_type").notNull(),
  data: text("data").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
