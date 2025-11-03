import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for admin authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Contracts table
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  companyName: text("company_name").notNull(),
  document: text("document").notNull(),
  contractDuration: text("contract_duration").notNull(),
  product: text("product").notNull(),
  ticketValue: text("ticket_value").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  submittedAt: true,
}).extend({
  clientName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  clientPhone: z.string().min(10, "Número de telefone inválido"),
  companyName: z.string().min(3, "Razão Social deve ter pelo menos 3 caracteres"),
  document: z.string().min(11, "CPF/CNPJ inválido"),
  contractDuration: z.enum(["3_months", "6_months", "1_year", "2_years"]),
  product: z.string().min(2, "Por favor, selecione um produto"),
  ticketValue: z.string().min(1, "Valor do ticket é obrigatório"),
  pdfUrl: z.string().min(1, "PDF é obrigatório"),
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// Webhook configuration
export const webhookConfig = pgTable("webhook_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  isActive: text("is_active").notNull().default("true"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWebhookConfigSchema = createInsertSchema(webhookConfig).omit({
  id: true,
  updatedAt: true,
});

export type InsertWebhookConfig = z.infer<typeof insertWebhookConfigSchema>;
export type WebhookConfig = typeof webhookConfig.$inferSelect;
